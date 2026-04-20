import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafConnectCreateTransaction — Submete documentos + dados ao CAF Connect para análise.
 *
 * Fluxo:
 *   1. OAuth2 client_credentials (cacheado)
 *   2. Para cada imagem → POST /v1/transactions/files (multipart) → retorna { filename }
 *   3. POST /v1/transactions?origin=TRUST com { templateId, files, attributes, metadata }
 *   4. Salva logs + URLs das imagens em DocumentUpload + IntegrationLog
 *
 * Entrada esperada:
 * {
 *   onboardingCaseId: "...",           // obrigatório
 *   templateId: "...",                 // obrigatório (Query Template no Trust)
 *   attributes: {                      // opcional — dados do merchant
 *     cpf, cnpj, name, birthDate, motherName, email, phoneNumber, ...
 *   },
 *   images: [                          // ao menos uma
 *     { type: "SELFIE"|"FRONT"|"BACK"|"DOCUMENT", base64: "data:image/...", filename?: "..." }
 *   ],
 *   callbackUrl: "https://..."         // opcional (webhook)
 * }
 *
 * Retorno:
 * {
 *   success: true,
 *   transactionId, requestId, status, attempts: [...], saved_image_urls: [...]
 * }
 *
 * Referência: https://docs.caf.io/caf-api/connect/available-resources/transaction
 */

const CONNECT_BASE = 'https://api.us.prd.caf.io';

// ── In-memory OAuth2 token cache ──
let tokenCache = { accessToken: null, expiresAt: 0 };

