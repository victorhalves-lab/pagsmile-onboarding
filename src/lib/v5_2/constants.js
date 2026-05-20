/**
 * [V5.2] Constantes canônicas do framework V5.2.
 *
 * Single source of truth para:
 *  - 13 dimensões analíticas (Aba 3 da tela de Análise de Risco)
 *  - 4 estados visuais dos datasets (success/empty/error/not_consulted)
 *  - 8 razões not_consulted_reason
 *  - 10 bloqueios absolutos sem exceção
 *  - 4 capabilities canônicas
 *  - 13 segmentos canônicos
 *  - Tiers permitidos
 *  - 7 mapeamentos de nomenclatura (DELTA Cap. 16.2)
 *  - 5 escalas de score por Tier
 */

// ─────────────────────────────────────────────────────────────────────────────
// 13 DIMENSÕES ANALÍTICAS (Aba 3)
// ─────────────────────────────────────────────────────────────────────────────
export const DIMENSOES_ANALITICAS = [
  { id: 'identidade_cadastro', nome: 'Identidade & Cadastro', ordem: 1, icone: 'IdCard' },
  { id: 'socios_beneficiarios', nome: 'Sócios & Beneficiários', ordem: 2, icone: 'Users' },
  { id: 'estrutura_societaria', nome: 'Estrutura Societária', ordem: 3, icone: 'Network' },
  { id: 'sancoes_internacionais_nacionais', nome: 'Sanções (Intl & Nac)', ordem: 4, icone: 'Ban' },
  { id: 'processos_compliance', nome: 'Processos & Compliance', ordem: 5, icone: 'Scale' },
  { id: 'atividade_reputacao', nome: 'Atividade & Reputação', ordem: 6, icone: 'TrendingUp' },
  { id: 'financeiro_mercado', nome: 'Financeiro & Mercado', ordem: 7, icone: 'DollarSign' },
  { id: 'trabalho_esg', nome: 'Trabalho & ESG', ordem: 8, icone: 'Leaf' },
  { id: 'compliance_setorial', nome: 'Compliance Setorial', ordem: 9, icone: 'ShieldCheck' },
  { id: 'pld_ft', nome: 'PLD/FT', ordem: 10, icone: 'AlertOctagon', novo_v5_2: true },
  { id: 'risco_pais_internacional', nome: 'Risco-País Internacional', ordem: 11, icone: 'Globe', condicional_capability: 'crossborder' },
  { id: 'caf_biometria_screening', nome: 'CAF — Biometria & Screening', ordem: 12, icone: 'Fingerprint' },
  { id: 'outras_integracoes', nome: 'Outras Integrações', ordem: 13, icone: 'Plug' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4 ESTADOS VISUAIS DOS DATASETS
// ─────────────────────────────────────────────────────────────────────────────
export const DATASET_STATES = {
  success: {
    label: 'Consultado com sucesso',
    icon: '🟢',
    color: 'emerald',
    classes: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  empty: {
    label: 'Consultado — sem dados',
    icon: '🟡',
    color: 'amber',
    classes: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  error: {
    label: 'Erro na consulta',
    icon: '🔴',
    color: 'red',
    classes: 'bg-red-50 border-red-200 text-red-700',
  },
  not_consulted: {
    label: 'Não aplicável neste contexto',
    icon: '⊝',
    color: 'gray',
    classes: 'bg-gray-50 border-gray-200 border-dashed text-gray-600',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 10 RAZÕES not_consulted_reason
// ─────────────────────────────────────────────────────────────────────────────
export const NOT_CONSULTED_REASONS = {
  tier_1_below_threshold: 'Dataset requer Tier ≥ 2; caso é Tier 1.',
  tier_2_below_threshold: 'Dataset requer Tier 3; caso é Tier 2 ou menor.',
  capability_crossborder_not_active: 'Capability crossborder não está ativa neste caso.',
  capability_splits_subseller_not_active: 'Capability splits/subseller não está ativa neste caso.',
  capability_recurrence_not_active: 'Capability recurrence não está ativa neste caso.',
  segment_not_applicable: 'Dataset não se aplica ao segmento deste caso.',
  morfologia_not_applicable: 'Dataset não se aplica à morfologia deste caso.',
  trigger_not_met: 'Trigger especial não atendido (ex: KYC de familiares só quando UBO é PEP/sancionado).',
  cost_optimization: 'Dataset desabilitado por flag de otimização de custo.',
  dataset_not_contracted: 'Dataset ainda não contratado com o provedor.',
  other: 'Outra razão (verificar IntegrationLog).',
};

// ─────────────────────────────────────────────────────────────────────────────
// 10 BLOQUEIOS ABSOLUTOS SEM EXCEÇÃO (núcleo duro regulatório)
// Nem Compliance Officer pode aplicar exceção. Recusa direta sempre.
// ─────────────────────────────────────────────────────────────────────────────
export const BLOQUEIOS_ABSOLUTOS = [
  'B03', // Sanção direta em sócio
  'B04', // Familiar de sancionado
  'B10', // Trabalho escravo confirmado (Lista Suja MTE)
  'B-CB-1', // País FATF blacklist (capability crossborder)
  'B-INT-1', // Interpol Red Notice
  'B-MKT-PROD-CRIT-1', // Marketplace com categoria proibida (armas/drogas/pirataria)
  'B-PV-LGPD-1-CRIT', // Plataforma Vertical Saúde sem DPO especializado
  'B-GW-PCI-CRIT-1', // Gateway sem PCI-DSS quando obrigatório
  'B-LOC-SETOR-CRIT-1', // Pousada/Restaurante sem AVCB
  'B-CB-PAIS-CRIT-1', // Crossborder em país FATF blacklist
];

// ─────────────────────────────────────────────────────────────────────────────
// 4 CAPABILITIES CANÔNICAS V5.2
// ─────────────────────────────────────────────────────────────────────────────
export const CAPABILITIES_CANONICAS = {
  'splits/subseller': {
    nome: 'Splits / Sub-credenciamento',
    obrigatoria_para: ['marketplace'],
    forca_ativacao_em: ['gateway'],
  },
  'crossborder': {
    nome: 'Operação Cross-border',
    obrigatoria_para: ['crossborder'],
    forca_ativacao_em: ['dropshipping'],
  },
  'recurrence': {
    nome: 'Cobrança Recorrente',
    obrigatoria_para: ['saas'],
    forca_ativacao_em: [],
  },
  'cap_financial_capacity_validation': {
    nome: 'Validação de Capacidade Financeira (Patch V5.1)',
    obrigatoria_para: [], // Tier 2+ universal
    forca_ativacao_em: ['gateway', 'marketplace', 'dropshipping', 'crossborder'], // forçam em Tier 1
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 13 SEGMENTOS CANÔNICOS
// ─────────────────────────────────────────────────────────────────────────────
export const SEGMENTOS_CANONICOS = [
  'ecommerce',
  'marketplace',
  'gateway',
  'saas',
  'infoprodutos',
  'plataforma_vertical',
  'turismo',
  'eventos',
  'servicos_b2b',
  'dropshipping',
  'servicos_locais',
  'educacao',
  'crossborder',
];

export const SEGMENTOS_TIER_3_ONLY = ['marketplace', 'gateway', 'crossborder'];

// ─────────────────────────────────────────────────────────────────────────────
// 5 ESCALAS DE SCORE POR TIER
// ─────────────────────────────────────────────────────────────────────────────
export const SCORE_SCALES_BY_TIER = {
  tier_1: { min: 0, max: 850 },
  tier_2: { min: 0, max: 850 },
  tier_3: { min: 0, max: 999 },
  subseller_pj: { min: 0, max: 850 },
  subseller_pf: { min: 0, max: 850 },
};

// ─────────────────────────────────────────────────────────────────────────────
// 7 MAPEAMENTOS DE NOMENCLATURA (find & replace) — DELTA_SEGMENTOS Cap. 16.2
// ─────────────────────────────────────────────────────────────────────────────
export const NOMENCLATURE_MAP = {
  'B-MKT-PROD-1': 'B-MKT-PROD-CRIT-1',
  'B-GW-PCI-1': 'B-GW-PCI-CRIT-1',
  'B-PV-LGPD-1': 'B-PV-LGPD-1-CRIT',
  'B-DS-FORN-1': 'B-DS-FORN-CRIT-1',
  'B-LOC-POUS-1': 'B-LOC-SETOR-CRIT-1',
  'B-LOC-VET-1': 'B-LOC-MED-1',
  'B-CB-PAIS-1': 'B-CB-PAIS-CRIT-1',
};

/**
 * Normaliza código de bloqueio para nome canônico V5.2.
 */
export function canonicalBlockCode(code) {
  return NOMENCLATURE_MAP[code] || code;
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE FLAGS V5.2
// ─────────────────────────────────────────────────────────────────────────────
export const FEATURE_FLAGS = {
  // Master switch — habilita nova UI de Análise de Risco V2
  risk_analysis_v2: false,
  // Engine V5.2 (score, tiers, capabilities, matriz de decisão).
  // Quando true, novos casos usam calcularScoreV5_2 + resolverTier V5.2 + 5 segmentos novos.
  // Casos V4/V5.1 existentes continuam com seu framework_version original (imutável).
  score_engine_v5_2: false,
};

/**
 * Verifica se uma feature flag está ativa para o usuário atual.
 * Em produção, lê de localStorage (ou no futuro, de PublicSettings/UserPreferences).
 *
 * Uso:
 *   import { isFeatureEnabled } from '@/lib/v5_2/constants';
 *   if (isFeatureEnabled('risk_analysis_v2', user)) { ... }
 */
export function isFeatureEnabled(flag, user) {
  // 1) Override por localStorage (desenvolvimento + soft launch manual)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`feature_${flag}`);
      if (stored === 'true') return true;
      if (stored === 'false') return false;
    } catch {}
  }

  // 2) Override por role (admin sempre vê V2 quando habilitado globalmente)
  if (user?.role === 'admin' && FEATURE_FLAGS[flag] === true) return true;

  // 3) Default da feature flag
  return !!FEATURE_FLAGS[flag];
}