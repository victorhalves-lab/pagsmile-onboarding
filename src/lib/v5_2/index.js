// ─────────────────────────────────────────────────────────────────────
// V5.2 — Barrel export (single import surface)
// ─────────────────────────────────────────────────────────────────────
// Uso preferencial em código novo:
//   import { calcularScoreV5_2, resolverTier, resolverCapabilities, CATEGORIAS_DECISAO_V5_2 } from '@/lib/v5_2';
//
// V5.1 (lib/v5_1/*) permanece intacto e em produção até o flip
// de feature flag `score_engine_v5_2`. Não deletar.
// ─────────────────────────────────────────────────────────────────────

export * from './constants';
export * from './tiers';
export * from './capabilities';
export * from './matrizDecisao';
export * from './scoringV5_2';
export * from './deveConsultarDataset';
export * from './segments';
export * from './triggersTier';
export * from './avaliarBloqueios';
export * from './crossValidation16';
export * from './tieringEngine';
export * from './microcopy';