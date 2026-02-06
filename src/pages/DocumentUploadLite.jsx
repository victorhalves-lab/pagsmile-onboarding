import React from 'react';
import DynamicDocumentUploadPage from '../components/compliance/DynamicDocumentUploadPage';

export default function DocumentUploadLite() {
  return (
    <DynamicDocumentUploadPage
      templateModel="lite"
      formDataStorageKey="compliance_data_lite"
      documentsStorageKey="documents_lite"
      questionnairePageName="ComplianceLite"
      nextPageName="OnboardingCompletion"
      flowType="lite"
      badgeLabel="Perfil Lite"
      badgeColor="bg-teal-100 text-teal-700"
    />
  );
}