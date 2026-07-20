/**
 * Mapa centralizado: segmento do Lead → modelo de compliance V4 (ComplianceDinamico ?model=)
 * Usa segmentConfig como fonte de verdade.
 */
import { 
  SEGMENT_ID_TO_COMPLIANCE,
  SEGMENT_LABEL_TO_COMPLIANCE,
  resolveComplianceFromSegment
} from '@/lib/segmentConfig';

// Re-export para compatibilidade com imports existentes
export const LEAD_SEGMENT_TO_COMPLIANCE_V4 = SEGMENT_ID_TO_COMPLIANCE;

// Retrocompatibilidade com valores antigos (MERCHAN/GATEWAY/MARKETPLACE)
export const BIZ_SUB_CATEGORY_TO_COMPLIANCE_V4 = {
  GATEWAY: 'ComplianceGatewayV4',
  MARKETPLACE: 'ComplianceMarketplaceV4',
  MERCHAN: 'ComplianceEcommerceV4',
  // Novos slugs mapeiam diretamente
  ...SEGMENT_ID_TO_COMPLIANCE,
};

// PIX: tipoNegocio do Lead PIX V4 → modelo ComplianceDinamico
export const PIX_TIPO_TO_COMPLIANCE_V4 = {
  merchant: 'CompliancePixMerchantV4',
  intermediario: 'CompliancePixIntermediarioV4',
};

/**
 * Resolve o modelo de compliance V4 a partir dos dados do Lead.
 * Prioriza segmento granular, cai para businessSubCategory.
 * Suporta valores novos (slugs) e legados (MERCHAN/GATEWAY/MARKETPLACE).
 */
export function resolveComplianceModel(lead) {
  if (!lead) return 'ComplianceEcommerceV4';

  const qData = lead.questionnaireData || {};

  // 1. Se veio do questionário Pin Bank V5, usar segmento granular
  if (qData.segmento && SEGMENT_ID_TO_COMPLIANCE[qData.segmento]) {
    return SEGMENT_ID_TO_COMPLIANCE[qData.segmento];
  }

  // 2. Se veio da landing page, segmentoLandingPage é o label
  if (qData.segmentoLandingPage && SEGMENT_LABEL_TO_COMPLIANCE[qData.segmentoLandingPage]) {
    return SEGMENT_LABEL_TO_COMPLIANCE[qData.segmentoLandingPage];
  }

  // 3. businessSubCategory (slug novo ou valor legado)
  if (lead.businessSubCategory) {
    return resolveComplianceFromSegment(lead.businessSubCategory);
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