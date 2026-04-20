import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafSubmitCompliance — submete compliance PF ou PJ ao CAF Connect.
 *
 * Regras:
 *   • personType "PJ" → usa CAF_TEMPLATE_ID_PJ (compliance PJ: v4 + PIX)
 *   • personType "PF" → usa CAF_TEMPLATE_ID_PF (subsellers PF)
 *   • Docs de identidade → type "SELFIE" / "FRONT" / "BACK" / "DOCUMENT"
 *   • Outros docs (contrato social, comprov. endereço, faturamento) → type "ATTACHMENTS"
 *
 * Fluxo:
 *   1. OAuth2 client_credentials (cacheado)
 *   2. Resolve templateId via secret conforme personType
 *   3. Para cada arquivo → POST /v1/transactions/files (multipart) + salva DocumentUpload
 *   4. POST /v1/transactions?origin=TRUST com files + attributes
 *   5. Persiste IntegrationLog
 *
 * Entrada:
 * {
 *   onboardingCaseId: "...",
 *   personType: "PF" | "PJ",
 *   attributes: { cpf|cnpj, name?, birthDate?, motherName? },
 *   files: [ { type, base64, filename? } ],
 *   callbackUrl?: "https://..."
 * }
 */

const CONNECT_BASE = 'https://api.us.prd.caf.io';

// ── OAuth2 token cache ──
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

