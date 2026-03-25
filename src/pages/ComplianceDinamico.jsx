import React from 'react';
import DynamicQuestionnaire from '../components/compliance/DynamicQuestionnaire';

const MODEL_CONFIG = {
  merchant: {
    storageKey: 'compliance_data_merchant',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'MERCHANT',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  gateway: {
    storageKey: 'compliance_data_gateway',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'GATEWAY',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  marketplace: {
    storageKey: 'compliance_data_marketplace',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'MARKETPLACE',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  // Novos modelos v2.0 com autocomplete
  ComplianceMerchantAutocomplete: {
    storageKey: 'compliance_data_merchant_v2',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'MERCHANT v2.0',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  ComplianceGatewayAutocomplete: {
    storageKey: 'compliance_data_gateway_v2',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'GATEWAY v2.0',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  ComplianceMarketplaceAutocomplete: {
    storageKey: 'compliance_data_marketplace_v2',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'MARKETPLACE v2.0',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
};

export default function ComplianceDinamico() {
  const urlParams = new URLSearchParams(window.location.search);
  const model = urlParams.get('model') || 'merchant';
  const config = MODEL_CONFIG[model] || MODEL_CONFIG.merchant;

  return (
    <DynamicQuestionnaire
      templateModel={model}
      storageKey={config.storageKey}
      documentUploadPage={config.documentUploadPage}
      flowType={config.flowType}
      badgeLabel={config.badgeLabel}
      badgeColor={config.badgeColor}
      questionsPerStep={4}
    />
  );
}