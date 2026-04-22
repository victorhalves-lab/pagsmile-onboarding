import React, { useMemo, useState, useEffect } from 'react';
import { useOnboarding } from '@/components/public-onboarding/useOnboarding';
import OnboardingShell, { FullPageLoader, InvalidLinkScreen } from '@/components/public-onboarding/OnboardingShell';
import StepQuestionnaireV2 from '@/components/public-onboarding/StepQuestionnaireV2';
import StepDocumentsV2 from '@/components/public-onboarding/StepDocumentsV2';
import StepCafV2 from '@/components/public-onboarding/StepCafV2';
import StepDoneV2 from '@/components/public-onboarding/StepDoneV2';
import SelfHealingBoundary from '@/components/public-onboarding/SelfHealingBoundary';
import ComplianceReviewStep from '@/components/compliance/ComplianceReviewStep';
import { toast } from 'sonner';

/**
 * Neutralize browser extensions & auto-translate for the /onboarding page.
 * Chrome Translate, Grammarly and most A11y extensions respect these hints and
 * stop mutating the DOM — which is the #1 cause of React's `insertBefore` error.
 * Runs once on mount, reverts on unmount so it doesn't leak to other pages.
 */
function useDomIsolation() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlTranslate: html.getAttribute('translate'),
      htmlClass: html.className,
      bodyTranslate: body.getAttribute('translate'),
      bodyClass: body.className,
    };
    html.setAttribute('translate', 'no');
    html.classList.add('notranslate');
    body.setAttribute('translate', 'no');
    body.classList.add('notranslate');
    // Grammarly honors this attribute on any element; Chrome Translate honors
    // translate="no" + the notranslate class on <html>/<body>.
    body.setAttribute('data-gramm', 'false');
    body.setAttribute('data-gramm_editor', 'false');

    return () => {
      if (prev.htmlTranslate === null) html.removeAttribute('translate');
      else html.setAttribute('translate', prev.htmlTranslate);
      html.className = prev.htmlClass;
      if (prev.bodyTranslate === null) body.removeAttribute('translate');
      else body.setAttribute('translate', prev.bodyTranslate);
      body.className = prev.bodyClass;
      body.removeAttribute('data-gramm');
      body.removeAttribute('data-gramm_editor');
    };
  }, []);
}

/**
 * Public onboarding V2 — single page, 4 modes.
 *
 * URL: /onboarding?case=XXX&token=YYY&mode=ZZZ
 *   mode=full       → questionnaire → docs → review → caf → done
 *   mode=docs_caf   → docs → review → caf → done
 *   mode=docs_only  → docs → review → done
 *   mode=caf_only   → caf → done
 *
 * All state lives in useOnboarding(). Autosave is automatic. Invalid tokens
 * are handled gracefully. Render errors are caught by OnboardingShell's local
 * boundary and reported server-side — never escalate to a white screen.
 */

const MODE_STEPS = {
  full:      [{ key: 'q', label: 'Perguntas' }, { key: 'd', label: 'Documentos' }, { key: 'r', label: 'Revisão' }, { key: 'c', label: 'Identidade' }, { key: 'done', label: 'Conclusão' }],
  docs_caf:  [{ key: 'd', label: 'Documentos' }, { key: 'r', label: 'Revisão' }, { key: 'c', label: 'Identidade' }, { key: 'done', label: 'Conclusão' }],
  docs_only: [{ key: 'd', label: 'Documentos' }, { key: 'r', label: 'Revisão' }, { key: 'done', label: 'Conclusão' }],
  caf_only:  [{ key: 'c', label: 'Identidade' }, { key: 'done', label: 'Conclusão' }],
};

function getInitialStep(mode) {
  if (mode === 'caf_only') return 'c';
  if (mode === 'full') return 'q';
  return 'd';
}

function useUrlParams() {
  return useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    // Accept new params (case/token/mode) AND legacy ones (caseId/token/mode, ca_mode, docs_and_caf).
    const caseId = p.get('case') || p.get('caseId');
    const token = p.get('token');
    let mode = p.get('mode') || p.get('ca_mode') || 'full';
    if (mode === 'docs_and_caf') mode = 'docs_caf';
    return { caseId, token, mode };
  }, []);
}

