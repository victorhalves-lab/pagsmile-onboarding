/**
 * Mapa centralizado: segmento do Lead (questionnaireData.segmento do PagSmile V5)
 * → modelo de compliance V4 (ComplianceDinamico ?model=)
 *
 * Usado por:
 * - PropostaPublica (aceitar proposta personalizada → compliance)
 * - PropostaPixPublica (aceitar proposta PIX → compliance PIX)
 * - FechamentoLandingPage (já usa segmentComplianceMap com nomes de segmento)
 */

// Segmento interno (id do questionário PagSmile V5) → modelo ComplianceDinamico
export const LEAD_SEGMENT_TO_COMPLIANCE_V4 = {
  gateway: 'ComplianceGatewayV4',
  marketplace: 'ComplianceMarketplaceV4',
  plataforma_vertical: 'CompliancePlataformaVerticalV4',
  ecommerce: 'ComplianceEcommerceV4',
  dropshipping: 'ComplianceDropshippingV4',
  infoprodutos: 'ComplianceInfoprodutosV4',
  saas: 'ComplianceSaaSV4',
  educacao: 'ComplianceEducacaoV4',
  link_pagamento: 'ComplianceMerchantLinkV4',
  mpe: 'ComplianceMPEV4',
};

// businessSubCategory → modelo V4 fallback (quando o segmento granular não está disponível)
export const BIZ_SUB_CATEGORY_TO_COMPLIANCE_V4 = {
  GATEWAY: 'ComplianceGatewayV4',
  MARKETPLACE: 'ComplianceMarketplaceV4',
  MERCHAN: 'ComplianceEcommerceV4', // default para merchants genéricos
};

// PIX: tipoNegocio do Lead PIX V4 → modelo ComplianceDinamico
export const PIX_TIPO_TO_COMPLIANCE_V4 = {
  merchant: 'CompliancePixMerchantV4',
  intermediario: 'CompliancePixIntermediarioV4',
};

/**
 * Resolve o modelo de compliance V4 a partir dos dados do Lead.
 * Prioriza segmento granular, cai para businessSubCategory se não tiver.
 */
export function resolveComplianceModel(lead) {
  if (!lead) return 'ComplianceEcommerceV4';

  const qData = lead.questionnaireData || {};

  // 1. Se veio do questionário PagSmile V5, usar segmento granular
  if (qData.segmento && LEAD_SEGMENT_TO_COMPLIANCE_V4[qData.segmento]) {
    return LEAD_SEGMENT_TO_COMPLIANCE_V4[qData.segmento];
  }

  // 2. Fallback por businessSubCategory
  if (lead.businessSubCategory && BIZ_SUB_CATEGORY_TO_COMPLIANCE_V4[lead.businessSubCategory]) {
    return BIZ_SUB_CATEGORY_TO_COMPLIANCE_V4[lead.businessSubCategory];
  }

  return 'ComplianceEcommerceV4';
}

/**
 * Resolve o modelo de compliance PIX V4 a partir dos dados do Lead.
 */
export function resolvePixComplianceModel(lead) {
  if (!lead) return 'CompliancePixMerchantV4';

  const qData = lead.questionnaireData || {};
  const tipoNegocio = qData._tipoNegocio || qData.tipoNegocio;

  if (tipoNegocio && PIX_TIPO_TO_COMPLIANCE_V4[tipoNegocio]) {
    return PIX_TIPO_TO_COMPLIANCE_V4[tipoNegocio];
  }

  return 'CompliancePixMerchantV4';
}