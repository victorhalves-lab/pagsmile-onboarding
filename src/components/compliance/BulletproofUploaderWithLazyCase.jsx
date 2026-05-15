import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
// SDK-FREE: public route — callPublicFunction hits /functions/* directly via fetch.
import { callPublicFunction } from '@/lib/publicApi';
import { toast } from 'sonner';
import BulletproofDocumentUploader from './BulletproofDocumentUploader';
import { expandPerRepresentativeDocs, getRepresentativesFromStorage } from '@/lib/expandPerRepresentativeDocs';
import { logSubsellerError } from '@/lib/subsellerErrorLogger';

/**
 * Wrapper around BulletproofDocumentUploader that ensures the OnboardingCase
 * exists BEFORE rendering the uploader.
 *
 * Why this exists:
 * Previously, if the DynamicQuestionnaire flow didn't create the case+token
 * upfront (happens in certain code paths), the page fell back to the legacy
 * `DynamicDocumentUploader`, which calls `base44.integrations.Core.UploadPrivateFile`
 * directly. That SDK call fails on PUBLIC routes (no auth token) → 401/403 →
 * client sees a generic "erro ao enviar" message and gets stuck.
 *
 * With this wrapper, we GUARANTEE that by the time the Bulletproof uploader
 * mounts, we have a valid caseId + docLinkToken — so uploads always go through
 * the public-safe `publicDirectDocUpload` backend endpoint.
 *
 * Lazy-create strategy: read the saved questionnaire responses from localStorage,
 * call `publicComplianceSubmit` to create Merchant + Case + Responses, then
 * persist the resulting IDs in localStorage for the rest of the flow.
 */
