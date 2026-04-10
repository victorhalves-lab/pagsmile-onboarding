import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * bdc_analyzeKycRisk — Consulta KYC real na BigDataCorp
 * 
 * Consulta datasets de KYC (sanções, PEP) + owners_kyc (sócios) 
 * e retorna análise de risco real.
 */

const BDC_BASE_URL = 'https://plataforma.bigdatacorp.com.br';

function safeGet(obj, path, def = null) {
  if (!obj) return def;
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return def;
    cur = cur[p];
  }
  return cur ?? def;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { cnpj, partners } = payload;

    if (!cnpj) {
      return Response.json({ error: 'CNPJ é obrigatório' }, { status: 400 });
    }

    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    console.log(`[BDC] Real KYC analysis for CNPJ ${cleanCnpj}`);

    const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
    const tokenId = Deno.env.get('BDC_TOKEN_ID');

    if (!accessToken || !tokenId) {
      return Response.json({ error: 'BDC tokens not configured' }, { status: 500 });
    }

    // Datasets de KYC: sanções empresa, sócios KYC, envolvimento político, dívida ativa
    const datasets = 'kyc,owners_kyc,political_involvement,government_debtors,basic_data,registration_data';
    const startTime = Date.now();

    const response = await fetch(`${BDC_BASE_URL}/empresas`, {
      method: 'POST',
      headers: {
        'AccessToken': accessToken,
        'TokenId': tokenId,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Datasets: datasets,
        q: `doc{${cleanCnpj}}`,
        Limit: 1,
      }),
    });

    const elapsedMs = Date.now() - startTime;
    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return Response.json({ error: 'Failed to parse BDC response', raw: rawText.substring(0, 500) }, { status: 500 });
    }

    const result = data.Result?.[0] || {};

    // Analyze company KYC
    const redFlags = [];
    let score = 100; // Start at 100 (best), subtract for issues

    // Company sanctions
    const kyc = result.Kyc;
    let companySanctioned = false;
    let companyPep = false;
    if (kyc) {
      const kycItems = Array.isArray(kyc) ? kyc : [kyc];
      for (const item of kycItems) {
        if (item?.IsPEP || item?.IsPep) companyPep = true;
        const sanctions = item?.Sanctions || item?.SanctionsDetails || [];
        if (Array.isArray(sanctions) && sanctions.length > 0) {
          companySanctioned = true;
          redFlags.push(`Empresa em lista de sanções: ${sanctions.map(s => s.Source || s.ListName || 'N/I').join(', ')}`);
          score -= 50;
        }
      }
    }
    if (companyPep) {
      redFlags.push('Empresa é PEP');
      score -= 20;
    }

    // Government debtors
    const debtors = result.GovernmentDebtors;
    if (debtors) {
      const dItems = Array.isArray(debtors) ? debtors : [debtors];
      let totalDebt = 0;
      for (const item of dItems) {
        totalDebt += Number(item?.TotalValue || item?.Value || 0);
      }
      if (totalDebt > 0) {
        redFlags.push(`Dívida ativa: R$ ${totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        score -= totalDebt > 500000 ? 40 : totalDebt > 100000 ? 20 : 10;
      }
    }

    // Company basic data
    const bd = result.BasicData || result.RegistrationData?.BasicData || {};
    const taxStatus = bd.TaxIdStatus || '';
    if (taxStatus && !String(taxStatus).toUpperCase().includes('ATIV')) {
      redFlags.push(`CNPJ não ativo: ${taxStatus}`);
      score -= 50;
    }

    // Analyze partners KYC
    const partnersRisk = [];
    const ownersKyc = result.OwnersKyc;
    if (ownersKyc) {
      const items = Array.isArray(ownersKyc) ? ownersKyc : [ownersKyc];
      for (const item of items) {
        const name = item?.Name || item?.RelatedPersonName || 'N/I';
        const isPep = item?.IsPEP || item?.IsPep || false;
        const sanctions = item?.Sanctions || [];
        const hasSanctions = Array.isArray(sanctions) && sanctions.length > 0;

        const partnerResult = {
          name,
          is_pep: isPep,
          has_sanctions: hasSanctions,
          sanctions_details: hasSanctions ? sanctions.map(s => s.Source || s.ListName || 'N/I') : [],
        };

        if (isPep) {
          redFlags.push(`Sócio PEP: ${name}`);
          score -= 15;
        }
        if (hasSanctions) {
          redFlags.push(`Sócio em sanções: ${name}`);
          score -= 30;
        }

        partnersRisk.push(partnerResult);
      }
    }

    // Political involvement
    const political = result.PoliticalInvolvement;
    if (political) {
      const pItems = Array.isArray(political) ? political : [political];
      if (pItems.some(p => p?.HasPoliticalInvolvement || (p?.InvolvedPersons && p.InvolvedPersons.length > 0))) {
        redFlags.push('Envolvimento político detectado no QSA');
        score -= 10;
      }
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));
    const level = score >= 80 ? 'LOW' : score >= 60 ? 'MEDIUM' : score >= 40 ? 'HIGH' : 'CRITICAL';

    const kycResult = {
      company_risk: {
        score,
        level,
        red_flags: redFlags,
        tax_status: taxStatus,
        is_sanctioned: companySanctioned,
        is_pep: companyPep,
      },
      partners_risk: partnersRisk,
      _meta: {
        query_id: data.QueryId,
        elapsed_ms: data.ElapsedMilliseconds || elapsedMs,
        query_date: data.QueryDate,
        datasets_queried: datasets,
        source: 'bigdatacorp_real',
      },
    };

    // Log
    try {
      await base44.asServiceRole.entities.IntegrationLog.create({
        provider: "BigDataCorp",
        service_type: "empresas_kyc_real",
        request_id: data.QueryId || `bdc_kyc_${Date.now()}`,
        status: "success",
        result_status: level,
        duration_ms: elapsedMs,
        score,
        request_payload: { cnpj: cleanCnpj },
        response_payload: { score, level, red_flags_count: redFlags.length },
      });
    } catch (logErr) {
      console.warn('[BDC] Log error:', logErr.message);
    }

    return Response.json(kycResult);

  } catch (error) {
    console.error("[BDC] Error analyzing KYC:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});