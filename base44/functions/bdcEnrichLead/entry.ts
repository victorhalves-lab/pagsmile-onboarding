import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BDC_BASE_URL = 'https://plataforma.bigdatacorp.com.br';

// Datasets per enrichment level
const DATASETS = {
  // Camada 1: autocomplete + activity indicators (called on CNPJ input)
  quick: [
    'basic_data', 'activity_indicators', 'merchant_category_data',
    'domains', 'addresses_extended',
  ],
  // Camada 2: full enrichment (called on submit)
  full: [
    'basic_data', 'activity_indicators', 'merchant_category_data',
    'domains', 'addresses_extended', 'passages',
    'reputations_and_reviews', 'collections', 'marketplace_data',
    'kyc', 'owners_kyc',
  ],
};

function safeGet(obj, path, def = null) {
  if (!obj) return def;
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) { if (cur == null) return def; cur = cur[p]; }
  return cur ?? def;
}

function flattenBDCArray(dataset) {
  if (!dataset) return [];
  if (Array.isArray(dataset)) return dataset.flatMap(d => d?.MatchKeys ? [d] : Array.isArray(d) ? d : [d]).filter(Boolean);
  return [dataset];
}

function extractBasicData(result) {
  const bd = result?.BasicData || result?.basic_data;
  if (!bd) return null;
  if (typeof bd === 'object' && !Array.isArray(bd)) return bd;
  return flattenBDCArray(bd)[0] || null;
}

// Extract address from BDC data
function extractAddress(result) {
  // Try addresses_extended first
  const addr = result?.AddressesExtended || result?.addresses_extended;
  if (addr) {
    const items = flattenBDCArray(addr);
    if (items.length > 0) {
      const a = items[0];
      return {
        cep: a?.ZipCode || a?.CEP || '',
        logradouro: a?.Street || a?.StreetName || a?.Address || '',
        numero: a?.Number || a?.AddressNumber || '',
        complemento: a?.Complement || '',
        bairro: a?.Neighborhood || a?.District || '',
        municipio: a?.City || '',
        uf: a?.State || '',
      };
    }
  }
  // Fallback to basic_data address
  const bd = extractBasicData(result);
  const bdAddr = safeGet(bd, 'Address') || safeGet(bd, 'MainAddress');
  if (bdAddr && typeof bdAddr === 'object') {
    return {
      cep: bdAddr.ZipCode || bdAddr.CEP || '',
      logradouro: bdAddr.Street || bdAddr.StreetName || '',
      numero: bdAddr.Number || bdAddr.AddressNumber || '',
      complemento: bdAddr.Complement || '',
      bairro: bdAddr.Neighborhood || bdAddr.District || '',
      municipio: bdAddr.City || '',
      uf: bdAddr.State || '',
    };
  }
  return null;
}

// Extract activity indicators
function extractActivityIndicators(result) {
  const ai = result?.ActivityIndicators || result?.activity_indicators;
  if (!ai) return null;
  const items = flattenBDCArray(ai);
  const first = items[0];
  if (!first) return null;
  return {
    activityLevel: first.ActivityLevel != null ? Number(first.ActivityLevel) : null,
    shellCompanyLikelihood: first.ShellCompanyLikelyhood != null ? Number(first.ShellCompanyLikelyhood) : (first.ShellCompanyLikelihood != null ? Number(first.ShellCompanyLikelihood) : null),
    hasActivity: first.HasActivity ?? null,
    employeesRange: first.EmployeesRange || null,
    incomeRange: first.IncomeRange || null,
    hasActiveDomain: first.HasActiveDomain ?? null,
    hasCorporateEmail: first.HasCorporateEmail ?? null,
    numberOfBranches: first.NumberOfBranches ?? null,
    hasRecentPassages: first.HasRecentPassages ?? null,
  };
}

// Extract domain info
function extractDomains(result) {
  const dom = result?.Domains || result?.domains;
  if (!dom) return null;
  const items = flattenBDCArray(dom);
  return items.slice(0, 5).map(d => ({
    domain: d?.Domain || d?.DomainName || '',
    age: d?.DomainAge || d?.Age || null,
    hasSSL: d?.HasSSL || d?.SSLEnabled || null,
    platform: d?.Platform || d?.Technology || '',
  })).filter(d => d.domain);
}

