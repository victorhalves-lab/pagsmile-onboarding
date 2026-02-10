import React from 'react';
import DynamicDocumentUploadPage from '../components/compliance/DynamicDocumentUploadPage';

export default function DocumentUploadPix() {
  return (
    <DynamicDocumentUploadPage
      templateModel="pix"
      formDataStorageKey="compliance_data_pix"
      documentsStorageKey="documents_pix"
      questionnairePageName="CompliancePixOnly"
      nextPageName="OnboardingCompletion"
      flowType="pix"
      badgeLabel="Somente Pix"
      badgeColor="bg-blue-100 text-blue-700"
    />
  );
}