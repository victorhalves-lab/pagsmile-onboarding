/**
 * Calculadora de Taxas Pagsmile
 * Replica EXATAMENTE a lógica de calcularTabelaParcelas de ParcelasTable.jsx
 */

/**
 * Calcula o custo efetivo de uma transação com cartão de crédito
 * @param {number} amount - Valor da transação (ticket médio) em R$
 * @param {number} installments - Número de parcelas (1 a 21)
 * @param {string} prazoOption - Prazo de recebimento: "D+1", "D+2", "D+7", "D+15", "D+30", "FLUXO"
 * @param {object} segmentRates - Objeto com as taxas do segmento selecionado
 * @returns {object} Resultado detalhado do cálculo
 */
export function calculateTransactionCost(amount, installments, prazoOption, segmentRates) {
  if (!segmentRates || !amount || amount <= 0 || !installments || installments < 1) {
    return {
      valorMDR: 0,
      taxaMDR: 0,
      taxasFixas: 0,
      valorAntecipacao: 0,
      taxaAntecipacaoMedia: 0,
      custoTotal: 0,
      valorLiquido: amount || 0,
      taxaEfetiva: 0,
    };
  }

  const {
    mdrAvista = 0, mdr2a6x = 0, mdr7a12x = 0, mdr13a21x = 0,
    percentualAntecipacao = 0, feeTransacao = 0, antifraude = 0, taxa3ds = 0,
  } = segmentRates;

  // 1. Determinar MDR aplicável com base no número de parcelas
  let taxaMDR = 0;
  if (installments === 1) {
    taxaMDR = mdrAvista;
  } else if (installments <= 6) {
    taxaMDR = mdr2a6x;
  } else if (installments <= 12) {
    taxaMDR = mdr7a12x;
  } else {
    taxaMDR = mdr13a21x;
  }

  // 2. Calcular valor MDR
  const valorMDR = amount * (taxaMDR / 100);

  // 3. Calcular taxas fixas
  const taxasFixas = feeTransacao + antifraude + taxa3ds;

  // 4. Calcular antecipação — LÓGICA EXATA do ParcelasTable.jsx
  // Cada sub-parcela i (de 1 a N) vence em D+(i*30).
  // Custo de antecipar sub-parcela i para D+prazo = RAV × max(0, i×30 - prazo) / 30
  // CET antecipação = média das N sub-parcelas
  let taxaAntecipacaoMedia = 0;
  let valorAntecipacao = 0;

  const prazoDias = prazoOption === 'FLUXO' ? 0 : (parseInt(String(prazoOption).replace('D+', '')) || 1);

  if (prazoOption !== 'FLUXO' && percentualAntecipacao > 0) {
    let somaAntecip = 0;
    for (let i = 1; i <= installments; i++) {
      const diasVencimento = i * 30;
      const diasAntecipados = diasVencimento - prazoDias;
      if (diasAntecipados > 0) {
        somaAntecip += (diasAntecipados / 30) * percentualAntecipacao;
      }
    }
    taxaAntecipacaoMedia = somaAntecip / installments;
    valorAntecipacao = amount * (taxaAntecipacaoMedia / 100);
  }

  // 5. Totais
  const custoTotal = valorMDR + taxasFixas + valorAntecipacao;
  const valorLiquido = amount - custoTotal;
  const taxaEfetiva = amount > 0 ? (custoTotal / amount) * 100 : 0;

  return {
    valorMDR,
    taxaMDR,
    taxasFixas,
    valorAntecipacao,
    taxaAntecipacaoMedia,
    custoTotal,
    valorLiquido,
    taxaEfetiva,
    detalhes: {
      feeTransacao,
      antifraude,
      taxa3ds,
      percentualAntecipacao,
      prazoDias,
      installments,
    }
  };
}

/**
 * Calcula o custo de uma transação PIX
 * Regra: cobra o que for MAIOR entre taxa percentual e taxa fixa
 * @param {number} amount - Valor da transação em R$
 * @param {number} pixTaxaPercentual - Taxa percentual do PIX em % (ex: 0.35)
 * @param {number} pixTaxaFixa - Taxa fixa do PIX em R$ (ex: 0.30)
 * @returns {object} Resultado do cálculo PIX
 */
export function calculatePixCost(amount, pixTaxaPercentual = 0.35, pixTaxaFixa = 0.30) {
  if (!amount || amount <= 0) {
    return { custoPix: 0, valorLiquido: 0, tipoAplicado: 'nenhum' };
  }

  const custoPercentual = amount * (pixTaxaPercentual / 100);
  const custoPix = Math.max(custoPercentual, pixTaxaFixa);
  const tipoAplicado = custoPercentual >= pixTaxaFixa ? 'percentual' : 'fixo';

  return {
    custoPix,
    valorLiquido: amount - custoPix,
    tipoAplicado,
    custoPercentual,
    custoFixo: pixTaxaFixa,
    taxaEfetiva: amount > 0 ? (custoPix / amount) * 100 : 0,
  };
}

