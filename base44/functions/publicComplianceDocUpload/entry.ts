import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC endpoint — creates DocumentUpload records for a given OnboardingCase.
 *
 * Required: caseId, documents: [{ documentTypeId, documentName, fileUrl, fileName, fileSize, fileType, uploadDate }]
 * Optional: docLinkToken — if present, validates it matches the case's docLinkToken (used by ComplianceDocOnly).
 *           If absent, any case can receive docs (used by the main flow where the case was just created).
 */
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    const body = await req.json().catch(() => ({}));
    const { caseId, documents, docLinkToken } = body;
    if (!caseId || !Array.isArray(documents) || documents.length === 0) {
      return Response.json({ error: 'caseId and documents required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Validate case
    let cases = [];
    try { cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId }); } catch (_) {}
    if (cases.length === 0) {
      return Response.json({ error: 'Caso não encontrado' }, { status: 404 });
    }
    const onboardingCase = cases[0];

    // If docLinkToken provided, enforce match (for ComplianceDocOnly flow)
    if (docLinkToken && onboardingCase.docLinkToken !== docLinkToken) {
      return Response.json({ error: 'Token inválido' }, { status: 403 });
    }

    // Create each DocumentUpload individually (to trigger per-doc CAF VerifAI automation)
    for (const d of documents) {
      if (!d || !d.documentTypeId || !d.fileUrl) continue;
      await base44.asServiceRole.entities.DocumentUpload.create({
        onboardingCaseId: caseId,
        documentTypeId: d.documentTypeId,
        documentName: d.documentName || d.documentTypeId,
        fileUrl: d.fileUrl,
        fileName: d.fileName || '',
        fileSize: d.fileSize || 0,
        fileType: d.fileType || '',
        uploadDate: d.uploadDate || new Date().toISOString(),
        validationStatus: 'Pendente',
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('publicComplianceDocUpload error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});