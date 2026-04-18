import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC endpoint — submits a Lead from public questionnaire pages
 * (QuestionarioLeadsPagsmile, LeadPixV4, LeadQuestionnaire, QuestionarioSimplificadoPublico).
 *
 * Enforces that status is restricted to the known client-side values (no injection of kyc_aprovado etc).
 *
 * Payload:
 *   - kind: 'lead' | 'introducer_lead' | 'simplified'
 *   - linkCode (optional): used to resolve introducer + increment submissionCount
 *   - leadPayload: fields for the Lead entity (sanitized server-side)
 *   - introducerLeadPayload: for kind='introducer_lead' — additional IntroducerLead fields
 *   - simplifiedPayload: for kind='simplified' — for QuestionarioSimplificadoPublico
 */
const ALLOWED_LEAD_STATUSES = new Set(['questionario_preenchido']);

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const { kind, linkCode, leadPayload, introducerLeadPayload, simplifiedPayload } = body;
    const base44 = createClientFromRequest(req);

    // ── Simplified questionnaire (QuestionarioSimplificadoPublico) ──
    if (kind === 'simplified') {
      if (!simplifiedPayload) {
        return Response.json({ error: 'simplifiedPayload required' }, { status: 400 });
      }
      const safePayload = {
        ...simplifiedPayload,
        status: 'novo',
      };
      const created = await base44.asServiceRole.entities.QuestionarioSimplificado.create(safePayload);

      if (linkCode) {
        try {
          const links = await base44.asServiceRole.entities.OnboardingLink.filter({ uniqueCode: linkCode });
          if (links.length > 0) {
            await base44.asServiceRole.entities.OnboardingLink.update(links[0].id, {
              submissionCount: (links[0].submissionCount || 0) + 1,
            });
          }
        } catch (_) {}
      }
      return Response.json({ ok: true, id: created.id, protocolo: simplifiedPayload.protocolo });
    }

    // ── Lead / Introducer Lead flow ──
    if (!leadPayload) {
      return Response.json({ error: 'leadPayload required' }, { status: 400 });
    }

    // Force status to allowed value
    const safeLeadPayload = {
      ...leadPayload,
      status: ALLOWED_LEAD_STATUSES.has(leadPayload.status) ? leadPayload.status : 'questionario_preenchido',
    };

    // Resolve introducer + agent from link (server-side, don't trust client)
    if (linkCode) {
      try {
        const links = await base44.asServiceRole.entities.OnboardingLink.filter({ uniqueCode: linkCode });
        const link = links[0];
        if (link) {
          safeLeadPayload.onboardingLinkCode = linkCode;
          if (link.commercialAgentId) safeLeadPayload.commercialAgentId = link.commercialAgentId;
          if (link.commercialAgentName) safeLeadPayload.commercialAgentName = link.commercialAgentName;
          if (link.introducerId) {
            try {
              const intros = await base44.asServiceRole.entities.Introducer.filter({ id: link.introducerId });
              if (intros.length > 0) {
                safeLeadPayload.introducerId = intros[0].id;
                safeLeadPayload.introducerName = intros[0].name;
                safeLeadPayload.introducerReferralCode = intros[0].referralCode;
              }
            } catch (_) {}
          }
        }
      } catch (_) {}
    }

    const createdLead = await base44.asServiceRole.entities.Lead.create(safeLeadPayload);

    // Create IntroducerLead if requested
    let createdIntroducerLead = null;
    if (kind === 'introducer_lead' && introducerLeadPayload && safeLeadPayload.introducerId) {
      const safeIntroducerLeadPayload = {
        ...introducerLeadPayload,
        leadId: createdLead.id,
        introducerId: safeLeadPayload.introducerId,
        introducerName: safeLeadPayload.introducerName,
        introducerReferralCode: safeLeadPayload.introducerReferralCode,
        status: 'novo',
      };
      createdIntroducerLead = await base44.asServiceRole.entities.IntroducerLead.create(safeIntroducerLeadPayload);
    }

    // Increment link submissionCount
    if (linkCode) {
      try {
        const links = await base44.asServiceRole.entities.OnboardingLink.filter({ uniqueCode: linkCode });
        if (links.length > 0) {
          await base44.asServiceRole.entities.OnboardingLink.update(links[0].id, {
            submissionCount: (links[0].submissionCount || 0) + 1,
          });
        }
      } catch (_) {}
    }

    return Response.json({
      ok: true,
      leadId: createdLead.id,
      introducerLeadId: createdIntroducerLead?.id || null,
      resolvedIntroducerId: safeLeadPayload.introducerId || null,
      resolvedCommercialAgentId: safeLeadPayload.commercialAgentId || null,
    });
  } catch (error) {
    console.error('publicLeadSubmit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});