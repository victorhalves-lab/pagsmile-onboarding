import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC endpoint — submission of FechamentoLandingPage (step 3).
 * Creates: LandingPageLead OR StandardProposalLead + Lead + Proposal, and links them.
 *
 * SECURITY HARDENING (BUG-003 fix):
 *   - Rate data is ALWAYS re-fetched server-side from the referenced source
 *     (StandardProposal token or Introducer id) to prevent rate injection.
 *   - Attribution (introducer, commercial agent) is ALWAYS resolved server-side
 *     from the DB. Client-submitted agent/introducer metadata is IGNORED.
 *   - formData is passed through an allowlist — no arbitrary field can be injected.
 */

// ─── Allowlist: only these fields are accepted from client formData ───
const ALLOWED_FORM_FIELDS = new Set([
  'cnpj', 'razaoSocial', 'nomeFantasia', 'website',
  'email', 'phone', 'contactName', 'contactRole',
  'endereco', 'tpvMensal', 'distribuicaoTpv',
  'modeloNegocio', 'sellersDescription', 'fornecedores',
]);

function sanitizeFormData(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const clean = {};
  for (const k of Object.keys(raw)) {
    if (ALLOWED_FORM_FIELDS.has(k)) clean[k] = raw[k];
  }
  return clean;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      isFromStandardProposal,
      fromStandardProposalToken,
      introducerId: rawIntroducerId,
      commercialAgent: rawCommercialAgent, // DO NOT TRUST — resolve server-side
      segmentName,
      businessSubCategory,
      slug,
      formData: rawFormData,
    } = body;

    // ── Sanitize formData (allowlist) ──
    const formData = sanitizeFormData(rawFormData);

    if (!formData || !segmentName) {
      return Response.json({ error: 'Missing formData or segmentName' }, { status: 400 });
    }

    // ── Anti-ghost: require minimal contact data ──
    if (!formData.email && !formData.phone && !formData.cnpj) {
      return Response.json({ error: 'EMPTY_LEAD_BLOCKED: missing contact identifier' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const tpvReais = (formData.tpvMensal || 0) / 100;

    // 1. Re-fetch rates server-side (NEVER trust rates from client)
    let ratesSource = null;
    let chosenPartnerId = null;
    let isFromIntroducer = false;
    let verifiedIntroducer = null; // server-resolved introducer object

    if (isFromStandardProposal && fromStandardProposalToken) {
      const props = await base44.asServiceRole.entities.StandardProposal.filter({ tokenPublico: fromStandardProposalToken });
      if (props.length === 0) return Response.json({ error: 'Proposta padrão não encontrada' }, { status: 404 });
      ratesSource = props[0].rates;
      chosenPartnerId = props[0].chosenPartnerId;

      // If the standard proposal links to an introducer, load it server-side
      if (rawIntroducerId && typeof rawIntroducerId === 'string') {
        const intros = await base44.asServiceRole.entities.Introducer.filter({ id: rawIntroducerId }).catch(() => []);
        if (intros.length > 0) verifiedIntroducer = intros[0];
      }
    } else if (rawIntroducerId && segmentName) {
      // Validate introducer exists
      if (typeof rawIntroducerId !== 'string' || rawIntroducerId.length < 10) {
        return Response.json({ error: 'Introducer inválido' }, { status: 400 });
      }
      const intros = await base44.asServiceRole.entities.Introducer.filter({ id: rawIntroducerId }).catch(() => []);
      if (intros.length === 0) return Response.json({ error: 'Introducer não encontrado' }, { status: 404 });
      verifiedIntroducer = intros[0];

      const segRate = verifiedIntroducer.standardRates?.find(r => r.segmentName === segmentName);
      if (!segRate) return Response.json({ error: 'Taxas do segmento não encontradas' }, { status: 404 });
      ratesSource = segRate;
      isFromIntroducer = true;
    } else {
      return Response.json({ error: 'Origem das taxas inválida' }, { status: 400 });
    }

    // ── Resolve commercial agent server-side ──
    // We IGNORE full_name from the client. Only the id is used as a lookup,
    // and we validate the user exists and has a commercial role before attributing.
    let verifiedAgent = null;
    const clientAgentId = rawCommercialAgent?.id;
    if (clientAgentId && typeof clientAgentId === 'string' && clientAgentId.length >= 10) {
      const users = await base44.asServiceRole.entities.User.filter({ id: clientAgentId }).catch(() => []);
      if (users.length > 0) {
        const u = users[0];
        // Only accept users that are legitimately able to be commercial agents
        if (u.role === 'admin' || u.role === 'user') {
          verifiedAgent = { id: u.id, full_name: u.full_name };
        }
      }
    }

    // 2. Build common fields for origin lead entity
    const commonFields = {
      cnpj: formData.cnpj,
      razaoSocial: formData.razaoSocial,
      nomeFantasia: formData.nomeFantasia,
      website: formData.website,
      email: formData.email,
      phone: formData.phone,
      contactName: formData.contactName,
      contactRole: formData.contactRole,
      endereco: formData.endereco,
      tpvMensal: tpvReais,
      distribuicaoTpv: formData.distribuicaoTpv,
      modeloNegocio: formData.modeloNegocio,
      sellersDescription: formData.sellersDescription,
      fornecedores: formData.fornecedores,
      segment: segmentName,
      businessSubCategory: businessSubCategory || 'ecommerce',
      status: 'novo',
      ...(verifiedAgent && { commercialAgentId: verifiedAgent.id, commercialAgentName: verifiedAgent.full_name }),
    };

    let createdOriginLead;
    let originEntity;

    if (isFromStandardProposal) {
      originEntity = 'StandardProposalLead';
      createdOriginLead = await base44.asServiceRole.entities.StandardProposalLead.create({
        ...commonFields,
        standardProposalToken: fromStandardProposalToken,
        ...(verifiedIntroducer && { introducerId: verifiedIntroducer.id }),
      });
    } else {
      originEntity = 'LandingPageLead';
      const introducerData = verifiedIntroducer ? {
        introducerId: verifiedIntroducer.id,
        introducerName: verifiedIntroducer.name,
        introducerReferralCode: verifiedIntroducer.referralCode,
      } : {};
      createdOriginLead = await base44.asServiceRole.entities.LandingPageLead.create({
        ...commonFields,
        slug: slug || '',
        ...introducerData,
      });
    }

    // 3. Create Lead (pipeline comercial)
    const origemLead = isFromStandardProposal ? 'proposta_padrao' : 'landing_page';
    const leadPayload = {
      fullName: formData.razaoSocial,
      companyName: formData.nomeFantasia,
      cpfCnpj: formData.cnpj,
      email: formData.email,
      phone: formData.phone,
      contactName: formData.contactName,
      contactRole: formData.contactRole,
      website: formData.website,
      businessSubCategory: businessSubCategory || 'ecommerce',
      status: 'proposta_aceita',
      origemLead,
      tpvMensal: tpvReais,
      questionnaireData: {
        tpvMensal: tpvReais,
        distribuicaoTpv: formData.distribuicaoTpv,
        modeloNegocio: formData.modeloNegocio,
        sellersDescription: formData.sellersDescription,
        fornecedores: formData.fornecedores,
        segmentoLandingPage: segmentName,
        contactRole: formData.contactRole,
      },
      ...(verifiedIntroducer && {
        introducerId: verifiedIntroducer.id,
        introducerName: verifiedIntroducer.name,
        introducerReferralCode: verifiedIntroducer.referralCode,
      }),
      ...(verifiedAgent && { commercialAgentId: verifiedAgent.id, commercialAgentName: verifiedAgent.full_name }),
    };
    const createdLead = await base44.asServiceRole.entities.Lead.create(leadPayload);

    // 4. Build proposal rates (map from introducer format if needed)
    let proposalRates = ratesSource;
    if (isFromIntroducer) {
      const r = ratesSource;
      const bandeira = (avista, de2a6x, de7a12x, de13a21x) => ({ avista, de2a6x, de7a12x, de13a21x });
      const cardRates = bandeira(r.mdrAvista, r.mdr2a6x, r.mdr7a12x, r.mdr13a21x);
      proposalRates = {
        cartao: { visa: { ...cardRates }, mastercard: { ...cardRates }, elo: { ...cardRates }, amex: { ...cardRates }, outras: { ...cardRates } },
        debito: {},
        pix: r.pixTaxaPercentual ? { tipo: 'percentual', valor: r.pixTaxaPercentual } : r.pixTaxaFixa ? { tipo: 'fixo', valor: r.pixTaxaFixa } : undefined,
        antifraude: r.antifraude,
        feeTransacao: r.feeTransacao,
        taxa3ds: r.taxa3ds,
        percentualAntecipacao: r.percentualAntecipacao,
        setup: 0,
      };
    }

    // 5. Create Proposal — FIX BUG #3: draft MUST have all required public fields
    // (codigo, tokenPublico, validUntil, publicSlug) so that: (a) it appears
    // properly in GestaoPropostas, (b) can be shared publicly once promoted to
    // "enviada", (c) has a 15-day default validity like manually-created proposals.
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    const randomToken = Array.from({ length: 64 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))).join('');
    const slugify = (s) => String(s || 'proposta').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 56);
    const slugSuffix = Array.from({ length: 4 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))).join('');
    const validUntil = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

    // When a client submits FechamentoLandingPage, they ARE accepting the proposed rates.
    // So the proposal must be created as "aceita" (accepted), not "rascunho" — this is
    // a fully-closed deal, not a draft pending review.
    const nowIso = new Date().toISOString();
    const proposalPayload = {
      leadId: createdLead.id,
      status: 'aceita',
      sentDate: nowIso,
      acceptedDate: nowIso,
      rates: proposalRates,
      clienteNome: createdLead.fullName,
      clienteCnpj: createdLead.cpfCnpj,
      clienteContato: createdLead.contactName || '',
      chosenPartnerId,
      businessSubCategory: businessSubCategory || 'ecommerce',
      sourceFlow: isFromStandardProposal ? 'standard_proposal_link' : 'introducer_landing_page',
      codigo: `PROP-${year}-${seq}`,
      tokenPublico: randomToken,
      publicSlug: `${slugify(createdLead.fullName)}-${slugSuffix}`,
      validUntil,
      version: 1,
      isCurrentVersion: true,
      proposalName: `Proposta - ${createdLead.fullName}`,
      origem: 'manual',
      ...(verifiedAgent && { responsavelId: verifiedAgent.id, responsavelNome: verifiedAgent.full_name }),
    };
    const createdProposal = await base44.asServiceRole.entities.Proposal.create(proposalPayload);

    // 6. Link everything
    await base44.asServiceRole.entities.Lead.update(createdLead.id, {
      currentProposalId: createdProposal.id,
      lastInteractionDate: nowIso,
    });
    await base44.asServiceRole.entities[originEntity].update(createdOriginLead.id, {
      leadId: createdLead.id,
      proposalId: createdProposal.id,
    });

    // 7. Log proposal acceptance activity
    try {
      await base44.asServiceRole.entities.LeadActivity.create({
        leadId: createdLead.id,
        activityType: 'proposta_aceita',
        description: `Cliente aceitou proposta padrão via landing page de fechamento (${segmentName})`,
        performedBy: 'cliente',
        activityDate: nowIso,
      });
    } catch (_) { /* non-blocking */ }

    return Response.json({ ok: true, lead: createdLead, proposal: createdProposal });
  } catch (error) {
    console.error('publicFechamentoSubmit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});