import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BDC_BASE_URL = 'https://plataforma.bigdatacorp.com.br';

// ══════════════════════════════════════════════════════════════════════════════
// MAPEAMENTO COMPLETO DE DATASETS BDC — EMPRESAS (/empresas)
// Validado em 2026-04-09 com token Pagsmile
// Total: 34 datasets confirmados operacionais
// ══════════════════════════════════════════════════════════════════════════════

const COMPANY_DATASET_ALIASES = {
  // ── DADOS CADASTRAIS ──
  'basic_data':               'basic_data',               // CNPJ, razão social, CNAE, capital, situação, regime tributário
  'registration_data':        'registration_data',        // Dados RF completos, QSA com qualificações
  'history_basic_data':       'history_basic_data',       // Histórico de alterações cadastrais
  'company_evolution':        'company_evolution',        // Timeline de evolução da empresa

  // ── CONTATOS ──
  'phones':                   'phones_extended',          // Alias amigável
  'phones_extended':          'phones_extended',          // Telefones da empresa
  'emails':                   'emails_extended',          // Alias amigável
  'emails_extended':          'emails_extended',          // E-mails da empresa
  'addresses':                'addresses_extended',       // Alias amigável
  'addresses_extended':       'addresses_extended',       // Endereços + geolocalização

  // ── SÓCIOS / QSA ──
  'relationships':            'relationships',            // Vínculos societários
  'owners_kyc':               'owners_kyc',               // 🔥 KYC individual de cada sócio (PEP + sanções por sócio)
  'owners_lawsuits':          'owners_lawsuits',          // Processos judiciais dos sócios
  'owners_influence':         'owners_influence',         // Nível de influência do QSA
  'owners_electoral_donors':  'owners_electoral_donors',  // Doações eleitorais dos sócios
  'owners_industrial_property': 'owners_industrial_property', // Marcas/patentes dos sócios
  'related_people_phones':    'related_people_phones',    // Telefones dos sócios
  'related_people_emails':    'related_people_emails',    // E-mails dos sócios
  'related_people_addresses': 'related_people_addresses', // Endereços dos sócios com lat/long

  // ── COMPLIANCE / KYC ──
  'kyc':                      'kyc',                      // PEP, sanções (OFAC/EU/UN), doações eleitorais
  'political_involvement':    'political_involvement',    // Envolvimento político QSA
  'government_debtors':       'government_debtors',       // Dívida ativa, CADIN

  // ── JURÍDICO ──
  'processes':                'processes',                // Processos judiciais da empresa

  // ── DIGITAL / PRESENÇA ONLINE ──
  'domains':                  'domains',                  // Domínios, idade, SSL, plataforma
  'online_ads':               'online_ads',               // Anúncios OLX/ML/WebMotors
  'passages':                 'passages',                 // 🔥 Passagens pela web (proxy de atividade real)

  // ── REPUTAÇÃO ──
  'media_profile_and_exposure': 'media_profile_and_exposure', // 🔥 Notícias com análise de sentimento (adverse media)
  'reputations_and_reviews':  'reputations_and_reviews',  // 🔥 Reclame Aqui, scores detalhados
  'awards_and_certifications': 'awards_and_certifications', // Prêmios e certificações

  // ── ATIVIDADE / MERCADO ──
  'activity_indicators':      'activity_indicators',      // 🔥 Nível atividade, ShellCompanyLikelyhood, employees, income
  'marketplace_data':         'marketplace_data',         // 🔥 Presença ML/Shopee/Amazon
  'collections':              'collections',              // Presença em cobrança
  'merchant_category_data':   'merchant_category_data',   // 🔥 MCC da empresa

  // ── FINANCEIRO / REGULATÓRIO ──
  'financial_market':         'financial_market',         // Registro BCB/CVM/SUSEP
  'economic_group':           'economic_group',           // Grupo econômico
  'industrial_property':      'industrial_property',      // Marcas/patentes da empresa
  'licenses_and_authorizations': 'licenses_and_authorizations', // Licenças e autorizações

  // ── ALIASES LEGADOS (compatibilidade) ──
  'owner_processes':          'owners_lawsuits',
  'owners':                   'relationships',
  'domain_data':              'domains',
  'lawsuits_distribution':    'processes',
  'sanctions_and_fines':      'kyc',
  'economic_group_relationships': 'economic_group',
  'unified_modeling_data_x1_0': 'basic_data',
};

