/**
 * [V5.2 Fase 6.5.6] Catálogo canônico das categorias de feedback estruturado
 * do SENTINEL (DOC4 Cap. 19.8 + DOC6 §2.6.6 + Q55).
 *
 * Espelha o enum `feedback_categories` da entidade SentinelFeedback.
 * Agrupado por tipo de feedback para guiar o analista no preenchimento.
 *
 * NUNCA edite os `code` — eles batem 1:1 com o enum do schema. Adicione
 * novos sempre como item adicional, e atualize o schema da entidade junto.
 */

export const FEEDBACK_CATEGORIES = [
  // ── Categorias de ERRO (quando feedback_type='errou' ou 'parcialmente') ──
  {
    code: 'missed_red_flag',
    label: 'Deixou de detectar red flag',
    description: 'O SENTINEL não levantou um red flag que era óbvio nos dados.',
    severity: 'high',
    appliesTo: ['errou', 'parcialmente'],
  },
  {
    code: 'false_positive',
    label: 'Falso positivo',
    description: 'Levantou red flag/bloqueio que não procedia.',
    severity: 'high',
    appliesTo: ['errou', 'parcialmente'],
  },
  {
    code: 'wrong_severity_up',
    label: 'Severidade superdimensionada',
    description: 'Classificou alerta como mais grave do que realmente era.',
    severity: 'medium',
    appliesTo: ['errou', 'parcialmente'],
  },
  {
    code: 'wrong_severity_down',
    label: 'Severidade subdimensionada',
    description: 'Subestimou a gravidade de um alerta real.',
    severity: 'medium',
    appliesTo: ['errou', 'parcialmente'],
  },
  {
    code: 'missed_positive',
    label: 'Ignorou ponto positivo relevante',
    description: 'Não destacou aspecto positivo que mudaria a decisão.',
    severity: 'low',
    appliesTo: ['errou', 'parcialmente'],
  },
  {
    code: 'wrong_regulatory_basis',
    label: 'Fundamentação regulatória incorreta',
    description: 'Citou norma/artigo errado ou inaplicável ao caso.',
    severity: 'high',
    appliesTo: ['errou', 'parcialmente'],
  },
  {
    code: 'wrong_suggested_action',
    label: 'Ação sugerida inadequada',
    description: 'Recomendou condição/documento que não resolve o problema.',
    severity: 'medium',
    appliesTo: ['errou', 'parcialmente'],
  },

  // ── Categorias positivas (acertou) ──
  {
    code: 'good_overall',
    label: 'Análise bem fundamentada',
    description: 'Recomendação coerente, fundamentação clara, sem ressalvas.',
    severity: 'positive',
    appliesTo: ['acertou'],
  },

  // ── Catch-all ──
  {
    code: 'outro',
    label: 'Outro (especificar no comentário)',
    description: 'Caso não se encaixe em nenhuma categoria acima.',
    severity: 'neutral',
    appliesTo: ['acertou', 'errou', 'parcialmente'],
  },
];

/**
 * Filtra categorias aplicáveis ao tipo de feedback selecionado.
 */
export function getCategoriesForFeedbackType(feedbackType) {
  if (!feedbackType) return [];
  return FEEDBACK_CATEGORIES.filter(c => c.appliesTo.includes(feedbackType));
}

/**
 * Tipos de feedback canônicos (DOC6 §2.6.6 — 3 botões).
 */
export const FEEDBACK_TYPES = [
  {
    code: 'acertou',
    label: 'Acertou',
    emoji: '👍',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    activeBg: 'bg-green-100',
    description: 'A recomendação do SENTINEL bate com sua decisão final.',
  },
  {
    code: 'parcialmente',
    label: 'Parcialmente correto',
    emoji: '🤔',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    activeBg: 'bg-yellow-100',
    description: 'Direção certa, mas algum detalhe (severidade, ação, base regulatória) precisa ajuste.',
  },
  {
    code: 'errou',
    label: 'Errou',
    emoji: '👎',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    activeBg: 'bg-red-100',
    description: 'Sua decisão final divergiu da recomendação do SENTINEL.',
  },
];