export default function BulletproofUploaderWithLazyCase({
  template,
  questions,
  templateModel,
  formDataStorageKey,
  documentsStorageKey,
  flowType,
  documents,
  setDocuments,
  onAllRequiredUploaded,
  onCaseReady, // ← novo: parent pode acompanhar quando caseId+docToken estiverem prontos
}) {
  const [caseId, setCaseId] = useState(() => localStorage.getItem('created_onboarding_case_id'));
  const [docToken, setDocToken] = useState(() => localStorage.getItem('created_doc_link_token'));
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const creatingRef = useRef(false); // prevent double-create on React StrictMode

  // CRITICAL FIX (caso Pedro Sperandio / Millions, 14-mai-2026):
  // Quando o cliente abre o link em duas abas/janelas, ou retoma a sessão noutro
  // device, o `created_onboarding_case_id` pode ser sobrescrito por outra aba.
  // Sem este listener, o React state segura o caseId ANTIGO indefinidamente, e o
  // botão "Próximo" do pai bate em case_id_missing porque lê do localStorage fresco.
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'created_onboarding_case_id' && e.newValue && e.newValue !== caseId) {
        setCaseId(e.newValue);
      }
      if (e.key === 'created_doc_link_token' && e.newValue && e.newValue !== docToken) {
        setDocToken(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [caseId, docToken]);

  // Notify parent whenever case+token become available so it can use them to
  // unblock the "Próximo" button validation immediately.
  useEffect(() => {
    if (onCaseReady && caseId) {
      onCaseReady({ caseId, docLinkToken: docToken || '' });
    }
  }, [caseId, docToken, onCaseReady]);

  // Expand per-representative documents (identity, address proof, selfie)
  // into N copies — one per representative. Declared HERE (before any early return)
  // to comply with React's rules of hooks.
  const expandedTemplate = useMemo(() => {
    if (!template || !Array.isArray(template.requiredDocuments)) return template;
    try {
      const reps = getRepresentativesFromStorage(formDataStorageKey, questions);
      const expanded = expandPerRepresentativeDocs(template.requiredDocuments, reps);
      if (expanded === template.requiredDocuments) return template;
      return { ...template, requiredDocuments: expanded };
    } catch (e) {
      console.warn('[BulletproofUploaderWithLazyCase] expand per-rep failed:', e?.message);
      return template;
    }
  }, [template, formDataStorageKey, questions]);

  useEffect(() => {
    // Already have both — nothing to do
    if (caseId && docToken) return;
    if (creatingRef.current) return;
    creatingRef.current = true;

    (async () => {
      setIsCreating(true);
      setError(null);
      try {
        const formData = JSON.parse(localStorage.getItem(formDataStorageKey) || '{}');
        const linkCode = localStorage.getItem('onboarding_link_code') || undefined;

        // Helper to find a value in the saved form by matching keywords against question text
        const findValue = (keywords) => {
          for (const q of questions) {
            const text = (q.text || '').toLowerCase();
            if (keywords.some(kw => text.includes(kw)) && formData[q.id]) return formData[q.id];
          }
          return '';
        };

        const isPF = template?.merchantType === 'PF';
        const merchantData = {
          type: isPF ? 'PF' : 'PJ',
          cpfCnpj: isPF ? (findValue(['cpf']) || '') : (findValue(['cnpj']) || ''),
          fullName: isPF ? (findValue(['nome completo']) || '') : (findValue(['razão social', 'razao social']) || ''),
          companyName: isPF ? '' : (findValue(['fantasia', 'nome fantasia']) || ''),
          email: findValue(['e-mail', 'email']) || '',
          onboardingStatus: 'Pendente',
          paymentServices: flowType === 'pix' ? ['Pix'] : ['Pix', 'Cartão'],
        };
        if (isPF) {
          merchantData.dateOfBirth = findValue(['data de nascimento']) || '';
          merchantData.nationality = findValue(['nacionalidade']) || '';
          merchantData.motherName = findValue(['nome da mãe', 'nome da mae']) || '';
        }

        const responses = questions
          .filter(q => formData[q.id] !== undefined && formData[q.id] !== '')
          .map(q => ({
            questionId: q.id,
            questionText: q.text,
            questionType: q.type,
            valueText: typeof formData[q.id] === 'string' ? formData[q.id] :
                       Array.isArray(formData[q.id]) ? formData[q.id].join(', ') : undefined,
            valueBoolean: typeof formData[q.id] === 'boolean' ? formData[q.id] : undefined,
            valueNumber: typeof formData[q.id] === 'number' ? formData[q.id] : undefined,
            valueArray: Array.isArray(formData[q.id]) ? formData[q.id] : undefined,
          }));

        const body = await callPublicFunction('publicComplianceSubmit', {
          templateId: template?.id,
          linkCode,
          merchantData,
          onboardingCaseData: { status: 'Pendente', priority: 'medium' },
          responses,
        });
        // callPublicFunction returns the response body directly (no .data wrapper).
        // Accept both legacy ({ data: {...} }) and direct shapes for safety.
        const payload = body?.data ?? body;

        if (payload?.error || !payload?.ok) {
          throw new Error(payload?.error || 'Erro ao criar caso de onboarding');
        }

        const newCaseId = payload.onboardingCaseId;
        const newToken = payload.docLinkToken;

        localStorage.setItem('created_onboarding_case_id', newCaseId);
        localStorage.setItem('created_merchant_id', payload.merchantId);
        if (newToken) localStorage.setItem('created_doc_link_token', newToken);

        setCaseId(newCaseId);
        setDocToken(newToken);
      } catch (e) {
        console.error('[BulletproofUploaderWithLazyCase] lazy-create failed:', e);
        const errMsg = e?.message || 'Falha ao preparar o envio dos documentos';
        setError(errMsg);
        logSubsellerError({
          stage: 'lazy_case_create_failed',
          message: errMsg,
          context: {
            flowType,
            templateModel,
            templateId: template?.id,
            hasFormData: !!localStorage.getItem(formDataStorageKey),
            linkCode: localStorage.getItem('onboarding_link_code'),
          },
        });
        toast.error(
          'Não conseguimos preparar o envio dos documentos. ' + errMsg + '. Você pode tentar novamente abaixo.',
          { duration: 12000 }
        );
      } finally {
        setIsCreating(false);
        creatingRef.current = false;
      }
    })();
  }, [caseId, docToken, template, questions, templateModel, formDataStorageKey, flowType]);

  if (isCreating) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
        <span className="ml-3 text-[#002443]/70">Preparando envio de documentos...</span>
      </div>
    );
  }

  if (error && !caseId) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 text-center">
          <div className="inline-flex p-3 rounded-full bg-amber-100 mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-lg font-bold text-[#002443] mb-2">
            Não foi possível preparar o envio
          </h2>
          <p className="text-sm text-[#002443]/70 mb-4">
            {error}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-left">
            <p className="text-xs text-blue-900 leading-relaxed">
              <strong>O que aconteceu:</strong> houve um erro ao registrar seu cadastro
              no nosso sistema antes de aceitar os documentos. Seus dados do questionário
              continuam salvos — basta tentar de novo.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setError(null);
                creatingRef.current = false;
                // re-dispara o effect de lazy-create
                setCaseId(localStorage.getItem('created_onboarding_case_id'));
              }}
              className="w-full bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full text-xs text-[#002443]/60 hover:text-[#002443] underline"
            >
              Recarregar a página
            </button>
          </div>
          <p className="text-[10px] text-[#002443]/40 mt-4">
            Se o problema persistir, entre em contato com nosso suporte.
          </p>
        </div>
      </div>
    );
  }

  if (!caseId) return null;

  const formDataParsed = JSON.parse(localStorage.getItem(formDataStorageKey) || '{}');

  return (
    <BulletproofDocumentUploader
      template={expandedTemplate}
      documents={documents}
      setDocuments={setDocuments}
      storageKey={documentsStorageKey}
      caseId={caseId}
      docLinkToken={docToken}
      onAllRequiredUploaded={onAllRequiredUploaded}
      formData={formDataParsed}
    />
  );
}