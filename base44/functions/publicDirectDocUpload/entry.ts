import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC endpoint — BULLETPROOF direct document upload.
 *
 * Receives raw multipart/form-data from the browser via native fetch (no SDK dependency
 * on the client side). The server handles the upload via asServiceRole and creates the
 * DocumentUpload entity, then fires VerifAI analysis asynchronously.
 *
 * This is the 100%-reliable replacement for publicComplianceDocUpload + client-side
 * SDK.integrations.Core.UploadPrivateFile — eliminating the two most common failure modes:
 *   1. SDK initialization crashes on public routes (legacy session tokens)
 *   2. Obscure SDK errors during upload (e.g. "instanceof is not callable")
 *
 * Multipart fields expected:
 *   - file             (File, required unless notAvailable=true)
 *   - caseId           (string, required)
 *   - documentTypeId   (string, required)
 *   - documentName     (string, optional)
 *   - docLinkToken     (string, required when called from ComplianceDocOnly)
 *   - notAvailable     ("true"/"false", optional — defaults false)
 *   - notAvailableReason (string, required when notAvailable=true)
 *   - uploadDate       (ISO string, optional)
 *
 * Response: { ok: true, documentUploadId, fileUri, fileUrl } or { ok: false, error }
 *
 * FIRE-AND-FORGET side effects (never block the response):
 *   - cafVerifaiDocs (documentoscopia) — same as publicComplianceDocUpload
 */

async function triggerVerifaiAsync(base44, documentUploadId, onboardingCaseId) {
  try {
    await base44.asServiceRole.functions.invoke('cafVerifaiDocs', {
      documentUploadId,
      onboardingCaseId,
    });
  } catch (err) {
    console.warn('[publicDirectDocUpload] VerifAI trigger failed (non-blocking):', err?.message);
  }
}

Deno.serve(async (req) => {
  const startedAt = Date.now();
  try {
    if (req.method !== 'POST') {
      return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return Response.json({ ok: false, error: 'Content-Type must be multipart/form-data' }, { status: 400 });
    }

    const form = await req.formData();
    const caseId = String(form.get('caseId') || '');
    const documentTypeId = String(form.get('documentTypeId') || '');
    const documentName = String(form.get('documentName') || documentTypeId);
    const docLinkToken = String(form.get('docLinkToken') || '');
    const notAvailable = String(form.get('notAvailable') || '') === 'true';
    const notAvailableReason = String(form.get('notAvailableReason') || '').trim();
    const uploadDate = String(form.get('uploadDate') || new Date().toISOString());
    const file = form.get('file');

    console.log(`[publicDirectDocUpload] START caseId=${caseId} docType=${documentTypeId} notAvailable=${notAvailable} hasFile=${!!file} hasToken=${!!docLinkToken}`);

    if (!caseId || !documentTypeId) {
      return Response.json({ ok: false, error: 'caseId and documentTypeId are required' }, { status: 400 });
    }

    if (!notAvailable && !(file instanceof File)) {
      return Response.json({ ok: false, error: 'file is required when not marked as unavailable' }, { status: 400 });
    }

    if (notAvailable && notAvailableReason.length < 10) {
      return Response.json({ ok: false, error: 'notAvailableReason must be at least 10 characters' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // ── Validate case + token ──
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

    // ── Branch A: Not-available justification (no file upload) ──
    if (notAvailable) {
      const createdDoc = await base44.asServiceRole.entities.DocumentUpload.create({
        onboardingCaseId: caseId,
        documentTypeId,
        documentName,
        fileUrl: '',
        fileName: '',
        fileSize: 0,
        fileType: '',
        uploadDate,
        validationStatus: 'Pendente',
        isPrivate: false,
        fileUri: '',
        notAvailable: true,
        notAvailableReason,
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

    // ── Branch B: Real file upload ──
    // Use server-side asServiceRole to upload the file — bypasses all client SDK risk.
    let uploadResult;
    try {
      uploadResult = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
    } catch (uploadErr) {
      console.error(`[publicDirectDocUpload] UPLOAD_FAILED caseId=${caseId} docType=${documentTypeId} name=${file?.name}:`, uploadErr?.message);
      return Response.json({ ok: false, error: 'Falha ao salvar arquivo: ' + (uploadErr?.message || 'erro desconhecido') }, { status: 500 });
    }

    const fileUri = uploadResult?.file_uri;
    if (!fileUri) {
      return Response.json({ ok: false, error: 'Servidor não retornou URI do arquivo' }, { status: 500 });
    }

    // Create DocumentUpload entity
    let createdDoc;
    try {
      createdDoc = await base44.asServiceRole.entities.DocumentUpload.create({
        onboardingCaseId: caseId,
        documentTypeId,
        documentName,
        fileUrl: fileUri,
        fileUri,
        isPrivate: true,
        fileName: file.name || '',
        fileSize: typeof file.size === 'number' ? file.size : 0,
        fileType: file.type || '',
        uploadDate,
        validationStatus: 'Pendente',
        notAvailable: false,
        notAvailableReason: '',
      });
    } catch (createErr) {
      console.error(`[publicDirectDocUpload] CREATE_FAILED caseId=${caseId} docType=${documentTypeId}:`, createErr?.message);
      return Response.json({ ok: false, error: 'Falha ao registrar documento: ' + (createErr?.message || 'erro desconhecido') }, { status: 500 });
    }

    console.log(`[publicDirectDocUpload] CREATED id=${createdDoc?.id} docType=${documentTypeId} size=${file.size} duration=${Date.now() - startedAt}ms`);

    // Fire-and-forget VerifAI (documentoscopia) — same pipeline as publicComplianceDocUpload
    if (createdDoc?.id) {
      triggerVerifaiAsync(base44, createdDoc.id, caseId);
    }

    return Response.json({
      ok: true,
      documentUploadId: createdDoc?.id,
      fileUri,
      fileUrl: fileUri,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      duration_ms: Date.now() - startedAt,
    });
  } catch (error) {
    console.error('[publicDirectDocUpload] UNCAUGHT_ERROR:', error?.message, error?.stack);
    return Response.json({ ok: false, error: error?.message || 'Erro desconhecido' }, { status: 500 });
  }
});