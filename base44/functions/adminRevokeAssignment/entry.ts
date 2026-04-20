import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin required' }, { status: 403 });
    }

    const { assignmentId, reason } = await req.json();
    if (!assignmentId) return Response.json({ error: 'assignmentId required' }, { status: 400 });

    const assignment = await base44.asServiceRole.entities.PartnerAssignment.get(assignmentId);
    if (!assignment) return Response.json({ error: 'Not found' }, { status: 404 });

    const now = new Date().toISOString();
    await base44.asServiceRole.entities.PartnerAssignment.update(assignmentId, {
      status: 'revoked',
      revokedAt: now,
      revokedBy: user.email,
      revokeReason: reason || ''
    });

    await base44.asServiceRole.entities.PartnerAssignmentActivity.create({
      assignmentId,
      partnerId: assignment.partnerId,
      onboardingCaseId: assignment.onboardingCaseId,
      activityType: 'revoked',
      performedBy: user.email,
      performedByName: user.full_name,
      performedByRole: 'admin',
      description: `${user.full_name} revogou a atribuição`,
      details: { reason }
    });

    // Notificar parceiro via Slack
    try {
      const partner = await base44.asServiceRole.entities.CompliancePartner.get(assignment.partnerId);
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot').catch(() => ({}));
      if (accessToken && partner?.notificationChannels?.slack?.channelId) {
        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: partner.notificationChannels.slack.channelId,
            text: `🔕 Atribuição revogada\n*Cliente:* ${assignment.merchantName || 'N/A'}\n*Motivo:* ${reason || 'Não informado'}`
          })
        });
      }
    } catch (_) {}

    return Response.json({ success: true });
  } catch (error) {
    console.error('adminRevokeAssignment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});