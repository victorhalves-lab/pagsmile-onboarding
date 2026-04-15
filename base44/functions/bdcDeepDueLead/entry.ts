import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BDC_BASE_URL = 'https://plataforma.bigdatacorp.com.br';

const DEEP_DATASETS = [
  'kyc', 'owners_kyc', 'processes', 'government_debtors',
  'media_profile_and_exposure', 'esg_and_compliance',
  'relationships', 'collections',
];

function flattenBDCArray(dataset) {
  if (!dataset) return [];
  if (Array.isArray(dataset)) return dataset.flatMap(d => d?.MatchKeys ? [d] : Array.isArray(d) ? d : [d]).filter(Boolean);
  return [dataset];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Can be called from automation (entity trigger) or manually
    const leadId = body?.data?.id || body?.leadId;
    if (!leadId) return Response.json({ error: 'No lead ID' }, { status: 400 });

    const leads = await base44.asServiceRole.entities.Lead.filter({ id: leadId });
    const lead = leads[0];
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    // Only enrich leads with score >= 50 or manual trigger
    const score = lead.bdcLeadScore || lead.leadQualifierScore || 0;
    if (score < 50 && !body.force) {
      console.log(`Lead ${leadId} score ${score} < 50, skipping deep due diligence`);
      return Response.json({ skipped: true, reason: 'Score below threshold' });
    }

    const cnpj = lead.cpfCnpj?.replace(/\D/g, '');
    if (!cnpj || cnpj.length !== 14) {
      console.log(`Lead ${leadId} has no valid CNPJ`);
      return Response.json({ skipped: true, reason: 'No valid CNPJ' });
    }

    // Skip if already enriched in last 24h
    if (lead.bdcDueReport && lead.bdcEnrichmentDate) {
      const lastEnrich = new Date(lead.bdcEnrichmentDate).getTime();
      if (Date.now() - lastEnrich < 24 * 60 * 60 * 1000 && !body.force) {
        console.log(`Lead ${leadId} already enriched recently`);
        return Response.json({ skipped: true, reason: 'Recently enriched' });
      }
    }

    const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
    const tokenId = Deno.env.get('BDC_TOKEN_ID');
    if (!accessToken || !tokenId) return Response.json({ error: 'BDC tokens not configured' }, { status: 500 });

    console.log(`BDC Deep Due Diligence for lead ${leadId} (${cnpj})`);

    const bdcResponse = await fetch(`${BDC_BASE_URL}/empresas`, {
      method: 'POST',
      headers: {
        'AccessToken': accessToken, 'TokenId': tokenId,
        'Accept': 'application/json', 'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Datasets: DEEP_DATASETS.join(','), q: `doc{${cnpj}}`, Limit: 1 }),
    });

    const rawText = await bdcResponse.text();
    let bdcData;
    try { bdcData = JSON.parse(rawText); } catch (e) {
      return Response.json({ error: 'BDC parse error' }, { status: 502 });
    }

    const result = bdcData.Result?.[0] || {};

    // Extract KYC
    let companyPep = false, companySanctions = false;
    let ownersPep = [], ownersSanctions = [];
    const kyc = result?.Kyc || result?.kyc;
    if (kyc) {
      for (const item of flattenBDCArray(kyc)) {
        if (item?.IsPEP || item?.IsPep) companyPep = true;
        if (Array.isArray(item?.Sanctions) && item.Sanctions.length > 0) companySanctions = true;
      }
    }
    const ownersKyc = result?.OwnersKyc || result?.owners_kyc;
    if (ownersKyc) {
      for (const item of flattenBDCArray(ownersKyc)) {
        const name = item?.Name || item?.RelatedPersonName || 'N/I';
        if (item?.IsPEP || item?.IsPep) ownersPep.push(name);
        if (Array.isArray(item?.Sanctions) && item.Sanctions.length > 0) ownersSanctions.push(name);
      }
    }

    // Extract processes count
    let processCount = 0, hasCriminal = false;
    const processes = result?.Processes || result?.processes;
    if (processes) {
      const lawsuits = processes?.Lawsuits || [];
      if (Array.isArray(lawsuits)) {
        processCount = lawsuits.length;
        hasCriminal = lawsuits.some(l => /criminal|penal|crime/i.test(l?.Type || ''));
      }
    }

    // Extract debt
    let totalDebt = 0;
    const debtors = result?.GovernmentDebtors || result?.government_debtors;
    if (debtors) {
      for (const item of flattenBDCArray(debtors)) {
        totalDebt += Number(item?.TotalValue || item?.Value || 0);
      }
    }

    // Extract adverse media
    let adverseMedia = 0;
    const media = result?.MediaProfileAndExposure || result?.media_profile_and_exposure;
    if (media) {
      for (const item of flattenBDCArray(media)) {
        const sentiment = String(item?.Sentiment || item?.OverallSentiment || '').toUpperCase();
        if (sentiment.includes('NEGATIVE')) adverseMedia++;
      }
    }

    // ESG check
    let slaveLaborFound = false;
    const esg = result?.EsgAndCompliance || result?.esg_and_compliance;
    if (esg) {
      for (const item of flattenBDCArray(esg)) {
        const sl = item?.SlaveLabor || item?.SlaveLaborList;
        if (sl === true || (typeof sl === 'string' && /sim|true/i.test(sl))) slaveLaborFound = true;
      }
    }

    // Relationships (QSA) count
    let ownersCount = 0;
    const rels = result?.Relationships || result?.relationships;
    if (rels) {
      const entries = rels?.Relationships || (Array.isArray(rels) ? rels : []);
      ownersCount = Array.isArray(entries) ? entries.length : 0;
    }

    const dueReport = {
      kyc: { companyPep, companySanctions, ownersPep, ownersSanctions },
      processes: { count: processCount, hasCriminal },
      debt: { total: totalDebt },
      adverseMedia: { count: adverseMedia },
      esg: { slaveLaborFound },
      owners: { count: ownersCount },
      queryDate: bdcData.QueryDate,
    };

    // Update lead
    const updateData = {
      bdcDueReport: dueReport,
      bdcEnrichmentDate: new Date().toISOString(),
    };

    // If sanctions found, escalate
    if (companySanctions || ownersSanctions.length > 0 || slaveLaborFound) {
      updateData.iaDecision = 'REJEITAR';
      updateData.iaPriority = 'URGENTE';
    } else if (companyPep || ownersPep.length > 0 || hasCriminal || totalDebt > 100000) {
      updateData.iaDecision = 'REVISAO_MANUAL';
      updateData.iaPriority = 'ALTA';
    }

    await base44.asServiceRole.entities.Lead.update(leadId, updateData);

    // Notify Slack if critical findings
    if (companySanctions || ownersSanctions.length > 0 || slaveLaborFound) {
      try {
        const slackMsg = `🚨 *ALERTA LEAD — BDC Deep Due Diligence*\n` +
          `*Lead:* ${lead.fullName || lead.companyName || lead.email}\n` +
          `*CNPJ:* ${cnpj}\n` +
          `*Protocolo:* ${lead.protocolo || 'N/D'}\n` +
          (companySanctions ? '🔴 *EMPRESA EM LISTA DE SANÇÕES*\n' : '') +
          (ownersSanctions.length > 0 ? `🔴 *SÓCIOS SANCIONADOS:* ${ownersSanctions.join(', ')}\n` : '') +
          (slaveLaborFound ? '🔴 *LISTA SUJA MTE — TRABALHO ESCRAVO*\n' : '') +
          (companyPep ? '⚠️ Empresa PEP\n' : '') +
          (ownersPep.length > 0 ? `⚠️ Sócios PEP: ${ownersPep.join(', ')}\n` : '') +
          `*Ação:* Lead marcado para REJEIÇÃO automática`;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: 'compliance@pagsmile.com',
          subject: `🚨 ALERTA BDC: ${lead.fullName || lead.email} — Sanções/Lista Suja`,
          body: slackMsg,
        });
      } catch (notifyErr) {
        console.warn('Notification failed:', notifyErr.message);
      }
    }

    console.log(`Deep due diligence completed for lead ${leadId}: PEP=${companyPep || ownersPep.length > 0}, Sanctions=${companySanctions || ownersSanctions.length > 0}`);
    return Response.json({ success: true, dueReport });
  } catch (error) {
    console.error('bdcDeepDueLead error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});