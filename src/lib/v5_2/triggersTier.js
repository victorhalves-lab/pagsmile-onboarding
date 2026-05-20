// ─────────────────────────────────────────────────────────────────────
// V5.2 — Triggers Tier Real-Time (14 gatilhos canônicos)
// ─────────────────────────────────────────────────────────────────────
// Função PURA: recebe dados estruturados, retorna { tier_ajustado, triggers_disparados }.
// NÃO faz I/O, NÃO chama APIs.
//
// Princípio: o tier resolvido por TPV (resolverTier base) pode ser ESCALADO
// para cima quando triggers de risco específicos são detectados. NUNCA escala
// para baixo (downward é controlado por aprovação manual, não automático).
//
// Os 14 triggers seguem DOC4 Bloco 3 §3.4.
// ─────────────────────────────────────────────────────────────────────

import { TIERS } from './tiers';

export const TRIGGERS_TIER = {
  PEP_SOCIO: 'pep_socio',                          // sócio é PEP
  SANCAO_INTERNACIONAL: 'sancao_internacional',    // qualquer sanção OFAC/UE/ONU
  PROCESSO_CRIMINAL_SOCIO: 'processo_criminal_socio',
  MCC_ALTO_RISCO: 'mcc_alto_risco',
  TPV_INCOMPATIVEL_CAPITAL: 'tpv_incompativel_capital',
  EMPRESA_RECEM_ABERTA: 'empresa_recem_aberta',    // < 6 meses
  CAPITAL_SOCIAL_BAIXO: 'capital_social_baixo',    // < R$1k em PJ Tier 2+
  CROSSBORDER_OPERACAO: 'crossborder_operacao',
  SETOR_REGULADO_SEM_LICENCA: 'setor_regulado_sem_licenca',
  MULTI_MEI_PULVERIZACAO: 'multi_mei_pulverizacao',
  HISTORICO_CHARGEBACK_ALTO: 'historico_chargeback_alto',
  RECLAMACOES_GRAVES: 'reclamacoes_graves',
  ENDERECO_VIRTUAL_SUSPEITO: 'endereco_virtual_suspeito',
  DOMINIO_RECENTE: 'dominio_recente',              // domínio < 90 dias
};

// Triggers que FORÇAM escalada para Tier 3 (revisão profunda obrigatória)
const TRIGGERS_FORCAM_T3 = [
  TRIGGERS_TIER.SANCAO_INTERNACIONAL,
  TRIGGERS_TIER.PROCESSO_CRIMINAL_SOCIO,
  TRIGGERS_TIER.PEP_SOCIO,
];

// Triggers que ESCALAM Tier 1 → Tier 2 (validação reforçada)
const TRIGGERS_T1_PARA_T2 = [
  TRIGGERS_TIER.MCC_ALTO_RISCO,
  TRIGGERS_TIER.EMPRESA_RECEM_ABERTA,
  TRIGGERS_TIER.CAPITAL_SOCIAL_BAIXO,
  TRIGGERS_TIER.MULTI_MEI_PULVERIZACAO,
  TRIGGERS_TIER.ENDERECO_VIRTUAL_SUSPEITO,
  TRIGGERS_TIER.DOMINIO_RECENTE,
  TRIGGERS_TIER.HISTORICO_CHARGEBACK_ALTO,
  TRIGGERS_TIER.RECLAMACOES_GRAVES,
  TRIGGERS_TIER.TPV_INCOMPATIVEL_CAPITAL,
];

/**
 * Avalia os 14 triggers contra os dados disponíveis e retorna lista disparada.
 * @param {Object} input
 * @param {Object} input.merchant - dados PJ/PF
 * @param {Object} input.bdcData - resultado de enriquecimento BDC (pode estar vazio)
 * @param {Object} input.questionario - flags extraídas do questionário
 * @param {Object} input.contexto - { tpvDeclarado, segmento, morfologia }
 * @returns {string[]} códigos dos triggers disparados
 */
