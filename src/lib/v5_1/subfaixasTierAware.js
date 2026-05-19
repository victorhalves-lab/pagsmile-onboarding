// ─────────────────────────────────────────────────────────────────────
// V5.1 — Subfaixas Tier-Aware
// ─────────────────────────────────────────────────────────────────────
// Formato: <letra><sufixo-tier>  → exemplos: 1A-T1, 2A-T2, 3B-T3, 1A-SubPJ, 2B-SubPF
// ─────────────────────────────────────────────────────────────────────

import { TIERS } from './tiers';

const TIER_SUFFIX = {
  [TIERS.TIER_1]: 'T1',
  [TIERS.TIER_2]: 'T2',
  [TIERS.TIER_3]: 'T3',
  [TIERS.SUBSELLER_PJ]: 'SubPJ',
  [TIERS.SUBSELLER_PF]: 'SubPF',
};

const BASE_SUBFAIXAS = ['1A','1B','2A','2B','3A','3B','4','5'];

// Cores reutilizadas das subfaixas V4 (1A verde escuro → 5 vermelho profundo),
// com leve variação por tier no foreground para diferenciar visualmente.
const SUBFAIXA_BASE_COLOR = {
  '1A': 'green-700',
  '1B': 'green-600',
  '2A': 'blue-700',
  '2B': 'blue-600',
  '3A': 'yellow-700',
  '3B': 'orange-700',
  '4':  'red-600',
  '5':  'red-800',
};

/**
 * Formata subfaixa tier-aware (ex: "2A-T2")
 */
export function formatSubfaixaTierAware(subfaixaBase, tier) {
  const suffix = TIER_SUFFIX[tier];
  if (!subfaixaBase || !suffix) return subfaixaBase || '-';
  return `${subfaixaBase}-${suffix}`;
}

/**
 * Parse "2A-T2" → { base: '2A', tier: 'tier_2' }
 */
export function parseSubfaixaTierAware(subfaixaTierAware) {
  if (!subfaixaTierAware) return { base: null, tier: null };
  const [base, suffix] = subfaixaTierAware.split('-');
  const tier = Object.keys(TIER_SUFFIX).find(t => TIER_SUFFIX[t] === suffix) || null;
  return { base, tier };
}

/**
 * Cor textual da subfaixa tier-aware.
 */
export function getSubfaixaTierAwareColor(subfaixaTierAware) {
  const { base } = parseSubfaixaTierAware(subfaixaTierAware);
  return `text-${SUBFAIXA_BASE_COLOR[base] || 'slate-600'}`;
}

/**
 * Classes Tailwind completas (bg + text + border) para badge.
 */
export function getSubfaixaTierAwareBadgeClasses(subfaixaTierAware) {
  const { base } = parseSubfaixaTierAware(subfaixaTierAware);
  const map = {
    '1A': 'bg-green-100 text-green-700 border-green-200',
    '1B': 'bg-green-100 text-green-700 border-green-200',
    '2A': 'bg-blue-100 text-blue-700 border-blue-200',
    '2B': 'bg-blue-100 text-blue-700 border-blue-200',
    '3A': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    '3B': 'bg-orange-100 text-orange-700 border-orange-200',
    '4':  'bg-red-100 text-red-700 border-red-200',
    '5':  'bg-red-200 text-red-800 border-red-300',
  };
  return map[base] || 'bg-slate-100 text-slate-600 border-slate-200';
}

export { BASE_SUBFAIXAS, TIER_SUFFIX };