import React from 'react';
import DynamicDocumentUploadPage from '../components/compliance/DynamicDocumentUploadPage';

export default function DocumentUploadSaaS() {
  return (
    <DynamicDocumentUploadPage
      templateModel="saas"
      formDataStorageKey="compliance_data_saas"
      documentsStorageKey="documents_saas"
      questionnairePageName="ComplianceSaaS"
      nextPageName="OnboardingCompletion"
      flowType="saas"
      badgeLabel="SaaS Fast Track"
      badgeColor="bg-violet-100 text-violet-700"
    />
  );
}