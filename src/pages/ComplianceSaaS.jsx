import React from 'react';
import DynamicQuestionnaire from '../components/compliance/DynamicQuestionnaire';

export default function ComplianceSaaS() {
  return (
    <DynamicQuestionnaire
      templateModel="saas"
      storageKey="compliance_data_saas"
      documentUploadPage="DocumentUploadSaaS"
      flowType="saas"
      badgeLabel="SaaS Fast Track"
      badgeColor="bg-violet-100 text-violet-700"
      questionsPerStep={5}
    />
  );
}