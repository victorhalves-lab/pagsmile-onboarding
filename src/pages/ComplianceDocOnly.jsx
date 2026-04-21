import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, FileUp, Loader2, CheckCircle2, AlertTriangle, ScanFace, ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import DynamicDocumentUploader from '@/components/compliance/DynamicDocumentUploader';
import CafVerificationStep from '@/components/compliance/CafVerificationStep';
import CafOnlyWelcomeBanner from '@/components/compliance/CafOnlyWelcomeBanner';
import ComplianceReviewStep from '@/components/compliance/ComplianceReviewStep';
import { StepPill, StepSep } from '@/components/compliance/StepIndicator';

/**
 * Public page: /ComplianceDocOnly?caseId=XXX&token=YYY
 * 
 * Allows a client who already completed the questionnaire to upload documents
 * and complete CAF verification (DocumentDetector + FaceLiveness) without
 * repeating the questionnaire.
 */

export default function ComplianceDocOnly() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('caseId');
  const token = urlParams.get('token');
  const mode = urlParams.get('mode');
  // MODES:
  //   - docs_only: Upload business docs only; CAF identity SDK is SKIPPED (VerifAI still runs server-side)
  //   - caf_only: Skip docs; go straight to CAF identity SDK (for clients who already uploaded docs)
  //   - docs_and_caf (DEFAULT): Full recovery flow — upload docs, then do CAF identity verification
  const skipCafIdentity = mode === 'docs_only';
  const cafOnlyMode = mode === 'caf_only';
  // "docs_and_caf" is the default — treated the same as no mode specified.

  const [documents, setDocuments] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allRequiredUploaded, setAllRequiredUploaded] = useState(false);
  // Steps (dependem do mode):
  //   docs_only      : docs_upload → review → completed
  //   caf_only       : caf_verification → completed
  //   docs_and_caf   : docs_upload → review → caf_verification → completed
  const [currentStep, setCurrentStep] = useState(cafOnlyMode ? 'caf_verification' : 'docs_upload');
  const [cafResult, setCafResult] = useState(null);

  // ── Session token for server-side progress persistence ──
  // Enables the client to resume from where they stopped if they close the browser.
  const sessionToken = useMemo(() => {
    if (!caseId) return '';
    const key = `compliance_session_token_doc_only_${caseId}`;
    let t = localStorage.getItem(key);
    if (!t) {
      t = `docs_${caseId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(key, t);
    }
    return t;
  }, [caseId]);

  // ── Load OnboardingCase + Template (token-protected via backend) ──
  const { data: caseContext, isLoading: loadingCase } = useQuery({
    queryKey: ['docOnlyCaseCtx', caseId, token],
    queryFn: async () => {
      if (!caseId || !token) return null;
      const res = await base44.functions.invoke('publicReadContext', {
        kind: 'onboarding_case_for_doc_only', caseId, token,
      });
      return res.data || null;
    },
    enabled: !!caseId && !!token,
  });
  const onboardingCase = caseContext?.case || null;
  const template = caseContext?.template || null;
  const loadingTemplate = loadingCase;

  // Token is valid iff backend returned the case (backend enforces token match)
  const isTokenValid = !!onboardingCase;

  // ── Load Merchant via backend (token-protected) ──
  const { data: merchant } = useQuery({
    queryKey: ['docOnlyMerchant', caseId, token],
    queryFn: async () => {
      const res = await base44.functions.invoke('publicReadContext', {
        kind: 'merchant_for_doc_only', caseId, token,
      });
      return res.data?.merchant || null;
    },
    enabled: !!onboardingCase,
  });

  // ── Save documents progress to server (debounced) whenever docs change ──
  // CRITICAL: this useEffect MUST come AFTER the useQuery declarations for `template` and `merchant`,
  // otherwise we get ReferenceError: Cannot access 'template'/'merchant' before initialization.
  React.useEffect(() => {
    if (!sessionToken || !caseId || Object.keys(documents).length === 0) return;
    const timer = setTimeout(() => {
      base44.functions.invoke('saveComplianceProgress', {
        sessionToken,
        flowType: cafOnlyMode ? 'caf_only_recovery' : (skipCafIdentity ? 'docs_only_recovery' : 'docs_and_caf_recovery'),
        templateModel: template?.model || '',
        currentPhase: currentStep === 'caf_verification' ? 'caf' : 'documents',
        documentsData: documents,
        clientEmail: merchant?.email || '',
        clientName: merchant?.fullName || '',
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [documents, sessionToken, caseId, currentStep, cafOnlyMode, skipCafIdentity, template, merchant]);

  // ── Restore documents from server on mount (if session exists) ──
  React.useEffect(() => {
    if (!sessionToken || !caseId) return;
    (async () => {
      try {
        const res = await base44.functions.invoke('loadComplianceProgress', { sessionToken });
        if (res.data?.session?.documentsData && Object.keys(res.data.session.documentsData).length > 0) {
          setDocuments(res.data.session.documentsData);
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken]);

  // ── Get person data for CAF ──
  const getPersonData = () => {
    if (!merchant) return { name: '', cpf: '' };
    return {
      name: merchant.fullName || '',
      cpf: merchant.cpfCnpj || '',
    };
  };

  // ── Get model label ──
  const getModelLabel = () => {
    const model = template?.model || '';
    const labels = {
      'ComplianceEcommerceV4': 'E-commerce',
      'ComplianceGatewayV4': 'Gateway',
      'ComplianceMarketplaceV4': 'Marketplace',
      'CompliancePlataformaVerticalV4': 'Plataforma Vertical',
      'ComplianceInfoprodutosV4': 'Infoprodutos',
      'ComplianceEducacaoV4': 'Educação',
      'ComplianceSaaSV4': 'SaaS',
      'ComplianceMerchantLinkV4': 'Link de Pagamento',
      'ComplianceMPEV4': 'MPE',
      'ComplianceDropshippingV4': 'Dropshipping',
      'CompliancePixMerchantV4': 'PIX Merchant',
      'CompliancePixIntermediarioV4': 'PIX Intermediário',
    };
    return labels[model] || model || 'Compliance';
  };

  // ── Proceed to CAF step (or submit directly in docs_only mode) ──
  // CRITICAL: A doc is "satisfied" if it has files OR has a not-available justification.
  // Also enforce that ALL docs must have an explicit action (prevents empty-state bypass
  // for templates where requiredDocuments are not marked `required: true` individually).
  const handleProceedToCaf = () => {
    const allTemplateDocs = (template?.requiredDocuments || []).map((doc, index) => ({
      ...doc,
      _docKey: doc.documentTypeId || doc.id || `doc_${index}_${(doc.label || '').replace(/\s+/g, '_').toLowerCase().slice(0, 30)}`,
    }));
    const isSatisfied = (d) => {
      const e = documents[d._docKey];
      if (!e) return false;
      const hasFiles = Array.isArray(e.files) ? e.files.length > 0 : !!e.url;
      return hasFiles || (e.notAvailable && e.notAvailableReason);
    };
    // Explicitly required docs
    const mandatoryDocs = allTemplateDocs.filter(d => d.required);
    const missingMandatory = mandatoryDocs.filter(d => !isSatisfied(d));
    if (missingMandatory.length > 0) {
      toast.error(`Faltam ${missingMandatory.length} documentos obrigatórios: ${missingMandatory.map(d => d.label || d.name).join(', ')}`);
      return;
    }
    // SAFETY NET: template has docs configured but nothing was acted on → block.
    if (allTemplateDocs.length > 0 && Object.keys(documents).length === 0) {
      toast.error(
        `Este fluxo exige o envio de ${allTemplateDocs.length} documento(s). ` +
        `Anexe cada documento solicitado ou clique em "Não tenho este documento" para justificar.`,
        { duration: 8000 }
      );
      return;
    }
    // Extra safety: if NONE are explicitly required: true, require 80% action rate.
    if (mandatoryDocs.length === 0 && allTemplateDocs.length >= 3) {
      const acted = allTemplateDocs.filter(isSatisfied).length;
      const minRequired = Math.ceil(allTemplateDocs.length * 0.8);
      if (acted < minRequired) {
        toast.error(
          `Envie ou justifique pelo menos ${minRequired} dos ${allTemplateDocs.length} documentos. ` +
          `Faltam ${allTemplateDocs.length - acted}.`,
          { duration: 8000 }
        );
        return;
      }
    }
    // Always go to the review screen first — gives the client one last look before submitting.
    // From the review screen we either go to CAF (docs_and_caf) or submit directly (docs_only).
    setCurrentStep('review');
  };

  // From review screen: advance to CAF or submit (depending on mode).
  const handleReviewConfirm = () => {
    if (skipCafIdentity) {
      handleFinalSubmit(null);
      return;
    }
    setCurrentStep('caf_verification');
  };

  // ── Final submit ──
  const handleFinalSubmit = async (cafResultParam) => {
    const effectiveCafResult = cafResultParam || cafResult;
    setIsSubmitting(true);
    try {
      // In caf_only mode, skip document upload entirely — only the CAF identity results
      // need to be persisted (which already happened inside CafVerificationStep).
      // We just need to flip cafCompleted=true on the case.
      const isCafOnly = cafOnlyMode;

      // Upload documents via publicComplianceDocUpload (asServiceRole, token-protected)
      const allTemplateDocs = (template?.requiredDocuments || []).map((doc, index) => ({
        ...doc,
        _docKey: doc.documentTypeId || doc.id || `doc_${index}_${(doc.label || '').replace(/\s+/g, '_').toLowerCase().slice(0, 30)}`,
      }));
      // ── Build payload: one entry per uploaded FILE (multi-file support) ──
      // A single document slot may have multiple files (e.g. 3 PDFs of balanço).
      // We flatten so the backend persists each as a separate DocumentUpload row.
      const docsPayload = isCafOnly ? [] : Object.entries(documents).flatMap(([docId, docData]) => {
        const docDef = allTemplateDocs.find(d => d._docKey === docId);
        const docName = docDef?.label || docDef?.name || docId;
        // Not-available: single entry with the justification
        if (docData.notAvailable && docData.notAvailableReason) {
          return [{
            documentTypeId: docId,
            documentName: docName,
            fileUrl: '',
            notAvailable: true,
            notAvailableReason: docData.notAvailableReason,
            uploadDate: docData.uploadedAt,
          }];
        }
        // Multi-file shape
        const files = Array.isArray(docData.files) && docData.files.length > 0
          ? docData.files
          : (docData.url ? [{ url: docData.url, uri: docData.uri, isPrivate: docData.isPrivate, name: docData.name, size: docData.size, type: docData.type, uploadedAt: docData.uploadedAt }] : []);
        return files.map((f, idx) => ({
          documentTypeId: files.length > 1 ? `${docId}__part${idx + 1}` : docId,
          documentName: files.length > 1 ? `${docName} (parte ${idx + 1}/${files.length})` : docName,
          fileUrl: f.url,
          fileUri: f.uri || f.url,
          isPrivate: f.isPrivate === true,
          fileName: f.name,
          fileSize: f.size,
          fileType: f.type,
          uploadDate: f.uploadedAt,
        }));
      });
      if (docsPayload.length > 0) {
        const uploadRes = await base44.functions.invoke('publicComplianceDocUpload', {
          caseId, docLinkToken: token, documents: docsPayload,
        });
        const uploadData = uploadRes?.data || {};
        // Accept partial-success only if failedCount=0 (skipped is OK — usually duplicates).
        if (!uploadData.ok && (uploadData.failedCount || 0) > 0) {
          const failedList = Array.isArray(uploadData.failed) && uploadData.failed.length > 0
            ? uploadData.failed.map(f => `${f.documentName || f.documentTypeId}: ${f.error}`).join('; ')
            : 'erro desconhecido';
          console.error('[ComplianceDocOnly] Upload failed', uploadData);
          toast.error(
            `Falha ao salvar documentos (${uploadData.createdCount || 0}/${docsPayload.length}). ` +
            `Detalhes: ${failedList}. Tente novamente ou contate o suporte.`,
            { duration: 10000 }
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Only reached if ALL documents were successfully persisted (or docs_only/caf_only mode).
      // In caf_only mode, we ONLY flip cafCompleted — docCompleted stays as-is (docs were already uploaded earlier).
      const updates = {
        cafCompleted: !!effectiveCafResult || cafOnlyMode,
        submissionDate: new Date().toISOString(),
      };
      if (!cafOnlyMode) {
        // Only set docCompleted=true when we actually uploaded documents in this session.
        updates.docCompleted = true;
      }
      await base44.functions.invoke('publicComplianceCaseUpdate', {
        caseId,
        docLinkToken: token,
        updates,
      });

      // Trigger re-analysis pipeline (non-blocking)
      base44.functions.invoke('autoEnrichOnboarding', { onboardingCaseId: caseId }).catch(() => {});

      toast.success('Documentos e verificação enviados com sucesso!');
      setCurrentStep('completed');
    } catch (error) {
      console.error('Erro ao submeter:', error);
      toast.error('Erro ao enviar: ' + (error?.message || 'erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading ──
  if (loadingCase || loadingTemplate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
        <span className="ml-3 text-[#002443]/70">Carregando...</span>
      </div>
    );
  }

  // ── Invalid token or missing case ──
  if (!caseId || !token || !onboardingCase || !isTokenValid) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-8">
          <ShieldAlert className="w-16 h-16 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-[#002443] mb-2">Link inválido ou expirado</h2>
          <p className="text-[#002443]/60 text-sm">
            Este link de complemento de documentos não é válido. Verifique se o link está correto ou entre em contato com o suporte.
          </p>
        </div>
      </div>
    );
  }

  // Note: We no longer block re-submission here.
  // When an analyst resets docCompleted/cafCompleted via bulk actions,
  // the client can re-submit docs + CAF through the same link.

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertTriangle className="w-16 h-16 mx-auto text-amber-400 mb-4" />
          <h2 className="text-xl font-bold text-[#002443] mb-2">Template não encontrado</h2>
          <p className="text-[#002443]/60 text-sm">
            Não foi possível carregar os documentos necessários para este caso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 px-4">
      {/* Welcome banner for caf_only mode — contextualizes the client */}
      {cafOnlyMode && (
        <CafOnlyWelcomeBanner merchantName={merchant?.fullName} />
      )}

      {/* Header */}
      <div className="text-center mb-6 md:mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--pagsmile-green)]/10 mb-4">
          {currentStep === 'caf_verification' ? (
            <ScanFace className="w-8 h-8 text-purple-600" />
          ) : (
            <FileUp className="w-8 h-8 text-[var(--pagsmile-green)]" />
          )}
        </div>

        {/* Step indicator — adapts to mode: docs_only hides CAF step, caf_only hides Docs step */}
        <div className="flex items-center justify-center gap-2 md:gap-3 mb-4 flex-wrap">
          {!cafOnlyMode && (
            <>
              <StepPill
                active={currentStep === 'docs_upload'}
                done={['review', 'caf_verification', 'completed'].includes(currentStep)}
                label="Documentos"
                number={1}
              />
              <StepSep />
              <StepPill
                active={currentStep === 'review'}
                done={['caf_verification', 'completed'].includes(currentStep)}
                label="Revisão"
                number={2}
              />
              {!skipCafIdentity && <StepSep />}
            </>
          )}
          {!skipCafIdentity && (
            <StepPill
              active={currentStep === 'caf_verification'}
              done={currentStep === 'completed'}
              label="Verificação CAF"
              number={cafOnlyMode ? 1 : 3}
              tone="purple"
            />
          )}
          <StepSep />
          <StepPill
            active={currentStep === 'completed'}
            done={currentStep === 'completed'}
            label="Conclusão"
            number={cafOnlyMode ? 2 : (skipCafIdentity ? 3 : 4)}
          />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-[var(--pagsmile-blue)] mb-2">
          {currentStep === 'caf_verification' ? 'Verificação de Identidade'
            : currentStep === 'review' ? 'Resumo antes de enviar'
            : 'Complemento de Documentos'}
        </h1>
        <p className="text-[var(--pagsmile-blue)]/70 max-w-lg mx-auto">
          {cafOnlyMode
            ? 'Você está a um passo de concluir seu cadastro. Capture seu documento de identidade (frente e verso) e faça a prova de vida.'
            : currentStep === 'caf_verification'
            ? 'Capture seu documento e realize a prova de vida para verificar sua identidade.'
            : currentStep === 'review'
            ? 'Confira as informações abaixo. Depois de confirmar, seus dados seguem para análise.'
            : 'Envie os documentos solicitados e complete a verificação de identidade para finalizar o onboarding.'}
        </p>

        {/* Client info + segment */}
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          <div className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
            {getModelLabel()}
          </div>
          {merchant && (
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600">
              {merchant.fullName}
            </div>
          )}
        </div>
      </div>

      {/* Step 1: Upload de Documentos (skipped in caf_only mode) */}
      {currentStep === 'docs_upload' && !cafOnlyMode && (
        <DynamicDocumentUploader
          template={template}
          documents={documents}
          setDocuments={setDocuments}
          storageKey={`doc_only_${caseId}`}
          onAllRequiredUploaded={setAllRequiredUploaded}
          formData={{}}
        />
      )}

      {/* Step 2: Review (resumo final antes de enviar) — skipped in caf_only mode */}
      {currentStep === 'review' && !cafOnlyMode && (
        <ComplianceReviewStep
          merchant={merchant}
          template={template}
          documents={documents}
          modeLabel={
            skipCafIdentity
              ? 'Apenas documentos'
              : 'Documentos + Verificação de identidade'
          }
          nextStepLabel={
            skipCafIdentity
              ? 'Confirmar e Enviar Documentos'
              : 'Próximo: Verificação de Identidade'
          }
          NextStepIcon={skipCafIdentity ? CheckCircle2 : ScanFace}
          onBack={() => setCurrentStep('docs_upload')}
          onConfirm={handleReviewConfirm}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Step 3: CAF Verification */}
      {currentStep === 'caf_verification' && (
        <div className="mb-8">
          <CafVerificationStep
            personName={getPersonData().name}
            personCpf={getPersonData().cpf}
            onboardingCaseId={caseId}
            onComplete={(result) => {
              setCafResult(result);
              handleFinalSubmit(result);
            }}
          />
        </div>
      )}

      {/* Step 3: Completed */}
      {currentStep === 'completed' && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#002443] mb-3">Processo concluído com sucesso!</h2>
          <p className="text-[#002443]/60 max-w-md mx-auto mb-6">
            Seus documentos e verificação de identidade foram enviados com sucesso.
            Nossa equipe de compliance irá analisar as informações.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Documentos enviados e verificação CAF concluída
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      {currentStep === 'docs_upload' && (
        <div className="flex justify-center mt-8 pt-6 border-t border-slate-200">
          <Button
            onClick={handleProceedToCaf}
            disabled={isSubmitting}
            className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white px-8 h-12 rounded-xl shadow-lg shadow-green-500/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
            ) : (
              <><FileUp className="w-4 h-4 mr-2" /> Revisar antes de enviar</>
            )}
          </Button>
        </div>
      )}

      {currentStep === 'caf_verification' && (
        <div className="flex justify-center mt-6">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep('docs_upload')}
            className="text-slate-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Documentos
          </Button>
        </div>
      )}
    </div>
  );
}