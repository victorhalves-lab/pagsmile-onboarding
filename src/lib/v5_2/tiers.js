// ─────────────────────────────────────────────────────────────────────
// V5.2 — Tiers (idêntico a V5.1 + decisões de negócio V5.2)
// ─────────────────────────────────────────────────────────────────────
// DIFERENÇA vs V5.1:
//   - Importa constantes canônicas de SEGMENTOS_TIER_3_ONLY (gateway, marketplace, crossborder)
//   - Marketplace permanece SEMPRE Tier 2 fixo (decisão imutável V5.2)
//   - Gateway e Crossborder são os ÚNICOS que escalam para Tier 3 livremente por TPV
// ─────────────────────────────────────────────────────────────────────

import { SEGMENTOS_TIER_3_ONLY } from './constants';

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

// Limiares de TPV mensal declarado
export const TPV_TIER_THRESHOLDS = {
  TIER_1_MAX: 50_000,
  TIER_2_MAX: 500_000,
};

/**
 * Resolve o tier baseado em TPV mensal declarado + segmento (V5.2).
 *
 * Regras V5.2:
 *   - Subseller → tier próprio (PJ/PF)
 *   - Marketplace → SEMPRE Tier 2 (fixed)
 *   - Gateway/Crossborder → podem subir a Tier 3 por TPV
 *   - Demais segmentos → cap Tier 2 (não escalam pra T3 só por TPV)
 *
 * NOTA: triggers adicionais (PEP, sanção, MCC alto risco, etc.) são aplicados
 * em pipeline downstream (resolverTierComTriggers — FASE 3).
 */
export function resolverTier({ tpvMensalDeclarado, segmento, isSubseller, merchantType }) {
  if (isSubseller) {
    return merchantType === 'PF' ? TIERS.SUBSELLER_PF : TIERS.SUBSELLER_PJ;
  }
  if (segmento === 'marketplace') {
    return TIERS.TIER_2;
  }
  const tpv = Number(tpvMensalDeclarado) || 0;
  if (tpv <= TPV_TIER_THRESHOLDS.TIER_1_MAX) return TIERS.TIER_1;
  if (tpv <= TPV_TIER_THRESHOLDS.TIER_2_MAX) return TIERS.TIER_2;
  // > R$500k: só gateway e crossborder sobem pra Tier 3
  if (SEGMENTOS_TIER_3_ONLY.includes(segmento)) return TIERS.TIER_3;
  return TIERS.TIER_2; // cap em Tier 2 para segmentos não-T3
}