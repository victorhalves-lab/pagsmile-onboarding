import React from 'react';
import DynamicQuestionnaire from '../components/compliance/DynamicQuestionnaire';

const MODEL_CONFIG = {
  merchant: {
    storageKey: 'compliance_data_merchant',
    badgeLabel: 'MERCHANT',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  gateway: {
    storageKey: 'compliance_data_gateway',
    badgeLabel: 'GATEWAY',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  marketplace: {
    storageKey: 'compliance_data_marketplace',
    badgeLabel: 'MARKETPLACE',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
};

export default function ComplianceFullKYC() {
  // Ler modelo do URL param ou localStorage (definido pela PropostaPublica ou ComplianceDinamico)
  const urlParams = new URLSearchParams(window.location.search);
  const model = urlParams.get('model') || localStorage.getItem('current_compliance_model') || 'merchant';
  const config = MODEL_CONFIG[model] || MODEL_CONFIG.merchant;

  return (
    <DynamicQuestionnaire
      templateModel={model}
      storageKey={config.storageKey}
      documentUploadPage="DocumentUploadFull"
      flowType="full_kyc"
      badgeLabel={config.badgeLabel}
      badgeColor={config.badgeColor}
      questionsPerStep={4}
    />
  );
}