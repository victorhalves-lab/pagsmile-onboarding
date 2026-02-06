import React from 'react';
import DynamicQuestionnaire from '../components/compliance/DynamicQuestionnaire';

export default function ComplianceFullKYC() {
  return (
    <DynamicQuestionnaire
      templateModel="full"
      storageKey="compliance_data_full"
      documentUploadPage="DocumentUploadFull"
      flowType="full_kyc"
      badgeLabel="FULL KYC"
      badgeColor="bg-purple-100 text-purple-700"
      questionsPerStep={4}
    />
  );
}