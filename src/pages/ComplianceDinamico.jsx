import React from 'react';
import DynamicQuestionnaire from '../components/compliance/DynamicQuestionnaire';

const MODEL_CONFIG = {
  merchant: {
    storageKey: 'compliance_data_merchant',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'MERCHANT',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    cafRedirectUrl: 'https://cadastro.io/c584e022b7936e44b8bc5acdd3a7945e',
  },
  gateway: {
    storageKey: 'compliance_data_gateway',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'GATEWAY',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    cafRedirectUrl: 'https://cadastro.io/9b998e4d45055dac959680cf3dcfc1c9',
  },
  marketplace: {
    storageKey: 'compliance_data_marketplace',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'MARKETPLACE',
    badgeColor: 'bg-amber-100 text-amber-700',
    cafRedirectUrl: 'https://cadastro.io/119c66a9c7f1e2618b20b3a41f656d3b',
  },
  // Novos modelos v2.0 com autocomplete
  ComplianceMerchantAutocomplete: {
    storageKey: 'compliance_data_merchant_v2',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'MERCHANT v2.0',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    cafRedirectUrl: 'https://cadastro.io/c584e022b7936e44b8bc5acdd3a7945e',
  },
  ComplianceGatewayAutocomplete: {
    storageKey: 'compliance_data_gateway_v2',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'GATEWAY v2.0',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    cafRedirectUrl: 'https://cadastro.io/9b998e4d45055dac959680cf3dcfc1c9',
  },
  ComplianceMarketplaceAutocomplete: {
    storageKey: 'compliance_data_marketplace_v2',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'MARKETPLACE v2.0',
    badgeColor: 'bg-amber-100 text-amber-700',
    cafRedirectUrl: 'https://cadastro.io/119c66a9c7f1e2618b20b3a41f656d3b',
  },
  // v4 — Questionários por segmento com pré-preenchimento do Lead v5
  ComplianceGatewayV4: {
    storageKey: 'compliance_data_gateway_v4',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'GATEWAY v4',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    cafRedirectUrl: 'https://cadastro.io/9b998e4d45055dac959680cf3dcfc1c9',
  },
  ComplianceMarketplaceV4: {
    storageKey: 'compliance_data_marketplace_v4',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'MARKETPLACE v4',
    badgeColor: 'bg-amber-100 text-amber-700',
    cafRedirectUrl: 'https://cadastro.io/119c66a9c7f1e2618b20b3a41f656d3b',
  },
  CompliancePlataformaVerticalV4: {
    storageKey: 'compliance_data_plataforma_vertical_v4',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'PLATAFORMA VERTICAL v4',
    badgeColor: 'bg-violet-100 text-violet-700',
    cafRedirectUrl: 'https://cadastro.io/c584e022b7936e44b8bc5acdd3a7945e',
  },
  ComplianceEcommerceV4: {
    storageKey: 'compliance_data_ecommerce_v4',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'E-COMMERCE v4',
    badgeColor: 'bg-rose-100 text-rose-700',
    cafRedirectUrl: 'https://cadastro.io/c584e022b7936e44b8bc5acdd3a7945e',
  },
  ComplianceInfoprodutosV4: {
    storageKey: 'compliance_data_infoprodutos_v4',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'INFOPRODUTOS v4',
    badgeColor: 'bg-amber-100 text-amber-700',
    cafRedirectUrl: 'https://cadastro.io/c584e022b7936e44b8bc5acdd3a7945e',
  },
  ComplianceEducacaoV4: {
    storageKey: 'compliance_data_educacao_v4',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'EDUCAÇÃO v4',
    badgeColor: 'bg-sky-100 text-sky-700',
    cafRedirectUrl: 'https://cadastro.io/c584e022b7936e44b8bc5acdd3a7945e',
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
      cafRedirectUrl={config.cafRedirectUrl}
    />
  );
}