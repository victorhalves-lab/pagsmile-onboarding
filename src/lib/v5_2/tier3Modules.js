// ─────────────────────────────────────────────────────────────────────
// V5.2 Fase 3b — Tier 3 com 9 Módulos Especializados
// ─────────────────────────────────────────────────────────────────────
// FUNDAMENTO: DOC4 Bloco 3 (Tier 3 — 9 módulos) + DELTA_SEGMENTOS Cap. 4.
//
// Cada módulo é DECLARATIVO: define quando se ativa (segmento, capability,
// resposta declarada), quais datasets exige, quais bloqueios pode disparar,
// e qual o ajuste de score adicional na C2 (morfologia) ou C4 (capabilities).
//
// O engine de scoring usa `resolverModulosT3Ativos()` para descobrir quais
// módulos rodam, e `aplicarPenalidadesT3()` para calcular impacto agregado.
//
// FUNÇÃO PURA: sem I/O, sem DB. Pipeline orquestra.
// ─────────────────────────────────────────────────────────────────────

import { TIERS } from './tiers';

/**
 * Catálogo canônico dos 9 módulos Tier 3.
 * Ordem segue DOC4 Bloco 3 §3.3.
 */
export const TIER_3_MODULES = {
  M_GW: {
    codigo: 'M_GW',
    nome: 'Módulo Gateway / PSP / BaaS',
    short: 'Gateway',
    fundamentacao: 'Circ. BCB 3.978 + Resol. BCB 80/2021 (sub-credenciamento)',
    segmentos: ['gateway'],
    capabilities_requeridas: ['splits/subseller', 'cap_financial_capacity_validation'],
    datasets_requeridos: ['basic_data', 'owners_kyc', 'financial_market', 'kyb_company_search'],
    bloqueios_possiveis: ['B-GW-PCI-CRIT-1', 'B-GW-SUB-1', 'B-GW-BAAS-1'],
    variavel_score: 'v_cap_splits_kyc_completeness',
    penalidade_se_falha: -60,
    penalidade_se_warning: -25,
    icon: '🔗',
  },
  M_MKT: {
    codigo: 'M_MKT',
    nome: 'Módulo Marketplace',
    short: 'Marketplace',
    fundamentacao: 'CDC + Resol. BCB 80/2021 + Lei 14.181/2021 (Marketplace)',
    segmentos: ['marketplace'],
    capabilities_requeridas: ['splits/subseller'],
    datasets_requeridos: ['basic_data', 'owners_kyc', 'kyb_company_search', 'business_identity'],
    bloqueios_possiveis: ['B-MKT-PROD-CRIT-1', 'B-MKT-SUB-1', 'B-MKT-VOL-1'],
    variavel_score: 'v_cap_splits_kyc_completeness',
    penalidade_se_falha: -50,
    penalidade_se_warning: -20,
    icon: '🏪',
  },
  M_PV: {
    codigo: 'M_PV',
    nome: 'Módulo Plataforma Vertical (fan-out)',
    short: 'Plat. Vertical',
    fundamentacao: 'Setor-específico: ANS (saúde), ANP, MAPA, CVM conforme vertical',
    segmentos: ['plataforma_vertical'],
    capabilities_requeridas: ['splits/subseller'],
    datasets_requeridos: ['basic_data', 'activity_indicators', 'mcc', 'sectoral_licenses'],
    bloqueios_possiveis: ['B-PV-LGPD-1-CRIT', 'B-PV-SETOR-1', 'B-PV-LICENCA-1'],
    variavel_score: 'v_cap_sectoral_compliance',
    penalidade_se_falha: -45,
    penalidade_se_warning: -18,
    icon: '📱',
    fan_out: true, // ativa sub-módulos por vertical (saude/foodtech/educacao)
  },
  M_DS: {
    codigo: 'M_DS',
    nome: 'Módulo Dropshipping',
    short: 'Dropshipping',
    fundamentacao: 'CDC + Decreto 7.962/2013 + COFI/CVM (importação digital)',
    segmentos: ['dropshipping'],
    capabilities_requeridas: ['cap_financial_capacity_validation', 'crossborder'],
    datasets_requeridos: ['basic_data', 'financial_market', 'country_risk_index', 'sanctions_international'],
    bloqueios_possiveis: ['B-DS-FORN-CRIT-1', 'B-DS-IMP-1', 'B-DS-CB-1'],
    variavel_score: 'v_financial_coherence',
    penalidade_se_falha: -55,
    penalidade_se_warning: -22,
    icon: '📦',
  },
  M_INFO: {
    codigo: 'M_INFO',
    nome: 'Módulo Infoprodutos',
    short: 'Infoprodutos',
    fundamentacao: 'CDC + CVM (mercado de capitais se trading) + Resol. CFC 1.000',
    segmentos: ['infoprodutos'],
    capabilities_requeridas: [],
    datasets_requeridos: ['basic_data', 'owners_kyc', 'reclame_aqui', 'media_adverse'],
    bloqueios_possiveis: ['B-INFO-CHRG-1', 'B-INFO-AFI-1', 'B-INFO-CVM-1'],
    variavel_score: 'v_historico_chargeback',
    penalidade_se_falha: -40,
    penalidade_se_warning: -15,
    icon: '🎓',
  },
  M_TUR: {
    codigo: 'M_TUR',
    nome: 'Módulo Turismo',
    short: 'Turismo',
    fundamentacao: 'Lei 11.771/2008 + CADASTUR + Resol. ANAC + ICAO',
    segmentos: ['turismo'],
    capabilities_requeridas: ['cap_financial_capacity_validation'],
    datasets_requeridos: ['basic_data', 'cadastur_active', 'financial_market', 'reclame_aqui'],
    bloqueios_possiveis: ['B-TUR-CAD-1', 'B-TUR-FIN-1', 'B-TUR-SAZ-1'],
    variavel_score: 'v_financial_coherence',
    penalidade_se_falha: -45,
    penalidade_se_warning: -18,
    icon: '✈️',
  },
  M_EVT: {
    codigo: 'M_EVT',
    nome: 'Módulo Eventos',
    short: 'Eventos',
    fundamentacao: 'Lei 12.933/2013 (meia-entrada) + AVCB + ECAD + Lei 14.597/2023',
    segmentos: ['eventos'],
    capabilities_requeridas: ['cap_financial_capacity_validation'],
    datasets_requeridos: ['basic_data', 'financial_market', 'reclame_aqui', 'media_adverse'],
    bloqueios_possiveis: ['B-EVT-AVCB-1', 'B-EVT-OVER-1', 'B-EVT-FIN-1'],
    variavel_score: 'v_financial_coherence',
    penalidade_se_falha: -50,
    penalidade_se_warning: -20,
    icon: '🎫',
  },
  M_SPL: {
    codigo: 'M_SPL',
    nome: 'Módulo Splits/Subseller (transversal)',
    short: 'Splits',
    fundamentacao: 'Resol. BCB 80/2021 + Circ. BCB 3.978 Art. 19',
    // É TRANSVERSAL: dispara em qualquer segmento que tenha splits/subseller ativo
    segmentos: ['all'],
    capabilities_requeridas: ['splits/subseller'],
    datasets_requeridos: ['basic_data', 'owners_kyc', 'kyb_company_search'],
    bloqueios_possiveis: ['B-SPL-KYC-1', 'B-SPL-VOL-1', 'B-SPL-PEP-1'],
    variavel_score: 'v_cap_splits_kyc_completeness',
    penalidade_se_falha: -50,
    penalidade_se_warning: -20,
    icon: '🔀',
    transversal: true,
  },
  M_CB: {
    codigo: 'M_CB',
    nome: 'Módulo Crossborder pesado',
    short: 'Crossborder',
    fundamentacao: 'FATF + OFAC + UK HMT + UN + EU + Circ. BCB 3.978 Art. 22',
    segmentos: ['crossborder'],
    capabilities_requeridas: ['crossborder', 'cap_financial_capacity_validation'],
    datasets_requeridos: [
      'basic_data',
      'sanctions_international',
      'sanctions_ofac',
      'sanctions_uk_hmt',
      'sanctions_un',
      'country_risk_index',
      'pep_international',
    ],
    bloqueios_possiveis: ['B-CB-PAIS-CRIT-1', 'B-CB-SANC-1', 'B-CB-FATF-1'],
    variavel_score: 'v_cap_crossborder_sanctions_clean',
    penalidade_se_falha: -80,
    penalidade_se_warning: -30,
    icon: '🌍',
  },
};

