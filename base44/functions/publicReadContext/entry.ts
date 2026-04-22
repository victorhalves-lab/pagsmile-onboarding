import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC endpoint — read-only, filtered access to entities needed by public pages.
 * Returns ONLY the fields safe to expose publicly. Everything goes via service role.
 *
 * Supported kinds:
 *   - introducer_by_slug { slug } → returns branding + standardRates + referralCode (landing page)
 *   - introducer_by_id { introducerId } → returns id, name, referralCode, companyName
 *   - onboarding_link { uniqueCode } → returns link config (branding, templateId, linkType, parentMerchant, commercial)
 *   - onboarding_link_by_slug { slug } → resolves customSlug → same as above
 *   - kickoff_public { token } → returns KickOffPresentation (if status=ativa)
 *   - contract_public { code } → returns Contract
 *   - questionnaire_template { id } → returns template
 *   - questions_by_template { templateId } → returns questions
 *   - merchant_for_doc_only { caseId, token } → returns merchant (validates docLinkToken)
 *   - onboarding_case_for_doc_only { caseId, token } → returns case + template (validates docLinkToken)
 *   - standard_proposal_by_token { token } → returns StandardProposal (ativa only)
 */
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const { kind } = body;
    // Tolerante a requests anônimos: se o token do cliente estiver inválido/expirado,
    // criamos um cliente "limpo" (sem auth). Todas as operações abaixo usam
    // asServiceRole mesmo, então não precisamos do user context.
    let base44;
    try {
      base44 = createClientFromRequest(req);
    } catch (_) {
      const { createClient } = await import('npm:@base44/sdk@0.8.25');
      base44 = createClient({
        appId: Deno.env.get('BASE44_APP_ID'),
        requiresAuth: false,
      });
    }

    // ── Introducer by slug (for IntroducerLandingPage) ──
    if (kind === 'introducer_by_slug') {
      const { slug } = body;
      if (!slug) return Response.json({ error: 'slug required' }, { status: 400 });
      let results = [];
      try { results = await base44.asServiceRole.entities.Introducer.filter({ uniqueLandingPageSlug: slug, status: 'active' }); } catch (_) {}
      if (results.length === 0) return Response.json({ introducer: null });
      const i = results[0];
      if (!i.landingPageActive) return Response.json({ introducer: null });
      return Response.json({
        introducer: {
          id: i.id,
          name: i.name,
          referralCode: i.referralCode,
          companyName: i.companyName,
          companyLogoUrl: i.companyLogoUrl,
          landingPageActive: i.landingPageActive,
          uniqueLandingPageSlug: i.uniqueLandingPageSlug,
          standardRates: i.standardRates || [],
        },
      });
    }

    // ── Introducer by id ──
    if (kind === 'introducer_by_id') {
      const { introducerId } = body;
      if (!introducerId) return Response.json({ error: 'introducerId required' }, { status: 400 });
      let results = [];
      try { results = await base44.asServiceRole.entities.Introducer.filter({ id: introducerId }); } catch (_) {}
      if (results.length === 0) return Response.json({ introducer: null });
      const i = results[0];
      return Response.json({
        introducer: { id: i.id, name: i.name, referralCode: i.referralCode, companyName: i.companyName },
      });
    }

    // ── Onboarding Link (by uniqueCode or customSlug) ──
    if (kind === 'onboarding_link' || kind === 'onboarding_link_by_slug') {
      const filter = kind === 'onboarding_link' ? { uniqueCode: body.uniqueCode } : { customSlug: body.slug };
      if (!filter.uniqueCode && !filter.customSlug) return Response.json({ error: 'code or slug required' }, { status: 400 });
      let results = [];
      try { results = await base44.asServiceRole.entities.OnboardingLink.filter(filter); } catch (_) {}
      if (results.length === 0) return Response.json({ link: null });
      const l = results[0];
      return Response.json({
        link: {
          id: l.id,
          uniqueCode: l.uniqueCode,
          customSlug: l.customSlug,
          linkType: l.linkType,
          questionnaireTemplateId: l.questionnaireTemplateId,
          expiresAt: l.expiresAt,
          isActive: l.isActive,
          brandName: l.brandName,
          brandLogoUrl: l.brandLogoUrl,
          brandPrimaryColor: l.brandPrimaryColor,
          brandSecondaryColor: l.brandSecondaryColor,
          parentMerchantId: l.parentMerchantId,
          parentMerchantName: l.parentMerchantName,
          commercialAgentId: l.commercialAgentId,
          commercialAgentName: l.commercialAgentName,
          introducerId: l.introducerId,
          introducerReferralCode: l.introducerReferralCode,
          complianceType: l.complianceType,
        },
      });
    }

    // ── KickOff Public ──
    if (kind === 'kickoff_public') {
      const { token } = body;
      if (!token) return Response.json({ error: 'token required' }, { status: 400 });
      let results = [];
      try { results = await base44.asServiceRole.entities.KickOffPresentation.filter({ publicToken: token, status: 'ativa' }); } catch (_) {}
      if (results.length === 0) return Response.json({ presentation: null });
      return Response.json({ presentation: results[0] });
    }

    // ── Contract Public ──
    if (kind === 'contract_public') {
      const { code } = body;
      if (!code) return Response.json({ error: 'code required' }, { status: 400 });
      let results = [];
      try { results = await base44.asServiceRole.entities.Contract.filter({ publicLinkCode: code }); } catch (_) {}
      if (results.length === 0) return Response.json({ contract: null });
      return Response.json({ contract: results[0] });
    }

    // ── QuestionnaireTemplate (for public compliance flow) ──
    if (kind === 'questionnaire_template') {
      const { id, model } = body;
      let results = [];
      try {
        if (id) results = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ id });
        else if (model) results = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ model, isActive: true });
      } catch (_) {}
      return Response.json({ template: results[0] || null });
    }

    // ── Questions by template ──
    if (kind === 'questions_by_template') {
      const { templateId } = body;
      if (!templateId) return Response.json({ error: 'templateId required' }, { status: 400 });
      let results = [];
      try { results = await base44.asServiceRole.entities.Question.filter({ questionnaireTemplateId: templateId }, 'order'); } catch (_) {}
      return Response.json({ questions: results });
    }

    // ── Merchant for ComplianceDocOnly (validates docLinkToken via case) ──
    if (kind === 'merchant_for_doc_only') {
      const { caseId, token } = body;
      if (!caseId || !token) return Response.json({ error: 'caseId and token required' }, { status: 400 });
      let cases = [];
      try { cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId }); } catch (_) {}
      if (cases.length === 0 || cases[0].docLinkToken !== token) {
        return Response.json({ merchant: null, case: null }, { status: 403 });
      }
      const c = cases[0];
      let merchants = [];
      try { merchants = await base44.asServiceRole.entities.Merchant.filter({ id: c.merchantId }); } catch (_) {}
      const m = merchants[0] || null;
      return Response.json({
        merchant: m ? { id: m.id, type: m.type, fullName: m.fullName, cpfCnpj: m.cpfCnpj, email: m.email, companyName: m.companyName } : null,
      });
    }

    // ── OnboardingCase + Template for ComplianceDocOnly (validates docLinkToken) ──
    if (kind === 'onboarding_case_for_doc_only') {
      const { caseId, token } = body;
      if (!caseId || !token) return Response.json({ error: 'caseId and token required' }, { status: 400 });
      let cases = [];
      try { cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId }); } catch (_) {}
      if (cases.length === 0 || cases[0].docLinkToken !== token) {
        return Response.json({ case: null, template: null }, { status: 403 });
      }
      const c = cases[0];
      let templates = [];
      try { templates = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ id: c.questionnaireTemplateId }); } catch (_) {}
      return Response.json({
        case: { id: c.id, merchantId: c.merchantId, questionnaireTemplateId: c.questionnaireTemplateId, status: c.status, docCompleted: c.docCompleted, cafCompleted: c.cafCompleted },
        template: templates[0] || null,
      });
    }

    // ── StandardProposal by token ──
    if (kind === 'standard_proposal_by_token') {
      const { token } = body;
      if (!token) return Response.json({ error: 'token required' }, { status: 400 });
      let results = [];
      try { results = await base44.asServiceRole.entities.StandardProposal.filter({ tokenPublico: token }); } catch (_) {}
      return Response.json({ proposal: results[0] || null });
    }

    // ── Proposal by token (resolves to CURRENT version when multiple exist) ──
    // Robusto: se token exato falhar, nunca devolve 404 silenciosamente — tenta
    // recuperar via rootProposalId, version chain ou slug.
    if (kind === 'proposal_by_token') {
      const { token } = body;
      if (!token) return Response.json({ error: 'token required' }, { status: 400 });
      let results = [];
      try { results = await base44.asServiceRole.entities.Proposal.filter({ tokenPublico: token }); } catch (_) {}

      if (results.length === 0) {
        // Fallback: token não bate mais (pode ter sido rotacionado) — não devolver
        // 404 ainda. O hook do front tentará via publicSlug em seguida.
        return Response.json({ proposal: null, reason: 'token_not_found' });
      }

      // Multiple matches (legacy token shared across versions): pick current version
      if (results.length > 1) {
        const current = results.find(r => r.isCurrentVersion === true);
        const picked = current || results.sort((a, b) => (b.version || 1) - (a.version || 1))[0];
        return Response.json({ proposal: picked });
      }
      const p = results[0];
      // If this token belongs to an old version, try to resolve to the current one via rootId
      if (p.isCurrentVersion === false && p.rootProposalId) {
        try {
          const currentByRoot = await base44.asServiceRole.entities.Proposal.filter({ rootProposalId: p.rootProposalId, isCurrentVersion: true });
          if (currentByRoot.length > 0) return Response.json({ proposal: currentByRoot[0] });
        } catch (_) {}
      }
      if (p.isCurrentVersion === false) {
        try {
          const childCurrent = await base44.asServiceRole.entities.Proposal.filter({ rootProposalId: p.id, isCurrentVersion: true });
          if (childCurrent.length > 0) return Response.json({ proposal: childCurrent[0] });
        } catch (_) {}
      }
      return Response.json({ proposal: p });
    }

    // ── Template + Questions bundle (single round-trip for public compliance flows) ──
    // Resolves either by explicit id, or by model+isActive. Returns both template and ordered questions.
    if (kind === 'template_with_questions') {
      const { id, model } = body;
      let templates = [];
      try {
        if (id) templates = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ id });
        else if (model) templates = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ model, isActive: true });
      } catch (_) {}
      const template = templates[0] || null;
      if (!template) return Response.json({ template: null, questions: [] });
      let questions = [];
      try { questions = await base44.asServiceRole.entities.Question.filter({ questionnaireTemplateId: template.id }, 'order'); } catch (_) {}
      return Response.json({ template, questions });
    }

    // ── Subseller info from onboarding link (parentMerchantId for subseller flow) ──
    // Public-safe: only returns fields needed by the subseller flow (no partner secrets, etc.)
    if (kind === 'subseller_link_info') {
      const { uniqueCode } = body;
      if (!uniqueCode) return Response.json({ error: 'uniqueCode required' }, { status: 400 });
      let results = [];
      try { results = await base44.asServiceRole.entities.OnboardingLink.filter({ uniqueCode }); } catch (_) {}
      const l = results[0];
      if (!l) return Response.json({ link: null });
      return Response.json({
        link: {
          id: l.id,
          linkType: l.linkType,
          parentMerchantId: l.parentMerchantId || null,
          parentMerchantName: l.parentMerchantName || null,
          isActive: l.isActive,
        },
      });
    }

    // ── Introducer rates for a given segment (public — used by FechamentoLandingPage) ──
    if (kind === 'introducer_segment_rates') {
      const { introducerId, segmentName } = body;
      if (!introducerId || !segmentName) return Response.json({ error: 'introducerId and segmentName required' }, { status: 400 });
      let results = [];
      try { results = await base44.asServiceRole.entities.Introducer.filter({ id: introducerId }); } catch (_) {}
      const i = results[0];
      if (!i) return Response.json({ rates: null });
      const rate = (i.standardRates || []).find(r => r.segmentName === segmentName) || null;
      return Response.json({ rates: rate });
    }

    // ── StandardProposal rates by token (public — used by FechamentoLandingPage) ──
    // Returns only the rates snapshot + partner id, never exposing the full proposal object.
    if (kind === 'standard_proposal_rates_by_token') {
      const { token } = body;
      if (!token) return Response.json({ error: 'token required' }, { status: 400 });
      let results = [];
      try { results = await base44.asServiceRole.entities.StandardProposal.filter({ tokenPublico: token }); } catch (_) {}
      const p = results[0];
      if (!p) return Response.json({ rates: null, partnerId: null });
      return Response.json({ rates: p.rates || {}, partnerId: p.chosenPartnerId || null });
    }

    // ── PixProposal by token ──
    if (kind === 'pix_proposal_by_token') {
      const { token } = body;
      if (!token) return Response.json({ error: 'token required' }, { status: 400 });
      let results = [];
      try { results = await base44.asServiceRole.entities.PixProposal.filter({ tokenPublico: token }); } catch (_) {}
      if (results.length === 0) return Response.json({ proposal: null });
      if (results.length > 1) {
        const current = results.find(r => r.isCurrentVersion === true);
        return Response.json({ proposal: current || results.sort((a, b) => (b.version || 1) - (a.version || 1))[0] });
      }
      return Response.json({ proposal: results[0] });
    }

    // ── Resolve public slug → target URL ──
    // Maps friendly URL (/p/:slug, /pp/:slug, /pix/:slug, /c/:slug) to legacy page URL.
    // For versioned proposals (Proposal/PixProposal): always resolves to the CURRENT version's token,
    // even if the slug was inherited from a previous version.
    if (kind === 'resolve_public_slug') {
      const { entityType, slug } = body;
      if (!entityType || !slug) return Response.json({ error: 'entityType and slug required' }, { status: 400 });

      const pickCurrentVersion = async (entityName, matches) => {
        // Prefer the version marked as current
        let current = matches.find(m => m.isCurrentVersion === true);
        if (current) return current;
        // Fallback: look up by rootProposalId (the slug may belong to the root, but a newer version is current)
        const rootIds = [...new Set(matches.map(m => m.rootProposalId || m.id).filter(Boolean))];
        for (const rid of rootIds) {
          try {
            const byRoot = await base44.asServiceRole.entities[entityName].filter({ rootProposalId: rid, isCurrentVersion: true });
            if (byRoot.length > 0) return byRoot[0];
          } catch (_) {}
        }
        // Last fallback: highest version among matches
        return matches.sort((a, b) => (b.version || 1) - (a.version || 1))[0];
      };

      // ORPHAN SLUG FALLBACK: if the exact slug isn't found, extract the company
      // name part (everything before the trailing 4-char suffix) and try to find
      // the current version of any proposal whose slug starts with the same base.
      // This rescues links sent to clients whose slug was later rotated (new version
      // = new slug). Example: "kingpay-3mbr" → base "kingpay" → find current KINGPAY.
      const findByOrphanBase = async (entityName) => {
        const m = slug.match(/^(.+)-[a-z0-9]{4}$/i);
        if (!m) return null;
        const base = m[1].toLowerCase();
        if (!base || base.length < 3) return null;
        try {
          // Search by slug prefix using regex — matches any slug starting with "base-"
          const candidates = await base44.asServiceRole.entities[entityName].filter({
            publicSlug: { $regex: `^${base}-`, $options: 'i' },
            isCurrentVersion: true,
          });
          if (candidates.length > 0) return candidates[0];
          // Broader fallback: any version with matching base, then resolve to current
          const anyVer = await base44.asServiceRole.entities[entityName].filter({
            publicSlug: { $regex: `^${base}-`, $options: 'i' },
          });
          if (anyVer.length > 0) return await pickCurrentVersion(entityName, anyVer);
        } catch (_) {}
        return null;
      };

      try {
        if (entityType === 'proposal') {
          const r = await base44.asServiceRole.entities.Proposal.filter({ publicSlug: slug });
          const picked = r.length > 0 ? await pickCurrentVersion('Proposal', r) : await findByOrphanBase('Proposal');
          if (picked?.tokenPublico) {
            return Response.json({ redirectTo: `/PropostaPublica?token=${encodeURIComponent(picked.tokenPublico)}` });
          }
        } else if (entityType === 'standardProposal') {
          const r = await base44.asServiceRole.entities.StandardProposal.filter({ publicSlug: slug });
          const picked = r.length > 0 ? r[0] : await findByOrphanBase('StandardProposal');
          if (picked?.tokenPublico) {
            return Response.json({ redirectTo: `/PropostaPadraoPublica?token=${encodeURIComponent(picked.tokenPublico)}` });
          }
        } else if (entityType === 'pixProposal') {
          const r = await base44.asServiceRole.entities.PixProposal.filter({ publicSlug: slug });
          const picked = r.length > 0 ? await pickCurrentVersion('PixProposal', r) : await findByOrphanBase('PixProposal');
          if (picked?.tokenPublico) {
            return Response.json({ redirectTo: `/PropostaPixPublica?token=${encodeURIComponent(picked.tokenPublico)}` });
          }
        } else if (entityType === 'contract') {
          const r = await base44.asServiceRole.entities.Contract.filter({ publicSlug: slug });
          const picked = r.length > 0 ? r[0] : await findByOrphanBase('Contract');
          if (picked?.publicLinkCode) {
            return Response.json({ redirectTo: `/ContratoPublico?code=${encodeURIComponent(picked.publicLinkCode)}` });
          }
        }
      } catch (_) {}
      return Response.json({ redirectTo: null });
    }

    return Response.json({ error: 'Unknown kind' }, { status: 400 });
  } catch (error) {
    console.error('publicReadContext error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});