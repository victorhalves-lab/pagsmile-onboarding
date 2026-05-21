import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC endpoint — BULLETPROOF direct document upload.
 *
 * Recebe arquivo BASE64 via JSON body. Salva no **Supabase Storage** (sem consumir
 * créditos Base44). O fileUri persistido segue o formato "supabase://<bucket>/<path>"
 * e é resolvido em download pelo getPrivateDocumentUrl.
 *
 * Mudança 2026-05-21:
 *   - Migrado de Base44 UploadPrivateFile (que consome 1 crédito/upload) para Supabase
 *     Storage REST API. Custo Base44 por upload agora = 0.
 *   - Documentos antigos no Base44 storage ("mp/private/...") continuam funcionando
 *     graças ao fallback no getPrivateDocumentUrl.
 *
 * Request JSON body (igual ao anterior):
 *   - caseId, documentTypeId, documentName, docLinkToken
 *   - notAvailable, notAvailableReason
 *   - fileBase64, fileName, fileType, fileSize, uploadDate
 *
 * Response: { ok, documentUploadId, fileUri, fileUrl, fileName, fileSize, fileType }
 */

function base64ToBytes(b64) {
  const commaIdx = b64.indexOf(',');
  const raw = commaIdx >= 0 ? b64.slice(commaIdx + 1) : b64;
  const bin = atob(raw);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Sanitiza nome do arquivo e monta path único dentro do bucket Supabase.
function buildSupabasePath(fileName) {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const ts = now.getTime();
  const rand = Math.random().toString(36).slice(2, 10);
  const safe = String(fileName || 'arquivo')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80);
  return `${yyyy}/${mm}/${ts}_${rand}_${safe}`;
}

// Upload direto pro Supabase Storage via REST API (zero crédito Base44).
async function uploadToSupabase(bytes, fileName, fileType) {
  const supaUrl = Deno.env.get('SUPABASE_URL');
  const supaKey = Deno.env.get('SUPABASE_SERVICE_KEY');
  const bucket = Deno.env.get('SUPABASE_BUCKET') || 'compliance-docs';
  if (!supaUrl || !supaKey) {
    throw new Error('SUPABASE_URL/SUPABASE_SERVICE_KEY não configurados');
  }
  const base = supaUrl.replace(/\/+$/, '');
  const path = buildSupabasePath(fileName);
  const endpoint = `${base}/storage/v1/object/${bucket}/${encodeURI(path)}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supaKey}`,
      'apikey': supaKey,
      'Content-Type': fileType || 'application/octet-stream',
      'x-upsert': 'false',
      'cache-control': '3600',
    },
    body: bytes,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Supabase upload ${res.status}: ${errText.slice(0, 300)}`);
  }
  return { fileUri: `supabase://${bucket}/${path}`, path, bucket };
}

