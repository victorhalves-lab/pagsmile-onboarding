/**
 * Utility to handle taxaFinalOverrides in both legacy and new per-prazo formats.
 * 
 * Legacy format (flat): { "1": 2.50, "5": 3.00 }
 * New format (per-prazo): { "D+1": { "1": 2.50 }, "D+7": { "1": 2.80 } }
 * 
 * Detection: if any key starts with "D+" it's new format, otherwise legacy.
 */

const AVAILABLE_PRAZOS = ['D+1', 'D+2', 'D+7', 'D+15', 'D+30', 'FLUXO'];

function isNewFormat(overrides) {
  if (!overrides || typeof overrides !== 'object') return false;
  return Object.keys(overrides).some(k => k.startsWith('D+') || k === 'FLUXO');
}

/**
 * Normalize overrides to always return the new per-prazo format.
 * If legacy flat format is detected, wraps it under the given defaultPrazo.
 */
function normalizeOverrides(overrides, defaultPrazo = 'D+1') {
  if (!overrides || typeof overrides !== 'object') return {};
  if (isNewFormat(overrides)) return overrides;
  // Legacy flat format — check if there are any numeric keys
  const hasNumericKeys = Object.keys(overrides).some(k => !isNaN(Number(k)));
  if (!hasNumericKeys) return {};
  return { [defaultPrazo]: { ...overrides } };
}

/**
 * Get overrides for a specific prazo from the (possibly legacy) overrides object.
 */
function getOverridesForPrazo(overrides, prazo) {
  if (!overrides || typeof overrides !== 'object') return {};
  if (isNewFormat(overrides)) return overrides[prazo] || {};
  // Legacy: return as-is (flat applies to all prazos)
  return { ...overrides };
}

/**
 * Get all prazos that have overrides defined.
 */
function getDefinedPrazos(overrides) {
  if (!overrides || typeof overrides !== 'object') return [];
  if (isNewFormat(overrides)) {
    return Object.keys(overrides).filter(k => {
      const inner = overrides[k];
      return inner && typeof inner === 'object' && Object.keys(inner).length > 0;
    });
  }
  // Legacy: has overrides but no prazo distinction
  const hasAny = Object.keys(overrides).some(k => overrides[k] != null);
  return hasAny ? ['(todos)'] : [];
}

export { AVAILABLE_PRAZOS, isNewFormat, normalizeOverrides, getOverridesForPrazo, getDefinedPrazos };