import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BDC_BASE_URL = 'https://plataforma.bigdatacorp.com.br';

// Mapeamento de nomes amigáveis → nomes reais dos datasets da API de Empresas BDC
// IMPORTANTE: Para empresas, vários datasets usam nomes diferentes de pessoas
// Ex: "phones" (pessoas) → "phones_extended" (empresas)
const COMPANY_DATASET_ALIASES = {
  'phones': 'phones_extended',
  'addresses': 'addresses_extended',
  'emails': 'emails_extended',
  'collections': 'collections',
  'processes': 'processes',
  'basic_data': 'basic_data',
  'owners': 'owners',
  'relationships': 'relationships',
  'domain_data': 'domain_data',
  'merchant_category_data': 'merchant_category_data',
  'online_presence': 'online_presence',
  'media_profile_and_exposure': 'media_profile_and_exposure',
  'lawsuits_distribution': 'lawsuits_distribution',
  'sanctions_and_fines': 'sanctions_and_fines',
  'political_involvement': 'political_involvement',
  'economic_group_relationships': 'economic_group_relationships',
  'owner_processes': 'owner_processes',
  'unified_modeling_data_x1_0': 'unified_modeling_data_x1_0',
};

// Converte nomes de datasets garantindo compatibilidade com a API de empresas
function normalizeCompanyDatasets(datasetsStr) {
  return datasetsStr.split(',').map(d => {
    const trimmed = d.trim();
    return COMPANY_DATASET_ALIASES[trimmed] || trimmed;
  }).join(',');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { cnpj, datasets } = await req.json();

    if (!cnpj) {
      return Response.json({ error: 'CNPJ é obrigatório' }, { status: 400 });
    }

    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    // Normaliza nomes dos datasets para a API de empresas
    const rawDatasets = datasets || 'basic_data';
    const requestedDatasets = normalizeCompanyDatasets(rawDatasets);

    const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
    const tokenId = Deno.env.get('BDC_TOKEN_ID');

    if (!accessToken || !tokenId) {
      return Response.json({ error: 'BDC tokens not configured' }, { status: 500 });
    }

    const requestBody = {
      Datasets: requestedDatasets,
      q: `doc{${cleanCnpj}}`,
      Limit: 1,
    };
    console.log('BDC Company Request:', JSON.stringify(requestBody));
    console.log('BDC Dataset mapping:', rawDatasets, '->', requestedDatasets);

    const response = await fetch(`${BDC_BASE_URL}/empresas`, {
      method: 'POST',
      headers: {
        'AccessToken': accessToken,
        'TokenId': tokenId,
        'accept': 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const rawText = await response.text();
    console.log('BDC HTTP Status:', response.status);
    console.log('BDC Raw Response (first 2000):', rawText.substring(0, 2000));

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return Response.json({ error: 'Failed to parse BDC response', raw: rawText.substring(0, 500) }, { status: 500 });
    }

    // Check for API-level errors
    if (data.Status) {
      const errors = Object.entries(data.Status).filter(([_, statuses]) =>
        Array.isArray(statuses) && statuses.some(s => s.Code !== 0)
      );
      if (errors.length > 0) {
        console.warn('BDC Dataset errors:', JSON.stringify(errors));
      }
    }

    return Response.json({
      success: true,
      queryId: data.QueryId,
      elapsedMs: data.ElapsedMilliseconds,
      queryDate: data.QueryDate,
      status: data.Status,
      result: data.Result?.[0] || null,
      evidences: data.Evidences,
    });

  } catch (error) {
    console.error('BDC Query Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});