export function avaliarTriggersTier({ merchant = {}, bdcData = {}, questionario = {}, contexto = {} }) {
  const disparados = [];

  // 1. PEP entre sócios
  if (questionario.tem_socio_pep === true || bdcData.has_pep === true) {
    disparados.push(TRIGGERS_TIER.PEP_SOCIO);
  }

  // 2. Sanção internacional
  if (bdcData.has_international_sanction === true || questionario.tem_sancao === true) {
    disparados.push(TRIGGERS_TIER.SANCAO_INTERNACIONAL);
  }

  // 3. Processo criminal grave
  if (bdcData.has_criminal_lawsuit === true) {
    disparados.push(TRIGGERS_TIER.PROCESSO_CRIMINAL_SOCIO);
  }

  // 4. MCC alto risco
  const MCC_ALTO_RISCO = ['7995', '5993', '5816', '6051', '5967', '7273'];
  if (MCC_ALTO_RISCO.includes(String(merchant.mcc || questionario.mcc || ''))) {
    disparados.push(TRIGGERS_TIER.MCC_ALTO_RISCO);
  }

  // 5. TPV declarado >> capital social (proxy de incompatibilidade)
  const tpvAnual = (Number(contexto.tpvDeclarado) || 0) * 12;
  const capital = Number(bdcData.capital_social) || Number(merchant.capital_social) || 0;
  if (capital > 0 && tpvAnual > capital * 24) {
    disparados.push(TRIGGERS_TIER.TPV_INCOMPATIVEL_CAPITAL);
  }

  // 6. Empresa recém-aberta (< 6 meses)
  if (bdcData.idade_empresa_meses != null && bdcData.idade_empresa_meses < 6) {
    disparados.push(TRIGGERS_TIER.EMPRESA_RECEM_ABERTA);
  }

  // 7. Capital social baixo (PJ Tier 2+ com capital < R$1k)
  if (merchant.type === 'PJ' && capital > 0 && capital < 1000) {
    disparados.push(TRIGGERS_TIER.CAPITAL_SOCIAL_BAIXO);
  }

  // 8. Crossborder
  if (contexto.morfologia === 'b2c_crossborder' || contexto.morfologia === 'b2b_crossborder' || contexto.segmento === 'crossborder') {
    disparados.push(TRIGGERS_TIER.CROSSBORDER_OPERACAO);
  }

  // 9. Setor regulado sem licença
  const SETORES_REGULADOS = ['educacao', 'foodtech', 'plataforma_vertical'];
  if (SETORES_REGULADOS.includes(contexto.segmento) && questionario.tem_licenca_setorial === false) {
    disparados.push(TRIGGERS_TIER.SETOR_REGULADO_SEM_LICENCA);
  }

  // 10. Multi-MEI
  if (contexto.morfologia === 'multi_mei' || questionario.tem_multiplos_meis === true) {
    disparados.push(TRIGGERS_TIER.MULTI_MEI_PULVERIZACAO);
  }

  // 11. Chargeback alto histórico
  if (questionario.chargeback_pct != null && Number(questionario.chargeback_pct) > 2) {
    disparados.push(TRIGGERS_TIER.HISTORICO_CHARGEBACK_ALTO);
  }

  // 12. Reclamações graves (Reclame Aqui / Procon)
  if (bdcData.reclamacoes_graves_count != null && bdcData.reclamacoes_graves_count > 5) {
    disparados.push(TRIGGERS_TIER.RECLAMACOES_GRAVES);
  }

  // 13. Endereço virtual suspeito
  if (bdcData.endereco_tipo === 'virtual' || questionario.endereco_virtual === true) {
    disparados.push(TRIGGERS_TIER.ENDERECO_VIRTUAL_SUSPEITO);
  }

  // 14. Domínio recente
  if (bdcData.dominio_idade_dias != null && bdcData.dominio_idade_dias < 90) {
    disparados.push(TRIGGERS_TIER.DOMINIO_RECENTE);
  }

  return disparados;
}

/**
 * Resolve tier final com triggers — chamada após resolverTier base.
 * NUNCA escala para baixo. Subseller nunca é escalado.
 *
 * @param {string} tierBase - tier resolvido pelo TPV (resolverTier de tiers.js)
 * @param {string[]} triggersDisparados - lista de TRIGGERS_TIER.*
 * @returns {{ tier_final: string, escalado: boolean, motivo: string }}
 */
export function resolverTierComTriggers(tierBase, triggersDisparados = []) {
  // Subsellers não escalam por triggers — fluxo próprio
  if (tierBase === TIERS.SUBSELLER_PJ || tierBase === TIERS.SUBSELLER_PF) {
    return { tier_final: tierBase, escalado: false, motivo: 'Subseller — fluxo dedicado' };
  }

  // Triggers que forçam T3
  const temForcaT3 = triggersDisparados.some((t) => TRIGGERS_FORCAM_T3.includes(t));
  if (temForcaT3) {
    return {
      tier_final: TIERS.TIER_3,
      escalado: tierBase !== TIERS.TIER_3,
      motivo: `Triggers de núcleo regulatório forçam Tier 3: ${triggersDisparados.filter((t) => TRIGGERS_FORCAM_T3.includes(t)).join(', ')}`,
    };
  }

  // Tier 1 com triggers T1→T2: escala
  if (tierBase === TIERS.TIER_1) {
    const escaladores = triggersDisparados.filter((t) => TRIGGERS_T1_PARA_T2.includes(t));
    if (escaladores.length > 0) {
      return {
        tier_final: TIERS.TIER_2,
        escalado: true,
        motivo: `Triggers escalam T1→T2: ${escaladores.join(', ')}`,
      };
    }
  }

  return { tier_final: tierBase, escalado: false, motivo: 'Sem triggers de escalada' };
}