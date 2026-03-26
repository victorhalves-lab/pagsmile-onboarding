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