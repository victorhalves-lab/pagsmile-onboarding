import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Atribui múltiplos casos a um parceiro de uma vez, filtrando pelos modelos permitidos.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { onboardingCaseIds, partnerId, visibilityLevel, reason } = await req.json();
    if (!Array.isArray(onboardingCaseIds) || onboardingCaseIds.length === 0 || !partnerId) {
      return Response.json({ error: 'onboardingCaseIds array and partnerId required' }, { status: 400 });
    }

    const partner = await base44.asServiceRole.entities.CompliancePartner.get(partnerId);
    if (!partner) return Response.json({ error: 'Partner not found' }, { status: 404 });
    if (partner.isActive === false) return Response.json({ error: 'Partner inactive' }, { status: 400 });

    const allowed = partner.allowedOnboardingCaseModels || [];
    const results = { success: [], failed: [] };

    for (const caseId of onboardingCaseIds) {
      try {
        const c = await base44.asServiceRole.entities.OnboardingCase.get(caseId);
        if (!c) { results.failed.push({ caseId, reason: 'Case not found' }); continue; }

        let caseModel = '';
        try {
          const tpl = await base44.asServiceRole.entities.QuestionnaireTemplate.get(c.questionnaireTemplateId);
          caseModel = tpl?.model || '';
        } catch (_) {}

        if (!allowed.includes(caseModel)) {
          results.failed.push({ caseId, reason: `Modelo "${caseModel}" não permitido` });
          continue;
        }

        const existing = await base44.asServiceRole.entities.PartnerAssignment.filter({
          onboardingCaseId: caseId,
          partnerId,
          status: { $in: ['pending', 'viewed', 'in_review'] }
        });
        if (existing && existing.length > 0) {
          results.failed.push({ caseId, reason: 'Já atribuído' });
          continue;
        }

        let merchant = null;
        try { merchant = await base44.asServiceRole.entities.Merchant.get(c.merchantId); } catch (_) {}

        const slaHours = partner.slaHours || 48;
        const assigned = await base44.asServiceRole.entities.PartnerAssignment.create({
          onboardingCaseId: caseId,
          merchantId: c.merchantId,
          merchantName: merchant?.companyName || merchant?.fullName || '',
          merchantCpfCnpj: merchant?.cpfCnpj || '',
          caseModel,
          caseStatus: c.status,
          caseRiskScoreV4: c.riskScoreV4,
          caseSubfaixa: c.subfaixa,
          partnerId,
          partnerName: partner.name,
          assignedBy: user.email,
          assignedByName: user.full_name,
          assignedAt: new Date().toISOString(),
          assignmentReason: reason || '',
          partnerVisibilityLevel: visibilityLevel || partner.defaultVisibilityLevel || 'full',
          status: 'pending',
          dueDate: new Date(Date.now() + slaHours * 3600 * 1000).toISOString()
        });

        await base44.asServiceRole.entities.PartnerAssignmentActivity.create({
          assignmentId: assigned.id,
          partnerId,
          onboardingCaseId: caseId,
          activityType: 'assigned',
          performedBy: user.email,
          performedByName: user.full_name,
          performedByRole: 'admin',
          description: `Atribuição em massa: ${partner.name}`,
          details: { reason, bulk: true }
        });

        results.success.push({ caseId, assignmentId: assigned.id });
      } catch (e) {
        results.failed.push({ caseId, reason: e.message });
      }
    }

    // Notificar parceiro com resumo
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot').catch(() => ({}));
      if (accessToken && partner?.notificationChannels?.slack?.channelId && results.success.length > 0) {
        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: partner.notificationChannels.slack.channelId,
            text: `🔔 *${results.success.length} novos casos atribuídos em massa*\nAcesse sua aba de Compliance Parceiro.`
          })
        });
      }
    } catch (_) {}

    return Response.json({ success: true, results });
  } catch (error) {
    console.error('adminBulkAssignPartner error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});