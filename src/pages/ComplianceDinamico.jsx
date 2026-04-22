import React from 'react';
import DynamicQuestionnaire from '../components/compliance/DynamicQuestionnaire';
import { getComplianceModelConfig, LEGACY_TO_V4 } from '@/lib/complianceModelRegistry';

export default function ComplianceDinamico() {
  const urlParams = new URLSearchParams(window.location.search);
  const rawModel = urlParams.get('model') || 'ComplianceEcommerceV4';
  // Redirecionar modelos legados para V4
  const model = LEGACY_TO_V4[rawModel] || rawModel;
  const config = getComplianceModelConfig(model);

  return (
    <DynamicQuestionnaire
      templateModel={model}
      storageKey={config.storageKey}
      documentUploadPage={config.documentUploadPage}
      flowType={config.flowType}
      badgeLabel={config.badgeLabel}
      badgeColor={config.badgeColor}
      questionsPerStep={4}
      cafRedirectUrl={config.cafRedirectUrl}
      isPublicView={true}
    />
  );
}