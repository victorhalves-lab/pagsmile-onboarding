import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Audita download de documento por parceiro e retorna a URL do arquivo.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { assignmentId, documentId, documentName, documentUrl } = await req.json();
    if (!assignmentId || !documentUrl) {
      return Response.json({ error: 'assignmentId and documentUrl required' }, { status: 400 });
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

    // Loga atividade
    await base44.asServiceRole.entities.PartnerAssignmentActivity.create({
      assignmentId,
      partnerId: assignment.partnerId,
      onboardingCaseId: assignment.onboardingCaseId,
      activityType: 'documents_downloaded',
      performedBy: user.email,
      performedByName: user.full_name,
      performedByRole: 'partner',
      description: `${user.full_name} baixou documento: ${documentName || documentId || 'sem nome'}`,
      details: { documentId, documentName, documentUrl }
    });

    return Response.json({ success: true, url: documentUrl });
  } catch (error) {
    console.error('partnerDownloadDocument error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});