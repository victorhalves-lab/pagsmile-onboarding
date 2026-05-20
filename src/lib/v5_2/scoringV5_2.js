// ─────────────────────────────────────────────────────────────────────
// V5.2 — Scoring Tier-Aware (5 camadas)
// ─────────────────────────────────────────────────────────────────────
// FUNÇÃO PURA: recebe inputs estruturados, retorna score + breakdown.
// NÃO toca em DB, NÃO chama APIs externas, NÃO importa nada do V4.
//
// ⚠️ CORREÇÃO CRÍTICA vs V5.1:
//   Escalas anteriores estavam invertidas (T1=499, T2=849, Sub=999).
//   Escalas corretas V5.2 (canônicas em SCORE_SCALES_BY_TIER):
//     Tier 1: 0-850
//     Tier 2: 0-850
//     Tier 3: 0-999  ⚠️ Tier mais alto = escala mais alta
//     Subseller PJ: 0-850
//     Subseller PF: 0-850
//
// 4 categorias finais (CAT 1-4) — Cat 5 é decidida no pipeline a partir
// de score + bloqueios + capability de monitoramento intensivo.
// ─────────────────────────────────────────────────────────────────────

import { TIERS } from './tiers';
import { CATEGORIAS_DECISAO_V5_2 } from './matrizDecisao';
import { SCORE_SCALES_BY_TIER } from './constants';
import { resolverModulosT3Ativos, aplicarPenalidadesT3 } from './tier3Modules';

// ── Escalas máximas por tier (V5.2 — CORRETAS) ──
export const SCORE_MAX_POR_TIER = {
  [TIERS.TIER_1]: SCORE_SCALES_BY_TIER.tier_1.max, // 850
  [TIERS.TIER_2]: SCORE_SCALES_BY_TIER.tier_2.max, // 850
  [TIERS.TIER_3]: SCORE_SCALES_BY_TIER.tier_3.max, // 999
  [TIERS.SUBSELLER_PJ]: SCORE_SCALES_BY_TIER.subseller_pj.max, // 850
  [TIERS.SUBSELLER_PF]: SCORE_SCALES_BY_TIER.subseller_pf.max, // 850
};

// Segmentos críticos (escalas mais conservadoras na C1)
const SEGMENTOS_CRITICOS = ['gateway', 'marketplace', 'dropshipping', 'crossborder'];

function isSegmentoCritico(s) {
  return SEGMENTOS_CRITICOS.includes(s);
}