// Extract MCC
function extractMCC(result) {
  const mcc = result?.MerchantCategoryData || result?.merchant_category_data;
  if (!mcc) return null;
  const items = flattenBDCArray(mcc);
  const first = items[0];
  if (!first) return null;
  return { code: first.MCC || first.CategoryCode || '', description: first.Description || first.CategoryDescription || '' };
}

// Extract passages
function extractPassages(result) {
  const p = result?.Passages || result?.passages;
  if (!p) return null;
  const items = flattenBDCArray(p);
  let total = 0, recent = 0;
  for (const i of items) {
    total += Number(i?.TotalPassages || 0);
    recent += Number(i?.Last365DaysPassages || i?.RecentPassages || 0);
  }
  return { total, recent };
}

// Extract reputation
function extractReputation(result) {
  const rep = result?.ReputationsAndReviews || result?.reputations_and_reviews;
  if (!rep) return null;
  const items = flattenBDCArray(rep);
  return items.slice(0, 3).map(r => ({
    platform: r?.Platform || r?.Source || 'Reclame Aqui',
    rating: r?.Rating || r?.Score || r?.GeneralScore || null,
    complaints: r?.TotalComplaints || r?.ComplaintsCount || 0,
    resolved: r?.ResolvedPercentage || r?.ResolutionRate || 0,
  }));
}

// Extract collections
function extractCollections(result) {
  const col = result?.Collections || result?.collections;
  if (!col) return { hasCollections: false, totalRecords: 0, totalValue: 0 };
  const items = flattenBDCArray(col);
  let has = false, records = 0, value = 0;
  for (const i of items) {
    if (i?.HasCollectionRecords || i?.TotalRecords > 0) has = true;
    records += Number(i?.TotalRecords || 0);
    value += Number(i?.TotalValue || i?.Value || 0);
  }
  return { hasCollections: has, totalRecords: records, totalValue: value };
}

// Extract KYC (PEP + sanctions)
function extractKYC(result) {
  const kyc = result?.Kyc || result?.kyc;
  const ownersKyc = result?.OwnersKyc || result?.owners_kyc;
  let companyPep = false, companySanctions = false;
  let ownersPep = [], ownersSanctions = [];

  if (kyc) {
    const items = flattenBDCArray(kyc);
    for (const i of items) {
      if (i?.IsPEP || i?.IsPep) companyPep = true;
      if (Array.isArray(i?.Sanctions) && i.Sanctions.length > 0) companySanctions = true;
    }
  }
  if (ownersKyc) {
    const items = flattenBDCArray(ownersKyc);
    for (const i of items) {
      const name = i?.Name || i?.RelatedPersonName || 'N/I';
      if (i?.IsPEP || i?.IsPep) ownersPep.push(name);
      if (Array.isArray(i?.Sanctions) && i.Sanctions.length > 0) ownersSanctions.push(name);
    }
  }
  return { companyPep, companySanctions, ownersPep, ownersSanctions };
}

