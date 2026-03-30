/**
 * Mapeamento de nome de segmento (landing page) → modelo de compliance (ComplianceDinamico ?model=)
 */
const SEGMENT_TO_COMPLIANCE = {
  'Educação': 'ComplianceEducacaoV4',
  'SaaS': 'ComplianceSaaSV4',
  'Plataformas Verticais': 'CompliancePlataformaVerticalV4',
  'E-commerce': 'ComplianceEcommerceV4',
  'Marketplace': 'ComplianceMarketplaceV4',
  'MPE': 'ComplianceMPEV4',
  'Link de Pagamento': 'ComplianceMerchantLinkV4',
  'Infoprodutos': 'ComplianceInfoprodutosV4',
  'Dropshipping': 'ComplianceDropshippingV4',
  'Gateway': 'ComplianceGatewayV4',
};

export default SEGMENT_TO_COMPLIANCE;