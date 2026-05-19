// ─────────────────────────────────────────────────────────────────────
// V5.1 — Matriz Canônica de Decisão
// ─────────────────────────────────────────────────────────────────────
// 5 categorias de decisão V5.1. Substitui o sistema V4 de 4 decisões.
// CAT 5 (Intensive Monitoring) é tratada externamente pelo cliente
// (Decisão 3 do roadmap: "monitoramento é com a gente em outro sistema").
// ─────────────────────────────────────────────────────────────────────

export const CATEGORIAS_DECISAO_V5_1 = {
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
 * Mapeia categoria V5.1 → status legacy do OnboardingCase (mantém compatibilidade
 * com fluxo atual de Pendências e ações do analista).
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
 * Mapeia categoria V5.1 → recomendacao_final do ComplianceScore.
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