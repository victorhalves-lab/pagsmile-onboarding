import React from 'react';
import DynamicQuestionnaire from '../components/compliance/DynamicQuestionnaire';

export default function CompliancePixOnly() {
  return (
    <DynamicQuestionnaire
      templateModel="pix"
      storageKey="compliance_data_pix"
      documentUploadPage="DocumentUploadPix"
      flowType="pix_only"
      badgeLabel="PIX"
      badgeColor="bg-blue-100 text-blue-700"
      questionsPerStep={4}
    />
  );
}