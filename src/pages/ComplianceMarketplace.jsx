import React from 'react';
import DynamicQuestionnaire from '../components/compliance/DynamicQuestionnaire';

export default function ComplianceMarketplace() {
  return (
    <DynamicQuestionnaire
      templateModel="marketplace"
      storageKey="compliance_data_marketplace"
      documentUploadPage="DocumentUploadFull"
      flowType="marketplace"
      badgeLabel="MARKETPLACE"
      badgeColor="bg-amber-100 text-amber-700"
      questionsPerStep={4}
    />
  );
}