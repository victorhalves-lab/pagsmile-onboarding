import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { data, event } = body;
    if (!data || !event) {
      return Response.json({ error: 'Missing data or event in payload' }, { status: 400 });
    }

    const segmentName = data.segmentName;
    if (!segmentName) {
      return Response.json({ error: 'Missing segmentName' }, { status: 400 });
    }

    console.log(`[CASCADE] Propagating rates for segment: ${segmentName}`);

    // Build the rate object matching Introducer.standardRates item shape
    const newRateItem = {
      segmentName: data.segmentName,
      mcc: data.mcc || '',
      riskLevel: data.riskLevel || '',
      mdrAvista: data.mdrAvista || 0,
      mdr2a6x: data.mdr2a6x || 0,
      mdr7a12x: data.mdr7a12x || 0,
      mdr13a21x: data.mdr13a21x || 0,
      percentualAntecipacao: data.percentualAntecipacao || 0,
      feeTransacao: data.feeTransacao || 0,
      antifraude: data.antifraude || 0,
      taxa3ds: data.taxa3ds || 0,
      pixTaxaPercentual: data.pixTaxaPercentual || 0,
      pixTaxaFixa: data.pixTaxaFixa || 0,
    };

    // ══════════ 1. Update Introducers ══════════
    const allIntroducers = await base44.asServiceRole.entities.Introducer.filter({});
    let introducerUpdated = 0;

    for (const intro of allIntroducers) {
      if (!intro.standardRates || !Array.isArray(intro.standardRates)) continue;

      const idx = intro.standardRates.findIndex(r => r.segmentName === segmentName);
      if (idx === -1) continue;

      const updatedRates = [...intro.standardRates];
      updatedRates[idx] = { ...updatedRates[idx], ...newRateItem };

      await base44.asServiceRole.entities.Introducer.update(intro.id, {
        standardRates: updatedRates,
      });
      introducerUpdated++;
    }

    console.log(`[CASCADE] Updated ${introducerUpdated} Introducers`);

    // ══════════ 2. Update StandardProposals ══════════
    const matchingProposals = await base44.asServiceRole.entities.StandardProposal.filter({
      segment: segmentName,
      status: 'ativa',
    });
    let proposalUpdated = 0;

    for (const prop of matchingProposals) {
      const updatedRates = {
        ...(prop.rates || {}),
        cartao: {
          ...(prop.rates?.cartao || {}),
          visa: { avista: newRateItem.mdrAvista, de2a6x: newRateItem.mdr2a6x, de7a12x: newRateItem.mdr7a12x, de13a21x: newRateItem.mdr13a21x },
          mastercard: { avista: newRateItem.mdrAvista, de2a6x: newRateItem.mdr2a6x, de7a12x: newRateItem.mdr7a12x, de13a21x: newRateItem.mdr13a21x },
          elo: { avista: newRateItem.mdrAvista, de2a6x: newRateItem.mdr2a6x, de7a12x: newRateItem.mdr7a12x, de13a21x: newRateItem.mdr13a21x },
          amex: { avista: newRateItem.mdrAvista, de2a6x: newRateItem.mdr2a6x, de7a12x: newRateItem.mdr7a12x, de13a21x: newRateItem.mdr13a21x },
          outras: { avista: newRateItem.mdrAvista, de2a6x: newRateItem.mdr2a6x, de7a12x: newRateItem.mdr7a12x, de13a21x: newRateItem.mdr13a21x },
        },
        pix: { tipo: 'percentual', valor: newRateItem.pixTaxaPercentual },
        boleto: data.boleto || 0,
        antifraude: newRateItem.antifraude,
        feeTransacao: newRateItem.feeTransacao,
        taxa3ds: newRateItem.taxa3ds,
        percentualAntecipacao: newRateItem.percentualAntecipacao,
        rav: { taxa: newRateItem.percentualAntecipacao, prazo: prop.rates?.rav?.prazo || 'D+2' },
      };

      await base44.asServiceRole.entities.StandardProposal.update(prop.id, {
        rates: updatedRates,
      });
      proposalUpdated++;
    }

    console.log(`[CASCADE] Updated ${proposalUpdated} StandardProposals`);

    return Response.json({
      success: true,
      segmentName,
      introducerUpdated,
      proposalUpdated,
    });
  } catch (error) {
    console.error('[CASCADE] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});