export const TIER_3_MODULE_CODES = Object.keys(TIER_3_MODULES);

/**
 * Resolve quais módulos T3 estão ativos para o contexto.
 *
 * Um módulo é ativado quando:
 *  - o tier é tier_3 (módulos T3 só rodam em Tier 3), E
 *  - o segmento bate (ou o módulo é transversal com 'all'), E
 *  - todas as capabilities requeridas estão na lista de capabilities ativas
 *    (ou o módulo não tem capabilities requeridas)
 *
 * @param {Object} ctx
 * @param {string} ctx.tier
 * @param {string} ctx.segmento
 * @param {string[]} ctx.capabilities_ativas
 * @returns {Array<{codigo, nome, ...module}>}
 */
export function resolverModulosT3Ativos({ tier, segmento, capabilities_ativas = [] }) {
  if (tier !== TIERS.TIER_3) return [];

  const ativos = [];

  for (const mod of Object.values(TIER_3_MODULES)) {
    // Filtro 1: segmento
    const segs = mod.segmentos || [];
    const segmentoMatch =
      segs.includes('all') ||
      segs.includes(segmento) ||
      (mod.transversal && capabilities_ativas.includes('splits/subseller'));
    if (!segmentoMatch) continue;

    // Filtro 2: capabilities
    const caps = mod.capabilities_requeridas || [];
    if (caps.length > 0) {
      const todasAtivas = caps.every((c) => capabilities_ativas.includes(c));
      if (!todasAtivas && !mod.transversal) continue;
      if (!todasAtivas && mod.transversal) continue;
    }

    ativos.push(mod);
  }

  return ativos;
}

