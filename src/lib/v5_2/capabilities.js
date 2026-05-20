// ─────────────────────────────────────────────────────────────────────
// V5.2 — Capabilities Transversais (4 canônicas)
// ─────────────────────────────────────────────────────────────────────
// DIFERENÇA vs V5.1:
//   - Nomes canônicos V5.2 (sem prefixo cap_ exceto financial_capacity_validation)
//   - 'splits/subseller' substitui 'cap_marketplace_kyc' (mais amplo: cobre MKT + GW)
//   - 'crossborder' substitui 'cap_crossborder_compliance'
//   - 'recurrence' é NOVA (obrigatória pra SaaS)
//   - 'cap_financial_capacity_validation' mantém nome (compatibilidade Patch V5.1)
// ─────────────────────────────────────────────────────────────────────

import { TIERS } from './tiers';

export const CAPABILITIES = {
  SPLITS_SUBSELLER: 'splits/subseller',
  CROSSBORDER: 'crossborder',
  RECURRENCE: 'recurrence',
  FINANCIAL_CAPACITY_VALIDATION: 'cap_financial_capacity_validation',
};

export const CAPABILITY_LABELS = {
  'splits/subseller': 'Splits / Sub-credenciamento',
  'crossborder': 'Operação Cross-border',
  'recurrence': 'Cobrança Recorrente',
  'cap_financial_capacity_validation': 'Validação de Capacidade Financeira',
};

export const CAPABILITY_BADGE_COLORS = {
  'splits/subseller': 'bg-purple-100 text-purple-700 border-purple-200',
  'crossborder': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'recurrence': 'bg-blue-100 text-blue-700 border-blue-200',
  'cap_financial_capacity_validation': 'bg-amber-100 text-amber-700 border-amber-200',
};

// Mapeamento canônico V5.2: segmento → capabilities obrigatórias
const OBRIGATORIA_POR_SEGMENTO = {
  marketplace: ['splits/subseller'],
  gateway: ['splits/subseller', 'cap_financial_capacity_validation'],
  saas: ['recurrence'],
  crossborder: ['crossborder', 'cap_financial_capacity_validation'],
  dropshipping: ['cap_financial_capacity_validation', 'crossborder'], // crossborder forçada
  educacao: ['recurrence'],
  turismo: ['cap_financial_capacity_validation'],
  eventos: ['cap_financial_capacity_validation'],
};

// Segmentos que forçam cap_financial_capacity_validation mesmo em Tier 1
const SEGMENTOS_FORCAM_PATCH_FINANCEIRO = ['gateway', 'marketplace', 'dropshipping', 'crossborder'];

/**
 * Resolve quais capabilities V5.2 estão ativas para o caso.
 *
 * @param {Object} input
 * @param {string} input.tier
 * @param {string} input.segmento
 * @param {boolean} input.isSubseller
 * @param {boolean} [input.declaraCobrancaRecorrente] - flag do questionário
 * @param {boolean} [input.declaraOperacaoInternacional] - flag do questionário
 * @returns {string[]} capabilities ativas
 */
export function resolverCapabilities({
  tier,
  segmento,
  isSubseller,
  declaraCobrancaRecorrente = false,
  declaraOperacaoInternacional = false,
}) {
  const ativas = new Set();

  // 1) Capabilities obrigatórias por segmento
  const obrigatorias = OBRIGATORIA_POR_SEGMENTO[segmento] || [];
  obrigatorias.forEach((cap) => ativas.add(cap));

  // 2) cap_financial_capacity_validation: Tier 2+ universal, Tier 1 forçada em segmentos críticos
  if (tier === TIERS.TIER_2 || tier === TIERS.TIER_3) {
    ativas.add(CAPABILITIES.FINANCIAL_CAPACITY_VALIDATION);
  } else if (tier === TIERS.TIER_1 && SEGMENTOS_FORCAM_PATCH_FINANCEIRO.includes(segmento)) {
    ativas.add(CAPABILITIES.FINANCIAL_CAPACITY_VALIDATION);
  }

  // 3) Gatilhos declarativos (do questionário)
  if (declaraCobrancaRecorrente) ativas.add(CAPABILITIES.RECURRENCE);
  if (declaraOperacaoInternacional) ativas.add(CAPABILITIES.CROSSBORDER);

  // 4) Subseller: PJ usa splits/subseller (KYB do seller mestre + PF do subseller)
  if (isSubseller) {
    ativas.add(CAPABILITIES.SPLITS_SUBSELLER);
  }

  return Array.from(ativas);
}