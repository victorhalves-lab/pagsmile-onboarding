/**
 * Utilitário para calcular limites de taxas baseados no parceiro selecionado.
 * 
 * Regras:
 * - MDR: Taxa do parceiro como mínimo, parceiro + 30% como máximo
 * - Fees fixas (transactionFee, antifraude, 3DS): Mínimo = valor do parceiro (exceto Tuna)
 * - Tuna: Sem restrições de mínimo para fees fixas
 */

const FAIXAS_MDR = ['debito', 'avista', 'de2a6x', 'de7a12x', 'de13a24x'];
const FAIXAS_PROPOSTA = ['avista', 'de2a6x', 'de7a12x', 'de13a21x'];
const BANDEIRAS = ['visa', 'mastercard', 'elo', 'amex', 'outras', 'hiper'];

// Mapeia faixas da proposta para faixas do parceiro
const FAIXA_MAP = {
  'avista': 'avista',
  'de2a6x': 'de2a6x',
  'de7a12x': 'de7a12x',
  'de13a21x': 'de13a24x',
};

/**
 * Retorna os limites de MDR para uma bandeira e faixa específica.
 * A taxa do parceiro está em DECIMAL (ex: 0.0150 = 1.50%).
 * Os limites retornados estão em PERCENTUAL (ex: 1.50).
 */
export function getMDRLimits(partner, clientMcc, bandeira, faixaProposta) {
  if (!partner?.mdrByMcc?.length) return null;

  const faixaParceiro = FAIXA_MAP[faixaProposta] || faixaProposta;

  // Encontrar bloco de MCC: primeiro exato, depois "Demais", depois primeiro disponível
  const mccBlock = partner.mdrByMcc.find(m => m.mccCode === clientMcc)
    || partner.mdrByMcc.find(m => ['Demais', 'demais', 'DEMAIS', 'default'].includes(m.mccCode))
    || partner.mdrByMcc[0];

  if (!mccBlock?.rates?.[bandeira]) return null;

  const taxaBaseDecimal = mccBlock.rates[bandeira][faixaParceiro];
  if (taxaBaseDecimal === undefined || taxaBaseDecimal === null) return null;

  // Converter de decimal para percentual (0.015 -> 1.50)
  const taxaBase = taxaBaseDecimal * 100;
  const taxaMin = taxaBase;
  const taxaMax = taxaBase * 1.30; // +30%

  return { taxaBase, taxaMin, taxaMax };
}

/**
 * Retorna os limites para fees fixas (R$).
 * Para Tuna, não há mínimo.
 */
export function getFeeLimits(partner, feeField) {
  if (!partner) return null;

  const isTuna = (partner.name || '').toLowerCase().includes('tuna');
  const feeMap = {
    'feeTransacao': partner.transactionFee,
    'antifraude': partner.antifraudCost,
    'taxa3ds': partner.threeDSCost,
  };

  const partnerFee = feeMap[feeField];
  if (partnerFee === undefined || partnerFee === null) return null;

  return {
    minFee: isTuna ? 0 : partnerFee,
    partnerFee,
    isTuna,
  };
}

/**
 * Valida se uma taxa MDR está dentro dos limites.
 * taxaValue em percentual (ex: 2.50)
 */
export function validateMDR(partner, clientMcc, bandeira, faixaProposta, taxaValue) {
  const limits = getMDRLimits(partner, clientMcc, bandeira, faixaProposta);
  if (!limits) return { valid: true, limits: null };

  const val = parseFloat(taxaValue) || 0;
  if (val === 0) return { valid: true, limits };

  return {
    valid: val >= limits.taxaMin && val <= limits.taxaMax,
    belowMin: val < limits.taxaMin,
    aboveMax: val > limits.taxaMax,
    limits,
  };
}

/**
 * Valida se uma fee fixa está dentro dos limites.
 */
export function validateFee(partner, feeField, feeValue) {
  const limits = getFeeLimits(partner, feeField);
  if (!limits) return { valid: true, limits: null };

  const val = parseFloat(String(feeValue).replace(/\./g, '').replace(',', '.')) || 0;
  if (val === 0) return { valid: true, limits };

  return {
    valid: val >= limits.minFee,
    belowMin: val < limits.minFee,
    limits,
  };
}