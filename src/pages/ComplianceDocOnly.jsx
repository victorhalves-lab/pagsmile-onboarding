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

  const [documents, setDocuments] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allRequiredUploaded, setAllRequiredUploaded] = useState(false);
  const [currentStep, setCurrentStep] = useState('docs_upload');
  const [cafResult, setCafResult] = useState(null);

  // ── Load OnboardingCase ──
  const { data: onboardingCase, isLoading: loadingCase, error: caseError } = useQuery({
    queryKey: ['docOnlyCase', caseId],
    queryFn: async () => {
      if (!caseId) return null;
      const cases = await base44.entities.OnboardingCase.filter({ id: caseId });
      return cases[0] || null;
    },
    enabled: !!caseId,
  });

  // ── Validate token ──
  const isTokenValid = onboardingCase && onboardingCase.docLinkToken === token;

  // ── Load Merchant (for person data) ──
  const { data: merchant } = useQuery({
    queryKey: ['docOnlyMerchant', onboardingCase?.merchantId],
    queryFn: async () => {
      const merchants = await base44.entities.Merchant.filter({ id: onboardingCase.merchantId });
      return merchants[0] || null;
    },
    enabled: !!onboardingCase?.merchantId,
  });

  // ── Load Template (for required documents) ──
  const { data: template, isLoading: loadingTemplate } = useQuery({
    queryKey: ['docOnlyTemplate', onboardingCase?.questionnaireTemplateId],
    queryFn: async () => {
      const templates = await base44.entities.QuestionnaireTemplate.filter({
        id: onboardingCase.questionnaireTemplateId,
      });
      return templates[0] || null;
    },
    enabled: !!onboardingCase?.questionnaireTemplateId,
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

  // ── Proceed to CAF step ──
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
    setCurrentStep('caf_verification');
  };

  // ── Final submit ──
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Save document uploads
      const allTemplateDocs = (template?.requiredDocuments || []).map((doc, index) => ({
        ...doc,
        _docKey: doc.documentTypeId || doc.id || `doc_${index}_${(doc.label || '').replace(/\s+/g, '_').toLowerCase().slice(0, 30)}`,
      }));
      // Criar individualmente para disparar automação CAF VerifAI em cada documento
      for (const [docId, docData] of Object.entries(documents)) {
        const docDef = allTemplateDocs.find(d => d._docKey === docId);
        await base44.entities.DocumentUpload.create({
          onboardingCaseId: caseId,
          documentTypeId: docId,
          documentName: docDef?.label || docDef?.name || docId,
          fileUrl: docData.url,
          fileName: docData.name,
          fileSize: docData.size,
          fileType: docData.type,
          uploadDate: docData.uploadedAt,
          validationStatus: 'Pendente',
        });
      }

      // Mark case as doc completed
      await base44.entities.OnboardingCase.update(caseId, {
        docCompleted: true,
        status: 'Em Processamento',
      });

      toast.success('Documentos e verificação enviados com sucesso!');
      setCurrentStep('completed');
    } catch (error) {
      console.error('Erro ao submeter:', error);
      toast.error('Erro ao enviar: ' + error.message);
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

  // ── Already completed ──
  if (onboardingCase.docCompleted && onboardingCase.cafCompleted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-8">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-[#002443] mb-2">Documentos já enviados!</h2>
          <p className="text-[#002443]/60 text-sm">
            Você já completou o envio de documentos e a verificação de identidade para este caso. Não é necessário enviar novamente.
          </p>
        </div>
      </div>
    );
  }

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

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            currentStep === 'docs_upload' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300' : 'bg-green-100 text-green-700'
          }`}>
            {currentStep !== 'docs_upload' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">1</span>}
            Documentos
          </div>
          <div className="w-8 h-0.5 bg-slate-200" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            currentStep === 'caf_verification' ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-300' :
            currentStep === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
          }`}>
            {currentStep === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-5 h-5 rounded-full bg-slate-300 text-white text-[10px] flex items-center justify-center">2</span>}
            Verificação CAF
          </div>
          <div className="w-8 h-0.5 bg-slate-200" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
            currentStep === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
          }`}>
            {currentStep === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-5 h-5 rounded-full bg-slate-300 text-white text-[10px] flex items-center justify-center">3</span>}
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
              handleFinalSubmit();
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