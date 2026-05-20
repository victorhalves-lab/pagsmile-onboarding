// ─────────────────────────────────────────────────────────────────────
// V5.2 — Avaliação de bloqueios via catálogo dinâmico
// ─────────────────────────────────────────────────────────────────────
// Substitui a tabela hardcoded BLOCK_EXPLANATIONS do V4. Em V5.2 cada
// Bloqueio (entidade) carrega: trigger_logic (pseudo-código), variáveis
// alimentadoras, tiers/segmentos/morfologias aplicáveis, severidade.
//
// FUNÇÃO PURA: recebe catálogo + contexto, retorna lista de bloqueios disparados.
// Não faz I/O. Quem busca o catálogo é o pipeline (functions/).
// ─────────────────────────────────────────────────────────────────────

/**
 * Verifica se o bloqueio é aplicável ao contexto (tier/segmento/morfologia/capabilities).
 */
function bloqueioAplicavel(bloqueio, ctx) {
  if (!bloqueio.ativo) return false;

  // tiers_aplicaveis vazio = todos
  if (bloqueio.tiers_aplicaveis?.length > 0 && !bloqueio.tiers_aplicaveis.includes(ctx.tier)) {
    return false;
  }

  // segmentos_aplicaveis ['all'] ou vazio = todos
  const segs = bloqueio.segmentos_aplicaveis || [];
  if (segs.length > 0 && !segs.includes('all') && !segs.includes(ctx.segmento)) {
    return false;
  }

  // morfologias_aplicaveis ['all'] ou vazio = todos
  const morfs = bloqueio.morfologias_aplicaveis || [];
  if (morfs.length > 0 && !morfs.includes('all') && !morfs.includes(ctx.morfologia)) {
    return false;
  }

  // capabilities_relacionadas: se bloqueio é vinculado a capability, capability deve estar ativa
  const caps = bloqueio.capabilities_relacionadas || [];
  if (caps.length > 0) {
    const algumaCapAtiva = caps.some((c) => (ctx.capabilities_ativas || []).includes(c));
    if (!algumaCapAtiva) return false;
  }

  return true;
}

/**
 * Avalia variáveis_alimentadoras: se TODAS estão presentes em variaveisInput,
 * verifica se algum valor é negativo (indicativo de problema na variável).
 *
 * NOTA: Esta é a regra simples V5.2 MVP. trigger_logic complexo é interpretado
 * em uma fase futura. Hoje cada bloqueio dispara quando:
 *   - há trigger_logic explicitamente true em ctx.bloqueios_forcados, OU
 *   - variáveis_alimentadoras contêm valor negativo, OU
 *   - dataset listado em datasets_consumidos retornou red_flag
 */
function avaliarTrigger(bloqueio, ctx) {
  // 1. Force list — pipeline pode explicitamente forçar disparo de um código
  if (ctx.bloqueios_forcados?.includes(bloqueio.codigo)) {
    return { disparou: true, razao: 'forçado pelo pipeline' };
  }

  // 2. Variáveis alimentadoras negativas
  const vars = bloqueio.variaveis_alimentadoras || [];
  for (const nomeVar of vars) {
    const v = ctx.variaveis_input?.[nomeVar];
    if (v == null) continue;
    const valor = typeof v === 'object' ? Number(v.valor) || 0 : Number(v) || 0;
    if (valor < 0) {
      return { disparou: true, razao: `variável ${nomeVar} negativa (${valor})` };
    }
  }

  // 3. Dataset red_flag explícito
  const datasets = bloqueio.datasets_consumidos || [];
  for (const ds of datasets) {
    if (ctx.datasets_red_flags?.includes(ds)) {
      return { disparou: true, razao: `dataset ${ds} sinalizou red flag` };
    }
  }

  return { disparou: false, razao: '' };
}

/**
 * Avalia todos os bloqueios do catálogo e retorna os disparados.
 *
 * @param {Array} catalogo - lista de Bloqueio (entidade)
 * @param {Object} ctx - contexto do caso
 * @param {string} ctx.tier
 * @param {string} ctx.segmento
 * @param {string} ctx.morfologia
 * @param {string[]} ctx.capabilities_ativas
 * @param {Object} ctx.variaveis_input
 * @param {string[]} ctx.datasets_red_flags - lista de códigos de Dataset que retornaram flag
 * @param {string[]} ctx.bloqueios_forcados - opcional: códigos forçados pelo pipeline
 * @returns {{
 *   bloqueios_ativos: string[],
 *   detalhes: Array<{ codigo, titulo, severidade, decisao_padrao, nucleo_duro_regulatorio, razao }>
 * }}
 */
export function avaliarBloqueios(catalogo = [], ctx = {}) {
  const detalhes = [];
  const ativos = [];

  for (const bloqueio of catalogo) {
    if (!bloqueioAplicavel(bloqueio, ctx)) continue;

    const { disparou, razao } = avaliarTrigger(bloqueio, ctx);
    if (!disparou) continue;

    ativos.push(bloqueio.codigo);
    detalhes.push({
      codigo: bloqueio.codigo,
      titulo: bloqueio.titulo,
      categoria: bloqueio.categoria,
      severidade: bloqueio.severidade,
      decisao_padrao: bloqueio.decisao_padrao,
      nucleo_duro_regulatorio: !!bloqueio.nucleo_duro_regulatorio,
      exception_categoria: bloqueio.exception_categoria || 'nenhuma',
      razao,
    });
  }

  return { bloqueios_ativos: ativos, detalhes };
}

/**
 * Decide a categoria final do caso considerando bloqueios + score.
 * REGRA: se algum bloqueio absoluto disparou → cat_4_block sempre.
 * Se algum bloqueio com decisao_padrao=monitoramento_intensivo → cat_5.
 */
export function aplicarBloqueiosNaCategoria(categoriaScore, detalhesBloqueios = []) {
  if (detalhesBloqueios.length === 0) return categoriaScore;

  // Núcleo duro regulatório SEMPRE bloqueia
  const temNucleoDuro = detalhesBloqueios.some((d) => d.nucleo_duro_regulatorio === true);
  if (temNucleoDuro) return 'cat_4_block';

  // Bloqueio com decisão monitoramento intensivo → Cat 5 (proposta)
  const temMonitoramento = detalhesBloqueios.some((d) => d.decisao_padrao === 'monitoramento_intensivo');
  if (temMonitoramento && categoriaScore !== 'cat_4_block') {
    return 'cat_5_intensive_monitoring';
  }

  // Bloqueio de severidade BLOQUEIO → cat_4
  const temBloqueio = detalhesBloqueios.some((d) => d.severidade === 'BLOQUEIO');
  if (temBloqueio) return 'cat_4_block';

  // Bloqueio de severidade ESCALACAO → cat_3
  const temEscalacao = detalhesBloqueios.some((d) => d.severidade === 'ESCALACAO');
  if (temEscalacao && categoriaScore === 'cat_1_auto_approve') return 'cat_3_manual_review';

  // Bloqueio de severidade CONDICAO → cat_2
  const temCondicao = detalhesBloqueios.some((d) => d.severidade === 'CONDICAO');
  if (temCondicao && categoriaScore === 'cat_1_auto_approve') return 'cat_2_conditional';

  return categoriaScore;
}