// ══════════════════════════════════════════════════════════════════════════════
// GRUPOS DE DATASETS PARA CONSULTAS POR CASO DE USO
// Esses grupos podem ser usados como atalhos no campo "datasets"
// ══════════════════════════════════════════════════════════════════════════════
const DATASET_GROUPS = {
  // Compliance completo — todos os datasets de KYC/AML/PLD
  'compliance_full': [
    'basic_data', 'registration_data', 'kyc', 'owners_kyc',
    'political_involvement', 'government_debtors', 'processes',
    'owners_lawsuits', 'media_profile_and_exposure', 'financial_market',
    'relationships', 'owners_influence', 'owners_electoral_donors',
  ].join(','),

  // Enriquecimento rápido — dados essenciais para validação de lead
  'enrichment_quick': [
    'basic_data', 'registration_data', 'activity_indicators',
    'domains', 'passages', 'merchant_category_data',
  ].join(','),

  // Digital footprint — presença online e reputação
  'digital_footprint': [
    'domains', 'online_ads', 'passages', 'reputations_and_reviews',
    'awards_and_certifications', 'marketplace_data', 'activity_indicators',
  ].join(','),

  // Sócios completo — tudo sobre o QSA
  'owners_full': [
    'relationships', 'owners_kyc', 'owners_lawsuits', 'owners_influence',
    'owners_electoral_donors', 'owners_industrial_property',
    'related_people_phones', 'related_people_emails', 'related_people_addresses',
    'political_involvement',
  ].join(','),

  // Risco financeiro — dívidas, cobranças, processos
  'financial_risk': [
    'collections', 'government_debtors', 'processes', 'owners_lawsuits',
    'financial_market',
  ].join(','),

  // PIX compliance — datasets mínimos para fluxo PIX
  'pix_compliance': [
    'basic_data', 'registration_data', 'kyc', 'owners_kyc',
    'activity_indicators', 'government_debtors', 'processes',
    'collections', 'domains', 'passages', 'merchant_category_data',
  ].join(','),

  // Mega query — TUDO (cuidado: caro)
  'all': [
    'basic_data', 'registration_data', 'history_basic_data', 'company_evolution',
    'phones_extended', 'emails_extended', 'addresses_extended',
    'relationships', 'owners_kyc', 'owners_lawsuits', 'owners_influence',
    'owners_electoral_donors', 'owners_industrial_property',
    'related_people_phones', 'related_people_emails', 'related_people_addresses',
    'kyc', 'political_involvement', 'government_debtors',
    'processes', 'domains', 'online_ads', 'passages',
    'media_profile_and_exposure', 'reputations_and_reviews', 'awards_and_certifications',
    'activity_indicators', 'marketplace_data', 'collections', 'merchant_category_data',
    'financial_market', 'economic_group', 'industrial_property', 'licenses_and_authorizations',
  ].join(','),
};

// Converte nomes de datasets garantindo compatibilidade com a API de empresas
function normalizeCompanyDatasets(rawInput) {
  // Se vier como array, converte para string separada por vírgula
  const datasetsStr = Array.isArray(rawInput) ? rawInput.join(',') : String(rawInput || 'basic_data');
  // Se é um grupo pré-definido, expande
  if (DATASET_GROUPS[datasetsStr]) {
    return DATASET_GROUPS[datasetsStr];
  }
  // Caso contrário, mapeia cada dataset individualmente
  return datasetsStr.split(',').map(d => {
    const trimmed = d.trim();
    // Checa se é um grupo inline
    if (DATASET_GROUPS[trimmed]) return DATASET_GROUPS[trimmed];
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
    console.log('BDC Request:', JSON.stringify(requestBody));

    const response = await fetch(`${BDC_BASE_URL}/empresas`, {
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
    console.log('BDC HTTP:', response.status);

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
        console.warn('BDC Errors:', JSON.stringify(Object.keys(statusErrors)));
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
    console.error('BDC Query Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});