Deno.serve(async (req) => {
  const startedAt = Date.now();
  try {
    if (req.method !== 'POST') {
      return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      caseId,
      documentTypeId,
      documentName,
      docLinkToken,
      notAvailable = false,
      notAvailableReason = '',
      fileBase64,
      fileName,
      fileType,
      fileSize,
      uploadDate,
    } = body || {};

    console.log(`[publicDirectDocUpload] START caseId=${caseId} docType=${documentTypeId} notAvailable=${notAvailable} hasB64=${!!fileBase64} hasToken=${!!docLinkToken}`);

    if (!caseId || !documentTypeId) {
      return Response.json({ ok: false, error: 'caseId and documentTypeId are required' }, { status: 400 });
    }

    if (!notAvailable && !fileBase64) {
      return Response.json({ ok: false, error: 'fileBase64 is required when not marked as unavailable' }, { status: 400 });
    }

    if (notAvailable && String(notAvailableReason).trim().length < 10) {
      return Response.json({ ok: false, error: 'notAvailableReason must be at least 10 characters' }, { status: 400 });
    }

    // Tolerante a tokens de cliente inválidos/expirados: fallback para client anônimo.
    let base44;
    try {
      base44 = createClientFromRequest(req);
    } catch (_) {
      const { createClient } = await import('npm:@base44/sdk@0.8.25');
      base44 = createClient({
        appId: Deno.env.get('BASE44_APP_ID'),
        requiresAuth: false,
      });
    }

    // Validate case + token
    let cases = [];
    try {
      cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
    } catch (filterErr) {
      console.error(`[publicDirectDocUpload] CASE_FILTER_ERROR caseId=${caseId}:`, filterErr.message);
      return Response.json({ ok: false, error: 'Erro ao buscar caso: ' + filterErr.message }, { status: 500 });
    }
    if (cases.length === 0) {
      return Response.json({ ok: false, error: 'Caso não encontrado' }, { status: 404 });
    }
    const onboardingCase = cases[0];
    if (docLinkToken && onboardingCase.docLinkToken !== docLinkToken) {
      console.warn(`[publicDirectDocUpload] TOKEN_MISMATCH caseId=${caseId}`);
      return Response.json({ ok: false, error: 'Token inválido' }, { status: 403 });
    }

    // Branch A: not-available justification
    if (notAvailable) {
      const createdDoc = await base44.asServiceRole.entities.DocumentUpload.create({
        onboardingCaseId: caseId,
        documentTypeId,
        documentName: documentName || documentTypeId,
        fileUrl: '',
        fileName: '',
        fileSize: 0,
        fileType: '',
        uploadDate: uploadDate || new Date().toISOString(),
        validationStatus: 'Pendente',
        isPrivate: false,
        fileUri: '',
        notAvailable: true,
        notAvailableReason: String(notAvailableReason).trim(),
        notAvailableReviewStatus: 'Pendente',
      });
      console.log(`[publicDirectDocUpload] CREATED_NOT_AVAILABLE id=${createdDoc?.id} docType=${documentTypeId} duration=${Date.now() - startedAt}ms`);
      return Response.json({
        ok: true,
        documentUploadId: createdDoc?.id,
        notAvailable: true,
        duration_ms: Date.now() - startedAt,
      });
    }

    // Branch B: decode base64 → bytes
    let fileBytes;
    try {
      fileBytes = base64ToBytes(fileBase64);
    } catch (decodeErr) {
      console.error('[publicDirectDocUpload] BASE64_DECODE_ERROR:', decodeErr?.message);
      return Response.json({ ok: false, error: 'Falha ao decodificar arquivo: ' + decodeErr?.message }, { status: 400 });
    }

    // IDEMPOTENCY CHECK — evita duplicar quando cliente reenvia por achar que falhou.
    try {
      const recentDocs = await base44.asServiceRole.entities.DocumentUpload.filter({
        onboardingCaseId: caseId,
        documentTypeId,
      });
      const sixtySecondsAgo = Date.now() - 60_000;
      const duplicate = (recentDocs || []).find((d) => {
        if (!d?.fileName || !d?.fileSize) return false;
        if (d.fileName !== fileName) return false;
        if (Number(d.fileSize) !== Number(fileSize)) return false;
        const createdMs = d.created_date ? new Date(d.created_date).getTime() : 0;
        return createdMs >= sixtySecondsAgo;
      });
      if (duplicate) {
        console.log(`[publicDirectDocUpload] DUPLICATE_DETECTED returning existing id=${duplicate.id} docType=${documentTypeId}`);
        return Response.json({
          ok: true,
          documentUploadId: duplicate.id,
          fileUri: duplicate.fileUri || duplicate.fileUrl,
          fileUrl: duplicate.fileUri || duplicate.fileUrl,
          fileName: duplicate.fileName,
          fileSize: duplicate.fileSize,
          fileType: duplicate.fileType,
          deduped: true,
          duration_ms: Date.now() - startedAt,
        });
      }
    } catch (dedupErr) {
      console.warn(`[publicDirectDocUpload] DEDUP_CHECK_FAILED (non-fatal):`, dedupErr?.message);
    }

    // ─── UPLOAD AO SUPABASE STORAGE (sem custo Base44) ───
    let supaResult;
    try {
      supaResult = await uploadToSupabase(fileBytes, fileName, fileType);
    } catch (uploadErr) {
      console.error(`[publicDirectDocUpload] SUPABASE_UPLOAD_FAILED caseId=${caseId} docType=${documentTypeId} name=${fileName}:`, uploadErr?.message);
      return Response.json({ ok: false, error: 'Falha ao salvar arquivo: ' + (uploadErr?.message || 'erro desconhecido') }, { status: 500 });
    }
    const fileUri = supaResult.fileUri;

    let createdDoc;
    try {
      createdDoc = await base44.asServiceRole.entities.DocumentUpload.create({
        onboardingCaseId: caseId,
        documentTypeId,
        documentName: documentName || documentTypeId,
        fileUrl: fileUri,
        fileUri,
        isPrivate: true,
        fileName: fileName || '',
        fileSize: typeof fileSize === 'number' ? fileSize : 0,
        fileType: fileType || '',
        uploadDate: uploadDate || new Date().toISOString(),
        validationStatus: 'Pendente',
        notAvailable: false,
        notAvailableReason: '',
      });
    } catch (createErr) {
      console.error(`[publicDirectDocUpload] CREATE_FAILED caseId=${caseId} docType=${documentTypeId}:`, createErr?.message);
      return Response.json({ ok: false, error: 'Falha ao registrar documento: ' + (createErr?.message || 'erro desconhecido') }, { status: 500 });
    }

    console.log(`[publicDirectDocUpload] CREATED id=${createdDoc?.id} docType=${documentTypeId} size=${fileSize} storage=supabase duration=${Date.now() - startedAt}ms`);

    // Audit trail — non-blocking
    try {
      const headers = req.headers;
      const ip = headers.get('cf-connecting-ip') || (headers.get('x-forwarded-for') || '').split(',')[0].trim() || headers.get('x-real-ip') || null;
      base44.asServiceRole.entities.AccessTrail.create({
        eventType: 'document_upload',
        onboardingCaseId: caseId,
        action: 'upload',
        ip,
        country: headers.get('cf-ipcountry') || null,
        region: headers.get('cf-region') || null,
        city: headers.get('cf-ipcity') || null,
        userAgent: (headers.get('user-agent') || '').slice(0, 500),
        referer: (headers.get('referer') || '').slice(0, 500),
        docLinkToken: (docLinkToken || '').slice(0, 6),
        metadata: { documentTypeId, fileName: (fileName || '').slice(0, 200), fileSize, fileType, notAvailable: false, storage: 'supabase' },
        serverTimestamp: new Date().toISOString(),
      }).catch(() => {});
    } catch (_) { /* silent */ }

    return Response.json({
      ok: true,
      documentUploadId: createdDoc?.id,
      fileUri,
      fileUrl: fileUri,
      fileName,
      fileSize,
      fileType,
      duration_ms: Date.now() - startedAt,
    });
  } catch (error) {
    console.error('[publicDirectDocUpload] UNCAUGHT_ERROR:', error?.message, error?.stack);
    return Response.json({ ok: false, error: error?.message || 'Erro desconhecido' }, { status: 500 });
  }
});