import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Audita download de documento por parceiro e retorna a URL do arquivo.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { assignmentId, documentId } = await req.json();
    if (!assignmentId || !documentId) {
      return Response.json({ error: 'assignmentId and documentId required' }, { status: 400 });
    }

    const assignment = await base44.asServiceRole.entities.PartnerAssignment.get(assignmentId);
    if (!assignment) return Response.json({ error: 'Not found' }, { status: 404 });

    // Validar acesso
    const userLinks = await base44.asServiceRole.entities.CompliancePartnerUser.filter({
      userId: user.id,
      isActive: true,
      partnerId: assignment.partnerId
    });
    if (!userLinks || userLinks.length === 0) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validar nível de visibilidade (summary_only não pode baixar)
    if (assignment.partnerVisibilityLevel === 'summary_only') {
      return Response.json({ error: 'Download not allowed for summary_only visibility' }, { status: 403 });
    }

    // Fetch documento server-side (NUNCA confiar em URL vinda do cliente)
    const document = await base44.asServiceRole.entities.DocumentUpload.get(documentId);
    if (!document) return Response.json({ error: 'Document not found' }, { status: 404 });

    // Validar que o documento pertence ao caso do assignment
    if (document.onboardingCaseId !== assignment.onboardingCaseId) {
      return Response.json({ error: 'Document does not belong to this assignment' }, { status: 403 });
    }

    if (!document.fileUrl) {
      return Response.json({ error: 'Document has no file URL' }, { status: 404 });
    }

    // Gerar signed URL fresh (nunca reusar URL antiga)
    let downloadUrl = document.fileUrl;
    if (document.fileUrl.startsWith('b44s://') || document.fileUrl.includes('/private/')) {
      const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: document.fileUrl,
        expires_in: 120
      });
      downloadUrl = signed_url;
    }

    // Loga atividade
    await base44.asServiceRole.entities.PartnerAssignmentActivity.create({
      assignmentId,
      partnerId: assignment.partnerId,
      onboardingCaseId: assignment.onboardingCaseId,
      activityType: 'documents_downloaded',
      performedBy: user.email,
      performedByName: user.full_name,
      performedByRole: 'partner',
      description: `${user.full_name} baixou documento: ${document.documentName || document.fileName || documentId}`,
      details: { documentId, documentName: document.documentName || document.fileName }
    });

    return Response.json({ success: true, url: downloadUrl });
  } catch (error) {
    console.error('partnerDownloadDocument error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});