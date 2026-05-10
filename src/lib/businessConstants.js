/**
 * businessConstants.js
 *
 * Constantes de negócio centralizadas. Use estas constantes ao invés de
 * hardcodar números mágicos em componentes/páginas.
 *
 * Mudanças aqui afetam toda a aplicação — alterar com cuidado.
 */

// Taxa MDR fallback usada quando uma proposta não tem rates definidos
// (ex: estimativa de receita de pipeline ainda não fechado).
export const FALLBACK_MDR_RATE = 0.025;

// Lead sem interação por mais de N dias é considerado "stale" (parado).
export const STALE_LEAD_DAYS = 7;

// Proposta enviada/visualizada que vence em menos de N dias entra em "expiring".
export const PROPOSAL_EXPIRING_DAYS = 3;

// TPV mensal mínimo aceito em formulários públicos (validação server-side).
export const MIN_TPV_MENSAL = 50000;