async function getAccessToken() {
  const clientId = Deno.env.get('CAF_CONNECT_CLIENT_ID');
  const clientSecret = Deno.env.get('CAF_CONNECT_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error('CAF_CONNECT_CLIENT_ID/SECRET não configurados');
  }
  const now = Date.now();
  if (tokenCache.accessToken && tokenCache.expiresAt - 60_000 > now) {
    return tokenCache.accessToken;
  }
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(`${CONNECT_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: body.toString(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new Error(`OAuth2 falhou HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  tokenCache = {
    accessToken: json.access_token,
    expiresAt: now + (Number(json.expires_in) || 3600) * 1000,
  };
  return json.access_token;
}

// Helper: converte base64/dataURI em Blob
function base64ToBlob(b64, defaultMime = 'image/jpeg') {
  let mime = defaultMime;
  let data = b64;
  const m = /^data:([^;]+);base64,(.+)$/.exec(b64);
  if (m) {
    mime = m[1];
    data = m[2];
  } else if (/^data:([^;]+),(.+)$/.test(b64)) {
    // URL-encoded data URI (raro)
    const m2 = /^data:([^;]+),(.+)$/.exec(b64);
    mime = m2[1];
    data = decodeURIComponent(m2[2]);
  }
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// Helper: deriva extensão pelo MIME
function extFromMime(mime) {
  const map = {
    'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
    'image/webp': 'webp', 'image/bmp': 'bmp', 'image/heif': 'heif',
    'application/pdf': 'pdf',
  };
  return map[mime] || 'jpg';
}

Deno.serve(async (req) => {
  const t0 = Date.now();
  const attempts = [];

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { onboardingCaseId, templateId, attributes = {}, images = [], callbackUrl } = body;

    // ── Validação ──
    if (!onboardingCaseId) return Response.json({ error: 'onboardingCaseId é obrigatório' }, { status: 400 });
    if (!templateId) return Response.json({ error: 'templateId (Trust Query Template) é obrigatório' }, { status: 400 });
    if (images && !Array.isArray(images)) {
      return Response.json({ error: 'images deve ser um array' }, { status: 400 });
    }
    for (const img of (images || [])) {
      if (!img.type || !img.base64) {
        return Response.json({ error: 'Cada imagem precisa de {type, base64}' }, { status: 400 });
      }
    }

    const accessToken = await getAccessToken();

    // ── ETAPA 1: Upload de cada arquivo → POST /v1/transactions/files ──
    const savedImageUrls = [];
    const cafFiles = [];

    for (const img of images) {
      const stepStart = Date.now();
      try {
        const blob = base64ToBlob(img.base64);
        const ext = extFromMime(blob.type);
        const filename = img.filename || `${img.type.toLowerCase()}_${Date.now()}.${ext}`;

        // 1a. Persistir imagem no storage (best-effort — não bloqueia o envio pro CAF)
        let file_url = null;
        try {
          const file = new File([blob], filename, { type: blob.type });
          const uploadRes = await base44.integrations.Core.UploadFile({ file });
          file_url = uploadRes?.file_url || null;
          if (file_url) {
            savedImageUrls.push({ type: img.type, url: file_url });
            // Cria DocumentUpload para a seção Docs CAF
            await base44.asServiceRole.entities.DocumentUpload.create({
              onboardingCaseId,
              documentTypeId: `CAF_${img.type}`,
              documentName: `CAF - ${img.type === 'SELFIE' ? 'Selfie' : img.type === 'BACK' ? 'Documento (Verso)' : 'Documento (Frente)'}`,
              fileUrl: file_url,
              fileName: filename,
              fileSize: blob.size,
              fileType: blob.type,
              uploadDate: new Date().toISOString(),
              validationStatus: 'Pendente',
            }).catch(e => console.warn('[ConnectTx] DocumentUpload create falhou:', e.message));
          }
        } catch (e) {
          console.warn(`[ConnectTx] Falha ao salvar ${img.type} no storage local (prosseguindo p/ CAF):`, e.message);
        }

        // 1b. Upload para CAF → POST /v1/transactions/files
        const form = new FormData();
        form.append('file', blob, filename);
        const up = await fetch(`${CONNECT_BASE}/v1/transactions/files`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
          body: form,
        });
        const upText = await up.text();
        let upJson; try { upJson = JSON.parse(upText); } catch { upJson = { raw: upText.substring(0, 300) }; }

        attempts.push({
          step: `upload_${img.type}`,
          status: up.status,
          ok: up.ok,
          duration_ms: Date.now() - stepStart,
          cafFilename: upJson?.data?.filename || null,
          error: up.ok ? null : upJson,
        });

        if (!up.ok) {
          throw new Error(`CAF upload falhou (${img.type}): HTTP ${up.status} — ${upText.substring(0, 200)}`);
        }

        const cafFilename = upJson?.data?.filename;
        if (!cafFilename) {
          throw new Error(`CAF upload retornou sem filename: ${JSON.stringify(upJson)}`);
        }

        cafFiles.push({ data: cafFilename, type: img.type });
      } catch (e) {
        attempts.push({ step: `upload_${img.type}`, ok: false, duration_ms: Date.now() - stepStart, error: e.message });
        throw e;
      }
    }

    // ── ETAPA 2: Criar transação → POST /v1/transactions?origin=TRUST ──
    const txStart = Date.now();
    const txPayload = {
      templateId,
      files: cafFiles,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      metadata: {
        onboardingCaseId,
        source: 'pagsmile_compliance',
        createdBy: user.email,
      },
      ...(callbackUrl ? { _callbackUrl: callbackUrl } : {}),
    };

    console.log(`[ConnectTx] Creating tx — templateId: ${templateId}, files: ${cafFiles.length}, attrs: ${Object.keys(attributes).join(',')}`);

    const txRes = await fetch(`${CONNECT_BASE}/v1/transactions?origin=TRUST`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(txPayload),
    });
    const txText = await txRes.text();
    let txJson; try { txJson = JSON.parse(txText); } catch { txJson = { raw: txText.substring(0, 500) }; }

    attempts.push({
      step: 'create_transaction',
      status: txRes.status,
      ok: txRes.ok,
      duration_ms: Date.now() - txStart,
      transactionId: txJson?.id || null,
      requestId: txJson?.requestId || null,
      error: txRes.ok ? null : txJson,
    });

    const totalDuration = Date.now() - t0;

    // ── ETAPA 3: Persistir log unificado ──
    try {
      await base44.asServiceRole.entities.IntegrationLog.create({
        onboarding_case_id: onboardingCaseId,
        provider: 'CAF',
        service_type: 'caf_post_capture_full',
        transaction_id: txJson?.id || '',
        request_id: txJson?.requestId || '',
        status: txRes.ok ? 'success' : 'failed',
        request_payload: {
          api: 'connect',
          endpoint: '/v1/transactions?origin=TRUST',
          templateId,
          files_count: cafFiles.length,
          attributes_keys: Object.keys(attributes),
        },
        response_payload: txJson,
        image_urls: savedImageUrls.map(i => i.url),
        duration_ms: totalDuration,
        error_message: txRes.ok ? null : (txJson?.message || `HTTP ${txRes.status}`),
      });
    } catch (e) { console.warn('[ConnectTx] IntegrationLog error:', e.message); }

    if (!txRes.ok) {
      return Response.json({
        success: false,
        error: txJson?.message || `CAF retornou HTTP ${txRes.status}`,
        attempts,
        rawResponse: txJson,
        status: txRes.status,
      }, { status: 200 });  // 200 pra não quebrar front; success:false já sinaliza
    }

    return Response.json({
      success: true,
      api: 'connect',
      transactionId: txJson.id,
      requestId: txJson.requestId,
      templateId,
      filesUploaded: cafFiles.length,
      savedImageUrls,
      attempts,
      duration_ms: totalDuration,
      note: 'Transação criada. Use cafConnectGetTransaction ou aguarde o callback para obter o resultado.',
    });

  } catch (error) {
    console.error('[ConnectTx] Error:', error);
    return Response.json({
      error: error.message,
      attempts,
      duration_ms: Date.now() - t0,
    }, { status: 500 });
  }
});