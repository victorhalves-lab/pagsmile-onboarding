// ─────────────────────────────────────────────────────────────────────
// V5.1 — Morfologias operacionais
// ─────────────────────────────────────────────────────────────────────
// Morfologia = "como a operação se manifesta na prática", ortogonal ao segmento.
// Ex: um e-commerce pode ter morfologia B2C-nacional, B2C-crossborder, ou multi-MEI.
// ─────────────────────────────────────────────────────────────────────

export const MORFOLOGIAS = {
  PIX_ONLY: 'pix_only',
  PIX_HEAVY: 'pix_heavy',           // PIX > 70% do TPV
  CARTAO_HEAVY: 'cartao_heavy',     // Cartão > 70% do TPV
  MULTI_MEI: 'multi_mei',           // Múltiplos MEIs sob mesmo grupo
  B2C_NACIONAL: 'b2c_nacional',
  B2C_CROSSBORDER: 'b2c_crossborder',
  B2B_NACIONAL: 'b2b_nacional',
  B2B_CROSSBORDER: 'b2b_crossborder',
  SAAS_RECORRENTE: 'saas_recorrente',
  LINK_PAGAMENTO_AVULSO: 'link_pagamento_avulso',
  PADRAO: 'padrao',                  // fallback
};

export const MORFOLOGIA_LABELS = {
  pix_only: 'PIX Exclusivo',
  pix_heavy: 'Predominância PIX',
  cartao_heavy: 'Predominância Cartão',
  multi_mei: 'Múltiplos MEIs',
  b2c_nacional: 'B2C Nacional',
  b2c_crossborder: 'B2C Cross-Border',
  b2b_nacional: 'B2B Nacional',
  b2b_crossborder: 'B2B Cross-Border',
  saas_recorrente: 'SaaS Recorrente',
  link_pagamento_avulso: 'Link Avulso',
  padrao: 'Padrão',
};

/**
 * Resolve morfologia baseada nas respostas do questionário.
 * Stub inicial — lógica completa será implementada na Fase 2 (pipeline).
 */
export function resolverMorfologia({ distribuicaoTpv = {}, segmento, modeloVenda, paisAtuacao }) {
  const pix = Number(distribuicaoTpv.pix) || 0;
  const cartao = Number(distribuicaoTpv.cartao) || 0;

  if (pix >= 95) return MORFOLOGIAS.PIX_ONLY;
  if (pix >= 70) return MORFOLOGIAS.PIX_HEAVY;
  if (cartao >= 70) return MORFOLOGIAS.CARTAO_HEAVY;
  if (paisAtuacao && paisAtuacao !== 'BR') {
    return modeloVenda === 'b2b' ? MORFOLOGIAS.B2B_CROSSBORDER : MORFOLOGIAS.B2C_CROSSBORDER;
  }
  if (segmento === 'saas') return MORFOLOGIAS.SAAS_RECORRENTE;
  if (segmento === 'link_pagamento') return MORFOLOGIAS.LINK_PAGAMENTO_AVULSO;
  return modeloVenda === 'b2b' ? MORFOLOGIAS.B2B_NACIONAL : MORFOLOGIAS.B2C_NACIONAL;
}