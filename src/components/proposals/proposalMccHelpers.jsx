// ────────────────────────────────────────────────────────────────────
// Helpers para Multi-MCC em Proposal personalizada
// Mantém retro-compat: quando cartaoPorMcc está vazio, comporta como
// proposta de MCC único (usa rates.cartao no nível raiz).
// ────────────────────────────────────────────────────────────────────

import { MCC_LIST } from '@/components/leads/mccData';

const BANDEIRAS = ['visa', 'mastercard', 'elo', 'amex', 'outras'];

export function getMccLabel(mccCode) {
  if (!mccCode) return '';
  const found = MCC_LIST.find(m => m.mcc === String(mccCode));
  return found?.name || mccCode;
}

export function emptyMccCartao() {
  const out = {};
  BANDEIRAS.forEach(b => { out[b] = { avista: '', de2a6x: '', de7a12x: '', de13a21x: '' }; });
  return out;
}

export function makeMccEntry(mccCode, sourceCartao = null) {
  return {
    mcc: String(mccCode || ''),
    mccLabel: getMccLabel(mccCode),
    cartao: sourceCartao ? JSON.parse(JSON.stringify(sourceCartao)) : emptyMccCartao(),
  };
}

// Constrói um cartao{} (visa/master/elo/amex/outras × faixas) a partir de um registro
// de SegmentDefaultRates. Aplica as mesmas 4 taxas (avista/2-6/7-12/13-21) em todas as
// bandeiras — é o mesmo critério usado pelo SegmentRatesLoader.
export function cartaoFromSegmentRates(segmentRates) {
  if (!segmentRates) return emptyMccCartao();
  const taxas = {
    avista: segmentRates.mdrAvista ?? '',
    de2a6x: segmentRates.mdr2a6x ?? '',
    de7a12x: segmentRates.mdr7a12x ?? '',
    de13a21x: segmentRates.mdr13a21x ?? '',
  };
  const out = {};
  BANDEIRAS.forEach(b => { out[b] = { ...taxas }; });
  return out;
}

// Tem multi-MCC ativo? (>= 2 itens)
export function isMultiMcc(rates) {
  return Array.isArray(rates?.cartaoPorMcc) && rates.cartaoPorMcc.length >= 2;
}

// Retorna o array de MCCs ou monta um único array a partir de rates.cartao (retro-compat)
export function getMccList(rates, fallbackMcc) {
  if (Array.isArray(rates?.cartaoPorMcc) && rates.cartaoPorMcc.length > 0) {
    return rates.cartaoPorMcc;
  }
  return [{
    mcc: String(fallbackMcc || ''),
    mccLabel: getMccLabel(fallbackMcc),
    cartao: rates?.cartao || {},
  }];
}

// Converte taxas string→number em uma matriz de cartão por bandeira
export function normalizeMccCartao(cartao, parseTaxa) {
  const out = {};
  BANDEIRAS.forEach(b => {
    const d = cartao?.[b] || {};
    out[b] = {
      avista: parseTaxa(d.avista),
      de2a6x: parseTaxa(d.de2a6x),
      de7a12x: parseTaxa(d.de7a12x),
      de13a21x: parseTaxa(d.de13a21x),
    };
  });
  return out;
}