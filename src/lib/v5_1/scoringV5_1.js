// ─────────────────────────────────────────────────────────────────────
// V5.1 — Scoring Tier-Aware (5 camadas)
// ─────────────────────────────────────────────────────────────────────
// FUNÇÃO PURA: recebe inputs estruturados, retorna score + breakdown.
// NÃO toca em DB, NÃO chama APIs externas, NÃO importa nada do V4.
//
// Escala tier-aware (definida no schema do OnboardingCase):
//   Tier 1: 0-499
//   Tier 2/3: 0-849
//   Subseller PJ/PF: 0-999
//
// As 5 camadas:
//   C1 — Base por Segmento+Tier
//   C2 — Ajuste Morfológico
//   C3 — Variáveis declaradas+confirmadas (16 campos canônicos)
//   C4 — Capabilities transversais
//   C5 — Patch Financeiro
// ─────────────────────────────────────────────────────────────────────

import { TIERS } from './tiers';
import { SEGMENTOS_V5_1, isSegmentoCritico } from './segmentos';
import { MORFOLOGIAS } from './morfologias';
import { CAPABILITIES } from './capabilities';
import { CATEGORIAS_DECISAO_V5_1 } from './matrizDecisao';
import { formatSubfaixaTierAware } from './subfaixasTierAware';

// ── Escalas máximas por tier ──
export const SCORE_MAX_POR_TIER = {
  [TIERS.TIER_1]: 499,
  [TIERS.TIER_2]: 849,
  [TIERS.TIER_3]: 849,
  [TIERS.SUBSELLER_PJ]: 999,
  [TIERS.SUBSELLER_PF]: 999,
};

// ── C1: Score base por (segmento, tier) ──
// Tabela conservadora — segmentos críticos começam mais baixo.
const BASE_SEGMENTO_TIER = {
  // Tier 1 — TPV baixo, escala 0-499
  [TIERS.TIER_1]: {
    ecommerce: 320, saas: 360, educacao: 340, mpe: 320, infoprodutos: 300,
    foodtech: 320, link_pagamento: 280, plataforma_vertical: 320,
    gateway: 220, dropshipping: 220, marketplace: 220, // críticos: bem mais baixos
    pix_merchant: 320, pix_intermediario: 240,
  },
  // Tier 2 — escala 0-849
  [TIERS.TIER_2]: {
    ecommerce: 560, saas: 600, educacao: 580, mpe: 540, infoprodutos: 520,
    foodtech: 560, link_pagamento: 500, plataforma_vertical: 560,
    gateway: 420, dropshipping: 420, marketplace: 460,
    pix_merchant: 560, pix_intermediario: 440,
  },
  // Tier 3 — alto risco; base mais conservadora apesar da escala 0-849
  [TIERS.TIER_3]: {
    ecommerce: 540, saas: 580, educacao: 560, mpe: 520, infoprodutos: 500,
    foodtech: 540, link_pagamento: 480, plataforma_vertical: 540,
    gateway: 380, dropshipping: 380, marketplace: 420,
    pix_merchant: 540, pix_intermediario: 400,
  },
  // Subseller — escala 0-999, base segmento-cego mais elevada (KYB do seller já validou)
  [TIERS.SUBSELLER_PJ]: { _default: 700 },
  [TIERS.SUBSELLER_PF]: { _default: 650 },
};

function camada1_baseSegmentoTier({ segmento, tier }) {
  const tabela = BASE_SEGMENTO_TIER[tier] || {};
  const score = tabela[segmento] ?? tabela._default ?? 400;
  return {
    valor: score,
    explicacao: `Base (${segmento || 'segmento_indef'}) × (${tier})`,
  };
}

// ── C2: Ajuste por morfologia ──
function camada2_morfologia({ morfologia, segmento }) {
  let ajuste = 0;
  const motivos = [];

  if (morfologia === MORFOLOGIAS.PIX_ONLY) {
    ajuste += 10; motivos.push('PIX exclusivo (+10): operação simples, baixa exposição cartão');
  }
  if (morfologia === MORFOLOGIAS.PIX_HEAVY) {
    ajuste += 5; motivos.push('PIX heavy (+5)');
  }
  if (morfologia === MORFOLOGIAS.B2C_CROSSBORDER) {
    ajuste -= 40; motivos.push('B2C crossborder (-40): risco cambial+regulatório');
  }
  if (morfologia === MORFOLOGIAS.B2B_CROSSBORDER) {
    ajuste -= 25; motivos.push('B2B crossborder (-25)');
  }
  if (morfologia === MORFOLOGIAS.MULTI_MEI) {
    ajuste -= 50; motivos.push('Multi-MEI (-50): pulverização suspeita');
  }
  if (morfologia === MORFOLOGIAS.SAAS_RECORRENTE) {
    ajuste += 15; motivos.push('SaaS recorrente (+15): receita previsível');
  }
  if (morfologia === MORFOLOGIAS.CARTAO_HEAVY && isSegmentoCritico(segmento)) {
    ajuste -= 20; motivos.push('Cartão heavy + segmento crítico (-20): chargeback risk');
  }

  return { valor: ajuste, explicacao: motivos.join('; ') || 'Morfologia padrão (0)' };
}

