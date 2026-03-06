import React from 'react';
import DynamicQuestionnaire from '../components/compliance/DynamicQuestionnaire';

export default function ComplianceGateway() {
  return (
    <DynamicQuestionnaire
      templateModel="gateway"
      storageKey="compliance_data_gateway"
      documentUploadPage="DocumentUploadFull"
      flowType="gateway"
      badgeLabel="GATEWAY"
      badgeColor="bg-blue-100 text-blue-700"
      questionsPerStep={4}
    />
  );
}