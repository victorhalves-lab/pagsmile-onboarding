import React from 'react';
import DynamicQuestionnaire from '../components/compliance/DynamicQuestionnaire';

export default function ComplianceMerchant() {
  return (
    <DynamicQuestionnaire
      templateModel="merchant"
      storageKey="compliance_data_merchant"
      documentUploadPage="DocumentUploadFull"
      flowType="merchant"
      badgeLabel="MERCHANT"
      badgeColor="bg-emerald-100 text-emerald-700"
      questionsPerStep={4}
    />
  );
}