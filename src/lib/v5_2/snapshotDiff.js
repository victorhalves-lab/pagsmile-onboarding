/**
 * [V5.2 Fase 6.5.6] Engine de diff entre 2 snapshots V5.2.
 *
 * Comparação determinística que extrai apenas as mudanças relevantes para
 * o analista — ignora ordem de arrays e diferenças cosméticas.
 *
 * Retorna um objeto estruturado com:
 *   - changes: lista plana de mudanças campo por campo
 *   - summary: contadores por categoria (score / blocks / config / decision)
 */

const TRACKED_PATHS = [
  // Score & camadas
  { path: 'output_score_camadas.score_final', label: 'Score final V5.2', cat: 'score' },
  { path: 'output_score_camadas.camada_1_segmento', label: 'Camada 1 — Segmento+Tier', cat: 'score' },
  { path: 'output_score_camadas.camada_2_morfologia', label: 'Camada 2 — Morfologia', cat: 'score' },
  { path: 'output_score_camadas.camada_3_variaveis', label: 'Camada 3 — Variáveis', cat: 'score' },
  { path: 'output_score_camadas.camada_4_capabilities', label: 'Camada 4 — Capabilities', cat: 'score' },
  { path: 'output_score_camadas.camada_5_patch', label: 'Camada 5 — Patch Financeiro', cat: 'score' },

  // Decisão
  { path: 'output_categoria_decisao', label: 'Categoria de decisão', cat: 'decision' },
  { path: 'output_subfaixa_tier_aware', label: 'Subfaixa tier-aware', cat: 'decision' },
  { path: 'output_sentinel_parecer', label: 'Parecer SENTINEL', cat: 'decision', long: true },

  // Patch Financeiro
  { path: 'output_patch_financeiro.status', label: 'Patch Financeiro — status', cat: 'patch' },

  // Classificação
  { path: 'tier', label: 'Tier', cat: 'config' },
  { path: 'segmento', label: 'Segmento', cat: 'config' },
  { path: 'morfologia', label: 'Morfologia', cat: 'config' },
];

const ARRAY_PATHS = [
  { path: 'output_bloqueios_ativos', label: 'Bloqueios ativos', cat: 'blocks' },
  { path: 'capabilities_ativas', label: 'Capabilities ativas', cat: 'config' },
  { path: 'datasets_obtidos', label: 'Datasets obtidos', cat: 'datasets' },
  { path: 'datasets_faltantes', label: 'Datasets faltantes', cat: 'datasets' },
];

function getPath(obj, path) {
  if (!obj) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function isEqual(a, b) {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a === 'object') {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}

function arrayDiff(prev = [], next = []) {
  const prevSet = new Set(prev);
  const nextSet = new Set(next);
  const added = next.filter((x) => !prevSet.has(x));
  const removed = prev.filter((x) => !nextSet.has(x));
  return { added, removed, unchanged: prev.filter((x) => nextSet.has(x)) };
}

/**
 * Compara 2 snapshots V5.2 e retorna o diff estruturado.
 * @param {object} prevSnapshot - snapshot anterior (pode ser null = primeiro)
 * @param {object} nextSnapshot - snapshot novo
 */
export function diffSnapshots(prevSnapshot, nextSnapshot) {
  const changes = [];
  const summary = { score: 0, decision: 0, blocks: 0, config: 0, patch: 0, datasets: 0 };

  if (!nextSnapshot) {
    return { changes, summary, isInitial: true };
  }

  // Caso inicial — sem comparação, só retorna o estado base
  if (!prevSnapshot) {
    return { changes, summary, isInitial: true };
  }

  // Campos escalares
  TRACKED_PATHS.forEach(({ path, label, cat, long }) => {
    const prev = getPath(prevSnapshot, path);
    const next = getPath(nextSnapshot, path);
    if (!isEqual(prev, next)) {
      changes.push({
        type: 'scalar',
        path,
        label,
        cat,
        long,
        prev,
        next,
      });
      summary[cat] = (summary[cat] || 0) + 1;
    }
  });

  // Arrays (diff por elementos)
  ARRAY_PATHS.forEach(({ path, label, cat }) => {
    const prev = getPath(prevSnapshot, path) || [];
    const next = getPath(nextSnapshot, path) || [];
    const { added, removed } = arrayDiff(prev, next);
    if (added.length > 0 || removed.length > 0) {
      changes.push({
        type: 'array',
        path,
        label,
        cat,
        added,
        removed,
      });
      summary[cat] = (summary[cat] || 0) + 1;
    }
  });

  // Exceções (novas só aparecem em snapshots posteriores)
  const prevExc = (prevSnapshot.excecoes_aplicadas || []).map((e) => e.codigo_excecao || e.codigo).filter(Boolean);
  const nextExc = (nextSnapshot.excecoes_aplicadas || []).map((e) => e.codigo_excecao || e.codigo).filter(Boolean);
  const { added: addedExc } = arrayDiff(prevExc, nextExc);
  if (addedExc.length > 0) {
    changes.push({
      type: 'array',
      path: 'excecoes_aplicadas',
      label: 'Exceções aplicadas',
      cat: 'config',
      added: addedExc,
      removed: [],
    });
    summary.config = (summary.config || 0) + 1;
  }

  return { changes, summary, isInitial: false };
}

/**
 * Mapeia tipo de snapshot para label legível + ícone.
 */
export const SNAPSHOT_TYPE_META = {
  initial_analysis: { label: 'Análise Inicial', icon: 'Rocket', color: '#2bc196' },
  revalidation: { label: 'Revalidação', icon: 'RefreshCw', color: '#0ea5e9' },
  exception_applied: { label: 'Exceção Aplicada', icon: 'ShieldCheck', color: '#f59e0b' },
  manual_decision: { label: 'Decisão Manual', icon: 'Gavel', color: '#8b5cf6' },
  reprocess_from_v4: { label: 'Reprocessado de V4', icon: 'GitCompare', color: '#6366f1' },
  plano_monitoramento_aplicado: { label: 'Plano Cat 5 Aplicado', icon: 'AlertTriangle', color: '#ef4444' },
};

export const CHANGE_CATEGORY_META = {
  score: { label: 'Score', color: '#2bc196' },
  decision: { label: 'Decisão', color: '#0ea5e9' },
  blocks: { label: 'Bloqueios', color: '#ef4444' },
  config: { label: 'Configuração', color: '#8b5cf6' },
  patch: { label: 'Patch Financeiro', color: '#f59e0b' },
  datasets: { label: 'Datasets', color: '#64748b' },
};