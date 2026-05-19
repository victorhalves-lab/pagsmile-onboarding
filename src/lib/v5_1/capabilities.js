// ─────────────────────────────────────────────────────────────────────
// V5.1 — Capabilities Transversais
// ─────────────────────────────────────────────────────────────────────

import { isSegmentoCritico, SEGMENTOS_V5_1 } from './segmentos';
import { TIERS } from './tiers';
import { MORFOLOGIAS } from './morfologias';

export const CAPABILITIES = {
  FINANCIAL_CAPACITY_VALIDATION: 'cap_financial_capacity_validation',
  MARKETPLACE_KYC: 'cap_marketplace_kyc',
  CROSSBORDER_COMPLIANCE: 'cap_crossborder_compliance',
  SUBSELLER_KYB: 'cap_subseller_kyb',
};

export const CAPABILITY_LABELS = {
  cap_financial_capacity_validation: 'Validação de Capacidade Financeira',
  cap_marketplace_kyc: 'KYC de Marketplace',
  cap_crossborder_compliance: 'Compliance Cross-Border',
  cap_subseller_kyb: 'KYB de Subseller',
};

export const CAPABILITY_BADGE_COLORS = {
  cap_financial_capacity_validation: 'bg-amber-100 text-amber-700 border-amber-200',
  cap_marketplace_kyc: 'bg-purple-100 text-purple-700 border-purple-200',
  cap_crossborder_compliance: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  cap_subseller_kyb: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

/**
 * Resolve quais capabilities V5.1 estão ativas para o caso.
 * Stub inicial — será expandido na Fase 2.
 */
export function resolverCapabilities({ tier, segmento, morfologia, isSubseller }) {
  const ativas = new Set();

  // cap_financial_capacity_validation
  // - Padrão em Tier 2 e Tier 3
  // - FORÇADA em Tier 1 se segmento crítico (gateway/marketplace/dropshipping)
  if (tier === TIERS.TIER_2 || tier === TIERS.TIER_3) {
    ativas.add(CAPABILITIES.FINANCIAL_CAPACITY_VALIDATION);
  } else if (tier === TIERS.TIER_1 && isSegmentoCritico(segmento)) {
    ativas.add(CAPABILITIES.FINANCIAL_CAPACITY_VALIDATION);
  }

  // cap_marketplace_kyc — sempre que segmento = marketplace
  if (segmento === SEGMENTOS_V5_1.MARKETPLACE) {
    ativas.add(CAPABILITIES.MARKETPLACE_KYC);
  }

  // cap_crossborder_compliance — sempre que morfologia crossborder
  if (morfologia === MORFOLOGIAS.B2C_CROSSBORDER || morfologia === MORFOLOGIAS.B2B_CROSSBORDER) {
    ativas.add(CAPABILITIES.CROSSBORDER_COMPLIANCE);
  }

  // cap_subseller_kyb — sempre que isSubseller
  if (isSubseller) {
    ativas.add(CAPABILITIES.SUBSELLER_KYB);
  }

  return Array.from(ativas);
}