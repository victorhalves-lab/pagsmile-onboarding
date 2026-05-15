import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BDC_BASE_URL = 'https://plataforma.bigdatacorp.com.br';

// ══════════════════════════════════════════════════════════════════
// DATASETS VÁLIDOS PARA A API DE PESSOAS (/pessoas)
// Fonte: https://docs.bigdatacorp.com.br/plataforma/reference/pessoas
// IMPORTANTE: Os nomes dos datasets de Pessoas são DIFERENTES dos de Empresas.
// ══════════════════════════════════════════════════════════════════

const PERSON_DATASET_ALIASES = {
  // Dados básicos / modelagem
  'basic_data':                    'basic_data',
  'unified_modeling_data_x1_0':    'unified_modeling_data_x1_0',
  'unified_modeling_data_x1_5':    'unified_modeling_data_x1_5',

  // KYC / Compliance
  'kyc':                           'kyc',
  'processes':                     'processes',
  'collections':                   'collections',
  'government_debtors':            'government_debtors',

  // Contatos
  'phones_extended':               'phones_extended',
  'emails_extended':               'emails_extended',
  'addresses_extended':            'addresses_extended',

  // Presença / Reputação
  'media_profile_and_exposure':    'media_profile_and_exposure',
  'online_presence':               'online_presence',

  // Relações
  'relationships':                 'relationships',
  'electoral_donors':              'electoral_donors',
  
  // Profissional
  'professional_data':             'professional_data',
  'university':                    'university',

  // Novos datasets PF — Sprint Compliance Expandido
  'first_level_family_kyc':        'first_level_family_kyc',
  'social_assistance':             'social_assistance',
  'public_servants':               'public_servants',
  'presumed_income':               'presumed_income',
  'financial_interests':           'financial_interests',
  'risk_data':                     'risk_data',

  // Sprint 2 PF — Cross-check financeiro & redes
  'personal_relationships':        'personal_relationships',
  'scr_positive_score':            'scr_positive_score',
  'simples_nacional_collection':   'simples_nacional_collection',

  // Contatos de pessoas relacionadas
  'related_people_phones':         'related_people_phones',
  'related_people_emails':         'related_people_emails',
  'related_people_addresses':      'related_people_addresses',

  // ── NOVOS DATASETS PF — Sprint Expansão PLD (2026-05-15) ──
  'judicial_assets':               'judicial_assets',               // 🔥 Bens penhorados, busca-apreensão, indisponibilidade
  'entrepreneur_quality':          'entrepreneur_quality',          // Score do empreendedor (sucesso/fracasso em empresas)
  'pep':                           'pep',                           // PEP dedicado (cargo, mandato, parentes)
  'financial_data':                'financial_data',                // Renda estimada, restituição IR, ativos PF
};

const PERSON_DATASET_GROUPS = {
  // KYC completo para PF
  'kyc_full': [
    'basic_data', 'kyc', 'processes', 'collections',
    'government_debtors', 'media_profile_and_exposure',
    'relationships', 'electoral_donors',
  ].join(','),

  // Subseller PF — expandido com datasets regulatórios + cross-check financeiro
  'subseller_pf': [
    'basic_data', 'kyc', 'processes', 'collections',
    'emails_extended', 'phones_extended', 'addresses_extended',
    'media_profile_and_exposure', 'online_presence',
    'related_people_phones', 'related_people_emails', 'related_people_addresses',
    'risk_data', 'government_debtors', 'first_level_family_kyc',
    'social_assistance', 'electoral_donors', 'public_servants',
    'presumed_income', 'financial_interests',
    'personal_relationships', 'scr_positive_score', 'simples_nacional_collection',
  ].join(','),

  // Cross-check financeiro (uso avulso)
  'financial_crosscheck': [
    'basic_data', 'presumed_income', 'financial_interests',
    'scr_positive_score', 'simples_nacional_collection', 'financial_data',
  ].join(','),

  // BDC Lookup — KYC/PLD completo PF (novo, para página BdcLookup)
  'bdc_lookup_full': [
    'basic_data', 'kyc', 'pep', 'processes', 'collections',
    'government_debtors', 'judicial_assets', 'entrepreneur_quality',
    'media_profile_and_exposure', 'relationships', 'first_level_family_kyc',
    'financial_data', 'electoral_donors', 'public_servants', 'risk_data',
  ].join(','),

  // Básico
  'basic': 'basic_data',

  // Modelagem
  'modeling': 'unified_modeling_data_x1_0',
};

function normalizePersonDatasets(rawInput) {
  const datasetsStr = Array.isArray(rawInput) ? rawInput.join(',') : String(rawInput || 'basic_data');
  if (PERSON_DATASET_GROUPS[datasetsStr]) {
    return PERSON_DATASET_GROUPS[datasetsStr];
  }
  return datasetsStr.split(',').map(d => {
    const trimmed = d.trim();
    if (PERSON_DATASET_GROUPS[trimmed]) return PERSON_DATASET_GROUPS[trimmed];
    return PERSON_DATASET_ALIASES[trimmed] || trimmed;
  }).join(',');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { cpf, datasets } = await req.json();

    if (!cpf) {
      return Response.json({ error: 'CPF é obrigatório' }, { status: 400 });
    }

    const cleanCpf = cpf.replace(/[^\d]/g, '');
    if (cleanCpf.length !== 11) {
      return Response.json({ error: 'CPF deve ter 11 dígitos' }, { status: 400 });
    }

    const requestedDatasets = normalizePersonDatasets(datasets || 'basic_data');

    const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
    const tokenId = Deno.env.get('BDC_TOKEN_ID');

    if (!accessToken || !tokenId) {
      return Response.json({ error: 'BDC tokens not configured' }, { status: 500 });
    }

    const requestBody = {
      Datasets: requestedDatasets,
      q: `doc{${cleanCpf}}`,
      Limit: 1,
    };
    console.log('BDC Person Request:', JSON.stringify(requestBody));

    const response = await fetch(`${BDC_BASE_URL}/pessoas`, {
      method: 'POST',
      headers: {
        'AccessToken': accessToken,
        'TokenId': tokenId,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const rawText = await response.text();
    console.log('BDC Person HTTP:', response.status);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return Response.json({ error: 'Failed to parse BDC response', raw: rawText.substring(0, 500) }, { status: 500 });
    }

    // Separa status OK vs erros
    const statusOk = {};
    const statusErrors = {};
    if (data.Status) {
      for (const [ds, statuses] of Object.entries(data.Status)) {
        if (Array.isArray(statuses) && statuses.some(s => s.Code !== 0)) {
          statusErrors[ds] = statuses;
        } else {
          statusOk[ds] = statuses;
        }
      }
      if (Object.keys(statusErrors).length > 0) {
        console.warn('BDC Person Errors:', JSON.stringify(Object.keys(statusErrors)));
      }
    }

    return Response.json({
      success: true,
      queryId: data.QueryId,
      elapsedMs: data.ElapsedMilliseconds,
      queryDate: data.QueryDate,
      datasetsOk: Object.keys(statusOk),
      datasetsError: Object.keys(statusErrors),
      status: data.Status,
      result: data.Result?.[0] || null,
      evidences: data.Evidences,
    });

  } catch (error) {
    console.error('BDC Person Query Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});