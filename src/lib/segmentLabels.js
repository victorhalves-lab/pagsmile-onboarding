// Centralized mapping of segment slugs/models → human-readable labels.
// Used in Cadastro Dashboard, Compliance Tab and KYC/KYB doc to avoid raw slugs.

const LABELS = {
  // Business sub-categories (Lead.businessSubCategory)
  gateway: 'Gateway / PSP',
  marketplace: 'Marketplace',
  plataformas_verticais: 'Plataformas Verticais',
  dropshipping: 'Dropshipping',
  infoprodutos: 'Infoprodutos',
  ecommerce: 'E-commerce',
  saas: 'SaaS / Recorrência',
  link_pagamento: 'Link de Pagamento',
  educacao: 'Educação',
  mpe: 'MPE',
  // Legacy uppercase
  MERCHAN: 'Merchant',
  GATEWAY: 'Gateway / PSP',
  MARKETPLACE: 'Marketplace',
  GENERAL: 'Geral',

  // PIX segments (ComplianceScore.segmento)
  pix_intermediario: 'PIX Intermediário',
  pix_merchant: 'PIX Merchant',
  foodtech: 'Foodtech',
  plataforma_vertical: 'Plataforma Vertical',

  // Compliance template models (QuestionnaireTemplate.model)
  ComplianceGatewayV4: 'Gateway / PSP',
  ComplianceMarketplaceV4: 'Marketplace',
  CompliancePlataformaVerticalV4: 'Plataforma Vertical',
  ComplianceDropshippingV4: 'Dropshipping',
  ComplianceInfoprodutosV4: 'Infoprodutos',
  ComplianceEcommerceV4: 'E-commerce',
  ComplianceSaaSV4: 'SaaS / Recorrência',
  ComplianceLinkPagamentoV4: 'Link de Pagamento',
  ComplianceMerchantLinkV4: 'Link de Pagamento',
  ComplianceEducacaoV4: 'Educação',
  ComplianceMPEV4: 'MPE',
  CompliancePixMerchantV4: 'PIX Merchant',
  CompliancePixIntermediarioV4: 'PIX Intermediário',
  pix_merchant_v4: 'PIX Merchant',
  pix_intermediario_v4: 'PIX Intermediário',
  subseller_v2: 'Subseller PJ',
  subseller_pf: 'Subseller PF',
  subseller: 'Subseller PJ (legacy)',
};

// Maps compliance template model → BDC dataset group (FULL / STANDARD / LITE / PIX_*)
const DATASET_GROUP = {
  ComplianceGatewayV4: 'FULL',
  ComplianceMarketplaceV4: 'FULL',
  CompliancePlataformaVerticalV4: 'FULL',
  ComplianceDropshippingV4: 'STANDARD',
  ComplianceInfoprodutosV4: 'STANDARD',
  ComplianceEcommerceV4: 'STANDARD',
  ComplianceSaaSV4: 'STANDARD',
  ComplianceLinkPagamentoV4: 'STANDARD',
  ComplianceMerchantLinkV4: 'STANDARD',
  ComplianceEducacaoV4: 'STANDARD',
  ComplianceMPEV4: 'LITE',
  CompliancePixMerchantV4: 'PIX_MERCHANT',
  CompliancePixIntermediarioV4: 'PIX_INTERMEDIARIO',
  pix_merchant_v4: 'PIX_MERCHANT',
  pix_intermediario_v4: 'PIX_INTERMEDIARIO',
  subseller_v2: 'SUBSELLER_PJ',
  subseller_pf: 'SUBSELLER_PF',
};

export function segmentLabel(slug) {
  if (!slug) return '—';
  return LABELS[slug] || slug;
}

export function datasetGroupFor(model) {
  return DATASET_GROUP[model] || null;
}