// ── C1: Score base por (segmento, tier) ──
// Tabela canônica V5.2 (Bloco 3 — Score base Tier 3).
// Tier 3 tem base mais alta (escala 0-999) mas conservadora pros segmentos críticos.
const BASE_SEGMENTO_TIER = {
  // Tier 1 — escala 0-850, base mais alta (operação simples)
  [TIERS.TIER_1]: {
    ecommerce: 560, saas: 600, educacao: 580, mpe: 540, infoprodutos: 500,
    foodtech: 560, link_pagamento: 480, plataforma_vertical: 540,
    turismo: 520, eventos: 500, servicos_b2b: 560, servicos_locais: 540,
    gateway: 380, dropshipping: 380, marketplace: 420, crossborder: 360,
    pix_merchant: 560, pix_intermediario: 400,
  },
  // Tier 2 — escala 0-850
  [TIERS.TIER_2]: {
    ecommerce: 560, saas: 600, educacao: 580, mpe: 540, infoprodutos: 520,
    foodtech: 560, link_pagamento: 500, plataforma_vertical: 560,
    turismo: 530, eventos: 510, servicos_b2b: 570, servicos_locais: 550,
    gateway: 420, dropshipping: 420, marketplace: 460, crossborder: 380,
    pix_merchant: 560, pix_intermediario: 440,
  },
  // Tier 3 — escala 0-999 (tabela canônica DOC4 Bloco 3)
  [TIERS.TIER_3]: {
    saas: 110, ecommerce: 150, marketplace: 170, gateway: 180,
    eventos: 220, infoprodutos: 240, turismo: 250, dropshipping: 260,
    crossborder: 280, plataforma_vertical: 190, servicos_b2b: 200,
    educacao: 200, link_pagamento: 220, servicos_locais: 220, mpe: 200,
    pix_merchant: 200, pix_intermediario: 240,
  },
  // Subseller — escala 0-850 (V5.2 corrigido — antes era 999)
  [TIERS.SUBSELLER_PJ]: { _default: 600 },
  [TIERS.SUBSELLER_PF]: { _default: 550 },
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

  if (morfologia === 'pix_only') { ajuste += 10; motivos.push('PIX exclusivo (+10)'); }
  if (morfologia === 'pix_heavy') { ajuste += 5; motivos.push('PIX heavy (+5)'); }
  if (morfologia === 'b2c_crossborder') { ajuste -= 40; motivos.push('B2C crossborder (-40)'); }
  if (morfologia === 'b2b_crossborder') { ajuste -= 25; motivos.push('B2B crossborder (-25)'); }
  if (morfologia === 'multi_mei') { ajuste -= 50; motivos.push('Multi-MEI (-50): pulverização'); }
  if (morfologia === 'saas_recorrente') { ajuste += 15; motivos.push('SaaS recorrente (+15)'); }
  if (morfologia === 'cartao_heavy' && isSegmentoCritico(segmento)) {
    ajuste -= 20; motivos.push('Cartão heavy + segmento crítico (-20)');
  }

  return { valor: ajuste, explicacao: motivos.join('; ') || 'Morfologia padrão (0)' };
}

