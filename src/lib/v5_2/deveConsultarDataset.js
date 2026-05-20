/**
 * [V5.2] Lógica condicional unificada — decide se um dataset BDC deve ser consultado.
 *
 * Pseudo-código documentado em:
 *   - docs/V5_2_BLOCO6_REDESIGN_ANALISE_RISCO.md §4.6
 *   - 05_ESPECIFICACAO_DATASETS_NA_TELA_V5_1.md §7.2
 *
 * Retorna { consultar: boolean, razao: string | null }
 *
 * `razao` segue o enum NOT_CONSULTED_REASONS (10 valores).
 */

import { NOT_CONSULTED_REASONS } from './constants';

const TIER_ORDEM = {
  tier_1: 1,
  tier_2: 2,
  tier_3: 3,
  subseller_pj: 2,
  subseller_pf: 1,
};

/**
 * @param {Object} dataset - Registro da entidade Dataset
 * @param {string} tier - 'tier_1' | 'tier_2' | 'tier_3' | 'subseller_pj' | 'subseller_pf'
 * @param {string} segmento - código canônico do segmento V5.2
 * @param {string[]} capabilities - capabilities ativas no caso
 * @param {string} morfologia - morfologia A-F
 * @returns {{ consultar: boolean, razao: string | null }}
 */
export function deveConsultarDataset(dataset, tier, segmento, capabilities = [], morfologia = null) {
  if (!dataset) return { consultar: false, razao: 'other' };

  // 0) Dataset inativo (kill switch) ou não contratado
  if (dataset.ativo === false) {
    return { consultar: false, razao: 'cost_optimization' };
  }
  if (dataset.contratado === false) {
    return { consultar: false, razao: 'dataset_not_contracted' };
  }

  // 1) Tier mínimo
  const tierAtual = TIER_ORDEM[tier] ?? 1;
  const tierMinimo = TIER_ORDEM[dataset.tier_minimo_uso] ?? 1;
  if (tierAtual < tierMinimo) {
    return {
      consultar: false,
      razao: tierAtual === 1 ? 'tier_1_below_threshold' : 'tier_2_below_threshold',
    };
  }

  // 2) Segmento
  const segmentosAtivam = dataset.segmentos_ativam || [];
  if (segmentosAtivam.length > 0 && !segmentosAtivam.includes('all')) {
    if (!segmentosAtivam.includes(segmento)) {
      return { consultar: false, razao: 'segment_not_applicable' };
    }
  }

  // 3) Capabilities
  const capabilitiesAtivam = dataset.capabilities_ativam || [];
  if (capabilitiesAtivam.length > 0) {
    const intersect = capabilitiesAtivam.some((c) => capabilities.includes(c));
    if (!intersect) {
      const cap = capabilitiesAtivam[0];
      const razaoKey = `capability_${cap.replace('/', '_')}_not_active`;
      return {
        consultar: false,
        razao: NOT_CONSULTED_REASONS[razaoKey] ? razaoKey : 'capability_crossborder_not_active',
      };
    }
  }

  // 4) Morfologia
  const morfologiasAtivam = dataset.morfologias_ativam || [];
  if (morfologiasAtivam.length > 0 && !morfologiasAtivam.includes('all')) {
    if (morfologia && !morfologiasAtivam.includes(morfologia)) {
      return { consultar: false, razao: 'morfologia_not_applicable' };
    }
  }

  // 5) Trigger especial (datasets sob trigger — ex: first_level_relatives_kyc)
  if (dataset.requires_trigger === true) {
    // Avaliação de trigger é específica por dataset — por padrão, retorna trigger_not_met.
    // O caller deve avaliar o trigger e setar via flag adicional se atendido.
    return { consultar: false, razao: 'trigger_not_met' };
  }

  return { consultar: true, razao: null };
}

/**
 * Retorna a lista de IDs canônicos de datasets que devem ser consultados
 * para um caso específico.
 *
 * @param {Object[]} todosDatasets - Lista completa da entidade Dataset
 * @param {string} tier
 * @param {string} segmento
 * @param {string[]} capabilities
 * @param {string} morfologia
 * @returns {{ aConsultar: string[], naoAplicaveis: Array<{ codigo: string, razao: string }> }}
 */
export function montarListaDatasets(todosDatasets, tier, segmento, capabilities = [], morfologia = null) {
  const aConsultar = [];
  const naoAplicaveis = [];

  for (const ds of todosDatasets) {
    const { consultar, razao } = deveConsultarDataset(ds, tier, segmento, capabilities, morfologia);
    if (consultar) {
      aConsultar.push(ds.codigo);
    } else {
      naoAplicaveis.push({ codigo: ds.codigo, razao });
    }
  }

  return { aConsultar, naoAplicaveis };
}