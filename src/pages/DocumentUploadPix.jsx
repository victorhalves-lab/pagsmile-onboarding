import React from 'react';
import DynamicDocumentUploadPage from '../components/compliance/DynamicDocumentUploadPage';

const MODEL_CONFIG = {
  CompliancePixMerchantV4: {
    formDataStorageKey: 'compliance_data_pix_merchant_v4',
    documentsStorageKey: 'documents_pix_merchant_v4',
    badgeLabel: 'PIX MERCHANT v4',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  CompliancePixIntermediarioV4: {
    formDataStorageKey: 'compliance_data_pix_intermediario_v4',
    documentsStorageKey: 'documents_pix_intermediario_v4',
    badgeLabel: 'PIX INTERMEDIÁRIO v4',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  // Legacy fallback
  pix: {
    formDataStorageKey: 'compliance_data_pix',
    documentsStorageKey: 'documents_pix',
    badgeLabel: 'PIX',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
};

export default function DocumentUploadPix() {
  const savedTemplateId = localStorage.getItem('current_template_id');
  const savedModel = localStorage.getItem('current_compliance_model');
  const config = MODEL_CONFIG[savedModel] || MODEL_CONFIG.pix;

  return (
    <DynamicDocumentUploadPage
      templateId={savedTemplateId}
      templateModel={savedModel || 'pix'}
      formDataStorageKey={config.formDataStorageKey}
      documentsStorageKey={config.documentsStorageKey}
      questionnairePageName="ComplianceDinamico"
      nextPageName="OnboardingCompletion"
      flowType="pix"
      badgeLabel={config.badgeLabel}
      badgeColor={config.badgeColor}
    />
  );
}