import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, FileUp, Loader2, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';
import DynamicDocumentUploader from './DynamicDocumentUploader';
import { useComplianceSession } from '../../hooks/useComplianceSession';
import AutoSaveIndicator from './AutoSaveIndicator';

export default function DynamicDocumentUploadPage({
  templateId,
  templateModel,
  formDataStorageKey,
  documentsStorageKey,
  questionnairePageName,
  nextPageName = 'LivenessFacematchStep',
  flowType,
  badgeLabel,
  badgeColor = 'bg-blue-100 text-blue-700',
  onSubmit
}) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allRequiredUploaded, setAllRequiredUploaded] = useState(false);

  // Session for save & resume
  const {
    sessionLoaded,
    savedDocumentsData,
    saveProgress,
    saveProgressNow,
    completeSession,
    getResumeUrl
  } = useComplianceSession({
    flowType: flowType || templateModel,
    templateModel: templateModel || 'unknown',
    storageKey: formDataStorageKey
  });

  // Track stage entry
  const hasTrackedEntry = useRef(false);
  useEffect(() => {
    if (!hasTrackedEntry.current) {
      hasTrackedEntry.current = true;
      base44.analytics.track({
        eventName: 'compliance_stage_entered',
        properties: {
          stage: 'documents',
          flow_type: flowType || templateModel || '',
          template_model: templateModel || '',
        }
      });
    }
  }, [flowType, templateModel]);

  // Track drop-off on page unload
  useEffect(() => {
    const handleUnload = () => {
      base44.analytics.track({
        eventName: 'compliance_stage_dropoff',
        properties: {
          stage: 'documents',
          flow_type: flowType || templateModel || '',
          template_model: templateModel || '',
          docs_uploaded: Object.keys(documents).length,
        }
      });
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [flowType, templateModel, documents]);

  // Restore documents from session
  useEffect(() => {
    if (sessionLoaded && savedDocumentsData && Object.keys(savedDocumentsData).length > 0) {
      setDocuments(prev => {
        if (Object.keys(prev).length === 0) return savedDocumentsData;
        return prev;
      });
    }
  }, [sessionLoaded, savedDocumentsData]);

  // Auto-save documents to server when they change
  useEffect(() => {
    if (Object.keys(documents).length > 0) {
      saveProgress({
        currentPhase: 'documents',
        documentsData: documents
      });
    }
  }, [documents, saveProgress]);

  // Buscar template
  const { data: template, isLoading: loadingTemplate } = useQuery({
    queryKey: ['template', templateId, templateModel],
    queryFn: async () => {
      const savedTemplateId = localStorage.getItem('current_template_id');
      if (savedTemplateId) {
        const templates = await base44.entities.QuestionnaireTemplate.filter({ id: savedTemplateId });
        if (templates[0]) return templates[0];
      }
      
      if (templateId) {
        const templates = await base44.entities.QuestionnaireTemplate.filter({ id: templateId });
        return templates[0] || null;
      } else if (templateModel) {
        const templates = await base44.entities.QuestionnaireTemplate.filter({ model: templateModel, isActive: true });
        return templates[0] || null;
      }
      return null;
    }
  });

  // Buscar perguntas para salvar as respostas
  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['questions', template?.id],
    queryFn: () => base44.entities.Question.filter(
      { questionnaireTemplateId: template.id }, 
      'order'
    ),
    enabled: !!template?.id
  });

  const handleSubmit = async () => {
    // Verificar documentos obrigatórios
    const requiredDocs = (template?.requiredDocuments || []).map((doc, index) => ({
      ...doc,
      _docKey: doc.documentTypeId || doc.id || `doc_${index}_${(doc.label || '').replace(/\s+/g, '_').toLowerCase().slice(0, 30)}`
    }));
    const mandatoryDocs = requiredDocs.filter(d => d.required);
    const missingDocs = mandatoryDocs.filter(d => !documents[d._docKey]?.url);
    
    if (missingDocs.length > 0) {
      toast.error(`Envie todos os documentos obrigatórios. Faltam ${missingDocs.length}: ${missingDocs.map(d => d.label || d.name).join(', ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit({ template, documents, formDataStorageKey, questions });
        return;
      }

      // Submissão padrão
      const formData = JSON.parse(localStorage.getItem(formDataStorageKey) || '{}');
      const linkCode = localStorage.getItem('onboarding_link_code');

      const findValue = (keywords) => {
        for (const q of questions) {
          const key = q.id;
          const text = q.text?.toLowerCase() || '';
          if (keywords.some(kw => text.includes(kw)) && formData[key]) {
            return formData[key];
          }
        }
        return '';
      };

      // Criar Merchant
      const merchantData = {
        type: 'PJ',
        cpfCnpj: findValue(['cnpj']) || '',
        fullName: findValue(['razão social', 'razao social']) || '',
        companyName: findValue(['fantasia', 'nome fantasia']) || '',
        email: findValue(['e-mail', 'email']) || '',
        onboardingStatus: 'Pendente',
        paymentServices: flowType === 'pix' ? ['Pix'] : ['Pix', 'Cartão']
      };

      const merchant = await base44.entities.Merchant.create(merchantData);

      // Criar OnboardingCase
      const onboardingCase = await base44.entities.OnboardingCase.create({
        merchantId: merchant.id,
        questionnaireTemplateId: template?.id,
        status: 'Pendente',
        onboardingLinkCode: linkCode,
        priority: 'medium'
      });

      // Criar respostas do questionário
      const responsesToCreate = questions
        .filter(q => formData[q.id] !== undefined && formData[q.id] !== '')
        .map(q => ({
          onboardingCaseId: onboardingCase.id,
          questionId: q.id,
          questionText: q.text,
          questionType: q.type,
          valueText: typeof formData[q.id] === 'string' ? formData[q.id] : 
                     Array.isArray(formData[q.id]) ? formData[q.id].join(', ') : undefined,
          valueBoolean: typeof formData[q.id] === 'boolean' ? formData[q.id] : undefined,
          valueNumber: typeof formData[q.id] === 'number' ? formData[q.id] : undefined,
          valueArray: Array.isArray(formData[q.id]) ? formData[q.id] : undefined
        }));

      if (responsesToCreate.length > 0) {
        await base44.entities.QuestionnaireResponse.bulkCreate(responsesToCreate);
      }

      // Criar uploads de documentos (incluindo selfie)
      const allTemplateDocs = (template?.requiredDocuments || []).map((doc, index) => ({
        ...doc,
        _docKey: doc.documentTypeId || doc.id || `doc_${index}_${(doc.label || '').replace(/\s+/g, '_').toLowerCase().slice(0, 30)}`
      }));
      const documentUploads = Object.entries(documents).map(([docId, docData]) => {
        const docDef = allTemplateDocs.find(d => d._docKey === docId);
        return {
          onboardingCaseId: onboardingCase.id,
          documentTypeId: docId,
          documentName: docDef?.label || docDef?.name || docId,
          fileUrl: docData.url,
          fileName: docData.name,
          fileSize: docData.size,
          fileType: docData.type,
          uploadDate: docData.uploadedAt,
          validationStatus: 'Pendente'
        };
      });

      if (documentUploads.length > 0) {
        await base44.entities.DocumentUpload.bulkCreate(documentUploads);
      }

      // Limpar localStorage
      localStorage.removeItem(formDataStorageKey);
      localStorage.removeItem(documentsStorageKey);
      localStorage.removeItem('current_template_id');
      localStorage.removeItem('current_compliance_model');

      base44.analytics.track({
        eventName: 'compliance_stage_completed',
        properties: {
          stage: 'documents',
          flow_type: flowType || templateModel || '',
          template_model: templateModel || '',
          docs_uploaded: Object.keys(documents).length,
        }
      });

      toast.success('Documentos enviados com sucesso!');

      // Mark session as completed
      await completeSession();

      // Ir direto para tela de conclusão
      navigate(`/OnboardingCompletion?caseId=${onboardingCase.id}`);

    } catch (error) {
      console.error('Erro ao submeter:', error);
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingTemplate || loadingQuestions) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
        <span className="ml-3 text-[#002443]/70">Carregando...</span>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-[#002443] mb-2">Template não encontrado</h2>
        <p className="text-[#002443]/70">Não foi possível carregar os documentos necessários.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--pagsmile-green)]/10 mb-4">
          <FileUp className="w-8 h-8 text-[var(--pagsmile-green)]" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--pagsmile-blue)] mb-2">
          Envio de Documentos
        </h1>
        <p className="text-[var(--pagsmile-blue)]/70 max-w-lg mx-auto">
          Envie os documentos solicitados para concluir sua solicitação de onboarding.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeColor}`}>
            {badgeLabel || template.name}
          </div>
        </div>
        <div className="flex justify-center mt-3">
          <AutoSaveIndicator
            saving={false}
            lastSaved={sessionLoaded}
            resumeUrl={getResumeUrl()}
          />
        </div>
      </div>

      {/* Upload de Documentos */}
      <DynamicDocumentUploader
        template={template}
        documents={documents}
        setDocuments={setDocuments}
        storageKey={documentsStorageKey}
        onAllRequiredUploaded={setAllRequiredUploaded}
        formData={JSON.parse(localStorage.getItem(formDataStorageKey) || '{}')}
      />

      {/* Botões de Ação */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
        <Button
          variant="ghost"
          onClick={() => navigate(`/${questionnairePageName}`)}
          className="text-slate-500 hover:text-[var(--pagsmile-blue)]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Questionário
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white px-8 h-12 rounded-xl shadow-lg shadow-green-500/20 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Concluir Submissão
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Selfie e documentos são enviados juntos — sem modal de verificação */}
    </div>
  );
}