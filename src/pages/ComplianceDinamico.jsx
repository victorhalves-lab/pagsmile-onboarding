import React from 'react';
import DynamicQuestionnaire from '../components/compliance/DynamicQuestionnaire';
import ComplianceV5_2Renderer from '../components/compliance/ComplianceV5_2Renderer';
import { getComplianceModelConfig, LEGACY_TO_V4 } from '@/lib/complianceModelRegistry';

/**
 * Roteador de fluxos de Compliance.
 *
 * — V4 (atual em produção): qualquer model `Compliance*V4` ou legado → `DynamicQuestionnaire`.
 * — V5.2 (Fase 5.7): model `ComplianceV5_2Dynamic` OU query `?v=5.2` → `ComplianceV5_2Renderer`.
 *
 * Coexistência total: nada do V4 é alterado. O bridge V5.2 só dispara
 * quando o link explicitamente aponta para o modelo novo.
 */
export default function ComplianceDinamico() {
  const urlParams = new URLSearchParams(window.location.search);
  const rawModel = urlParams.get('model') || 'ComplianceEcommerceV4';
  const versionParam = urlParams.get('v');

  // Detecção V5.2: modelo dedicado ou query param ?v=5.2
  const isV5_2 = rawModel === 'ComplianceV5_2Dynamic' || versionParam === '5.2';

  if (isV5_2) {
    const v52Config = getComplianceModelConfig('ComplianceV5_2Dynamic');
    return (
      <ComplianceV5_2Renderer
        storageKey={v52Config.storageKey}
        badgeLabel={v52Config.badgeLabel}
        badgeColor={v52Config.badgeColor}
      />
    );
  }

  // Fluxo V4 — intocado
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