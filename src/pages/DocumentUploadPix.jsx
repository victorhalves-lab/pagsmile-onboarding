import React from 'react';
import DynamicDocumentUploadPage from '../components/compliance/DynamicDocumentUploadPage';
import NoContextRecoveryScreen from '../components/compliance/NoContextRecoveryScreen';
import { getComplianceModelConfig, resolveCurrentModel } from '@/lib/complianceModelRegistry';

export default function DocumentUploadPix() {
  // Prioridade: URL (?model=XXX) > localStorage > default PIX
  const urlParams = new URLSearchParams(window.location.search);
  const urlModel = urlParams.get('model');
  const urlCaseId = urlParams.get('caseId');
  const urlTemplateId = urlParams.get('templateId');

  const hasContext = !!(
    urlModel ||
    urlTemplateId ||
    urlCaseId ||
    (typeof window !== 'undefined' && (
      localStorage.getItem('current_compliance_model') ||
      localStorage.getItem('current_template_id') ||
      localStorage.getItem('created_onboarding_case_id')
    ))
  );

  const resolvedModel = urlModel || resolveCurrentModel() || 'CompliancePixMerchantV4';
  const config = getComplianceModelConfig(resolvedModel);

  // IMPORTANTE: hook declarado ANTES de qualquer early return (regras de hooks).
  React.useEffect(() => {
    if (!hasContext) return;
    try {
      localStorage.setItem('current_compliance_model', config._resolvedKey);
      if (urlTemplateId) localStorage.setItem('current_template_id', urlTemplateId);
      if (urlCaseId) localStorage.setItem('created_onboarding_case_id', urlCaseId);
    } catch (_) {}
  }, [hasContext, config._resolvedKey, urlTemplateId, urlCaseId]);

  if (!hasContext) {
    return <NoContextRecoveryScreen linkSupport="compliance@pagsmile.com" />;
  }

  const savedTemplateId = urlTemplateId || localStorage.getItem('current_template_id');

  return (
    <DynamicDocumentUploadPage
      templateId={savedTemplateId}
      templateModel={config._resolvedKey}
      formDataStorageKey={config.storageKey}
      documentsStorageKey={config.documentsStorageKey}
      questionnairePageName="ComplianceDinamico"
      nextPageName="OnboardingCompletion"
      flowType={config.flowType}
      badgeLabel={config.badgeLabel}
      badgeColor={config.badgeColor}
    />
  );
}