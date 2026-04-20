import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Monitora SLAs de PartnerAssignments e envia notificações de vencimento.
 * Chamada por automação scheduled (1x/hora).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Permite chamada interna sem auth (automação) — mas se vier user, valida admin
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch (_) {}

    const now = Date.now();
    const activeAssignments = await base44.asServiceRole.entities.PartnerAssignment.filter({
      status: { $in: ['pending', 'viewed', 'in_review'] }
    }, '-assignedAt', 500);

    const stats = { warned24h: 0, expired: 0, total: activeAssignments.length };

    for (const a of activeAssignments) {
      if (!a.dueDate) continue;
      const due = new Date(a.dueDate).getTime();
      const hoursLeft = (due - now) / (3600 * 1000);

      if (hoursLeft < 0) {
        // Expirado
        await base44.asServiceRole.entities.PartnerAssignment.update(a.id, { status: 'expired' });
        await base44.asServiceRole.entities.PartnerAssignmentActivity.create({
          assignmentId: a.id,
          partnerId: a.partnerId,
          onboardingCaseId: a.onboardingCaseId,
          activityType: 'sla_breached',
          performedBy: 'system',
          performedByRole: 'system',
          description: 'SLA expirado sem resposta do parceiro'
        });
        await notifyExpired(base44, a);
        stats.expired++;
      } else if (hoursLeft > 0 && hoursLeft <= 24) {
        // Verifica se já enviamos warning nas últimas 24h
        const existingWarning = await base44.asServiceRole.entities.PartnerAssignmentActivity.filter({
          assignmentId: a.id,
          activityType: 'sla_warning_sent'
        }, '-created_date', 1);
        if (!existingWarning || existingWarning.length === 0) {
          await base44.asServiceRole.entities.PartnerAssignmentActivity.create({
            assignmentId: a.id,
            partnerId: a.partnerId,
            onboardingCaseId: a.onboardingCaseId,
            activityType: 'sla_warning_sent',
            performedBy: 'system',
            performedByRole: 'system',
            description: `SLA vence em ${Math.round(hoursLeft)}h`
          });
          await notifyWarning(base44, a, Math.round(hoursLeft));
          stats.warned24h++;
        }
      }
    }

    return Response.json({ success: true, stats });
  } catch (error) {
    console.error('partnerSlaMonitor error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function getSlackToken(base44) {
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
    return accessToken;
  } catch (_) { return null; }
}

async function notifyExpired(base44, assignment) {
  const token = await getSlackToken(base44);
  if (!token) return;
  try {
    const partner = await base44.asServiceRole.entities.CompliancePartner.get(assignment.partnerId);
    const adminCh = Deno.env.get('SLACK_COMPLIANCE_CHANNEL') || '#compliance';
    const text = `⚠️ *SLA vencido*\n*Parceiro:* ${assignment.partnerName}\n*Cliente:* ${assignment.merchantName}\n*Caso:* ${assignment.onboardingCaseId}\nO parceiro não respondeu no prazo.`;
    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: adminCh, text })
    });
    if (partner?.notificationChannels?.slack?.channelId) {
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: partner.notificationChannels.slack.channelId,
          text: `⚠️ *SLA vencido* para o caso do cliente ${assignment.merchantName}. Atribuição marcada como expirada.`
        })
      });
    }
  } catch (_) {}
}

async function notifyWarning(base44, assignment, hoursLeft) {
  const token = await getSlackToken(base44);
  if (!token) return;
  try {
    const partner = await base44.asServiceRole.entities.CompliancePartner.get(assignment.partnerId);
    if (!partner?.notificationChannels?.slack?.channelId) return;
    const text = `⏰ *SLA vence em ~${hoursLeft}h*\n*Cliente:* ${assignment.merchantName}\n*Caso:* ${assignment.onboardingCaseId}`;
    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: partner.notificationChannels.slack.channelId, text })
    });
  } catch (_) {}
}