// ── C3: Variáveis canônicas (16 campos) ──
const VARIAVEIS_CANONICAS = [
  'v_cnpj_valido_e_ativo', 'v_qsa_coherence', 'v_capital_social_proporcional',
  'v_idade_empresa', 'v_endereco_coerente', 'v_atividade_cnae_coerente',
  'v_socios_sem_restricoes', 'v_socios_sem_pep_sancoes', 'v_socios_sem_processos_criticos',
  'v_score_credito_pj', 'v_score_credito_socios', 'v_dominio_proprio_ativo',
  'v_presenca_digital', 'v_reclamacoes_consumidor', 'v_historico_chargeback',
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

// ── C4: Capabilities transversais + Módulos Tier 3 (Fase 3b) ──
function camada4_capabilities({
  capabilitiesAtivas = [],
  resultadosCapabilities = {},
  tier,
  segmento,
}) {
  let total = 0;
  const motivos = [];

  // 4a) Capabilities transversais
  for (const cap of capabilitiesAtivas) {
    const res = resultadosCapabilities[cap];
    if (!res) {
      total -= 10;
      motivos.push(`${cap}: sem dados (-10)`);
      continue;
    }
    if (res.status === 'pass') continue;
    if (res.status === 'warning') {
      total -= 20; motivos.push(`${cap}: warning (-20)`);
    } else if (res.status === 'fail') {
      total -= 50; motivos.push(`${cap}: fail (-50)`);
    }
  }

  // 4b) Módulos Tier 3 (Fase 3b) — apenas em tier_3
  const modulosT3 = resolverModulosT3Ativos({
    tier,
    segmento,
    capabilities_ativas: capabilitiesAtivas,
  });
  const t3 = aplicarPenalidadesT3(modulosT3, resultadosCapabilities);
  if (t3.total !== 0) {
    total += t3.total;
    motivos.push(`Tier 3 módulos (${modulosT3.map((m) => m.short).join(', ')}): ${t3.total}`);
  }

  return {
    valor: total,
    explicacao: motivos.join('; ') || 'Capabilities OK (0)',
    modulos_t3_ativos: modulosT3.map((m) => m.codigo),
    modulos_t3_detalhes: t3.detalhes,
  };
}

// ── C5: Patch Financeiro ──
function camada5_patchFinanceiro({ patchStatus = 'nao_aplicavel' }) {
  const map = {
    verde: { valor: 20, explicacao: 'Patch Financeiro verde (+20)' },
    amarelo: { valor: -10, explicacao: 'Patch Financeiro amarelo (-10)' },
    laranja: { valor: -40, explicacao: 'Patch Financeiro laranja (-40)' },
    vermelho: { valor: -100, explicacao: 'Patch Financeiro vermelho (-100)' },
    nao_aplicavel: { valor: 0, explicacao: 'Patch Financeiro N/A' },
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

/**
 * Resolve a categoria de decisão V5.2.
 * Cat 5 NÃO é decidida automaticamente aqui — ela é proposta no pipeline
 * quando bloqueio mitigável + analista aprova plano de monitoramento.
 */
function resolverCategoriaDecisao({ subfaixaBase, bloqueiosAtivos = [], patchStatus = 'nao_aplicavel' }) {
  if (bloqueiosAtivos.length > 0) return CATEGORIAS_DECISAO_V5_2.CAT_4_BLOCK;
  if (patchStatus === 'vermelho') return CATEGORIAS_DECISAO_V5_2.CAT_4_BLOCK;
  if (subfaixaBase === '5') return CATEGORIAS_DECISAO_V5_2.CAT_4_BLOCK;
  if (subfaixaBase === '4') return CATEGORIAS_DECISAO_V5_2.CAT_3_MANUAL_REVIEW;
  if (subfaixaBase === '3A' || subfaixaBase === '3B') return CATEGORIAS_DECISAO_V5_2.CAT_2_CONDITIONAL;
  if (subfaixaBase === '2A' || subfaixaBase === '2B') {
    if (patchStatus === 'amarelo' || patchStatus === 'laranja') return CATEGORIAS_DECISAO_V5_2.CAT_2_CONDITIONAL;
    return CATEGORIAS_DECISAO_V5_2.CAT_1_AUTO_APPROVE;
  }
  return CATEGORIAS_DECISAO_V5_2.CAT_1_AUTO_APPROVE;
}

/**
 * Calcula score V5.2 (função pura).
 *
 * Mesma assinatura de calcularScoreV5_1 — drop-in replacement.
 * Diferença: escalas corrigidas + tabela Tier 3 canônica + 5 novos segmentos.
 */
export function calcularScoreV5_2(input) {
  const {
    tier, segmento, morfologia,
    capabilitiesAtivas = [], variaveisInput = {},
    resultadosCapabilities = {},
    patchStatus = 'nao_aplicavel',
    bloqueiosAtivos = [],
  } = input;

  const c1 = camada1_baseSegmentoTier({ segmento, tier });
  const c2 = camada2_morfologia({ morfologia, segmento });
  const c3 = camada3_variaveis({ variaveisInput });
  const c4 = camada4_capabilities({ capabilitiesAtivas, resultadosCapabilities, tier, segmento });
  const c5 = camada5_patchFinanceiro({ patchStatus });

  const scoreBruto = c1.valor + c2.valor + c3.valor + c4.valor + c5.valor;
  const scoreMax = SCORE_MAX_POR_TIER[tier] || 850;
  const scoreFinal = Math.max(0, Math.min(scoreMax, scoreBruto));
  const scoreNormalizado = (scoreFinal / scoreMax) * 100;

  const subfaixaBase = scoreNormalizadoToSubfaixaBase(scoreNormalizado);
  const categoriaDecisao = resolverCategoriaDecisao({ subfaixaBase, bloqueiosAtivos, patchStatus });

  return {
    framework_version: 'v5.2',
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
    categoria_decisao: categoriaDecisao,
    variaveis_positivas: c3.positivas,
    variaveis_negativas: c3.negativas,
    patch_financeiro_status: patchStatus,
    bloqueios_ativos: bloqueiosAtivos,
  };
}