// ── C3: Variáveis canônicas (16 campos) ──
// Cada variável vale entre -30 e +30. Aqui implementamos o core; falhas
// silenciosas (campo ausente) = 0 (neutro, não penaliza).
const VARIAVEIS_CANONICAS = [
  'v_cnpj_valido_e_ativo',
  'v_qsa_coherence',
  'v_capital_social_proporcional',
  'v_idade_empresa',
  'v_endereco_coerente',
  'v_atividade_cnae_coerente',
  'v_socios_sem_restricoes',
  'v_socios_sem_pep_sancoes',
  'v_socios_sem_processos_criticos',
  'v_score_credito_pj',
  'v_score_credito_socios',
  'v_dominio_proprio_ativo',
  'v_presenca_digital',
  'v_reclamacoes_consumidor',
  'v_historico_chargeback',
  'v_financial_coherence',
];

function camada3_variaveis({ variaveisInput = {} }) {
  let total = 0;
  const aplicadas = {};
  const positivas = [];
  const negativas = [];

  for (const nome of VARIAVEIS_CANONICAS) {
    const v = variaveisInput[nome];
    if (v == null) continue;
    // Aceita {valor, descricao} ou só number
    const valor = typeof v === 'object' ? Number(v.valor) || 0 : Number(v) || 0;
    const desc = typeof v === 'object' ? v.descricao : null;
    if (valor === 0) continue;
    total += valor;
    aplicadas[nome] = { valor, descricao: desc || '' };
    if (valor > 0) positivas.push(`${nome}: +${valor}`);
    if (valor < 0) negativas.push(`${nome}: ${valor}`);
  }

  return { valor: total, aplicadas, positivas, negativas };
}

// ── C4: Capabilities transversais ──
// Capabilities NÃO somam pontos por si só — elas funcionam como gates:
// se ativa mas FALHA, penaliza. Se ativa e OK, neutro.
function camada4_capabilities({ capabilitiesAtivas = [], resultadosCapabilities = {} }) {
  let total = 0;
  const motivos = [];

  for (const cap of capabilitiesAtivas) {
    const res = resultadosCapabilities[cap];
    if (!res) {
      // Capability ativa mas sem resultado = inconclusivo → penalização leve
      total -= 10;
      motivos.push(`${cap}: sem dados (-10)`);
      continue;
    }
    if (res.status === 'pass') continue; // neutro
    if (res.status === 'warning') {
      total -= 20;
      motivos.push(`${cap}: warning (-20)`);
    } else if (res.status === 'fail') {
      total -= 50;
      motivos.push(`${cap}: fail (-50)`);
    }
  }

  return { valor: total, explicacao: motivos.join('; ') || 'Capabilities OK (0)' };
}

// ── C5: Patch Financeiro ──
// Status: verde (+20), amarelo (-10), laranja (-40), vermelho (-100), nao_aplicavel (0).
function camada5_patchFinanceiro({ patchStatus = 'nao_aplicavel' }) {
  const map = {
    verde: { valor: 20, explicacao: 'Patch Financeiro coerente (+20)' },
    amarelo: { valor: -10, explicacao: 'Patch Financeiro amarelo (-10): divergência <30%' },
    laranja: { valor: -40, explicacao: 'Patch Financeiro laranja (-40): divergência 30-100%' },
    vermelho: { valor: -100, explicacao: 'Patch Financeiro vermelho (-100): divergência >100% ou docs inválidos' },
    nao_aplicavel: { valor: 0, explicacao: 'Patch Financeiro não aplicável' },
  };
  return map[patchStatus] || map.nao_aplicavel;
}

// ── Subfaixa base (1A..5) a partir do score normalizado 0-100 ──
function scoreNormalizadoToSubfaixaBase(scoreNorm) {
  if (scoreNorm >= 90) return '1A';
  if (scoreNorm >= 80) return '1B';
  if (scoreNorm >= 70) return '2A';
  if (scoreNorm >= 60) return '2B';
  if (scoreNorm >= 50) return '3A';
  if (scoreNorm >= 40) return '3B';
  if (scoreNorm >= 25) return '4';
  return '5';
}