function base64ToBlob(b64, defaultMime = 'image/jpeg') {
  let mime = defaultMime;
  let data = b64;
  const m = /^data:([^;]+);base64,(.+)$/.exec(b64);
  if (m) { mime = m[1]; data = m[2]; }
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function extFromMime(mime) {
  const map = {
    'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
    'image/webp': 'webp', 'image/bmp': 'bmp', 'image/heif': 'heif',
    'application/pdf': 'pdf',
  };
  return map[mime] || 'jpg';
}

function friendlyDocName(type) {
  const map = {
    SELFIE: 'CAF - Selfie',
    FRONT: 'CAF - Documento (Frente)',
    BACK: 'CAF - Documento (Verso)',
    DOCUMENT: 'CAF - Documento',
    ATTACHMENTS: 'CAF - Anexo',
  };
  return map[type] || `CAF - ${type}`;
}

Deno.serve(async (req) => {
  const t0 = Date.now();
  const attempts = [];

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      onboardingCaseId,
      personType,
      attributes = {},
      files = [],
      callbackUrl,
    } = body;

    // ── Validação ──
    if (!onboardingCaseId) return Response.json({ error: 'onboardingCaseId é obrigatório' }, { status: 400 });
    if (personType !== 'PF' && personType !== 'PJ') {
      return Response.json({ error: 'personType deve ser "PF" ou "PJ"' }, { status: 400 });
    }
    if (files && !Array.isArray(files)) {
      return Response.json({ error: 'files deve ser um array' }, { status: 400 });
    }
    for (const f of (files || [])) {
      if (!f.type || !f.base64) {
        return Response.json({ error: 'Cada file precisa de {type, base64}' }, { status: 400 });
      }
    }

    // ── Resolve templateId ──
    const templateId = personType === 'PF'
      ? Deno.env.get('CAF_TEMPLATE_ID_PF')
      : Deno.env.get('CAF_TEMPLATE_ID_PJ');

    if (!templateId) {
      return Response.json({
        error: `Secret CAF_TEMPLATE_ID_${personType} não configurado`,
      }, { status: 500 });
    }

    const accessToken = await getAccessToken();

    // ── ETAPA 1: upload de cada arquivo ──
    // Estratégia: tenta upload multipart (/v1/transactions/files). Se 403 (permissão
    // "Create Transaction Files" não concedida no Trust), faz fallback inline com base64
    // direto no payload da transação — que é um formato oficialmente aceito pela CAF.
    const savedImageUrls = [];
    const cafFiles = [];

    for (const f of files) {
      const stepStart = Date.now();
      try {
        const blob = base64ToBlob(f.base64);
        const ext = extFromMime(blob.type);
        const filename = f.filename || `${f.type.toLowerCase()}_${Date.now()}.${ext}`;

        // 1a. Persistir no storage + criar DocumentUpload (best-effort)
        let file_url = null;
        try {
          const file = new File([blob], filename, { type: blob.type });
          const uploadRes = await base44.integrations.Core.UploadFile({ file });
          file_url = uploadRes?.file_url || null;
          if (file_url) {
            savedImageUrls.push({ type: f.type, url: file_url });
            await base44.asServiceRole.entities.DocumentUpload.create({
              onboardingCaseId,
              documentTypeId: `CAF_${f.type}`,
              documentName: friendlyDocName(f.type),
              fileUrl: file_url,
              fileName: filename,
              fileSize: blob.size,
              fileType: blob.type,
              uploadDate: new Date().toISOString(),
              validationStatus: 'Pendente',
            }).catch(e => console.warn('[cafSubmit] DocumentUpload create falhou:', e.message));
          }
        } catch (e) {
          console.warn(`[cafSubmit] Falha ao salvar ${f.type} no storage (prosseguindo p/ CAF):`, e.message);
        }

        // 1b. Tenta upload multipart na CAF
        const form = new FormData();
        form.append('file', blob, filename);
        const up = await fetch(`${CONNECT_BASE}/v1/transactions/files`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
          body: form,
        });
        const upText = await up.text();
        let upJson; try { upJson = JSON.parse(upText); } catch { upJson = { raw: upText.substring(0, 300) }; }

        if (up.ok && upJson?.data?.filename) {
          // Sucesso no multipart — usa o filename retornado
          attempts.push({
            step: `upload_${f.type}`, mode: 'multipart',
            status: up.status, ok: true,
            duration_ms: Date.now() - stepStart,
            cafFilename: upJson.data.filename,
          });
          cafFiles.push({ data: upJson.data.filename, type: f.type });
        } else {
          // Fallback: envia base64 direto no payload da transação
          console.warn(`[cafSubmit] Multipart upload falhou (HTTP ${up.status}), usando fallback base64 inline para ${f.type}`);
          attempts.push({
            step: `upload_${f.type}`, mode: 'multipart_fallback_to_inline',
            status: up.status, ok: false,
            duration_ms: Date.now() - stepStart,
            error: upJson,
            note: 'Fallback: usando base64 inline no payload da transação',
          });
          // Remove prefixo data:...;base64, se existir
          const b64Only = f.base64.replace(/^data:[^;]+;base64,/, '');
          cafFiles.push({ data: b64Only, type: f.type });
        }
      } catch (e) {
        attempts.push({ step: `upload_${f.type}`, ok: false, duration_ms: Date.now() - stepStart, error: e.message });
        throw e;
      }
    }

    // ── ETAPA 2: criar transação ──
    const txStart = Date.now();
    const txPayload = {
      templateId,
      files: cafFiles,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      metadata: {
        onboardingCaseId,
        personType,
        source: 'pagsmile_compliance',
        createdBy: user.email,
      },
      ...(callbackUrl ? { _callbackUrl: callbackUrl } : {}),
    };

    console.log(`[cafSubmit] ${personType} tx — templateId: ${templateId}, files: ${cafFiles.length}`);

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

    // ── ETAPA 3: persistir log ──
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
          personType,
          templateId,
          files_count: cafFiles.length,
          attributes_keys: Object.keys(attributes),
        },
        response_payload: txJson,
        image_urls: savedImageUrls.map(i => i.url),
        duration_ms: totalDuration,
        error_message: txRes.ok ? null : (txJson?.message || `HTTP ${txRes.status}`),
      });
    } catch (e) { console.warn('[cafSubmit] IntegrationLog error:', e.message); }

    if (!txRes.ok) {
      return Response.json({
        success: false,
        personType,
        templateIdUsed: templateId,
        error: txJson?.message || `CAF retornou HTTP ${txRes.status}`,
        attempts,
        rawResponse: txJson,
        status: txRes.status,
      });
    }

    return Response.json({
      success: true,
      personType,
      templateIdUsed: templateId,
      transactionId: txJson.id,
      requestId: txJson.requestId,
      filesUploaded: cafFiles.length,
      savedImageUrls,
      attempts,
      duration_ms: totalDuration,
      note: 'Transação criada. Use cafConnectGetTransaction ou aguarde o callback p/ resultado.',
    });

  } catch (error) {
    console.error('[cafSubmit] Error:', error);
    return Response.json({
      error: error.message,
      attempts,
      duration_ms: Date.now() - t0,
    }, { status: 500 });
  }
});