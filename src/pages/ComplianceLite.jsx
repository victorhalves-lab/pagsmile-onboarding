import React from 'react';
import DynamicQuestionnaire from '../components/compliance/DynamicQuestionnaire';

export default function ComplianceLite() {
  return (
    <DynamicQuestionnaire
      templateModel="lite"
      storageKey="compliance_data_lite"
      documentUploadPage="DocumentUploadLite"
      flowType="lite"
      badgeLabel="LITE"
      badgeColor="bg-teal-100 text-teal-700"
      questionsPerStep={4}
    />
  );
}