// ── Categoria de decisão V5.1 a partir da subfaixa base + bloqueios ──
function resolverCategoriaDecisao({ subfaixaBase, bloqueiosAtivos = [], patchStatus = 'nao_aplicavel' }) {
  if (bloqueiosAtivos.length > 0) return CATEGORIAS_DECISAO_V5_1.CAT_4_BLOCK;
  if (patchStatus === 'vermelho') return CATEGORIAS_DECISAO_V5_1.CAT_4_BLOCK;
  if (subfaixaBase === '5') return CATEGORIAS_DECISAO_V5_1.CAT_4_BLOCK;
  if (subfaixaBase === '4') return CATEGORIAS_DECISAO_V5_1.CAT_3_MANUAL_REVIEW;
  if (subfaixaBase === '3A' || subfaixaBase === '3B') return CATEGORIAS_DECISAO_V5_1.CAT_2_CONDITIONAL;
  if (subfaixaBase === '2A' || subfaixaBase === '2B') {
    // patch amarelo/laranja em 2A/2B → condicional
    if (patchStatus === 'amarelo' || patchStatus === 'laranja') return CATEGORIAS_DECISAO_V5_1.CAT_2_CONDITIONAL;
    return CATEGORIAS_DECISAO_V5_1.CAT_1_AUTO_APPROVE;
  }
  return CATEGORIAS_DECISAO_V5_1.CAT_1_AUTO_APPROVE; // 1A, 1B
}

/**
 * Calcula score V5.1 completo (função pura).
 *
 * @param {Object} input
 * @param {string} input.tier           — tier resolvido
 * @param {string} input.segmento       — segmento V5.1
 * @param {string} input.morfologia     — morfologia resolvida
 * @param {string[]} input.capabilitiesAtivas
 * @param {Object} input.variaveisInput — { v_xxx: {valor, descricao} | number }
 * @param {Object} input.resultadosCapabilities — { cap_xxx: {status, detail} }
 * @param {string} input.patchStatus    — 'verde'|'amarelo'|'laranja'|'vermelho'|'nao_aplicavel'
 * @param {string[]} input.bloqueiosAtivos — códigos B-XXX-NN ativos
 *
 * @returns {Object} { score_final, score_max, camadas:{c1..c5}, subfaixa_base, subfaixa_tier_aware, categoria_decisao, ... }
 */
export function calcularScoreV5_1(input) {
  const {
    tier,
    segmento,
    morfologia,
    capabilitiesAtivas = [],
    variaveisInput = {},
    resultadosCapabilities = {},
    patchStatus = 'nao_aplicavel',
    bloqueiosAtivos = [],
  } = input;

  const c1 = camada1_baseSegmentoTier({ segmento, tier });
  const c2 = camada2_morfologia({ morfologia, segmento });
  const c3 = camada3_variaveis({ variaveisInput });
  const c4 = camada4_capabilities({ capabilitiesAtivas, resultadosCapabilities });
  const c5 = camada5_patchFinanceiro({ patchStatus });

  const scoreBruto = c1.valor + c2.valor + c3.valor + c4.valor + c5.valor;
  const scoreMax = SCORE_MAX_POR_TIER[tier] || 849;
  const scoreFinal = Math.max(0, Math.min(scoreMax, scoreBruto));
  const scoreNormalizado = (scoreFinal / scoreMax) * 100; // 0-100 para mapping subfaixa

  const subfaixaBase = scoreNormalizadoToSubfaixaBase(scoreNormalizado);
  const subfaixaTierAware = formatSubfaixaTierAware(subfaixaBase, tier);
  const categoriaDecisao = resolverCategoriaDecisao({
    subfaixaBase,
    bloqueiosAtivos,
    patchStatus,
  });

  return {
    score_final: scoreFinal,
    score_max: scoreMax,
    score_normalizado: Math.round(scoreNormalizado * 10) / 10,
    camadas: {
      c1_segmento_tier: c1,
      c2_morfologia: c2,
      c3_variaveis: c3,
      c4_capabilities: c4,
      c5_patch_financeiro: c5,
    },
    subfaixa_base: subfaixaBase,
    subfaixa_tier_aware: subfaixaTierAware,
    categoria_decisao: categoriaDecisao,
    variaveis_positivas: c3.positivas,
    variaveis_negativas: c3.negativas,
    patch_financeiro_status: patchStatus,
  };
}