/**
 * Calcula penalidades agregadas dos módulos T3 ativos.
 * Usa `resultadosCapabilities` (mesmo input usado em C4 do scoring) para
 * decidir status pass/warning/fail por módulo.
 *
 * Lógica de status:
 *   - Se alguma capability requerida do módulo está em 'fail' → módulo fail
 *   - Senão, se alguma está em 'warning' → módulo warning
 *   - Senão → módulo pass (sem penalidade)
 *
 * @param {Array} modulosAtivos
 * @param {Object} resultadosCapabilities - { 'splits/subseller': { status }, ... }
 * @returns {{ total: number, detalhes: Array<{codigo, status, penalidade, motivo}> }}
 */
export function aplicarPenalidadesT3(modulosAtivos = [], resultadosCapabilities = {}) {
  let total = 0;
  const detalhes = [];

  for (const mod of modulosAtivos) {
    const caps = mod.capabilities_requeridas || [];
    let status = 'pass';

    for (const cap of caps) {
      const res = resultadosCapabilities[cap];
      if (!res) continue;
      if (res.status === 'fail') {
        status = 'fail';
        break;
      }
      if (res.status === 'warning' && status !== 'fail') {
        status = 'warning';
      }
    }

    let penalidade = 0;
    if (status === 'fail') penalidade = mod.penalidade_se_falha;
    else if (status === 'warning') penalidade = mod.penalidade_se_warning;

    total += penalidade;
    detalhes.push({
      codigo: mod.codigo,
      nome: mod.nome,
      status,
      penalidade,
      motivo:
        status === 'pass'
          ? `${mod.short}: OK`
          : `${mod.short}: ${status} → ${penalidade}`,
    });
  }

  return { total, detalhes };
}

/**
 * Helper: retorna apenas códigos dos bloqueios que os módulos T3 ativos
 * podem disparar. Útil para o pipeline pré-filtrar o catálogo de bloqueios.
 */
export function bloqueiosPossiveisT3(modulosAtivos = []) {
  const set = new Set();
  for (const mod of modulosAtivos) {
    (mod.bloqueios_possiveis || []).forEach((b) => set.add(b));
  }
  return Array.from(set);
}

/**
 * Helper: lista todos os datasets requeridos pelos módulos T3 ativos.
 * O pipeline usa para garantir que esses datasets foram consultados.
 */
export function datasetsRequeridosT3(modulosAtivos = []) {
  const set = new Set();
  for (const mod of modulosAtivos) {
    (mod.datasets_requeridos || []).forEach((d) => set.add(d));
  }
  return Array.from(set);
}