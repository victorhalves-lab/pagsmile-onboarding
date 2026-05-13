// Calcula rentabilidade on-the-fly a partir das taxas da proposta + TPV do lead.
// Usado quando estimatedRevenue/Cost/Margin não estão persistidos na entidade Proposal
// (que é o caso da maioria dos casos atualmente).
//
// Modelo simplificado:
//   Receita mensal ≈ TPV × MDR ponderado + (transações × fees)
//   Custo mensal   ≈ TPV × MDR-parceiro ponderado + (transações × fees-parceiro)
//   Margem         = Receita - Custo
//
// Quando faltam dados, retorna null (não inventa números).

const DEFAULT_DISTRIBUICAO = { credito: 50, debito: 15, pix: 25, boleto: 10 };
const DEFAULT_PARCELAMENTO = { avista: 60, de2a6x: 25, de7a12x: 12, de13a21x: 3 };

function mdrMedio(cartao, parcelamento) {
  if (!cartao) return 0;
  // Média entre Visa e Mastercard (bandeiras principais)
  const brands = ['visa', 'mastercard'].map(b => cartao[b]).filter(Boolean);
  if (brands.length === 0) return 0;
  const avg = (key) => brands.reduce((s, b) => s + (b[key] || 0), 0) / brands.length;
  return (
    (avg('avista') * parcelamento.avista +
      avg('de2a6x') * parcelamento.de2a6x +
      avg('de7a12x') * parcelamento.de7a12x +
      avg('de13a21x') * parcelamento.de13a21x) / 100
  );
}

function partnerMdrMedio(partner, mcc, parcelamento) {
  if (!partner?.mdrByMcc?.length) return 0;
  const mccEntry = partner.mdrByMcc.find(e => e.mccCode === mcc) ||
                   partner.mdrByMcc.find(e => e.mccCode === 'Demais') ||
                   partner.mdrByMcc[0];
  const rates = mccEntry?.rates;
  if (!rates) return 0;
  // Pega "todas" ou média visa/mastercard
  const brand = rates.todas || rates.visa || rates.mastercard || Object.values(rates)[0];
  if (!brand) return 0;
  return (
    ((brand.avista || 0) * parcelamento.avista +
      (brand.de2a6x || 0) * parcelamento.de2a6x +
      (brand.de7a12x || 0) * parcelamento.de7a12x +
      (brand.de13a24x || 0) * parcelamento.de13a21x) * 100 / 100
  );
}

export function computeProposalProfitability(proposal, lead, partner) {
  if (!proposal?.rates) return null;
  // Se já tem persistido, usa
  if (proposal.estimatedRevenue != null && proposal.estimatedCost != null && proposal.estimatedMargin != null) {
    return {
      revenue: proposal.estimatedRevenue,
      cost: proposal.estimatedCost,
      margin: proposal.estimatedMargin,
      marginPct: proposal.estimatedRevenue > 0 ? (proposal.estimatedMargin / proposal.estimatedRevenue) * 100 : 0,
      source: 'persisted',
    };
  }

  // Calcula on-the-fly
  const tpv = lead?.tpvMensal || lead?.questionnaireData?.tpvMensal;
  const tpvNum = typeof tpv === 'string' ? parseFloat(tpv) : tpv;
  if (!tpvNum || tpvNum <= 0) return null;

  const ticketMedio = lead?.ticketMedio || parseFloat(lead?.questionnaireData?.ticketMedio) || 100;
  const transacoes = lead?.transacoesMes || (tpvNum / ticketMedio);

  // Distribuição declarada ou default
  const dist = lead?.questionnaireData?.distribuicaoDesejada || DEFAULT_DISTRIBUICAO;
  const parc = lead?.questionnaireData?.distribuicaoParcelamento || DEFAULT_PARCELAMENTO;

  const rates = proposal.rates;
  const mdrCartao = mdrMedio(rates.cartao, parc);
  const mdrPix = rates.pix?.tipo === 'percentual' ? (rates.pix.valor / 100) : 0;
  const pixFixo = rates.pix?.tipo === 'fixo' ? (rates.pix.valor || 0) : 0;
  const mdrBoleto = (rates.boleto || 0) / 100;
  const fee = rates.feeTransacao || 0;
  const antifraude = rates.antifraude || 0;

  // Receita
  const receitaCartao = tpvNum * (dist.credito / 100) * mdrCartao;
  const receitaPix = tpvNum * (dist.pix / 100) * mdrPix + (transacoes * (dist.pix / 100) * pixFixo);
  const receitaBoleto = tpvNum * (dist.boleto / 100) * mdrBoleto;
  const receitaFees = transacoes * (fee + antifraude);
  const revenue = receitaCartao + receitaPix + receitaBoleto + receitaFees;

  // Custo (se partner conhecido)
  let cost = 0;
  if (partner) {
    const mdrPartner = partnerMdrMedio(partner, proposal.clienteMcc, parc);
    cost = tpvNum * (dist.credito / 100) * mdrPartner +
           transacoes * ((partner.transactionFee || 0) + (partner.antifraudCost || 0));
  } else {
    // Sem partner: estima custo como 60% da receita (margem média de 40%)
    cost = revenue * 0.6;
  }

  const margin = revenue - cost;
  return {
    revenue: Math.round(revenue * 100) / 100,
    cost: Math.round(cost * 100) / 100,
    margin: Math.round(margin * 100) / 100,
    marginPct: revenue > 0 ? Math.round((margin / revenue) * 10000) / 100 : 0,
    source: partner ? 'computed_with_partner' : 'computed_estimated',
  };
}