import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Fire-and-forget VerifAI analysis for a newly created DocumentUpload.
// Errors here NEVER block the upload response — VerifAI is best-effort; the pipeline
// will re-try for any doc still in validationStatus="Pendente" later.
async function triggerVerifaiAsync(base44, documentUploadId, onboardingCaseId) {
  try {
    await base44.asServiceRole.functions.invoke('cafVerifaiDocs', {
      documentUploadId,
      onboardingCaseId,
    });
  } catch (err) {
    console.warn('[publicComplianceDocUpload] VerifAI trigger failed (non-blocking):', err?.message);
  }
}

/**
 * PUBLIC endpoint — creates DocumentUpload records for a given OnboardingCase.
 *
 * Required: caseId, documents: [{ documentTypeId, documentName, fileUrl, fileName, fileSize, fileType, uploadDate }]
 * Optional: docLinkToken — if present, validates it matches the case's docLinkToken (used by ComplianceDocOnly).
 *           If absent, any case can receive docs (used by the main flow where the case was just created).
 *
 * CONTRACT (v2 — 2026-04-20):
 * Always returns { ok: boolean, createdCount, requestedCount, created: [...], failed: [{ documentTypeId, error }] }.
 * `ok` is true ONLY if ALL requested documents were successfully created.
 * The client MUST check `ok` — do NOT assume success just because the HTTP call didn't throw.
 */
Deno.serve(async (req) => {
  const startedAt = Date.now();
  try {
    if (req.method !== 'POST') {
      return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
    }
    const body = await req.json().catch(() => ({}));
    const { caseId, documents, docLinkToken } = body;

    console.log(`[publicComplianceDocUpload] START caseId=${caseId} docsCount=${Array.isArray(documents) ? documents.length : 0} hasToken=${!!docLinkToken}`);

    if (!caseId || !Array.isArray(documents) || documents.length === 0) {
      console.warn(`[publicComplianceDocUpload] BAD_REQUEST caseId=${caseId} docs=${documents}`);
      return Response.json({ ok: false, error: 'caseId and documents required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Validate case
    let cases = [];
    try {
      cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
    } catch (filterErr) {
      console.error(`[publicComplianceDocUpload] CASE_FILTER_ERROR caseId=${caseId}:`, filterErr.message);
      return Response.json({ ok: false, error: 'Erro ao buscar caso: ' + filterErr.message }, { status: 500 });
    }
    if (cases.length === 0) {
      console.warn(`[publicComplianceDocUpload] CASE_NOT_FOUND caseId=${caseId}`);
      return Response.json({ ok: false, error: 'Caso não encontrado' }, { status: 404 });
    }
    const onboardingCase = cases[0];

    // If docLinkToken provided, enforce match (for ComplianceDocOnly flow)
    if (docLinkToken && onboardingCase.docLinkToken !== docLinkToken) {
      console.warn(`[publicComplianceDocUpload] TOKEN_MISMATCH caseId=${caseId} expected=${onboardingCase.docLinkToken?.substring(0, 6)}... got=${docLinkToken?.substring(0, 6)}...`);
      return Response.json({ ok: false, error: 'Token inválido' }, { status: 403 });
    }

    // Create each DocumentUpload individually — track success/failure per document
    const created = [];
    const failed = [];
    const skipped = [];

    for (let i = 0; i < documents.length; i++) {
      const d = documents[i];
      if (!d || !d.documentTypeId || !d.fileUrl) {
        console.warn(`[publicComplianceDocUpload] SKIP idx=${i} reason=missing_required_fields documentTypeId=${d?.documentTypeId} hasFileUrl=${!!d?.fileUrl}`);
        skipped.push({ index: i, documentTypeId: d?.documentTypeId || null, reason: 'missing documentTypeId or fileUrl' });
        continue;
      }
      try {
        const payload = {
          onboardingCaseId: caseId,
          documentTypeId: d.documentTypeId,
          documentName: d.documentName || d.documentTypeId,
          fileUrl: d.fileUrl,
          fileName: d.fileName || '',
          fileSize: typeof d.fileSize === 'number' ? d.fileSize : 0,
          fileType: d.fileType || '',
          uploadDate: d.uploadDate || new Date().toISOString(),
          validationStatus: 'Pendente',
        };
        const createdDoc = await base44.asServiceRole.entities.DocumentUpload.create(payload);
        console.log(`[publicComplianceDocUpload] CREATED idx=${i} id=${createdDoc?.id} documentTypeId=${d.documentTypeId} file=${d.fileName}`);
        created.push({ id: createdDoc?.id, documentTypeId: d.documentTypeId, documentName: payload.documentName });
        // Fire-and-forget VerifAI analysis — CAF VerifAI Docs checks for digital manipulation.
        // Skipped internally for CAF-captured docs (documentTypeId starts with 'caf_').
        // Does NOT block the response; failures are logged but don't affect the result.
        if (createdDoc?.id) {
          triggerVerifaiAsync(base44, createdDoc.id, caseId);
        }
      } catch (createErr) {
        console.error(`[publicComplianceDocUpload] CREATE_FAILED idx=${i} documentTypeId=${d.documentTypeId} error=${createErr.message}`);
        failed.push({
          index: i,
          documentTypeId: d.documentTypeId,
          documentName: d.documentName || d.documentTypeId,
          fileName: d.fileName || '',
          error: createErr.message || String(createErr),
        });
      }
    }

    const requestedCount = documents.length;
    const createdCount = created.length;
    const allOk = failed.length === 0 && createdCount === (requestedCount - skipped.length);

    const result = {
      ok: allOk,
      caseId,
      requestedCount,
      createdCount,
      skippedCount: skipped.length,
      failedCount: failed.length,
      created,
      skipped,
      failed,
      duration_ms: Date.now() - startedAt,
    };

    console.log(`[publicComplianceDocUpload] DONE caseId=${caseId} ok=${allOk} created=${createdCount}/${requestedCount} skipped=${skipped.length} failed=${failed.length} duration=${result.duration_ms}ms`);

    // If nothing was successfully created, return a non-2xx so clients that only check status code still fail loudly.
    if (createdCount === 0) {
      return Response.json({ ...result, error: 'Nenhum documento foi criado' }, { status: 500 });
    }
    // Partial success → still 200 but ok=false so the client can detect it.
    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error('[publicComplianceDocUpload] UNCAUGHT_ERROR:', error?.message, error?.stack);
    return Response.json({ ok: false, error: error.message || 'Erro desconhecido' }, { status: 500 });
  }
});