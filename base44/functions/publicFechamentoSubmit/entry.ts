import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC endpoint — submission of FechamentoLandingPage (step 3).
 * Creates: LandingPageLead OR StandardProposalLead + Lead + Proposal, and links them.
 * The payload must include rates already-resolved (client picked them from public data).
 *
 * Guarantees:
 *   - No auth required.
 *   - Rate data is re-fetched server-side from the referenced source (StandardProposal token or Introducer id)
 *     to prevent a malicious client from injecting arbitrary rates.
 */
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      isFromStandardProposal,
      fromStandardProposalToken,
      introducerId,
      commercialAgent, // {id, full_name}
      segmentName,
      businessSubCategory,
      slug,
      formData,
    } = body;

    if (!formData || !segmentName) {
      return Response.json({ error: 'Missing formData or segmentName' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const tpvReais = (formData.tpvMensal || 0) / 100;

    // 1. Re-fetch rates server-side (NEVER trust rates from client)
    let ratesSource = null;
    let chosenPartnerId = null;
    let isFromIntroducer = false;

    if (isFromStandardProposal && fromStandardProposalToken) {
      const props = await base44.asServiceRole.entities.StandardProposal.filter({ tokenPublico: fromStandardProposalToken });
      if (props.length === 0) return Response.json({ error: 'Proposta padrão não encontrada' }, { status: 404 });
      ratesSource = props[0].rates;
      chosenPartnerId = props[0].chosenPartnerId;
    } else if (introducerId && segmentName) {
      const intros = await base44.asServiceRole.entities.Introducer.filter({ id: introducerId });
      if (intros.length === 0) return Response.json({ error: 'Introducer não encontrado' }, { status: 404 });
      const segRate = intros[0].standardRates?.find(r => r.segmentName === segmentName);
      if (!segRate) return Response.json({ error: 'Taxas do segmento não encontradas' }, { status: 404 });
      ratesSource = segRate;
      isFromIntroducer = true;
    } else {
      return Response.json({ error: 'Origem das taxas inválida' }, { status: 400 });
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
      ...(commercialAgent && { commercialAgentId: commercialAgent.id, commercialAgentName: commercialAgent.full_name }),
    };

    let createdOriginLead;
    let originEntity;

    if (isFromStandardProposal) {
      originEntity = 'StandardProposalLead';
      createdOriginLead = await base44.asServiceRole.entities.StandardProposalLead.create({
        ...commonFields,
        standardProposalToken: fromStandardProposalToken,
        ...(introducerId && { introducerId }),
      });
    } else {
      originEntity = 'LandingPageLead';
      let introducerData = {};
      if (introducerId) {
        const intros = await base44.asServiceRole.entities.Introducer.filter({ id: introducerId });
        if (intros.length > 0) {
          introducerData = {
            introducerId: intros[0].id,
            introducerName: intros[0].name,
            introducerReferralCode: intros[0].referralCode,
          };
        }
      }
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
      status: 'questionario_preenchido',
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
      ...(introducerId && { introducerId }),
      ...(commercialAgent && { commercialAgentId: commercialAgent.id, commercialAgentName: commercialAgent.full_name }),
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

    const proposalPayload = {
      leadId: createdLead.id,
      status: 'rascunho',
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
      ...(commercialAgent && { responsavelId: commercialAgent.id, responsavelNome: commercialAgent.full_name }),
    };
    const createdProposal = await base44.asServiceRole.entities.Proposal.create(proposalPayload);

    // 6. Link everything
    await base44.asServiceRole.entities.Lead.update(createdLead.id, { currentProposalId: createdProposal.id });
    await base44.asServiceRole.entities[originEntity].update(createdOriginLead.id, {
      leadId: createdLead.id,
      proposalId: createdProposal.id,
    });

    return Response.json({ ok: true, lead: createdLead, proposal: createdProposal });
  } catch (error) {
    console.error('publicFechamentoSubmit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});