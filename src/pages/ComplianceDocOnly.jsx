import React, { useState, useEffect } from 'react';
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
  // When mode=docs_only, the CAF identity SDK (RG/CNH + selfie + liveness) is SKIPPED.
  // The uploaded business documents are STILL analyzed by CAF VerifAI in the backend
  // (digital manipulation detection) — VerifAI runs automatically on each DocumentUpload
  // created by publicComplianceDocUpload.
  const skipCafIdentity = urlParams.get('mode') === 'docs_only';

  const [documents, setDocuments] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allRequiredUploaded, setAllRequiredUploaded] = useState(false);
  const [currentStep, setCurrentStep] = useState('docs_upload');
  const [cafResult, setCafResult] = useState(null);

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
  const handleProceedToCaf = () => {
    const requiredDocs = (template?.requiredDocuments || []).map((doc, index) => ({
      ...doc,
      _docKey: doc.documentTypeId || doc.id || `doc_${index}_${(doc.label || '').replace(/\s+/g, '_').toLowerCase().slice(0, 30)}`,
    }));
    const mandatoryDocs = requiredDocs.filter(d => d.required);
    const missingDocs = mandatoryDocs.filter(d => !documents[d._docKey]?.url);
    if (missingDocs.length > 0) {
      toast.error(`Faltam ${missingDocs.length} documentos obrigatórios: ${missingDocs.map(d => d.label || d.name).join(', ')}`);
      return;
    }
    // In docs_only mode, skip CAF identity SDK and submit directly.
    // Uploaded docs will still be analyzed by CAF VerifAI (server-side, automatic).
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
      // Upload documents via publicComplianceDocUpload (asServiceRole, token-protected)
      const allTemplateDocs = (template?.requiredDocuments || []).map((doc, index) => ({
        ...doc,
        _docKey: doc.documentTypeId || doc.id || `doc_${index}_${(doc.label || '').replace(/\s+/g, '_').toLowerCase().slice(0, 30)}`,
      }));
      const docsPayload = Object.entries(documents).map(([docId, docData]) => {
        const docDef = allTemplateDocs.find(d => d._docKey === docId);
        return {
          documentTypeId: docId,
          documentName: docDef?.label || docDef?.name || docId,
          fileUrl: docData.url,
          fileName: docData.name,
          fileSize: docData.size,
          fileType: docData.type,
          uploadDate: docData.uploadedAt,
        };
      });
      if (docsPayload.length > 0) {
        const uploadRes = await base44.functions.invoke('publicComplianceDocUpload', {
          caseId, docLinkToken: token, documents: docsPayload,
        });
        const uploadData = uploadRes?.data || {};
        // CRITICAL: server returns { ok, createdCount, requestedCount, failed: [...] }.
        // If not ALL documents were saved, ABORT and do NOT mark docCompleted=true.
        if (!uploadData.ok || uploadData.createdCount !== docsPayload.length) {
          const failedList = Array.isArray(uploadData.failed) && uploadData.failed.length > 0
            ? uploadData.failed.map(f => `${f.documentName || f.documentTypeId}: ${f.error}`).join('; ')
            : 'erro desconhecido';
          console.error('[ComplianceDocOnly] Upload incomplete', uploadData);
          toast.error(
            `Falha ao salvar documentos (${uploadData.createdCount || 0}/${docsPayload.length}). ` +
            `Detalhes: ${failedList}. Tente novamente ou contate o suporte.`,
            { duration: 10000 }
          );
          setIsSubmitting(false);
          return; // ABORT — do not mark docCompleted
        }
      }

      // Only reached if ALL documents were successfully persisted.
      // Mark case as doc + caf completed (whitelisted fields only via publicComplianceCaseUpdate)
      await base44.functions.invoke('publicComplianceCaseUpdate', {
        caseId,
        docLinkToken: token,
        updates: {
          docCompleted: true,
          cafCompleted: !!effectiveCafResult,
          submissionDate: new Date().toISOString(),
        }
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--pagsmile-green)]/10 mb-4">
          {currentStep === 'caf_verification' ? (
            <ScanFace className="w-8 h-8 text-purple-600" />
          ) : (
            <FileUp className="w-8 h-8 text-[var(--pagsmile-green)]" />
          )}
        </div>

        {/* Step indicator — in docs_only mode, hide the CAF identity step */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            currentStep === 'docs_upload' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300' : 'bg-green-100 text-green-700'
          }`}>
            {currentStep !== 'docs_upload' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">1</span>}
            Documentos
          </div>
          {!skipCafIdentity && (
            <>
              <div className="w-8 h-0.5 bg-slate-200" />
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                currentStep === 'caf_verification' ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-300' :
                currentStep === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
              }`}>
                {currentStep === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-5 h-5 rounded-full bg-slate-300 text-white text-[10px] flex items-center justify-center">2</span>}
                Verificação CAF
              </div>
            </>
          )}
          <div className="w-8 h-0.5 bg-slate-200" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
            currentStep === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
          }`}>
            {currentStep === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-5 h-5 rounded-full bg-slate-300 text-white text-[10px] flex items-center justify-center">{skipCafIdentity ? '2' : '3'}</span>}
            Conclusão
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-[var(--pagsmile-blue)] mb-2">
          {currentStep === 'caf_verification' ? 'Verificação de Identidade' : 'Complemento de Documentos'}
        </h1>
        <p className="text-[var(--pagsmile-blue)]/70 max-w-lg mx-auto">
          {currentStep === 'caf_verification'
            ? 'Capture seu documento e realize a prova de vida para verificar sua identidade.'
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

      {/* Step 1: Upload de Documentos */}
      {currentStep === 'docs_upload' && (
        <DynamicDocumentUploader
          template={template}
          documents={documents}
          setDocuments={setDocuments}
          storageKey={`doc_only_${caseId}`}
          onAllRequiredUploaded={setAllRequiredUploaded}
          formData={{}}
        />
      )}

      {/* Step 2: CAF Verification */}
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
            ) : skipCafIdentity ? (
              <><CheckCircle2 className="w-4 h-4 mr-2" /> Enviar Documentos</>
            ) : (
              <><ScanFace className="w-4 h-4 mr-2" /> Próximo: Verificação de Identidade</>
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