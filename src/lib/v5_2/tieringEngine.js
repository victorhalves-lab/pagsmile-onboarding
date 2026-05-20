// ──────────────────────────────────────────────────────────────────────────────
// V5.2 — Tiering Engine Dinâmico (Fase 5.3)
// ──────────────────────────────────────────────────────────────────────────────
// Objetivo:
//   Recebe respostas parciais do questionário (ou completas) + payload BDC opcional
//   e retorna o tier resolvido + grau (para subsellers) + lista de triggers que
//   levaram à escalada. Diferentemente do `resolverTier` antigo (que só usava TPV
//   declarado + segmento), este engine considera TODOS os gatilhos V5.2:
//
//   1) Subseller PJ/PF → grau A/B/C por TPV ou renda
//   2) Segmento → marketplace fica Tier 2 fixo; gateway/crossborder podem escalar T3
//   3) TPV declarado → bandas T1/T2/T3
//   4) Capabilities forçadas → marketplace força splits/subseller; saas força recurrence
//   5) Triggers críticos → PEP, sanção, MCC alto risco, CNPJ <6 meses + capital
//      desproporcional, país risco FATF → forçam Tier 3 ou bloqueio
//   6) Cap por segmento → segmentos fora de SEGMENTOS_TIER_3_ONLY ficam em T2
//
// Saída: { tier, grau, capabilities_ativas, triggers, motivos }
// É PURO (sem side-effects) — pode rodar no browser durante o questionário
// para mostrar "tier_escalated banner" em real-time.
// ──────────────────────────────────────────────────────────────────────────────

import {
  SEGMENTOS_TIER_3_ONLY,
  CAPABILITIES_CANONICAS,
} from './constants';
import { TIERS, TPV_TIER_THRESHOLDS } from './tiers';

// ─────────────────────────────────────────────────────────────────────────────
// Limiares grau Subseller (Fase 3c)
// ─────────────────────────────────────────────────────────────────────────────
export const GRAU_SUBSELLER_PJ_THRESHOLDS = {
  A_MAX_TPV_MENSAL: 30_000,
  B_MAX_TPV_MENSAL: 200_000,
  C_MAX_TPV_MENSAL: 500_000, // acima disso = não é subseller (vira seller normal)
};

export const GRAU_SUBSELLER_PF_THRESHOLDS = {
  A_MAX_RENDA_MENSAL: 2_000,
  B_MAX_RENDA_MENSAL: 10_000,
  // C: > 10k (sem teto)
};

// ─────────────────────────────────────────────────────────────────────────────
// MCCs de alto risco (forçam escalada para Tier 3)
// ─────────────────────────────────────────────────────────────────────────────
const MCC_ALTO_RISCO = new Set([
  '5912', '5993', '7995', // farmácia, tabaco, jogos
  '6051', '6211',          // cripto, valores mobiliários
  '5816', '5817', '5818',  // softwares digitais (alto chargeback)
  '4829',                  // money transfer
  '5967',                  // adulto
]);

