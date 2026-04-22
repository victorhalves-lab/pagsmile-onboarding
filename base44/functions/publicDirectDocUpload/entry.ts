import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC endpoint — BULLETPROOF direct document upload.
 *
 * Receives the file as BASE64 inside a JSON body (via base44.functions.invoke).
 * This approach is 100% reliable on public routes because:
 *   - base44.functions.invoke is the SDK's native public-safe channel (already works anonymous)
 *   - We avoid the fragile SDK client-side UploadPrivateFile/UploadFile path
 *   - Server decodes base64 → File → uses asServiceRole.integrations.Core.UploadPrivateFile
 *
 * Request JSON body:
 *   - caseId              (string, required)
 *   - documentTypeId      (string, required)
 *   - documentName        (string, optional)
 *   - docLinkToken        (string, required when ComplianceDocOnly)
 *   - notAvailable        (boolean, optional)
 *   - notAvailableReason  (string, required when notAvailable=true, ≥10 chars)
 *   - fileBase64          (string, required unless notAvailable=true)
 *   - fileName            (string, required when fileBase64)
 *   - fileType            (string, required when fileBase64)
 *   - fileSize            (number, optional)
 *   - uploadDate          (ISO string, optional)
 *
 * Response: { ok, documentUploadId, fileUri, fileUrl, fileName, fileSize, fileType } | { ok:false, error }
 *
 * Side effect (fire-and-forget): triggers cafVerifaiDocs for documentoscopia.
 */

// FIX (2026-04-22): base44.asServiceRole.functions.invoke does NOT exist in the SDK.
// We must call the cafVerifaiDocs endpoint over plain HTTP using the app's internal URL.
// This runs fire-and-forget — documentoscopia must never block the client's upload response.
async function triggerVerifaiAsync(documentUploadId, onboardingCaseId, req) {
  try {
    const reqUrl = new URL(req.url);
    // Build sibling function URL from the current request URL (same host/app path)
    const verifaiUrl = reqUrl.href.replace(/\/publicDirectDocUpload(\?.*)?$/, '/cafVerifaiDocs');
    // Non-awaited: we truly want fire-and-forget. If the caller aborts, this may get cut
    // off, but that's acceptable — cafReconcilePendingTransactions picks up stragglers.
    fetch(verifaiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentUploadId, onboardingCaseId }),
    }).catch((err) => {
      console.warn('[publicDirectDocUpload] VerifAI trigger fetch failed:', err?.message);
    });
  } catch (err) {
    console.warn('[publicDirectDocUpload] VerifAI trigger setup failed:', err?.message);
  }
}

// Decode base64 (data URL or raw) into a Uint8Array
function base64ToBytes(b64) {
  const commaIdx = b64.indexOf(',');
  const raw = commaIdx >= 0 ? b64.slice(commaIdx + 1) : b64;
  const bin = atob(raw);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
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
    // Todas as operações usam asServiceRole, então não dependem do user context.
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

    // Branch B: decode base64 → File → upload server-side via asServiceRole
    let fileBlob;
    try {
      const bytes = base64ToBytes(fileBase64);
      fileBlob = new File([bytes], fileName || 'arquivo', { type: fileType || 'application/octet-stream' });
    } catch (decodeErr) {
      console.error('[publicDirectDocUpload] BASE64_DECODE_ERROR:', decodeErr?.message);
      return Response.json({ ok: false, error: 'Falha ao decodificar arquivo: ' + decodeErr?.message }, { status: 400 });
    }

    let uploadResult;
    try {
      uploadResult = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file: fileBlob });
    } catch (uploadErr) {
      console.error(`[publicDirectDocUpload] UPLOAD_FAILED caseId=${caseId} docType=${documentTypeId} name=${fileName}:`, uploadErr?.message);
      return Response.json({ ok: false, error: 'Falha ao salvar arquivo: ' + (uploadErr?.message || 'erro desconhecido') }, { status: 500 });
    }

    const fileUri = uploadResult?.file_uri;
    if (!fileUri) {
      return Response.json({ ok: false, error: 'Servidor não retornou URI do arquivo' }, { status: 500 });
    }

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

    console.log(`[publicDirectDocUpload] CREATED id=${createdDoc?.id} docType=${documentTypeId} size=${fileSize} duration=${Date.now() - startedAt}ms`);

    if (createdDoc?.id) {
      triggerVerifaiAsync(createdDoc.id, caseId, req);
    }

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