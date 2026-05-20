// ─────────────────────────────────────────────────────────────────────
// V5.2 — Matriz Canônica de Decisão (5 categorias finais)
// ─────────────────────────────────────────────────────────────────────
// DIFERENÇA vs V5.1: Cat 5 (Intensive Monitoring) agora exige PlanoMonitoramento
// + TermoAdicionalV5_2 aceito pelo seller. Decisão se torna explícita no fluxo
// (não mais "tratada externamente").
// ─────────────────────────────────────────────────────────────────────

export const CATEGORIAS_DECISAO_V5_2 = {
  CAT_1_AUTO_APPROVE: 'cat_1_auto_approve',
  CAT_2_CONDITIONAL: 'cat_2_conditional',
  CAT_3_MANUAL_REVIEW: 'cat_3_manual_review',
  CAT_4_BLOCK: 'cat_4_block',
  CAT_5_INTENSIVE_MONITORING: 'cat_5_intensive_monitoring',
};

export const CATEGORIA_DECISAO_LABELS = {
  cat_1_auto_approve: 'Aprovação Automática',
  cat_2_conditional: 'Aprovação Condicional',
  cat_3_manual_review: 'Revisão Manual',
  cat_4_block: 'Bloqueio',
  cat_5_intensive_monitoring: 'Monitoramento Intensivo',
};

export const CATEGORIA_DECISAO_COLORS = {
  cat_1_auto_approve: 'bg-green-100 text-green-700 border-green-200',
  cat_2_conditional: 'bg-blue-100 text-blue-700 border-blue-200',
  cat_3_manual_review: 'bg-orange-100 text-orange-700 border-orange-200',
  cat_4_block: 'bg-red-100 text-red-700 border-red-200',
  cat_5_intensive_monitoring: 'bg-amber-100 text-amber-700 border-amber-200',
};

/**
 * Mapeia categoria V5.2 → status legacy do OnboardingCase.
 */
export function categoriaToStatusLegacy(categoria) {
  const map = {
    cat_1_auto_approve: 'Aprovado',
    cat_2_conditional: 'Aprovado',
    cat_3_manual_review: 'Manual',
    cat_4_block: 'Recusado',
    cat_5_intensive_monitoring: 'Aprovado',
  };
  return map[categoria] || 'Manual';
}

/**
 * Mapeia categoria V5.2 → recomendacao_final do ComplianceScore.
 */
export function categoriaToRecomendacaoFinal(categoria) {
  const map = {
    cat_1_auto_approve: 'Aprovado',
    cat_2_conditional: 'Aprovado com Condições',
    cat_3_manual_review: 'Revisão Manual',
    cat_4_block: 'Recusado',
    cat_5_intensive_monitoring: 'Aprovado com Condições',
  };
  return map[categoria] || 'Revisão Manual';
}