const PAISES_FATF_BLACKLIST = new Set(['IR', 'KP', 'MM']); // 2026
const PAISES_FATF_GREYLIST = new Set(['SY', 'VE', 'YE', 'AF', 'NI', 'TR', 'AE']);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function toNumber(v) {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(String(v).replace(/[^0-9.,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function diffMonths(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolução de GRAU para subsellers
// ─────────────────────────────────────────────────────────────────────────────
export function resolverGrauSubseller({ merchantType, tpvMensalDeclarado, rendaMensalLiquida }) {
  if (merchantType === 'PF') {
    const renda = toNumber(rendaMensalLiquida);
    if (renda < GRAU_SUBSELLER_PF_THRESHOLDS.A_MAX_RENDA_MENSAL) return 'A';
    if (renda <= GRAU_SUBSELLER_PF_THRESHOLDS.B_MAX_RENDA_MENSAL) return 'B';
    return 'C';
  }
  // PJ
  const tpv = toNumber(tpvMensalDeclarado);
  if (tpv <= GRAU_SUBSELLER_PJ_THRESHOLDS.A_MAX_TPV_MENSAL) return 'A';
  if (tpv <= GRAU_SUBSELLER_PJ_THRESHOLDS.B_MAX_TPV_MENSAL) return 'B';
  return 'C';
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolução de CAPABILITIES ativas
// ─────────────────────────────────────────────────────────────────────────────
export function resolverCapabilities({ segmento, tier, respostas = {} }) {
  const ativas = new Set();

  // Por obrigatoriedade de segmento
  for (const [codigo, conf] of Object.entries(CAPABILITIES_CANONICAS)) {
    if ((conf.obrigatoria_para || []).includes(segmento)) ativas.add(codigo);
  }

  // Forçada por segmento em tiers menores
  for (const [codigo, conf] of Object.entries(CAPABILITIES_CANONICAS)) {
    if ((conf.forca_ativacao_em || []).includes(segmento)) ativas.add(codigo);
  }

  // Tier 2+ universal → cap_financial_capacity_validation
  if (tier === TIERS.TIER_2 || tier === TIERS.TIER_3) {
    ativas.add('cap_financial_capacity_validation');
  }

  // Crossborder por resposta declarada
  if (respostas.opera_internacional === true || respostas.opera_internacional === 'sim') {
    ativas.add('crossborder');
  }
  if (toNumber(respostas.pct_volume_internacional) > 0) {
    ativas.add('crossborder');
  }

  // Recurrence por resposta declarada
  if (respostas.modelo_cobranca === 'recorrente' || respostas.tem_assinatura === true) {
    ativas.add('recurrence');
  }

  // Splits/subseller por resposta declarada (gateway/marketplace que opera com sub-credenciamento)
  if (respostas.opera_splits === true || respostas.tem_subseller === true) {
    ativas.add('splits/subseller');
  }

  return Array.from(ativas);
}

// ─────────────────────────────────────────────────────────────────────────────
// Avaliação de TRIGGERS de escalada
// ─────────────────────────────────────────────────────────────────────────────
function avaliarTriggers({ segmento, respostas, bdcSnapshot, merchantType }) {
  const triggers = [];
  const motivos = [];

  // 1) PEP declarado
  if (respostas.tem_socio_pep === true || respostas.pep === 'sim') {
    triggers.push({ codigo: 'TRG-PEP-DECLARED', forca_tier: TIERS.TIER_3, severidade: 'alta' });
    motivos.push('Sócio PEP declarado → exige Tier 3.');
  }

  // 2) Sanção detectada via BDC
  if (bdcSnapshot?.sancao_detectada === true) {
    triggers.push({ codigo: 'TRG-SANCTION-BDC', forca_tier: TIERS.TIER_3, severidade: 'critica', bloqueio_potencial: true });
    motivos.push('Sanção detectada em base BDC → Tier 3 + bloqueio potencial.');
  }

  // 3) MCC alto risco
  const mcc = String(respostas.mcc || respostas.mcc_principal || '').trim();
  if (MCC_ALTO_RISCO.has(mcc)) {
    triggers.push({ codigo: 'TRG-MCC-HIGH-RISK', forca_tier: TIERS.TIER_3, severidade: 'media' });
    motivos.push(`MCC ${mcc} é categorizado como alto risco → Tier 3.`);
  }

  // 4) País FATF blacklist (capability crossborder)
  const paisesDestino = Array.isArray(respostas.paises_destino) ? respostas.paises_destino : [];
  const paisesBlack = paisesDestino.filter((p) => PAISES_FATF_BLACKLIST.has(String(p).toUpperCase()));
  if (paisesBlack.length > 0) {
    triggers.push({ codigo: 'TRG-FATF-BLACKLIST', forca_tier: TIERS.TIER_3, severidade: 'critica', bloqueio_potencial: true });
    motivos.push(`País(es) em lista negra FATF detectado(s): ${paisesBlack.join(', ')} → bloqueio absoluto.`);
  }
  const paisesGrey = paisesDestino.filter((p) => PAISES_FATF_GREYLIST.has(String(p).toUpperCase()));
  if (paisesGrey.length > 0) {
    triggers.push({ codigo: 'TRG-FATF-GREYLIST', forca_tier: TIERS.TIER_3, severidade: 'media' });
    motivos.push(`País(es) em lista cinza FATF: ${paisesGrey.join(', ')} → escalada Tier 3.`);
  }

  // 5) CNPJ recém-criado com capital desproporcional ao TPV
  if (merchantType !== 'PF') {
    const meses = diffMonths(respostas.data_fundacao || bdcSnapshot?.data_fundacao);
    const capital = toNumber(respostas.capital_social || bdcSnapshot?.capital_social);
    const tpvAnual = toNumber(respostas.tpv_mensal_declarado) * 12;
    if (meses !== null && meses < 6 && tpvAnual > capital * 24) {
      triggers.push({ codigo: 'TRG-CNPJ-NOVO-CAPITAL-BAIXO', forca_tier: TIERS.TIER_3, severidade: 'alta' });
      motivos.push(`CNPJ com ${meses} mês(es) + TPV anual projetado (R$${tpvAnual.toLocaleString('pt-BR')}) muito acima do capital social → Tier 3.`);
    }
  }

  // 6) Lista Suja MTE
  if (bdcSnapshot?.lista_suja_mte === true) {
    triggers.push({ codigo: 'TRG-MTE-LISTA-SUJA', forca_tier: null, severidade: 'critica', bloqueio_potencial: true });
    motivos.push('Trabalho escravo confirmado (Lista Suja MTE) → bloqueio absoluto B10.');
  }

  return { triggers, motivos };
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNÇÃO PRINCIPAL — resolve tier dinamicamente
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Engine de tiering dinâmico V5.2.
 *
 * @param {object} input
 * @param {string}  input.segmento          — segmento canônico V5.2
 * @param {string}  input.merchantType      — 'PF' | 'PJ'
 * @param {boolean} input.isSubseller       — true se é subseller
 * @param {number}  input.tpvMensalDeclarado
 * @param {number}  [input.rendaMensalLiquida] — apenas para subseller PF
 * @param {object}  [input.respostas]       — payload de respostas (parcial ok)
 * @param {object}  [input.bdcSnapshot]     — payload BDC opcional (run em runtime sem BDC ainda)
 *
 * @returns {object} {
 *   tier, grau, tier_base, tier_final, capabilities_ativas,
 *   triggers, motivos, escalado
 * }
 */
export function resolverTierDinamico(input) {
  const {
    segmento,
    merchantType = 'PJ',
    isSubseller = false,
    tpvMensalDeclarado = 0,
    rendaMensalLiquida = 0,
    respostas = {},
    bdcSnapshot = null,
  } = input || {};

  // ─── Subseller path ─────────────────────────────────────────────────────
  if (isSubseller) {
    const tier = merchantType === 'PF' ? TIERS.SUBSELLER_PF : TIERS.SUBSELLER_PJ;
    const grau = resolverGrauSubseller({ merchantType, tpvMensalDeclarado, rendaMensalLiquida });
    const capabilities_ativas = resolverCapabilities({ segmento, tier, respostas });
    return {
      tier,
      grau,
      tier_base: tier,
      tier_final: tier,
      capabilities_ativas,
      triggers: [],
      motivos: [`Subseller ${merchantType} grau ${grau} resolvido por ${merchantType === 'PF' ? 'renda mensal' : 'TPV'}.`],
      escalado: false,
    };
  }

  // ─── Tier base por TPV + segmento ──────────────────────────────────────
  const tpv = toNumber(tpvMensalDeclarado);
  let tier_base;
  if (segmento === 'marketplace') {
    tier_base = TIERS.TIER_2;
  } else if (tpv <= TPV_TIER_THRESHOLDS.TIER_1_MAX) {
    tier_base = TIERS.TIER_1;
  } else if (tpv <= TPV_TIER_THRESHOLDS.TIER_2_MAX) {
    tier_base = TIERS.TIER_2;
  } else if (SEGMENTOS_TIER_3_ONLY.includes(segmento)) {
    tier_base = TIERS.TIER_3;
  } else {
    tier_base = TIERS.TIER_2; // cap T2 para segmentos não-T3
  }

  // ─── Avalia triggers ──────────────────────────────────────────────────
  const { triggers, motivos } = avaliarTriggers({ segmento, respostas, bdcSnapshot, merchantType });

  // ─── Tier final = max(tier_base, maior trigger) ───────────────────────
  let tier_final = tier_base;
  for (const t of triggers) {
    if (t.forca_tier === TIERS.TIER_3 && tier_final !== TIERS.TIER_3) {
      tier_final = TIERS.TIER_3;
    }
  }

  // ─── Resolve capabilities ativas ───────────────────────────────────────
  const capabilities_ativas = resolverCapabilities({ segmento, tier: tier_final, respostas });

  return {
    tier: tier_final,
    grau: null,
    tier_base,
    tier_final,
    capabilities_ativas,
    triggers,
    motivos,
    escalado: tier_final !== tier_base,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// SANITY HELPERS — exportados para teste e debug
// ──────────────────────────────────────────────────────────────────────────────
export const _internal = {
  toNumber,
  diffMonths,
  MCC_ALTO_RISCO,
  PAISES_FATF_BLACKLIST,
  PAISES_FATF_GREYLIST,
};