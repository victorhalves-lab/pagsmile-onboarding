import React from 'react';
import DynamicDocumentUploadPage from '../components/compliance/DynamicDocumentUploadPage';

/**
 * SubsellerDocUpload — Unified document upload page for both PF and PJ subsellers.
 * Uses DynamicDocumentUploadPage which includes CAF SDK (DocumentDetector + FaceLiveness).
 * 
 * Determines the model from localStorage (set by DynamicQuestionnaire/SubsellerQuestionnaire).
 */

const MODEL_CONFIG = {
  subseller_pf: {
    formDataStorageKey: 'compliance_data_subseller_pf',
    documentsStorageKey: 'documents_subseller_pf',
    badgeLabel: 'SUBSELLER PF',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  subseller_v2: {
    formDataStorageKey: 'compliance_data_subseller_v2',
    documentsStorageKey: 'documents_subseller_v2',
    badgeLabel: 'SUBSELLER',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
};

export default function SubsellerDocUpload() {
  const savedTemplateId = localStorage.getItem('current_template_id');
  const savedModel = localStorage.getItem('current_compliance_model');
  const config = MODEL_CONFIG[savedModel] || MODEL_CONFIG.subseller_pf;

  return (
    <DynamicDocumentUploadPage
      templateId={savedTemplateId}
      templateModel={savedModel || 'subseller_pf'}
      formDataStorageKey={config.formDataStorageKey}
      documentsStorageKey={config.documentsStorageKey}
      questionnairePageName="SubsellerQuestionnaire"
      nextPageName="OnboardingCompletion"
      flowType="subseller"
      badgeLabel={config.badgeLabel}
      badgeColor={config.badgeColor}
    />
  );
}