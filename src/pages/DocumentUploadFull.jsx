import React from 'react';
import DynamicDocumentUploadPage from '../components/compliance/DynamicDocumentUploadPage';

const MODEL_CONFIG = {
  merchant: {
    formDataStorageKey: 'compliance_data_merchant',
    documentsStorageKey: 'documents_merchant',
    badgeLabel: 'MERCHANT',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  gateway: {
    formDataStorageKey: 'compliance_data_gateway',
    documentsStorageKey: 'documents_gateway',
    badgeLabel: 'GATEWAY',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  marketplace: {
    formDataStorageKey: 'compliance_data_marketplace',
    documentsStorageKey: 'documents_marketplace',
    badgeLabel: 'MARKETPLACE',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  // Modelos v2.0 com autocomplete
  ComplianceMerchantAutocomplete: {
    formDataStorageKey: 'compliance_data_merchant_v2',
    documentsStorageKey: 'documents_merchant_v2',
    badgeLabel: 'MERCHANT',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  ComplianceGatewayAutocomplete: {
    formDataStorageKey: 'compliance_data_gateway_v2',
    documentsStorageKey: 'documents_gateway_v2',
    badgeLabel: 'GATEWAY',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  ComplianceMarketplaceAutocomplete: {
    formDataStorageKey: 'compliance_data_marketplace_v2',
    documentsStorageKey: 'documents_marketplace_v2',
    badgeLabel: 'MARKETPLACE',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  subseller_v2: {
    formDataStorageKey: 'compliance_data_subseller_v2',
    documentsStorageKey: 'documents_subseller_v2',
    badgeLabel: 'SUBSELLER',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  // V4 models
  ComplianceGatewayV4: { formDataStorageKey: 'compliance_data_gateway_v4', documentsStorageKey: 'documents_gateway_v4', badgeLabel: 'GATEWAY v4', badgeColor: 'bg-indigo-100 text-indigo-700' },
  ComplianceMarketplaceV4: { formDataStorageKey: 'compliance_data_marketplace_v4', documentsStorageKey: 'documents_marketplace_v4', badgeLabel: 'MARKETPLACE v4', badgeColor: 'bg-amber-100 text-amber-700' },
  CompliancePlataformaVerticalV4: { formDataStorageKey: 'compliance_data_plataforma_vertical_v4', documentsStorageKey: 'documents_plataforma_vertical_v4', badgeLabel: 'PLATAFORMA VERTICAL v4', badgeColor: 'bg-violet-100 text-violet-700' },
  ComplianceEcommerceV4: { formDataStorageKey: 'compliance_data_ecommerce_v4', documentsStorageKey: 'documents_ecommerce_v4', badgeLabel: 'E-COMMERCE v4', badgeColor: 'bg-rose-100 text-rose-700' },
  ComplianceInfoprodutosV4: { formDataStorageKey: 'compliance_data_infoprodutos_v4', documentsStorageKey: 'documents_infoprodutos_v4', badgeLabel: 'INFOPRODUTOS v4', badgeColor: 'bg-amber-100 text-amber-700' },
  ComplianceEducacaoV4: { formDataStorageKey: 'compliance_data_educacao_v4', documentsStorageKey: 'documents_educacao_v4', badgeLabel: 'EDUCAÇÃO v4', badgeColor: 'bg-sky-100 text-sky-700' },
  ComplianceSaaSV4: { formDataStorageKey: 'compliance_data_saas_v4', documentsStorageKey: 'documents_saas_v4', badgeLabel: 'SAAS v4', badgeColor: 'bg-cyan-100 text-cyan-700' },
  ComplianceMerchantLinkV4: { formDataStorageKey: 'compliance_data_merchant_link_v4', documentsStorageKey: 'documents_merchant_link_v4', badgeLabel: 'MERCHANT LINK v4', badgeColor: 'bg-green-100 text-green-700' },
  ComplianceMPEV4: { formDataStorageKey: 'compliance_data_mpe_v4', documentsStorageKey: 'documents_mpe_v4', badgeLabel: 'MPE v4', badgeColor: 'bg-amber-100 text-amber-700' },
  ComplianceDropshippingV4: { formDataStorageKey: 'compliance_data_dropshipping_v4', documentsStorageKey: 'documents_dropshipping_v4', badgeLabel: 'DROPSHIPPING v4', badgeColor: 'bg-orange-100 text-orange-700' },
  CompliancePixMerchantV4: { formDataStorageKey: 'compliance_data_pix_merchant_v4', documentsStorageKey: 'documents_pix_merchant_v4', badgeLabel: 'PIX MERCHANT v4', badgeColor: 'bg-emerald-100 text-emerald-700' },
  CompliancePixIntermediarioV4: { formDataStorageKey: 'compliance_data_pix_intermediario_v4', documentsStorageKey: 'documents_pix_intermediario_v4', badgeLabel: 'PIX INTERMEDIÁRIO v4', badgeColor: 'bg-indigo-100 text-indigo-700' },
};

export default function DocumentUploadFull() {
  // Determinar o modelo pelo localStorage (salvo pelo DynamicQuestionnaire/ComplianceDinamico)
  const savedTemplateId = localStorage.getItem('current_template_id');
  const savedModel = localStorage.getItem('current_compliance_model');
  const config = MODEL_CONFIG[savedModel] || MODEL_CONFIG.merchant;

  return (
    <DynamicDocumentUploadPage
      templateId={savedTemplateId}
      templateModel={savedModel || 'merchant'}
      formDataStorageKey={config.formDataStorageKey}
      documentsStorageKey={config.documentsStorageKey}
      questionnairePageName="ComplianceDinamico"
      nextPageName="OnboardingCompletion"
      flowType="full_kyc"
      badgeLabel={config.badgeLabel}
      badgeColor={config.badgeColor}
    />
  );
}