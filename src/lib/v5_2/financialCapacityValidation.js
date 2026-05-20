// ─────────────────────────────────────────────────────────────────────
// V5.2 Fase 4 — Capability cap_financial_capacity_validation (executável)
// ─────────────────────────────────────────────────────────────────────
// FUNDAMENTO: DOC4 Bloco 4 §4.2 (Patch Financeiro 5 dimensões) +
//              DOC5 V5.2 §17 (Capacidade Financeira PJ/PF).
//
// Esta capability avalia se o TPV/faturamento declarado é compatível com:
//   PJ — capital social, faturamento ECF, CRC ativo, fluxo de caixa Open
//        Finance e benchmark setorial.
//   PF — renda mensal declarada, score de crédito PF, comprometimento de
//        renda, idade do CPF.
//
// Retorna:
//   - status do Patch Financeiro (verde/amarelo/laranja/vermelho)
//   - lista de dimensões com (valor_declarado, valor_observado, divergência%)
//   - v_financial_coherence ∈ [-100, +20] (alimenta C3 do scoring)
//   - bloqueios sugeridos (B-FIN-1 a B-FIN-4) quando aplicável
//
// FUNÇÃO PURA. Pipeline orquestra (busca payload BDC + respostas).
// ─────────────────────────────────────────────────────────────────────

