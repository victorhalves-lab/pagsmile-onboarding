// ─────────────────────────────────────────────────────────────────────
// V5.1 — Segmentos
// ─────────────────────────────────────────────────────────────────────

export const SEGMENTOS_V5_1 = {
  ECOMMERCE: 'ecommerce',
  GATEWAY: 'gateway',
  MARKETPLACE: 'marketplace',
  DROPSHIPPING: 'dropshipping',
  INFOPRODUTOS: 'infoprodutos',
  EDUCACAO: 'educacao',
  SAAS: 'saas',
  PLATAFORMA_VERTICAL: 'plataforma_vertical',
  LINK_PAGAMENTO: 'link_pagamento',
  FOODTECH: 'foodtech',
  MPE: 'mpe',
  PIX_MERCHANT: 'pix_merchant',
  PIX_INTERMEDIARIO: 'pix_intermediario',
};

export const SEGMENTO_LABELS = {
  ecommerce: 'E-commerce',
  gateway: 'Gateway',
  marketplace: 'Marketplace',
  dropshipping: 'Dropshipping',
  infoprodutos: 'Infoprodutos',
  educacao: 'Educação',
  saas: 'SaaS',
  plataforma_vertical: 'Plataforma Vertical',
  link_pagamento: 'Link de Pagamento',
  foodtech: 'FoodTech',
  mpe: 'MPE',
  pix_merchant: 'PIX Merchant',
  pix_intermediario: 'PIX Intermediário',
};

// Segmentos críticos que FORÇAM cap_financial_capacity_validation
// mesmo em Tier 1 (Insight 7 do diagnóstico)
export const SEGMENTOS_CRITICOS_FINANCEIRO = [
  SEGMENTOS_V5_1.GATEWAY,
  SEGMENTOS_V5_1.DROPSHIPPING,
  SEGMENTOS_V5_1.MARKETPLACE,
  // crossborder será detectado via morfologia
];

export function isSegmentoCritico(segmento) {
  return SEGMENTOS_CRITICOS_FINANCEIRO.includes(segmento);
}