/**
 * Taxas padrão dos 6 segmentos Pagsmile (extraídas do Excel oficial)
 */
/**
 * LEGACY FALLBACK — mantido para retrocompatibilidade.
 * A fonte de verdade agora é a entidade SegmentDefaultRates no banco de dados.
 * Use fetchSegmentDefaultRates() em vez de acessar este array diretamente.
 */
export const DEFAULT_SEGMENT_RATES = [
  { segmentName: "Educação", mcc: "8299", riskLevel: "BAIXO", mdrAvista: 3.49, mdr2a6x: 3.89, mdr7a12x: 4.39, mdr13a21x: 4.89, percentualAntecipacao: 1.79, feeTransacao: 0.39, antifraude: 0.39, taxa3ds: 0.49, pixTaxaPercentual: 0.45, pixTaxaFixa: 0.30 },
  { segmentName: "Infoprodutos", mcc: "8299", riskLevel: "MÉDIO-ALTO", mdrAvista: 4.19, mdr2a6x: 4.69, mdr7a12x: 5.19, mdr13a21x: 5.69, percentualAntecipacao: 1.99, feeTransacao: 0.49, antifraude: 0.49, taxa3ds: 0.59, pixTaxaPercentual: 0.45, pixTaxaFixa: 0.30 },
  { segmentName: "E-commerce", mcc: "4816", riskLevel: "MÉDIO", mdrAvista: 3.69, mdr2a6x: 4.19, mdr7a12x: 4.69, mdr13a21x: 5.19, percentualAntecipacao: 1.79, feeTransacao: 0.45, antifraude: 0.45, taxa3ds: 0.55, pixTaxaPercentual: 0.45, pixTaxaFixa: 0.30 },
  { segmentName: "SaaS", mcc: "4816", riskLevel: "BAIXO-MÉDIO", mdrAvista: 3.69, mdr2a6x: 4.19, mdr7a12x: 4.69, mdr13a21x: 5.19, percentualAntecipacao: 1.79, feeTransacao: 0.39, antifraude: 0.35, taxa3ds: 0.49, pixTaxaPercentual: 0.45, pixTaxaFixa: 0.30 },
  { segmentName: "Marketplace", mcc: "5999/4816", riskLevel: "MÉDIO", mdrAvista: 3.69, mdr2a6x: 4.19, mdr7a12x: 4.69, mdr13a21x: 5.19, percentualAntecipacao: 1.85, feeTransacao: 0.45, antifraude: 0.45, taxa3ds: 0.55, pixTaxaPercentual: 0.45, pixTaxaFixa: 0.30 },
  { segmentName: "Gateway", mcc: "Variados", riskLevel: "MUITO ALTO", mdrAvista: 4.39, mdr2a6x: 4.89, mdr7a12x: 5.39, mdr13a21x: 5.89, percentualAntecipacao: 2.19, feeTransacao: 0.59, antifraude: 0.65, taxa3ds: 0.69, pixTaxaPercentual: 0.45, pixTaxaFixa: 0.30 },
  { segmentName: "Dropshipping", mcc: "5999", riskLevel: "ALTO", mdrAvista: 4.59, mdr2a6x: 5.29, mdr7a12x: 5.89, mdr13a21x: 6.39, percentualAntecipacao: 2.39, feeTransacao: 0.55, antifraude: 0.55, taxa3ds: 0.59, pixTaxaPercentual: 0.45, pixTaxaFixa: 0.30 },
  { segmentName: "MPE", mcc: "Variados", riskLevel: "BAIXO", mdrAvista: 3.49, mdr2a6x: 3.89, mdr7a12x: 4.39, mdr13a21x: 4.89, percentualAntecipacao: 1.89, feeTransacao: 0.39, antifraude: 0.35, taxa3ds: 0.45, pixTaxaPercentual: 0.45, pixTaxaFixa: 0.30 },
  { segmentName: "Plataformas Verticais", mcc: "4816", riskLevel: "MÉDIO", mdrAvista: 3.69, mdr2a6x: 4.19, mdr7a12x: 4.69, mdr13a21x: 5.19, percentualAntecipacao: 1.79, feeTransacao: 0.45, antifraude: 0.45, taxa3ds: 0.55, pixTaxaPercentual: 0.45, pixTaxaFixa: 0.30 },
  { segmentName: "Link de Pagamento", mcc: "4816", riskLevel: "MÉDIO", mdrAvista: 3.69, mdr2a6x: 4.19, mdr7a12x: 4.69, mdr13a21x: 5.19, percentualAntecipacao: 1.79, feeTransacao: 0.45, antifraude: 0.39, taxa3ds: 0.49, pixTaxaPercentual: 0.45, pixTaxaFixa: 0.30 },
];