function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/[^0-9.,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function pctDivergencia(declarado, observado) {
  if (declarado == null || observado == null || declarado === 0) return null;
  return Math.round(((declarado - observado) / declarado) * 1000) / 10; // 1 casa decimal
}

/**
 * Status consolidado do Patch a partir das dimensões.
 *
 * Regra V5.2:
 *  - 0 dimensões com bloqueio_disparado → verde
 *  - 1 dimensão amarela → amarelo
 *  - 2+ dimensões amarelas OU 1 dimensão laranja → laranja
 *  - 1+ dimensão vermelha (bloqueio_disparado=true) → vermelho
 */
function consolidarStatusPatch(dimensoes) {
  const arr = Object.values(dimensoes);
  const vermelhas = arr.filter((d) => d?.bloqueio_disparado === true).length;
  const laranjas = arr.filter((d) => d?.cor === 'laranja').length;
  const amarelas = arr.filter((d) => d?.cor === 'amarelo').length;

  if (vermelhas > 0) return 'vermelho';
  if (laranjas > 0 || amarelas >= 2) return 'laranja';
  if (amarelas === 1) return 'amarelo';
  return 'verde';
}

/**
 * Calcula v_financial_coherence ∈ [-100, +20].
 * - Patch verde: +20
 * - Patch amarelo: -10
 * - Patch laranja: -40
 * - Patch vermelho: -100
 */
function calcularVFinancialCoherence(status) {
  const map = { verde: 20, amarelo: -10, laranja: -40, vermelho: -100 };
  return map[status] ?? 0;
}

// ─────────────────────────────────────────────────────────────────────
// PJ — 5 dimensões V5.1/V5.2
// ─────────────────────────────────────────────────────────────────────

/**
 * Dim 1: TPV declarado vs BDC.
 *  - verde: divergência ≤ 20%
 *  - amarelo: 20%-50%
 *  - laranja: 50%-100%
 *  - vermelho (bloqueio): >100% E TPV declarado > capital × 12
 */
function avaliarDim1_tpvDeclaradoVsBdc({ tpvDeclarado, tpvBdc, capital }) {
  const decl = num(tpvDeclarado);
  const obs = num(tpvBdc);
  if (decl == null || obs == null) {
    return { valor_declarado: decl, valor_observado: obs, divergencia_pct: null, cor: 'cinza', bloqueio_disparado: false, motivo: 'sem dados BDC' };
  }
  const div = pctDivergencia(decl, obs);
  const absDiv = Math.abs(div);
  let cor = 'verde';
  let bloqueio = false;
  if (absDiv > 100) {
    cor = 'vermelho';
    if (num(capital) != null && decl > num(capital) * 12) {
      bloqueio = true; // dispara B-FIN-1
    }
  } else if (absDiv > 50) cor = 'laranja';
  else if (absDiv > 20) cor = 'amarelo';

  return { valor_declarado: decl, valor_observado: obs, divergencia_pct: div, cor, bloqueio_disparado: bloqueio, motivo: `Δ ${div}%` };
}

/**
 * Dim 2: Faturamento DOC vs ECF.
 */
function avaliarDim2_faturamentoDocVsEcf({ faturamentoDoc, faturamentoEcf }) {
  const decl = num(faturamentoDoc);
  const obs = num(faturamentoEcf);
  if (decl == null || obs == null) {
    return { valor_declarado: decl, valor_observado: obs, divergencia_pct: null, cor: 'cinza', bloqueio_disparado: false, motivo: 'sem ECF' };
  }
  const div = pctDivergencia(decl, obs);
  const absDiv = Math.abs(div);
  let cor = 'verde';
  let bloqueio = false;
  if (absDiv > 100) { cor = 'vermelho'; bloqueio = true; } // B-FIN-2
  else if (absDiv > 50) cor = 'laranja';
  else if (absDiv > 25) cor = 'amarelo';
  return { valor_declarado: decl, valor_observado: obs, divergencia_pct: div, cor, bloqueio_disparado: bloqueio, motivo: `Δ ${div}%` };
}

/**
 * Dim 3: CRC ativo do contador.
 */
function avaliarDim3_crcStatus({ crcAtivo, exigeCrc }) {
  if (!exigeCrc) {
    return { valor_declarado: 'N/A', valor_observado: 'N/A', divergencia_pct: null, cor: 'verde', bloqueio_disparado: false, motivo: 'CRC não exigido' };
  }
  if (crcAtivo === true) {
    return { valor_declarado: 'ativo', valor_observado: 'ativo', divergencia_pct: 0, cor: 'verde', bloqueio_disparado: false, motivo: 'CRC ativo' };
  }
  if (crcAtivo === false) {
    return { valor_declarado: 'ativo', valor_observado: 'inativo', divergencia_pct: 100, cor: 'vermelho', bloqueio_disparado: true, motivo: 'CRC inativo/inexistente' }; // B-FIN-3
  }
  return { valor_declarado: 'ativo', valor_observado: null, divergencia_pct: null, cor: 'amarelo', bloqueio_disparado: false, motivo: 'CRC não verificado' };
}

/**
 * Dim 4: Fluxo de caixa Open Finance.
 */
function avaliarDim4_fluxoCaixaOpenFinance({ saldoMedio, tpvDeclarado }) {
  const saldo = num(saldoMedio);
  const tpv = num(tpvDeclarado);
  if (saldo == null || tpv == null || tpv === 0) {
    return { valor_declarado: tpv, valor_observado: saldo, divergencia_pct: null, cor: 'cinza', bloqueio_disparado: false, motivo: 'Open Finance não consultado' };
  }
  // Cobertura = saldo / TPV mensal (em meses)
  const cobertura = saldo / tpv;
  let cor = 'verde';
  let bloqueio = false;
  if (cobertura < 0.1) { cor = 'vermelho'; bloqueio = true; }  // <10% do TPV → B-FIN-4
  else if (cobertura < 0.3) cor = 'laranja';
  else if (cobertura < 0.5) cor = 'amarelo';
  return { valor_declarado: tpv, valor_observado: saldo, divergencia_pct: Math.round((1 - cobertura) * 1000) / 10, cor, bloqueio_disparado: bloqueio, motivo: `Cobertura ${Math.round(cobertura * 100)}% TPV` };
}

/**
 * Dim 5: Coerência setorial (TPV vs benchmark do segmento).
 */
function avaliarDim5_coerenciaSetor({ tpvDeclarado, tpvP90Setor }) {
  const decl = num(tpvDeclarado);
  const p90 = num(tpvP90Setor);
  if (decl == null || p90 == null) {
    return { valor_declarado: decl, valor_observado: p90, divergencia_pct: null, cor: 'cinza', bloqueio_disparado: false, motivo: 'sem benchmark setorial' };
  }
  const ratio = decl / p90;
  let cor = 'verde';
  if (ratio > 5) cor = 'laranja';
  else if (ratio > 2) cor = 'amarelo';
  const div = Math.round((ratio - 1) * 1000) / 10;
  return { valor_declarado: decl, valor_observado: p90, divergencia_pct: div, cor, bloqueio_disparado: false, motivo: `${Math.round(ratio * 100)}% do P90 do setor` };
}

/**
 * Avalia capacidade financeira PJ — 5 dimensões.
 *
 * @param {Object} input
 * @param {Object} input.respostas - declarações do questionário
 * @param {Object} input.bdcSnapshot - payload BDC
 * @param {string} input.segmento
 * @returns {Object} { patch_financeiro_status, dimensoes, v_financial_coherence, bloqueios_sugeridos }
 */
export function avaliarCapacidadeFinanceiraPJ({ respostas = {}, bdcSnapshot = {}, segmento }) {
  const tpvDeclarado = respostas.tpv_mensal_declarado || respostas.tpvMensal;
  const capital = respostas.capital_social || bdcSnapshot.capital_social;
  const faturamentoDoc = respostas.faturamento_anual_doc || respostas.faturamentoAnual;
  const faturamentoEcf = bdcSnapshot.faturamento_ecf;
  const crcAtivo = bdcSnapshot.crc_ativo;
  // Segmentos que EXIGEM contador com CRC ativo (regulamentado)
  const exigeCrc = ['gateway', 'marketplace', 'crossborder'].includes(segmento);
  const saldoMedio = bdcSnapshot.openfinance_saldo_medio;
  const tpvP90Setor = bdcSnapshot.benchmark_tpv_p90_setor;

  const dim1 = avaliarDim1_tpvDeclaradoVsBdc({ tpvDeclarado, tpvBdc: bdcSnapshot.tpv_estimado_bdc, capital });
  const dim2 = avaliarDim2_faturamentoDocVsEcf({ faturamentoDoc, faturamentoEcf });
  const dim3 = avaliarDim3_crcStatus({ crcAtivo, exigeCrc });
  const dim4 = avaliarDim4_fluxoCaixaOpenFinance({ saldoMedio, tpvDeclarado });
  const dim5 = avaliarDim5_coerenciaSetor({ tpvDeclarado, tpvP90Setor });

  const dimensoes = {
    tpv_declarado_vs_bdc: dim1,
    faturamento_doc_vs_ecf: dim2,
    crc_status: dim3,
    fluxo_caixa_open_finance: dim4,
    coerencia_setor: dim5,
  };

  const status = consolidarStatusPatch(dimensoes);
  const v_financial_coherence = calcularVFinancialCoherence(status);

  // Bloqueios sugeridos (códigos canônicos V5.2)
  const bloqueios_sugeridos = [];
  if (dim1.bloqueio_disparado) bloqueios_sugeridos.push('B-FIN-1');
  if (dim2.bloqueio_disparado) bloqueios_sugeridos.push('B-FIN-2');
  if (dim3.bloqueio_disparado) bloqueios_sugeridos.push('B-FIN-3');
  if (dim4.bloqueio_disparado) bloqueios_sugeridos.push('B-FIN-4');

  return {
    framework_version: 'v5.2',
    pessoa: 'PJ',
    patch_financeiro_status: status,
    dimensoes,
    v_financial_coherence,
    bloqueios_sugeridos,
  };
}

// ─────────────────────────────────────────────────────────────────────
// PF — versão para Subseller PF (4 dimensões alternativas)
// ─────────────────────────────────────────────────────────────────────

/**
 * Dim PF-1: Renda mensal declarada vs score crédito PF.
 */
function avaliarDimPF1_rendaVsScore({ rendaDeclarada, scoreCreditoPf }) {
  const renda = num(rendaDeclarada);
  const score = num(scoreCreditoPf);
  if (renda == null) {
    return { valor_declarado: null, valor_observado: score, divergencia_pct: null, cor: 'cinza', bloqueio_disparado: false, motivo: 'sem renda declarada' };
  }
  if (score == null) {
    return { valor_declarado: renda, valor_observado: null, divergencia_pct: null, cor: 'amarelo', bloqueio_disparado: false, motivo: 'sem score crédito' };
  }
  // Score baixo (<300) + renda alta declarada → inconsistência
  let cor = 'verde';
  let bloqueio = false;
  if (score < 300 && renda > 10_000) { cor = 'vermelho'; bloqueio = true; } // B-PF-1
  else if (score < 400 && renda > 5_000) cor = 'laranja';
  else if (score < 500) cor = 'amarelo';
  return { valor_declarado: renda, valor_observado: score, divergencia_pct: null, cor, bloqueio_disparado: bloqueio, motivo: `score=${score}, renda=R$${renda}` };
}

/**
 * Dim PF-2: Comprometimento de renda (TPV mensal vs renda mensal).
 */
function avaliarDimPF2_comprometimento({ tpvMensal, rendaDeclarada }) {
  const tpv = num(tpvMensal);
  const renda = num(rendaDeclarada);
  if (tpv == null || renda == null || renda === 0) {
    return { valor_declarado: tpv, valor_observado: renda, divergencia_pct: null, cor: 'cinza', bloqueio_disparado: false, motivo: 'sem dados' };
  }
  const ratio = tpv / renda;
  let cor = 'verde';
  let bloqueio = false;
  if (ratio > 50) { cor = 'vermelho'; bloqueio = true; } // B-PF-2
  else if (ratio > 20) cor = 'laranja';
  else if (ratio > 10) cor = 'amarelo';
  return { valor_declarado: tpv, valor_observado: renda, divergencia_pct: Math.round(ratio * 100) / 100, cor, bloqueio_disparado: bloqueio, motivo: `TPV é ${ratio.toFixed(1)}× a renda` };
}

/**
 * Dim PF-3: Idade do CPF (anos desde emissão / data de nascimento).
 */
function avaliarDimPF3_idadeCpf({ idadeAnos }) {
  const idade = num(idadeAnos);
  if (idade == null) {
    return { valor_declarado: null, valor_observado: null, divergencia_pct: null, cor: 'cinza', bloqueio_disparado: false, motivo: 'sem data nascimento' };
  }
  let cor = 'verde';
  let bloqueio = false;
  if (idade < 18) { cor = 'vermelho'; bloqueio = true; motivo: 'menor de idade'; }
  else if (idade < 21) cor = 'amarelo';
  return { valor_declarado: idade, valor_observado: idade, divergencia_pct: null, cor, bloqueio_disparado: bloqueio, motivo: `${idade} anos` };
}

/**
 * Dim PF-4: CPF com restrições (negativações Serasa/SPC).
 */
function avaliarDimPF4_restricoes({ temRestricoes, valorRestricoes }) {
  if (temRestricoes === false) {
    return { valor_declarado: 'limpo', valor_observado: 'limpo', divergencia_pct: 0, cor: 'verde', bloqueio_disparado: false, motivo: 'sem restrições' };
  }
  if (temRestricoes === true) {
    const valor = num(valorRestricoes) ?? 0;
    let cor = 'amarelo';
    let bloqueio = false;
    if (valor > 50_000) { cor = 'vermelho'; bloqueio = true; } // B-PF-3
    else if (valor > 10_000) cor = 'laranja';
    return { valor_declarado: 'limpo', valor_observado: `R$${valor}`, divergencia_pct: null, cor, bloqueio_disparado: bloqueio, motivo: `restrição R$${valor}` };
  }
  return { valor_declarado: 'limpo', valor_observado: null, divergencia_pct: null, cor: 'cinza', bloqueio_disparado: false, motivo: 'não consultado' };
}

/**
 * Avalia capacidade financeira PF (Subseller PF) — 4 dimensões.
 */
export function avaliarCapacidadeFinanceiraPF({ respostas = {}, bdcSnapshot = {} }) {
  const rendaDeclarada = respostas.renda_mensal_liquida || respostas.rendaMensal;
  const scoreCreditoPf = bdcSnapshot.score_credito_pf;
  const tpvMensal = respostas.tpv_mensal_declarado || respostas.tpvMensal;
  const idadeAnos = bdcSnapshot.idade_anos;
  const temRestricoes = bdcSnapshot.tem_restricoes_pf;
  const valorRestricoes = bdcSnapshot.valor_restricoes_pf;

  const dim1 = avaliarDimPF1_rendaVsScore({ rendaDeclarada, scoreCreditoPf });
  const dim2 = avaliarDimPF2_comprometimento({ tpvMensal, rendaDeclarada });
  const dim3 = avaliarDimPF3_idadeCpf({ idadeAnos });
  const dim4 = avaliarDimPF4_restricoes({ temRestricoes, valorRestricoes });

  const dimensoes = {
    renda_vs_score_pf: dim1,
    comprometimento_renda: dim2,
    idade_cpf: dim3,
    restricoes_pf: dim4,
  };

  const status = consolidarStatusPatch(dimensoes);
  const v_financial_coherence = calcularVFinancialCoherence(status);

  const bloqueios_sugeridos = [];
  if (dim1.bloqueio_disparado) bloqueios_sugeridos.push('B-PF-1');
  if (dim2.bloqueio_disparado) bloqueios_sugeridos.push('B-PF-2');
  if (dim3.bloqueio_disparado) bloqueios_sugeridos.push('B-PF-FRAUDE-1'); // menor de idade
  if (dim4.bloqueio_disparado) bloqueios_sugeridos.push('B-PF-3');

  return {
    framework_version: 'v5.2',
    pessoa: 'PF',
    patch_financeiro_status: status,
    dimensoes,
    v_financial_coherence,
    bloqueios_sugeridos,
  };
}

/**
 * Dispatcher — escolhe PJ ou PF baseado em tipo do merchant.
 */
export function avaliarCapacidadeFinanceira({ merchantType, ...rest }) {
  if (merchantType === 'PF') return avaliarCapacidadeFinanceiraPF(rest);
  return avaliarCapacidadeFinanceiraPJ(rest);
}