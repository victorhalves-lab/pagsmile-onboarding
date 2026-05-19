// ─────────────────────────────────────────────────────────────────────
// V5.1 — Framework Constants
// ─────────────────────────────────────────────────────────────────────
// REGRA SUPREMA: helpers defensivos. Qualquer caso SEM framework_version
// explícito é tratado como V4 (legado). Quem nasceu V4 morre V4.
// ─────────────────────────────────────────────────────────────────────

export const FRAMEWORK_V4 = 'v4.0';
export const FRAMEWORK_V5_1 = 'v5.1';
export const DEFAULT_FRAMEWORK = FRAMEWORK_V4;

/**
 * Retorna a versão do framework de um OnboardingCase ou ComplianceScore.
 * Default = v4.0 (segurança: caso sem campo é tratado como legado).
 */
export function getFrameworkVersion(entity) {
  return entity?.framework_version || DEFAULT_FRAMEWORK;
}

/**
 * True se o caso/score é V5.1. False para V4 ou indefinido.
 */
export function isV5_1(entity) {
  return getFrameworkVersion(entity) === FRAMEWORK_V5_1;
}

/**
 * True se o caso/score é V4 (legado) OU se framework_version está ausente.
 * Use isto como gate defensivo em renderização.
 */
export function isV4(entity) {
  return getFrameworkVersion(entity) === FRAMEWORK_V4;
}

/**
 * Badge legível da versão (para UI).
 */
export function getFrameworkBadge(entity) {
  const v = getFrameworkVersion(entity);
  if (v === FRAMEWORK_V5_1) {
    return { label: 'V5.1', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  }
  return { label: 'V4', color: 'bg-slate-100 text-slate-600 border-slate-200' };
}