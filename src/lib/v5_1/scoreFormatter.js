// ─────────────────────────────────────────────────────────────────────
// V5.1 — Score Formatter (helper centralizado)
// ─────────────────────────────────────────────────────────────────────
// Resolve "qual score exibir e em que escala" baseado no DNA do caso.
// Casos V4 → riskScoreV4 / score_final (0-849)
// Casos V5.1 → risk_score_v5_1 / score_v5_1_final (escala tier-aware)
// ─────────────────────────────────────────────────────────────────────

import { isV5_1 } from './frameworkConstants';
import { TIERS } from './tiers';

// Escalas máximas por tier em V5.1
const V5_1_MAX_SCORE = {
  [TIERS.TIER_1]: 499,
  [TIERS.TIER_2]: 849,
  [TIERS.TIER_3]: 849,
  [TIERS.SUBSELLER_PJ]: 999,
  [TIERS.SUBSELLER_PF]: 999,
};

const V4_MAX_SCORE = 849;

/**
 * Retorna metadados do score apropriado para exibição.
 * Output: { value, max, label, framework }
 */
export function getScoreForDisplay({ onboardingCase, complianceScore }) {
  if (isV5_1(onboardingCase) || isV5_1(complianceScore)) {
    const tier = onboardingCase?.tier || complianceScore?.tier_v5_1;
    return {
      value: complianceScore?.score_v5_1_final ?? onboardingCase?.risk_score_v5_1 ?? null,
      max: V5_1_MAX_SCORE[tier] || 849,
      label: 'Score V5.1',
      framework: 'v5.1',
    };
  }
  // Default V4
  return {
    value: complianceScore?.score_final ?? onboardingCase?.riskScoreV4 ?? null,
    max: V4_MAX_SCORE,
    label: 'Score V4',
    framework: 'v4.0',
  };
}

/**
 * Retorna a subfaixa apropriada (V4 simples ou V5.1 tier-aware) para exibição.
 */
export function getSubfaixaForDisplay({ onboardingCase, complianceScore }) {
  if (isV5_1(onboardingCase) || isV5_1(complianceScore)) {
    return {
      value: complianceScore?.subfaixa_tier_aware ?? onboardingCase?.subfaixa_tier_aware ?? null,
      framework: 'v5.1',
    };
  }
  return {
    value: complianceScore?.subfaixa ?? onboardingCase?.subfaixa ?? null,
    framework: 'v4.0',
  };
}