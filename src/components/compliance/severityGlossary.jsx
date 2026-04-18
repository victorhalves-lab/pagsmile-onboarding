/**
 * Central glossary for compliance severities — used across findings, red flags and alerts.
 * Keep wording business-friendly and consistent everywhere.
 */

export const SEVERITY_META = {
  BLOQUEANTE: {
    label: 'Bloqueante',
    short: 'BLOQ',
    color: 'bg-red-700',
    bg: 'bg-red-50',
    bgSoft: 'bg-red-50/50',
    border: 'border-red-300',
    text: 'text-red-800',
    textSoft: 'text-red-700',
    ring: 'ring-red-200',
    badge: 'bg-red-700 text-white border-red-800',
    order: 0,
    icon: '🛑',
    explanation:
      'Condição absoluta que impede a aprovação automática. Score é forçado para 850+ e o caso é bloqueado/recusado independentemente do restante da análise. Exemplos: presença em listas de sanções OFAC/OFIU, lista suja MTE, PEP em sócio sem justificativa.',
    actionForAnalyst:
      'Revisar manualmente antes de qualquer aprovação. Bloqueios só devem ser removidos após validação explícita da área de compliance/PLD.',
  },
  CRITICAL: {
    label: 'Crítico',
    short: 'CRIT',
    color: 'bg-red-500',
    bg: 'bg-red-50',
    bgSoft: 'bg-red-50/40',
    border: 'border-red-200',
    text: 'text-red-700',
    textSoft: 'text-red-600',
    ring: 'ring-red-100',
    badge: 'bg-red-100 text-red-700 border-red-200',
    order: 1,
    icon: '🔴',
    explanation:
      'Achado grave que normalmente escala o caso para revisão manual. Sozinho não bloqueia, mas acumula pontos significativos no score. Exemplos: processos judiciais relevantes recentes, dívida ativa expressiva, inconsistência cadastral severa.',
    actionForAnalyst:
      'Investigar evidências antes de decidir. Se houver 2+ findings CRÍTICOS, considerar condições reforçadas ou recusa.',
  },
  HIGH: {
    label: 'Alto',
    short: 'ALTO',
    color: 'bg-orange-500',
    bg: 'bg-orange-50',
    bgSoft: 'bg-orange-50/40',
    border: 'border-orange-200',
    text: 'text-orange-700',
    textSoft: 'text-orange-600',
    ring: 'ring-orange-100',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    order: 2,
    icon: '🟠',
    explanation:
      'Ponto de atenção relevante que precisa ser considerado, mas não é suficiente para recusar o caso isoladamente. Impacta o score e pode ativar condições comerciais (rolling reserve, monitoramento reforçado).',
    actionForAnalyst:
      'Leia as evidências e confirme se o questionário cobre o ponto. Normalmente se resolve com documentação adicional.',
  },
  MEDIUM: {
    label: 'Médio',
    short: 'MED',
    color: 'bg-amber-400',
    bg: 'bg-amber-50',
    bgSoft: 'bg-amber-50/40',
    border: 'border-amber-200',
    text: 'text-amber-700',
    textSoft: 'text-amber-600',
    ring: 'ring-amber-100',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    order: 3,
    icon: '🟡',
    explanation:
      'Observação que merece atenção, mas com impacto moderado. Entra no score porém raramente muda a decisão sozinha. Útil para compor o quadro geral de risco.',
    actionForAnalyst:
      'Use como contexto. Se o caso já estiver em Revisão Manual, vale mencionar no parecer.',
  },
  LOW: {
    label: 'Baixo',
    short: 'BX',
    color: 'bg-blue-400',
    bg: 'bg-blue-50',
    bgSoft: 'bg-blue-50/40',
    border: 'border-blue-200',
    text: 'text-blue-700',
    textSoft: 'text-blue-600',
    ring: 'ring-blue-100',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    order: 4,
    icon: '🔵',
    explanation:
      'Finding informativo de baixo impacto. Incluído para completude e auditoria. Normalmente não afeta a decisão final.',
    actionForAnalyst: 'Leitura opcional. Útil apenas para auditoria ou pareceres detalhados.',
  },
  INFO: {
    label: 'Informativo',
    short: 'INFO',
    color: 'bg-slate-400',
    bg: 'bg-slate-50',
    bgSoft: 'bg-slate-50/60',
    border: 'border-slate-200',
    text: 'text-slate-700',
    textSoft: 'text-slate-600',
    ring: 'ring-slate-100',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    order: 5,
    icon: '⚪',
    explanation:
      'Apenas contexto. Dado neutro ou positivo mencionado pela IA para enriquecer o parecer. Não representa risco.',
    actionForAnalyst: 'Ignorar na decisão — usar só se quiser compor o relatório.',
  },
};

// Aliases (the DB uses mixed casing — map everything to the canonical key)
const ALIASES = {
  bloqueante: 'BLOQUEANTE',
  bloqueio: 'BLOQUEANTE',
  critico: 'CRITICAL',
  crítico: 'CRITICAL',
  critical: 'CRITICAL',
  alto: 'HIGH',
  high: 'HIGH',
  medio: 'MEDIUM',
  médio: 'MEDIUM',
  medium: 'MEDIUM',
  baixo: 'LOW',
  low: 'LOW',
  info: 'INFO',
  informativo: 'INFO',
};

export function normaliseSeverity(key) {
  if (!key) return 'INFO';
  const k = String(key).trim();
  if (SEVERITY_META[k]) return k;
  const lower = k.toLowerCase();
  return ALIASES[lower] || SEVERITY_META[k.toUpperCase()] ? k.toUpperCase() : 'INFO';
}

export function getSeverityMeta(key) {
  const normalised = normaliseSeverity(key);
  return SEVERITY_META[normalised] || SEVERITY_META.INFO;
}