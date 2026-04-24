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

// SECURITY: allowlist of fields the public client is allowed to send.
// ALL other fields (introducerId, commercialAgentId, leadQualifierScore, priscila*, ia*, bdc*,
// onboardingCaseId, currentProposalId, etc.) are derived SERVER-SIDE from linkCode or by
// post-create automations. Never trust the client for scoring/attribution/IA fields.
const CLIENT_ALLOWED_LEAD_FIELDS = [
  'email', 'fullName', 'cpfCnpj', 'phone',
  'companyName', 'website', 'mcc',
  'contactName', 'contactRole',
  'businessSubCategory',
  'tpvMensal', 'ticketMedio', 'transacoesMes',
  'expectativaCrescimento',
  'protocolo', 'origemLead',
  'questionnaireData', 'expectedRates',
  'lastInteractionDate',
  // BDC enrichment (calculated client-side from bdcEnrichLead response)
  'bdcEnrichmentData', 'bdcLeadScore', 'bdcScoreLevel',
  'bdcFlags', 'bdcCrossValidation', 'bdcEnrichmentDate',
  // Lead qualifier (calculated client-side from questionnaire answers)
  'leadQualifierScore', 'leadQualifierLevel',
];

// SECURITY: IntroducerLead allowlist — client CANNOT set leadId, introducerId,
// introducerName, introducerReferralCode, status, or scoring fields directly.
// Those are derived server-side from linkCode resolution + Lead creation.
const CLIENT_ALLOWED_INTRODUCER_LEAD_FIELDS = [
  'email', 'fullName', 'cpfCnpj', 'phone',
  'companyName', 'contactName', 'contactRole', 'website',
  'businessSubCategory',
  'tpvMensal', 'ticketMedio',
  'protocolo', 'onboardingLinkCode',
  'questionnaireData',
];

// SECURITY: QuestionarioSimplificado allowlist — client CANNOT set lead_id or status.
// `lead_id` is linked post-creation by admin; `status` is always 'novo' on creation.
const CLIENT_ALLOWED_SIMPLIFIED_FIELDS = [
  'protocolo',
  'nome_empresa', 'cnpj',
  'contato_nome', 'contato_email', 'contato_telefone', 'contato_cargo',
  'taxas_credito_1x', 'taxas_credito_2_6x', 'taxas_credito_7_12x',
  'usa_antecipacao', 'percentual_antecipacao', 'taxa_antecipacao',
  'distribuicao_avista', 'distribuicao_2_6x', 'distribuicao_7_12x',
  'pix_tipo', 'pix_valor',
  'taxa_antifraude_centavos',
  'usa_fee_transacao', 'fee_transacao_centavos',
  'onboarding_link_code',
];

function pickAllowed(raw, allowlist) {
  const safe = {};
  if (!raw || typeof raw !== 'object') return safe;
  for (const key of allowlist) {
    if (raw[key] !== undefined) safe[key] = raw[key];
  }
  return safe;
}

function sanitizeLeadPayload(raw) {
  return pickAllowed(raw, CLIENT_ALLOWED_LEAD_FIELDS);
}

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
      // SECURITY: apply allowlist — client cannot set lead_id or status
      const safePayload = pickAllowed(simplifiedPayload, CLIENT_ALLOWED_SIMPLIFIED_FIELDS);
      safePayload.status = 'novo';
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

    // ── ANTI-FANTASMA: bloquear submissões completamente vazias.
    // Um lead precisa ter pelo menos UM dado identificável (nome, e-mail OU CPF/CNPJ).
    // Isso previne bugs de frontend (ex: rota errada renderizando form sem perguntas)
    // de criar leads vazios que poluem o CRM e gastam quota de IA inutilmente.
    const hasFullName = (leadPayload.fullName || '').trim().length > 0;
    const hasEmail = (leadPayload.email || '').trim().length > 0;
    const hasCpfCnpj = (leadPayload.cpfCnpj || '').trim().length > 0;
    if (!hasFullName && !hasEmail && !hasCpfCnpj) {
      return Response.json({
        error: 'Dados insuficientes. O questionário não capturou as informações do cliente. Verifique se o link está correto e tente novamente.',
        code: 'EMPTY_LEAD_BLOCKED'
      }, { status: 400 });
    }

    // SECURITY: apply allowlist — only trusted client fields pass through.
    // Sensitive fields (scoring, attribution, IA reports) are derived server-side.
    const safeLeadPayload = sanitizeLeadPayload(leadPayload);
    safeLeadPayload.status = ALLOWED_LEAD_STATUSES.has(leadPayload.status) ? leadPayload.status : 'questionario_preenchido';

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
      // SECURITY: apply allowlist — client cannot inject leadId, introducerId,
      // status, or scoring fields. Those are set server-side below.
      const safeIntroducerLeadPayload = pickAllowed(introducerLeadPayload, CLIENT_ALLOWED_INTRODUCER_LEAD_FIELDS);
      safeIntroducerLeadPayload.leadId = createdLead.id;
      safeIntroducerLeadPayload.introducerId = safeLeadPayload.introducerId;
      safeIntroducerLeadPayload.introducerName = safeLeadPayload.introducerName;
      safeIntroducerLeadPayload.introducerReferralCode = safeLeadPayload.introducerReferralCode;
      safeIntroducerLeadPayload.status = 'novo';
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