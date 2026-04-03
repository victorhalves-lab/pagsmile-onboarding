/**
 * FONTE ÚNICA DE VERDADE para os 10 segmentos de negócio.
 * Importar daqui em vez de duplicar mapeamentos em cada arquivo.
 */

export const SEGMENTS = [
  { id: 'educacao', label: 'Educação', complianceModel: 'ComplianceEducacaoV4' },
  { id: 'infoprodutos', label: 'Infoprodutos', complianceModel: 'ComplianceInfoprodutosV4' },
  { id: 'ecommerce', label: 'E-commerce', complianceModel: 'ComplianceEcommerceV4' },
  { id: 'saas', label: 'SaaS', complianceModel: 'ComplianceSaaSV4' },
  { id: 'gateway', label: 'Gateway', complianceModel: 'ComplianceGatewayV4' },
  { id: 'marketplace', label: 'Marketplace', complianceModel: 'ComplianceMarketplaceV4' },
  { id: 'mpe', label: 'MPE', complianceModel: 'ComplianceMPEV4' },
  { id: 'dropshipping', label: 'Dropshipping', complianceModel: 'ComplianceDropshippingV4' },
  { id: 'plataformas_verticais', label: 'Plataformas Verticais', complianceModel: 'CompliancePlataformaVerticalV4' },
  { id: 'link_pagamento', label: 'Link de Pagamento', complianceModel: 'ComplianceMerchantLinkV4' },
];

// Mapas derivados
export const SEGMENT_BY_ID = Object.fromEntries(SEGMENTS.map(s => [s.id, s]));
export const SEGMENT_BY_LABEL = Object.fromEntries(SEGMENTS.map(s => [s.label, s]));

// id → compliance model
export const SEGMENT_ID_TO_COMPLIANCE = Object.fromEntries(SEGMENTS.map(s => [s.id, s.complianceModel]));

// label (nome do segmento na landing page) → compliance model
export const SEGMENT_LABEL_TO_COMPLIANCE = Object.fromEntries(SEGMENTS.map(s => [s.label, s.complianceModel]));

// label → id
export const SEGMENT_LABEL_TO_ID = Object.fromEntries(SEGMENTS.map(s => [s.label, s.id]));

// id → label
export const SEGMENT_ID_TO_LABEL = Object.fromEntries(SEGMENTS.map(s => [s.id, s.label]));

// Retrocompatibilidade: mapear os antigos 3 valores para um segmento padrão
const LEGACY_TO_SEGMENT = {
  MERCHAN: 'ecommerce',
  GATEWAY: 'gateway',
  MARKETPLACE: 'marketplace',
};

/**
 * Resolve o modelo de compliance V4 a partir de qualquer valor de segmento.
 * Aceita: slug (id), label (nome), ou valor legado (MERCHAN/GATEWAY/MARKETPLACE).
 */
export function resolveComplianceFromSegment(value) {
  if (!value) return 'ComplianceEcommerceV4';
  // Tenta pelo id
  if (SEGMENT_ID_TO_COMPLIANCE[value]) return SEGMENT_ID_TO_COMPLIANCE[value];
  // Tenta pelo label
  if (SEGMENT_LABEL_TO_COMPLIANCE[value]) return SEGMENT_LABEL_TO_COMPLIANCE[value];
  // Tenta legado
  const legacyId = LEGACY_TO_SEGMENT[value];
  if (legacyId && SEGMENT_ID_TO_COMPLIANCE[legacyId]) return SEGMENT_ID_TO_COMPLIANCE[legacyId];
  return 'ComplianceEcommerceV4';
}

/**
 * Normaliza um valor de businessSubCategory para o formato novo (slug).
 * Aceita valores legados (MERCHAN → ecommerce), labels, ou slugs.
 */
export function normalizeSegment(value) {
  if (!value) return '';
  // Já é um slug válido
  if (SEGMENT_BY_ID[value]) return value;
  // É um label
  if (SEGMENT_LABEL_TO_ID[value]) return SEGMENT_LABEL_TO_ID[value];
  // É valor legado
  if (LEGACY_TO_SEGMENT[value]) return LEGACY_TO_SEGMENT[value];
  return value;
}

/**
 * Faturamento mínimo mensal por segmento para exibição em propostas e landing pages.
 * MPE e Link de Pagamento: R$ 50.000 | Todos os outros: R$ 100.000
 */
export const SEGMENT_MIN_REVENUE = {
  'MPE': 50000,
  'Link de Pagamento': 50000,
  'Educação': 100000,
  'Infoprodutos': 100000,
  'E-commerce': 100000,
  'SaaS': 100000,
  'Gateway': 100000,
  'Marketplace': 100000,
  'Dropshipping': 100000,
  'Plataformas Verticais': 100000,
};

export function getMinRevenueLabel(segmentName) {
  const value = SEGMENT_MIN_REVENUE[segmentName] || 100000;
  return `Faturamento acima de R$ ${value.toLocaleString('pt-BR')}/mês`;
}

export function getMinRevenueValue(segmentName) {
  return SEGMENT_MIN_REVENUE[segmentName] || 100000;
}

/**
 * Retorna o label legível de um segmento a partir de qualquer formato.
 */
export function getSegmentLabel(value) {
  if (!value) return '';
  if (SEGMENT_BY_ID[value]) return SEGMENT_BY_ID[value].label;
  if (SEGMENT_BY_LABEL[value]) return value; // já é label
  const legacyId = LEGACY_TO_SEGMENT[value];
  if (legacyId && SEGMENT_BY_ID[legacyId]) return SEGMENT_BY_ID[legacyId].label;
  return value;
}