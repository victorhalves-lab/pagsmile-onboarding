import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Admin atribui um OnboardingCase a um CompliancePartner.
 * Valida que o caseModel está nos allowedOnboardingCaseModels do parceiro.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin required' }, { status: 403 });
    }

    const { onboardingCaseId, partnerId, visibilityLevel, reason, dueDate } = await req.json();
    if (!onboardingCaseId || !partnerId) {
      return Response.json({ error: 'onboardingCaseId and partnerId required' }, { status: 400 });
    }

    const onboardingCase = await base44.asServiceRole.entities.OnboardingCase.get(onboardingCaseId);
    if (!onboardingCase) return Response.json({ error: 'Case not found' }, { status: 404 });

    const partner = await base44.asServiceRole.entities.CompliancePartner.get(partnerId);
    if (!partner) return Response.json({ error: 'Partner not found' }, { status: 404 });
    if (partner.isActive === false) return Response.json({ error: 'Partner is inactive' }, { status: 400 });

    // Resolver caseModel: ler do QuestionnaireTemplate
    let caseModel = '';
    try {
      const tpl = await base44.asServiceRole.entities.QuestionnaireTemplate.get(onboardingCase.questionnaireTemplateId);
      caseModel = tpl?.model || '';
    } catch (_) {}

    const allowed = partner.allowedOnboardingCaseModels || [];
    if (allowed.length === 0 || !allowed.includes(caseModel)) {
      return Response.json({
        error: `O parceiro "${partner.name}" não está autorizado a ver o modelo "${caseModel}". Ajuste os modelos permitidos do parceiro ou selecione outro parceiro.`
      }, { status: 400 });
    }

    // Prevenir duplicata (mesmo caso + parceiro + status ativo)
    const existing = await base44.asServiceRole.entities.PartnerAssignment.filter({
      onboardingCaseId,
      partnerId,
      status: { $in: ['pending', 'viewed', 'in_review'] }
    });
    if (existing && existing.length > 0) {
      return Response.json({ error: 'Já existe uma atribuição ativa deste caso a este parceiro.' }, { status: 409 });
    }

    // Dados do merchant
    let merchant = null;
    try {
      merchant = await base44.asServiceRole.entities.Merchant.get(onboardingCase.merchantId);
    } catch (_) {}

    const assignedAt = new Date().toISOString();
    const slaHours = partner.slaHours || 48;
    const finalDueDate = dueDate || new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

    const assignment = await base44.asServiceRole.entities.PartnerAssignment.create({
      onboardingCaseId,
      merchantId: onboardingCase.merchantId,
      merchantName: merchant?.companyName || merchant?.fullName || '',
      merchantCpfCnpj: merchant?.cpfCnpj || '',
      caseModel,
      caseStatus: onboardingCase.status,
      caseRiskScoreV4: onboardingCase.riskScoreV4,
      caseSubfaixa: onboardingCase.subfaixa,
      partnerId,
      partnerName: partner.name,
      assignedBy: user.email,
      assignedByName: user.full_name,
      assignedAt,
      assignmentReason: reason || '',
      partnerVisibilityLevel: visibilityLevel || partner.defaultVisibilityLevel || 'full',
      status: 'pending',
      dueDate: finalDueDate
    });

    await base44.asServiceRole.entities.PartnerAssignmentActivity.create({
      assignmentId: assignment.id,
      partnerId,
      onboardingCaseId,
      activityType: 'assigned',
      performedBy: user.email,
      performedByName: user.full_name,
      performedByRole: 'admin',
      description: `${user.full_name} atribuiu o caso ao parceiro ${partner.name}`,
      details: { reason, visibilityLevel, dueDate: finalDueDate }
    });

    // Notificar parceiro via Slack
    try {
      await notifyPartnerSlack(base44, partner, assignment, merchant);
    } catch (e) {
      console.warn('Slack notify failed:', e.message);
    }

    return Response.json({ success: true, assignment });
  } catch (error) {
    console.error('adminAssignCaseToPartner error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function notifyPartnerSlack(base44, partner, assignment, merchant) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot').catch(() => ({}));
  if (!accessToken) return;

  const channel = partner.notificationChannels?.slack?.channelId;
  if (!channel) return;

  const text = `🔔 *Novo caso atribuído para análise*\n` +
    `*Cliente:* ${assignment.merchantName || 'N/A'}\n` +
    `*Modelo:* ${assignment.caseModel}\n` +
    `*Score V4:* ${assignment.caseRiskScoreV4 || 'N/A'} (${assignment.caseSubfaixa || 'N/A'})\n` +
    `*Prazo:* ${new Date(assignment.dueDate).toLocaleString('pt-BR')}\n` +
    `Acesse sua aba de Compliance Parceiro para analisar.`;

  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, text })
  });
}