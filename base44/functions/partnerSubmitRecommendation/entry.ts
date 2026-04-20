import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Parceiro submete sua decisão final sobre o caso (approve/reject/request_docs/escalate).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { assignmentId, recommendation, comments } = await req.json();
    if (!assignmentId || !recommendation) {
      return Response.json({ error: 'assignmentId and recommendation required' }, { status: 400 });
    }

    const validRecommendations = ['approve', 'reject', 'request_docs', 'escalate'];
    if (!validRecommendations.includes(recommendation)) {
      return Response.json({ error: 'Invalid recommendation' }, { status: 400 });
    }

    if (!comments || String(comments).trim().length < 20) {
      return Response.json({ error: 'Comments must be at least 20 characters' }, { status: 400 });
    }

    const assignment = await base44.asServiceRole.entities.PartnerAssignment.get(assignmentId);
    if (!assignment) return Response.json({ error: 'Assignment not found' }, { status: 404 });

    // Validar que o usuário pertence ao parceiro + tem role de analyst ou manager
    const userLinks = await base44.asServiceRole.entities.CompliancePartnerUser.filter({
      userId: user.id,
      isActive: true,
      partnerId: assignment.partnerId
    });
    if (!userLinks || userLinks.length === 0) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const link = userLinks[0];
    if (!['analyst', 'manager'].includes(link.partnerRole)) {
      return Response.json({ error: 'Your role cannot submit recommendations' }, { status: 403 });
    }

    const isChanging = !!assignment.partnerRecommendation;
    const now = new Date().toISOString();

    await base44.asServiceRole.entities.PartnerAssignment.update(assignmentId, {
      partnerRecommendation: recommendation,
      partnerComments: comments,
      partnerReviewerId: user.id,
      partnerReviewerName: user.full_name,
      partnerReviewerEmail: user.email,
      partnerReviewedAt: now,
      status: 'completed'
    });

    await base44.asServiceRole.entities.PartnerAssignmentActivity.create({
      assignmentId,
      partnerId: assignment.partnerId,
      onboardingCaseId: assignment.onboardingCaseId,
      activityType: isChanging ? 'recommendation_changed' : 'recommendation_submitted',
      performedBy: user.email,
      performedByName: user.full_name,
      performedByRole: 'partner',
      description: `${user.full_name} (${assignment.partnerName}) ${isChanging ? 'alterou' : 'enviou'} parecer: ${recommendation.toUpperCase()}`,
      details: { recommendation, comments: comments.slice(0, 500) }
    });

    // Notificar Pagsmile via Slack
    try {
      await notifySlack(base44, assignment, user, recommendation, comments);
    } catch (e) {
      console.warn('Slack notification failed:', e.message);
    }

    return Response.json({ success: true, message: 'Parecer enviado com sucesso.' });
  } catch (error) {
    console.error('partnerSubmitRecommendation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function notifySlack(base44, assignment, user, recommendation, comments) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot').catch(() => ({}));
  if (!accessToken) return;

  const emoji = { approve: '✅', reject: '❌', request_docs: '📄', escalate: '⚠️' }[recommendation] || '📌';
  const label = { approve: 'APROVADO', reject: 'REPROVADO', request_docs: 'SOLICITOU DOCS', escalate: 'ESCALOU' }[recommendation];

  const text = `${emoji} *Parecer do Parceiro* — ${label}\n` +
    `*Parceiro:* ${assignment.partnerName}\n` +
    `*Analista:* ${user.full_name} (${user.email})\n` +
    `*Cliente:* ${assignment.merchantName || 'N/A'}\n` +
    `*Caso:* ${assignment.onboardingCaseId}\n` +
    `*Modelo:* ${assignment.caseModel || 'N/A'}\n` +
    `*Justificativa:* ${comments.slice(0, 300)}${comments.length > 300 ? '...' : ''}`;

  const channel = Deno.env.get('SLACK_COMPLIANCE_CHANNEL') || '#compliance';
  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, text })
  });
}