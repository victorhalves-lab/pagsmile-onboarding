// ─────────────────────────────────────────────────────────────────────
// V5.1 — Tiers
// ─────────────────────────────────────────────────────────────────────

export const TIERS = {
  TIER_1: 'tier_1',
  TIER_2: 'tier_2',
  TIER_3: 'tier_3',
  SUBSELLER_PJ: 'subseller_pj',
  SUBSELLER_PF: 'subseller_pf',
};

export const TIER_LABELS = {
  tier_1: 'Tier 1 (≤R$50k/mês)',
  tier_2: 'Tier 2 (R$50k-500k/mês)',
  tier_3: 'Tier 3 (>R$500k/mês)',
  subseller_pj: 'Subseller PJ',
  subseller_pf: 'Subseller PF',
};

export const TIER_BADGE_COLORS = {
  tier_1: 'bg-sky-100 text-sky-700 border-sky-200',
  tier_2: 'bg-amber-100 text-amber-700 border-amber-200',
  tier_3: 'bg-purple-100 text-purple-700 border-purple-200',
  subseller_pj: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  subseller_pf: 'bg-pink-100 text-pink-700 border-pink-200',
};

// Limiares de TPV mensal declarado para resolução de tier
export const TPV_TIER_THRESHOLDS = {
  TIER_1_MAX: 50_000,
  TIER_2_MAX: 500_000,
};

/**
 * Resolve o tier baseado em TPV mensal declarado + segmento.
 * REGRA: Marketplace é SEMPRE Tier 2 fixo (Decisão 2 do roadmap V5.1).
 */
export function resolverTier({ tpvMensalDeclarado, segmento, isSubseller, merchantType }) {
  if (isSubseller) {
    return merchantType === 'PF' ? TIERS.SUBSELLER_PF : TIERS.SUBSELLER_PJ;
  }
  // Marketplace fixo em Tier 2
  if (segmento === 'marketplace') {
    return TIERS.TIER_2;
  }
  const tpv = Number(tpvMensalDeclarado) || 0;
  if (tpv <= TPV_TIER_THRESHOLDS.TIER_1_MAX) return TIERS.TIER_1;
  if (tpv <= TPV_TIER_THRESHOLDS.TIER_2_MAX) return TIERS.TIER_2;
  return TIERS.TIER_3;
}