// Extract marketplace presence
function extractMarketplace(result) {
  const mp = result?.MarketplaceData || result?.marketplace_data;
  if (!mp) return [];
  const items = flattenBDCArray(mp);
  return items.map(i => i?.MarketplaceName || i?.Platform || i?.Name || '').filter(Boolean);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Public endpoint — no auth required (called from public lead forms)
    // But we still need to validate the request
    const { cnpj, level } = await req.json();

    if (!cnpj) return Response.json({ error: 'CNPJ é obrigatório' }, { status: 400 });

    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) return Response.json({ error: 'CNPJ deve ter 14 dígitos' }, { status: 400 });

    const enrichLevel = level === 'full' ? 'full' : 'quick';
    const datasets = DATASETS[enrichLevel];

    const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
    const tokenId = Deno.env.get('BDC_TOKEN_ID');
    if (!accessToken || !tokenId) return Response.json({ error: 'BDC tokens not configured' }, { status: 500 });

    console.log(`BDC Lead Enrich: ${cleanCnpj} | level=${enrichLevel} | datasets=${datasets.length}`);

    const bdcResponse = await fetch(`${BDC_BASE_URL}/empresas`, {
      method: 'POST',
      headers: {
        'AccessToken': accessToken,
        'TokenId': tokenId,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Datasets: datasets.join(','), q: `doc{${cleanCnpj}}`, Limit: 1 }),
    });

    const rawText = await bdcResponse.text();
    let bdcData;
    try { bdcData = JSON.parse(rawText); } catch (e) {
      console.error('BDC parse error:', rawText.substring(0, 300));
      return Response.json({ error: 'BDC parse error' }, { status: 502 });
    }

    const result = bdcData.Result?.[0] || {}; 
    const bd = extractBasicData(result);

    // Detecta payload vazio (token expirado, sem dados, erro silencioso da BDC)
    // BDC responde 200 mesmo quando o login está expirado → status com Code -101.
    const statusErrors = [];
    if (bdcData.Status && typeof bdcData.Status === 'object') {
      for (const [ds, statuses] of Object.entries(bdcData.Status)) {
        if (Array.isArray(statuses)) {
          for (const s of statuses) {
            if (s.Code !== 0 && s.Code != null) statusErrors.push({ ds, code: s.Code, msg: s.Message });
          }
        }
      }
    }
    if (statusErrors.length > 0) {
      console.warn(`BDC empty/error response for ${cleanCnpj}:`, JSON.stringify(statusErrors));
    }

    // Build standardized response
    const response = {
      success: true,
      level: enrichLevel,
      queryDate: bdcData.QueryDate,
      elapsedMs: bdcData.ElapsedMilliseconds,

      // Autopreenchimento
      autoFill: {
        razaoSocial: safeGet(bd, 'OfficialName') || safeGet(bd, 'CompanyName') || '',
        nomeFantasia: safeGet(bd, 'TradeName') || safeGet(bd, 'FantasyName') || '',
        capitalSocial: safeGet(bd, 'ShareCapital') || safeGet(bd, 'Capital') || null,
        porte: safeGet(bd, 'CompanySize') || safeGet(bd, 'Size') || '',
        fundacao: safeGet(bd, 'FoundedDate') || safeGet(bd, 'Age.FoundedDate') || '',
        situacaoCadastral: safeGet(bd, 'TaxIdStatus') || safeGet(bd, 'TaxIdStatusDescription') || '',
        cnaePrincipal: safeGet(bd, 'MainEconomicActivity') || safeGet(bd, 'MainActivityCode') || '',
        cnaeDescricao: safeGet(bd, 'MainEconomicActivityDescription') || safeGet(bd, 'MainActivityDescription') || '',
        naturezaJuridica: safeGet(bd, 'LegalNatureDescription') || (typeof safeGet(bd, 'LegalNature') === 'object' ? safeGet(bd, 'LegalNature.Activity') || safeGet(bd, 'LegalNature.Description') : safeGet(bd, 'LegalNature')) || '',
        regimeTributario: safeGet(bd, 'TaxRegime') || '',
        isMEI: safeGet(bd, 'TaxRegimes.MEI') || safeGet(bd, 'IsMEI') || false,
        isSimples: safeGet(bd, 'TaxRegimes.Simples') || false,
        email: safeGet(bd, 'Email') || safeGet(bd, 'MainEmail') || '',
        phone: safeGet(bd, 'Phone') || safeGet(bd, 'MainPhone') || safeGet(bd, 'PhoneNumber') || '',
      },
      endereco: extractAddress(result),
      activityIndicators: extractActivityIndicators(result),
      domains: extractDomains(result),
      mcc: extractMCC(result),
    };

    // Full level adds more data
    if (enrichLevel === 'full') {
      response.passages = extractPassages(result);
      response.reputation = extractReputation(result);
      response.collections = extractCollections(result);
      response.kyc = extractKYC(result);
      response.marketplaces = extractMarketplace(result);
    }

    return Response.json(response);
  } catch (error) {
    console.error('bdcEnrichLead error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});