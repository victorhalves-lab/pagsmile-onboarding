import React from 'react';
import DynamicDocumentUploadPage from '../components/compliance/DynamicDocumentUploadPage';

export default function DocumentUploadEcommerce() {
  return (
    <DynamicDocumentUploadPage
      templateModel="ecommerce"
      formDataStorageKey="compliance_data_ecommerce"
      documentsStorageKey="documents_ecommerce"
      questionnairePageName="ComplianceEcommerce"
      nextPageName="OnboardingCompletion"
      flowType="ecommerce"
      badgeLabel="E-commerce Known"
      badgeColor="bg-orange-100 text-orange-700"
    />
  );
}