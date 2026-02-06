import React from 'react';
import DynamicQuestionnaire from '../components/compliance/DynamicQuestionnaire';

export default function ComplianceEcommerce() {
  return (
    <DynamicQuestionnaire
      templateModel="ecommerce"
      storageKey="compliance_data_ecommerce"
      documentUploadPage="DocumentUploadEcommerce"
      flowType="ecommerce"
      badgeLabel="E-COMMERCE"
      badgeColor="bg-orange-100 text-orange-700"
      questionsPerStep={4}
    />
  );
}