function PublicOnboardingInner() {
  const { caseId, token, mode } = useUrlParams();
  const ob = useOnboarding({ caseId, token, mode });
  useDomIsolation();

  const [step, setStep] = useState(() => getInitialStep(mode));
  const [submitting, setSubmitting] = useState(false);
  const [, setCafResult] = useState(null);

  // Step key is purely UI state; no backend sync needed. The session persists
  // formData + documentsData, which is enough to reconstruct position on resume.

  if (ob.status === 'loading') return <FullPageLoader label="Carregando seu onboarding..." />;
  if (ob.status === 'error') return <InvalidLinkScreen reason={ob.errorReason} />;

  const { data } = ob;
  const steps = MODE_STEPS[mode] || MODE_STEPS.full;

  // ── Step-specific handlers ──
  const goToReview = () => { setStep('r'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goToCaf = () => { setStep('c'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goToDone = () => { setStep('done'); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const finalizeAndGoDone = async () => {
    setSubmitting(true);
    const res = await ob.finalize();
    setSubmitting(false);
    if (!res?.ok) {
      toast.error('Não foi possível finalizar. Tente novamente em alguns segundos.');
      return;
    }
    goToDone();
  };

  const handleReviewConfirm = () => {
    if (mode === 'docs_only') { finalizeAndGoDone(); return; }
    goToCaf();
  };

  const handleCafComplete = (result) => {
    setCafResult(result);
    finalizeAndGoDone();
  };

  // ── Headings per step ──
  const headings = {
    q:    { title: 'Questionário de Compliance', subtitle: 'Responda as perguntas abaixo para avançarmos no seu cadastro.' },
    d:    { title: 'Envio de Documentos',        subtitle: 'Anexe os documentos solicitados. Documentos faltantes podem ser justificados.' },
    r:    { title: 'Revise antes de enviar',     subtitle: 'Confira as informações abaixo. Depois de confirmar, seguem para análise.' },
    c:    { title: 'Verificação de Identidade',  subtitle: 'Capture seu documento e realize a prova de vida para concluir.' },
    done: { title: 'Tudo pronto!',               subtitle: 'Recebemos suas informações com sucesso.' },
  };
  const h = headings[step] || headings.done;

  return (
    <OnboardingShell
      title={h.title}
      subtitle={h.subtitle}
      merchant={data.merchant}
      templateName={data.template?.name}
      steps={steps}
      currentStepKey={step}
    >
      {step === 'q' && (
        <StepQuestionnaireV2
          questions={data.questions}
          formData={ob.formData}
          setFormData={ob.setFormData}
          onComplete={() => setStep('d')}
        />
      )}

      {step === 'd' && (
        <StepDocumentsV2
          template={data.template}
          documents={ob.documentsData}
          setDocuments={ob.setDocumentsData}
          caseId={data.case.id}
          docLinkToken={token}
          canGoBack={mode === 'full'}
          onBack={() => setStep('q')}
          onNext={goToReview}
          isSubmitting={submitting}
        />
      )}

      {step === 'r' && (
        <ComplianceReviewStep
          merchant={data.merchant}
          template={data.template}
          documents={ob.documentsData}
          modeLabel={mode === 'docs_only' ? 'Apenas documentos' : 'Documentos + Verificação de identidade'}
          nextStepLabel={mode === 'docs_only' ? 'Confirmar e Enviar' : 'Próximo: Verificação de Identidade'}
          onBack={() => setStep('d')}
          onConfirm={handleReviewConfirm}
          isSubmitting={submitting}
        />
      )}

      {step === 'c' && (
        <StepCafV2
          merchant={data.merchant}
          caseId={data.case.id}
          canGoBack={mode !== 'caf_only'}
          onBack={() => setStep(mode === 'full' || mode === 'docs_caf' || mode === 'docs_only' ? 'r' : 'd')}
          onComplete={handleCafComplete}
        />
      )}

      {step === 'done' && <StepDoneV2 mode={mode} />}
    </OnboardingShell>
  );
}

/**
 * Public entry point — wraps the whole page in a self-healing boundary so that
 * DOM manipulation from extensions never results in a visible crash.
 * The boundary sits OUTSIDE OnboardingShell, so even errors in the shell's
 * header/step-pills are caught and auto-recovered.
 */
export default function PublicOnboarding() {
  return (
    <SelfHealingBoundary>
      <PublicOnboardingInner />
    </SelfHealingBoundary>
  );
}