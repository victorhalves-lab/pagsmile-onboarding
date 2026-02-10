import React from 'react';
import DynamicDocumentUploadPage from '../components/compliance/DynamicDocumentUploadPage';

export default function DocumentUploadFull() {
  return (
    <DynamicDocumentUploadPage
      templateModel="full"
      formDataStorageKey="compliance_data_full"
      documentsStorageKey="documents_full"
      questionnairePageName="ComplianceFullKYC"
      nextPageName="OnboardingCompletion"
      flowType="full"
      badgeLabel="Full KYC"
      badgeColor="bg-purple-100 text-purple-700"
    />
  );
}