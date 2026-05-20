/**
 * [V5.2] Dry-run do Tiering Engine V5.2 (Fase 5.3).
 *
 * Endpoint admin-only que aceita um cenário hipotético e retorna o tier resolvido
 * + grau + capabilities + triggers + motivos. Útil para validar o engine
 * antes de integrar no fluxo do questionário, e para a tela V5_2_Status.
 *
 * Payload:
 *   {
 *     segmento: 'ecommerce',
 *     merchantType: 'PJ',
 *     isSubseller: false,
 *     tpvMensalDeclarado: 75000,
 *     rendaMensalLiquida: 0,
 *     respostas: { mcc: '5912', tem_socio_pep: true, opera_internacional: true, paises_destino: ['IR'] },
 *     bdcSnapshot: null
 *   }
 *
 * Engine é puro JS — replicamos o código aqui pois backend functions não podem
 * importar de lib/* (deploy independente).
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES (replicadas de lib/v5_2/constants.js e tiers.js)
// ─────────────────────────────────────────────────────────────────────────────
const TIERS = {
  TIER_1: 'tier_1',
  TIER_2: 'tier_2',
  TIER_3: 'tier_3',
  SUBSELLER_PJ: 'subseller_pj',
  SUBSELLER_PF: 'subseller_pf',
};

const TPV_TIER_THRESHOLDS = { TIER_1_MAX: 50_000, TIER_2_MAX: 500_000 };
const SEGMENTOS_TIER_3_ONLY = ['marketplace', 'gateway', 'crossborder'];

const CAPABILITIES_CANONICAS = {
  'splits/subseller': { obrigatoria_para: ['marketplace'], forca_ativacao_em: ['gateway'] },
  'crossborder': { obrigatoria_para: ['crossborder'], forca_ativacao_em: ['dropshipping'] },
  'recurrence': { obrigatoria_para: ['saas'], forca_ativacao_em: [] },
  'cap_financial_capacity_validation': { obrigatoria_para: [], forca_ativacao_em: ['gateway', 'marketplace', 'dropshipping', 'crossborder'] },
};

const GRAU_SUBSELLER_PJ_THRESHOLDS = { A_MAX_TPV_MENSAL: 30_000, B_MAX_TPV_MENSAL: 200_000 };
const GRAU_SUBSELLER_PF_THRESHOLDS = { A_MAX_RENDA_MENSAL: 2_000, B_MAX_RENDA_MENSAL: 10_000 };

const MCC_ALTO_RISCO = new Set(['5912', '5993', '7995', '6051', '6211', '5816', '5817', '5818', '4829', '5967']);
const PAISES_FATF_BLACKLIST = new Set(['IR', 'KP', 'MM']);
const PAISES_FATF_GREYLIST = new Set(['SY', 'VE', 'YE', 'AF', 'NI', 'TR', 'AE']);

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
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

function resolverGrauSubseller({ merchantType, tpvMensalDeclarado, rendaMensalLiquida }) {
  if (merchantType === 'PF') {
    const renda = toNumber(rendaMensalLiquida);
    if (renda < GRAU_SUBSELLER_PF_THRESHOLDS.A_MAX_RENDA_MENSAL) return 'A';
    if (renda <= GRAU_SUBSELLER_PF_THRESHOLDS.B_MAX_RENDA_MENSAL) return 'B';
    return 'C';
  }
  const tpv = toNumber(tpvMensalDeclarado);
  if (tpv <= GRAU_SUBSELLER_PJ_THRESHOLDS.A_MAX_TPV_MENSAL) return 'A';
  if (tpv <= GRAU_SUBSELLER_PJ_THRESHOLDS.B_MAX_TPV_MENSAL) return 'B';
  return 'C';
}

function resolverCapabilities({ segmento, tier, respostas = {} }) {
  const ativas = new Set();
  for (const [codigo, conf] of Object.entries(CAPABILITIES_CANONICAS)) {
    if ((conf.obrigatoria_para || []).includes(segmento)) ativas.add(codigo);
    if ((conf.forca_ativacao_em || []).includes(segmento)) ativas.add(codigo);
  }
  if (tier === TIERS.TIER_2 || tier === TIERS.TIER_3) ativas.add('cap_financial_capacity_validation');
  if (respostas.opera_internacional === true || respostas.opera_internacional === 'sim') ativas.add('crossborder');
  if (toNumber(respostas.pct_volume_internacional) > 0) ativas.add('crossborder');
  if (respostas.modelo_cobranca === 'recorrente' || respostas.tem_assinatura === true) ativas.add('recurrence');
  if (respostas.opera_splits === true || respostas.tem_subseller === true) ativas.add('splits/subseller');
  return Array.from(ativas);
}

function avaliarTriggers({ segmento, respostas, bdcSnapshot, merchantType }) {
  const triggers = [];
  const motivos = [];

  if (respostas.tem_socio_pep === true || respostas.pep === 'sim') {
    triggers.push({ codigo: 'TRG-PEP-DECLARED', forca_tier: TIERS.TIER_3, severidade: 'alta' });
    motivos.push('Sócio PEP declarado → exige Tier 3.');
  }
  if (bdcSnapshot?.sancao_detectada === true) {
    triggers.push({ codigo: 'TRG-SANCTION-BDC', forca_tier: TIERS.TIER_3, severidade: 'critica', bloqueio_potencial: true });
    motivos.push('Sanção detectada em base BDC → Tier 3 + bloqueio potencial.');
  }
  const mcc = String(respostas.mcc || respostas.mcc_principal || '').trim();
  if (MCC_ALTO_RISCO.has(mcc)) {
    triggers.push({ codigo: 'TRG-MCC-HIGH-RISK', forca_tier: TIERS.TIER_3, severidade: 'media' });
    motivos.push(`MCC ${mcc} é categorizado como alto risco → Tier 3.`);
  }
  const paisesDestino = Array.isArray(respostas.paises_destino) ? respostas.paises_destino : [];
  const paisesBlack = paisesDestino.filter((p) => PAISES_FATF_BLACKLIST.has(String(p).toUpperCase()));
  if (paisesBlack.length > 0) {
    triggers.push({ codigo: 'TRG-FATF-BLACKLIST', forca_tier: TIERS.TIER_3, severidade: 'critica', bloqueio_potencial: true });
    motivos.push(`País(es) em lista negra FATF: ${paisesBlack.join(', ')} → bloqueio absoluto.`);
  }
  const paisesGrey = paisesDestino.filter((p) => PAISES_FATF_GREYLIST.has(String(p).toUpperCase()));
  if (paisesGrey.length > 0) {
    triggers.push({ codigo: 'TRG-FATF-GREYLIST', forca_tier: TIERS.TIER_3, severidade: 'media' });
    motivos.push(`País(es) em lista cinza FATF: ${paisesGrey.join(', ')} → escalada Tier 3.`);
  }
  if (merchantType !== 'PF') {
    const meses = diffMonths(respostas.data_fundacao || bdcSnapshot?.data_fundacao);
    const capital = toNumber(respostas.capital_social || bdcSnapshot?.capital_social);
    const tpvAnual = toNumber(respostas.tpv_mensal_declarado) * 12;
    if (meses !== null && meses < 6 && tpvAnual > capital * 24) {
      triggers.push({ codigo: 'TRG-CNPJ-NOVO-CAPITAL-BAIXO', forca_tier: TIERS.TIER_3, severidade: 'alta' });
      motivos.push(`CNPJ com ${meses} mês(es) + TPV anual projetado muito acima do capital social → Tier 3.`);
    }
  }
  if (bdcSnapshot?.lista_suja_mte === true) {
    triggers.push({ codigo: 'TRG-MTE-LISTA-SUJA', forca_tier: null, severidade: 'critica', bloqueio_potencial: true });
    motivos.push('Trabalho escravo confirmado (Lista Suja MTE) → bloqueio absoluto B10.');
  }
  return { triggers, motivos };
}

function resolverTierDinamico(input) {
  const {
    segmento,
    merchantType = 'PJ',
    isSubseller = false,
    tpvMensalDeclarado = 0,
    rendaMensalLiquida = 0,
    respostas = {},
    bdcSnapshot = null,
  } = input || {};

  if (isSubseller) {
    const tier = merchantType === 'PF' ? TIERS.SUBSELLER_PF : TIERS.SUBSELLER_PJ;
    const grau = resolverGrauSubseller({ merchantType, tpvMensalDeclarado, rendaMensalLiquida });
    return {
      tier, grau, tier_base: tier, tier_final: tier,
      capabilities_ativas: resolverCapabilities({ segmento, tier, respostas }),
      triggers: [], motivos: [`Subseller ${merchantType} grau ${grau}.`], escalado: false,
    };
  }

  const tpv = toNumber(tpvMensalDeclarado);
  let tier_base;
  if (segmento === 'marketplace') tier_base = TIERS.TIER_2;
  else if (tpv <= TPV_TIER_THRESHOLDS.TIER_1_MAX) tier_base = TIERS.TIER_1;
  else if (tpv <= TPV_TIER_THRESHOLDS.TIER_2_MAX) tier_base = TIERS.TIER_2;
  else if (SEGMENTOS_TIER_3_ONLY.includes(segmento)) tier_base = TIERS.TIER_3;
  else tier_base = TIERS.TIER_2;

  const { triggers, motivos } = avaliarTriggers({ segmento, respostas, bdcSnapshot, merchantType });
  let tier_final = tier_base;
  for (const t of triggers) {
    if (t.forca_tier === TIERS.TIER_3 && tier_final !== TIERS.TIER_3) tier_final = TIERS.TIER_3;
  }
  return {
    tier: tier_final, grau: null, tier_base, tier_final,
    capabilities_ativas: resolverCapabilities({ segmento, tier: tier_final, respostas }),
    triggers, motivos, escalado: tier_final !== tier_base,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const result = resolverTierDinamico(body);
    return Response.json({ ok: true, input: body, result });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});