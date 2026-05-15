import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
// SDK-FREE: page is PUBLIC (anonymous clients uploading docs + CAF liveness).
// The @base44/sdk fails with 401 on private apps when there's no auth session.
// callPublicFunction hits /functions/* directly via fetch with credentials:'omit'.
import { callPublicFunction } from '@/lib/publicApi';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, FileUp, Loader2, CheckCircle2, AlertTriangle, ScanFace 
} from 'lucide-react';
import { toast } from 'sonner';
import BulletproofDocumentUploader from './BulletproofDocumentUploader';
import BulletproofUploaderWithLazyCase from './BulletproofUploaderWithLazyCase';
import CafVerificationStep from './CafVerificationStep';
import { useComplianceSession } from '../../hooks/useComplianceSession';
import AutoSaveIndicator from './AutoSaveIndicator';
import PhaseProgressBar from './PhaseProgressBar';
import ContinueOnMobileButton from './ContinueOnMobileButton';
import BlockedSubmitDialog from './BlockedSubmitDialog';
import { logSubsellerError } from '@/lib/subsellerErrorLogger';

export default function DynamicDocumentUploadPage({
  templateId,
  templateModel,
  formDataStorageKey,
  documentsStorageKey,
  questionnairePageName,
  nextPageName,
  flowType,
  badgeLabel,
  badgeColor = 'bg-blue-100 text-blue-700',
  onSubmit,
  skipCaf = false
}) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allRequiredUploaded, setAllRequiredUploaded] = useState(false);
  // CAF verification is ALWAYS required (unless explicitly skipped)
  // Phase: 'docs_upload' = uploading docs, 'caf_verification' = running CAF SDK, 'done' = all complete
  const [currentStep, setCurrentStep] = useState('docs_upload');
  const [cafResult, setCafResult] = useState(null);
  const cafResultRef = React.useRef(null);

  // Persistent block dialog state (replaces ephemeral toast.error that disappeared
  // before client could read it — root cause of Pedro Sperandio / Millions case
  // where 10 docs were uploaded but the "Próximo" button "didn't work").
  const [blockDialog, setBlockDialog] = useState({
    open: false,
    variant: 'missing_docs',
    missingList: [],
    reason: '',
    recovering: false,
  });

  // Live caseId from BulletproofUploaderWithLazyCase — needed to validate
  // BEFORE the user clicks Próximo (the old code read localStorage at click time,
  // which races with React state and cross-tab updates).
  const [liveCaseInfo, setLiveCaseInfo] = useState({ caseId: '', docLinkToken: '' });

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

  // Analytics SDK removidos: base44.analytics depende do SDK autenticado (falha em públicas).
  // O tracking de funil é feito server-side via onboardingTracker / função pública.

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

  // Get person data from saved form for CAF
  // Priority chain:
  //   P4: Explicit "CPF/Nome do Representante Legal" question fields
  //   P3: Explicit "CPF/Nome do Responsável Legal" question fields
  //   P2: First sócio from formData.socios array (every sócio IS a representante legal)
  //   P1: Any CPF_CNPJ field with 11 digits / any "Nome completo" field
  //   P0: Raw fallback scan
  const getPersonData = () => {
    const fd = JSON.parse(localStorage.getItem(formDataStorageKey) || '{}');
    let name = '', cpf = '';
    let namePriority = 0, cpfPriority = 0; // higher = better match

    // ── Source 1: Explicit question fields ──
    if (questions.length > 0) {
      for (const q of questions) {
        const t = (q.text || '').toLowerCase().trim();
        const val = fd[q.id];
        if (!val || typeof val !== 'string') continue;
        const cleanVal = val.replace(/\D/g, '');

        // CPF P4: "CPF do Representante Legal"
        if (cleanVal.length === 11 && t.includes('cpf') && t.includes('representante') && t.includes('legal') && cpfPriority < 4) {
          cpf = val; cpfPriority = 4;
        }
        // CPF P3: "CPF do Responsável Legal"
        if (cleanVal.length === 11 && t.includes('cpf') && (t.includes('responsável') || t.includes('responsavel')) && cpfPriority < 3) {
          cpf = val; cpfPriority = 3;
        }
        // CPF P1: Any CPF_CNPJ field with 11 digits
        if (cleanVal.length === 11 && q.type === 'CPF_CNPJ' && cpfPriority < 1) {
          cpf = val; cpfPriority = 1;
        }

        // Name P4: "Nome completo do Representante Legal"
        if (t.includes('representante legal') && t.includes('nome') && namePriority < 4) {
          name = val; namePriority = 4;
        }
        // Name P3: "Nome do Responsável Legal"
        if ((t.includes('responsável legal') || (t.includes('nome') && t.includes('responsável'))) && namePriority < 3) {
          name = val; namePriority = 3;
        }
        // Name P1: "Nome completo" generic
        if (t.includes('nome completo') && namePriority < 1) {
          name = val; namePriority = 1;
        }
      }
    }

    // ── Source 2: Sócios array (every sócio IS a representante legal) ──
    // Use the first sócio with valid CPF as P2 fallback
    const socios = fd.socios || [];
    if (Array.isArray(socios) && socios.length > 0) {
      for (const socio of socios) {
        const socioCpf = (socio.cpf || '').replace(/\D/g, '');
        const socioNome = (socio.nome || '').trim();
        if (socioCpf.length === 11 && cpfPriority < 2) {
          cpf = socio.cpf; cpfPriority = 2;
        }
        if (socioNome.length > 3 && socioNome.includes(' ') && namePriority < 2) {
          name = socioNome; namePriority = 2;
        }
        // Stop after first valid sócio (principal)
        if (cpfPriority >= 2 && namePriority >= 2) break;
      }
    }

    // ── Source 3: Raw fallback scan ──
    if (!cpf || !name) {
      for (const q of questions) {
        const val = fd[q.id];
        if (typeof val !== 'string') continue;
        const clean = val.replace(/\D/g, '');
        if (!cpf && clean.length === 11) cpf = val;
        if (!name && val.length > 3 && val.includes(' ') && !/^\d/.test(val)) name = val;
      }
    }

    console.log('[CAF-PersonData] Extracted:', { name: name ? name.substring(0, 20) + '...' : 'EMPTY', cpf: cpf ? cpf.substring(0, 3) + '***' : 'EMPTY', namePriority, cpfPriority, sociosCount: socios.length });
    return { name, cpf };
  };

  // Public-safe read: template + questions via service-role backend (no direct entity access).
  const { data: bundle, isLoading: loadingBundle } = useQuery({
    queryKey: ['docUploadTemplateBundle', templateId, templateModel],
    queryFn: async () => {
      // Prioridade: prop templateId (vem da URL) > localStorage > model
      // Isso garante que links com ?templateId=... ou ?model=... funcionem
      // sempre, mesmo após "limpar cache".
      const savedTemplateId = localStorage.getItem('current_template_id');
      const idToUse = templateId || savedTemplateId;
      const payload = idToUse
        ? { kind: 'template_with_questions', id: idToUse }
        : { kind: 'template_with_questions', model: templateModel };
      const res = await callPublicFunction('publicReadContext', payload);
      return { template: res?.template || null, questions: res?.questions || [] };
    },
    enabled: !!(templateId || templateModel || localStorage.getItem('current_template_id')),
  });
  const template = bundle?.template || null;
  const questions = bundle?.questions || [];
  const loadingTemplate = loadingBundle;
  const loadingQuestions = loadingBundle;

  // Validation result — exposed so mobile UI can show PERSISTENT feedback below the button
  // (toast.error desaparece rápido demais no mobile, especialmente quando o botão fica
  // sobre a barra de URL do Safari/Chrome iOS).
  const docsValidation = React.useMemo(() => {
    const allTemplateDocs = (template?.requiredDocuments || []).map((doc, index) => ({
      ...doc,
      _docKey: doc.documentTypeId || doc.id || `doc_${index}_${(doc.label || '').replace(/\s+/g, '_').toLowerCase().slice(0, 30)}`
    }));
    const isSatisfied = (d) => {
      const e = documents[d._docKey];
      if (!e) return false;
      const hasFiles = Array.isArray(e.files) ? e.files.length > 0 : !!e.url;
      return hasFiles || (e.notAvailable && e.notAvailableReason);
    };
    const mandatoryDocs = allTemplateDocs.filter(d => d.required);
    const missingMandatory = mandatoryDocs.filter(d => !isSatisfied(d));

    let canProceed = true;
    let reason = '';
    let missingList = [];

    if (missingMandatory.length > 0) {
      canProceed = false;
      reason = `Faltam ${missingMandatory.length} documento(s) obrigatório(s)`;
      missingList = missingMandatory.map(d => d.label || d.name);
    } else if (allTemplateDocs.length > 0 && Object.keys(documents).length === 0) {
      canProceed = false;
      reason = `Este fluxo exige o envio de ${allTemplateDocs.length} documento(s)`;
      missingList = allTemplateDocs.map(d => d.label || d.name);
    } else if (mandatoryDocs.length === 0 && allTemplateDocs.length >= 3) {
      const acted = allTemplateDocs.filter(isSatisfied).length;
      const minRequired = Math.ceil(allTemplateDocs.length * 0.8);
      if (acted < minRequired) {
        canProceed = false;
        reason = `Envie ou justifique pelo menos ${minRequired} dos ${allTemplateDocs.length} documentos`;
        missingList = allTemplateDocs.filter(d => !isSatisfied(d)).map(d => d.label || d.name);
      }
    }
    return { canProceed, reason, missingList, totalDocs: allTemplateDocs.length };
  }, [template, documents]);

  // Called when user finishes doc uploads and clicks "Próximo" → go to CAF step
  //
  // BULLETPROOF VERSION (caso Pedro Sperandio / Millions, 14-mai-2026):
  // O bug original tinha 3 camadas:
  //   1. Toast desaparece em 10s e fica escondido pela barra do navegador no mobile
  //      → cliente acha que o botão "não funciona" / fica preso.
  //   2. `docsValidation` (no pai) calculava obrigatórios de forma diferente do
  //      `BulletproofDocumentUploader` (no filho) → 100% no filho, falta-doc no pai.
  //   3. `localStorage.getItem('created_onboarding_case_id')` perdido no cross-device
  //      / multi-tab → case_id_missing mesmo com uploads OK no servidor.
  //
  // Agora:
  //   • Confiamos no `allRequiredUploaded` que o filho calcula (única fonte de verdade)
  //   • Validação extra olha o `documents` state em busca de uploads sem case → recovery
  //   • Modal persistente (BlockedSubmitDialog) substitui o toast → cliente VÊ o erro
  //   • Auto-recovery: chama findCaseFromUploads com os documentUploadIds do state
  const handleProceedToCaf = async () => {
    const logAttempt = (outcome, reason = '') => {
      logSubsellerError({
        stage: `proceed_to_caf_${outcome}`,
        message: reason || outcome,
        context: {
          flowType,
          templateModel,
          templateId: template?.id || null,
          caseId: liveCaseInfo.caseId || localStorage.getItem('created_onboarding_case_id') || null,
          docsCount: Object.keys(documents).length,
          allRequiredUploaded,
        },
      });
    };

    // ── GATE 1: Filho (BulletproofDocumentUploader) é fonte de verdade ──
    // O filho já filtra por conditionalLogic + expansão por representante e nos avisa
    // via onAllRequiredUploaded. Se ele disse true, está válido — não recalcular.
    if (!allRequiredUploaded) {
      logAttempt('blocked', 'missing_required_per_child');
      setBlockDialog({
        open: true,
        variant: 'missing_docs',
        missingList: docsValidation.missingList,
        reason: docsValidation.reason || 'Ainda faltam documentos obrigatórios.',
        recovering: false,
      });
      return;
    }

    // ── GATE 2: caseId presente (com auto-recovery) ──
    let caseId = liveCaseInfo.caseId || localStorage.getItem('created_onboarding_case_id');

    if (!skipCaf && !caseId) {
      // AUTO-RECOVERY: clientes têm uploads bem-sucedidos com documentUploadId no state.
      // Usamos esses IDs para descobrir o caseId server-side.
      logAttempt('attempting_case_recovery', 'case_id_missing');

      const uploadedIds = [];
      const fileUris = [];
      for (const entry of Object.values(documents || {})) {
        if (entry?.documentUploadId) uploadedIds.push(entry.documentUploadId);
        if (Array.isArray(entry?.files)) {
          for (const f of entry.files) {
            if (f?.documentUploadId) uploadedIds.push(f.documentUploadId);
            if (f?.uri) fileUris.push(f.uri);
          }
        }
        if (entry?.uri) fileUris.push(entry.uri);
      }

      if (uploadedIds.length === 0 && fileUris.length === 0) {
        // Sem nenhuma evidência de upload → caso realmente não existe
        setBlockDialog({
          open: true,
          variant: 'case_missing',
          missingList: [],
          reason: 'Nenhum documento foi registrado ainda. Tente recarregar a página.',
          recovering: false,
        });
        return;
      }

      // Mostra modal de "recuperando..." enquanto chama a API
      setBlockDialog({
        open: true,
        variant: 'recovering',
        missingList: [],
        reason: '',
        recovering: true,
      });

      try {
        const res = await callPublicFunction('findCaseFromUploads', {
          documentUploadIds: uploadedIds.slice(0, 10),
          fileUris: fileUris.slice(0, 5),
        });
        if (res?.ok && res.caseId) {
          // Restaura no localStorage para tudo voltar a funcionar
          localStorage.setItem('created_onboarding_case_id', res.caseId);
          if (res.docLinkToken) localStorage.setItem('created_doc_link_token', res.docLinkToken);
          if (res.merchantId) localStorage.setItem('created_merchant_id', res.merchantId);
          caseId = res.caseId;
          setLiveCaseInfo({ caseId: res.caseId, docLinkToken: res.docLinkToken || '' });
          logAttempt('case_recovery_success', `caseId=${res.caseId.slice(0, 8)}`);
          setBlockDialog({ open: false, variant: 'missing_docs', missingList: [], reason: '', recovering: false });
          // Continua o fluxo normalmente abaixo
        } else {
          logAttempt('case_recovery_failed', res?.error || 'unknown');
          setBlockDialog({
            open: true,
            variant: 'case_missing',
            missingList: [],
            reason: 'Não foi possível recuperar seu cadastro automaticamente. Por favor, recarregue a página.',
            recovering: false,
          });
          return;
        }
      } catch (e) {
        logAttempt('case_recovery_error', e?.message || 'unknown');
        setBlockDialog({
          open: true,
          variant: 'case_missing',
          missingList: [],
          reason: 'Erro ao recuperar seu cadastro. Recarregue a página — seus documentos continuam salvos.',
          recovering: false,
        });
        return;
      }
    }

    // ── GATE 3: tudo OK, avança ──
    logAttempt('advanced');
    saveProgressNow({ currentPhase: 'caf', documentsData: documents });
    if (!skipCaf) {
      setCurrentStep('caf_verification');
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async (cafResultParam) => {
    // Use parameter if provided (from CAF onComplete), otherwise use state/ref
    const effectiveCafResult = cafResultParam || cafResultRef.current || cafResult;

    const requiredDocs = (template?.requiredDocuments || []).map((doc, index) => ({
      ...doc,
      _docKey: doc.documentTypeId || doc.id || `doc_${index}_${(doc.label || '').replace(/\s+/g, '_').toLowerCase().slice(0, 30)}`
    }));
    const mandatoryDocs = requiredDocs.filter(d => d.required);
    // FIX (2026-04-22): a doc is satisfied if it has ANY file (files[] OR url)
    // OR has a not-available justification. Previous check `!documents[d._docKey]?.url`
    // wrongly blocked clients who: (1) uploaded multiple files (files[] populated but url
    // may race), or (2) marked the doc as not-available with reason.
    const isSubmitSatisfied = (d) => {
      const e = documents[d._docKey];
      if (!e) return false;
      const hasFiles = Array.isArray(e.files) ? e.files.length > 0 : !!e.url;
      return hasFiles || (e.notAvailable && e.notAvailableReason);
    };
    const missingDocs = mandatoryDocs.filter(d => !isSubmitSatisfied(d));

    if (missingDocs.length > 0) {
      toast.error(`Envie todos os documentos obrigatórios. Faltam ${missingDocs.length}: ${missingDocs.map(d => d.label || d.name).join(', ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit({ template, documents, formDataStorageKey, questions, cafResult: effectiveCafResult });
        return;
      }

      // Submissão padrão
      const formData = JSON.parse(localStorage.getItem(formDataStorageKey) || '{}');
      const linkCode = localStorage.getItem('onboarding_link_code');

      // Check if Merchant + OnboardingCase were already created by DynamicQuestionnaire
      const existingCaseId = localStorage.getItem('created_onboarding_case_id');
      const existingMerchantId = localStorage.getItem('created_merchant_id');

      let onboardingCaseId;

      if (existingCaseId) {
        // Reuse existing case — no need to create Merchant/Case/Responses again
        onboardingCaseId = existingCaseId;
      } else {
        // Fallback: create everything via publicComplianceSubmit (asServiceRole)
        const findValue = (keywords) => {
          for (const q of questions) {
            const text = q.text?.toLowerCase() || '';
            if (keywords.some(kw => text.includes(kw)) && formData[q.id]) return formData[q.id];
          }
          return '';
        };

        const isPF = template?.merchantType === 'PF';
        const merchantData = {
          type: isPF ? 'PF' : 'PJ',
          cpfCnpj: isPF ? findValue(['cpf']) || '' : findValue(['cnpj']) || '',
          fullName: isPF ? findValue(['nome completo']) || '' : findValue(['razão social', 'razao social']) || '',
          companyName: isPF ? '' : findValue(['fantasia', 'nome fantasia']) || '',
          email: findValue(['e-mail', 'email']) || '',
          onboardingStatus: 'Pendente',
          paymentServices: flowType === 'pix' ? ['Pix'] : ['Pix', 'Cartão'],
        };
        if (isPF) {
          merchantData.dateOfBirth = findValue(['data de nascimento']) || '';
          merchantData.nationality = findValue(['nacionalidade']) || '';
          merchantData.motherName = findValue(['nome da mãe', 'nome da mae']) || '';
        }

        const responsesToCreate = questions
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

        const submitRes = await callPublicFunction('publicComplianceSubmit', {
          templateId: template?.id,
          linkCode: linkCode || undefined,
          merchantData,
          onboardingCaseData: { status: 'Pendente', priority: 'medium' },
          responses: responsesToCreate,
        });
        if (submitRes?.error || !submitRes?.ok) {
          throw new Error(submitRes?.error || 'Erro ao criar caso');
        }
        onboardingCaseId = submitRes.onboardingCaseId;
        if (submitRes.docLinkToken) {
          localStorage.setItem('created_doc_link_token', submitRes.docLinkToken);
        }
      }

      // Upload documentos via publicComplianceDocUpload (asServiceRole)
      // BULLETPROOF: se TODOS os docs já foram persistidos no upload individual
      // (entry.persisted === true), pulamos o re-envio em lote — docs já estão salvos.
      const allTemplateDocs = (template?.requiredDocuments || []).map((doc, index) => ({
        ...doc,
        _docKey: doc.documentTypeId || doc.id || `doc_${index}_${(doc.label || '').replace(/\s+/g, '_').toLowerCase().slice(0, 30)}`
      }));
      const allAlreadyPersisted = Object.values(documents).every(d => d?.persisted === true);
      // Flatten multi-file docs + handle not-available entries
      const docsPayload = allAlreadyPersisted ? [] : Object.entries(documents).flatMap(([docId, docData]) => {
        const docDef = allTemplateDocs.find(d => d._docKey === docId);
        const docName = docDef?.label || docDef?.name || docId;
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
        let uploadData;
        try {
          uploadData = await callPublicFunction('publicComplianceDocUpload', {
            caseId: onboardingCaseId,
            docLinkToken: localStorage.getItem('created_doc_link_token') || undefined,
            documents: docsPayload,
          });
        } catch (invokeErr) {
          console.error('[DynamicDocumentUploadPage] invoke failed:', invokeErr);
          toast.error(
            'Falha ao comunicar com o servidor. Verifique sua conexão e clique em Enviar novamente. ' +
            `Detalhe: ${invokeErr?.message || 'erro de rede'}`,
            { duration: 10000 }
          );
          setIsSubmitting(false);
          return;
        }
        uploadData = uploadData || {};
        // Fail only on hard failures (failedCount>0). Skipped entries are OK (usually dedupe).
        if (!uploadData.ok && (uploadData.failedCount || 0) > 0) {
          const failedList = Array.isArray(uploadData.failed) && uploadData.failed.length > 0
            ? uploadData.failed.map(f => `${f.documentName || f.documentTypeId}: ${f.error}`).join('; ')
            : (uploadData.error || 'erro desconhecido');
          console.error('[DynamicDocumentUploadPage] Upload failed', uploadData);
          toast.error(
            `Falha ao salvar documentos (${uploadData.createdCount || 0}/${docsPayload.length}). ` +
            `Detalhes: ${failedList}. Tente novamente ou contate o suporte.`,
            { duration: 10000 }
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Only reached if ALL documents were successfully persisted.
      // Mark case as docs + CAF completed — via public function (service role, whitelisted fields).
      // The docLinkToken authenticates the update so anonymous clients can't flip case fields.
      await callPublicFunction('publicComplianceCaseUpdate', {
        caseId: onboardingCaseId,
        docLinkToken: localStorage.getItem('created_doc_link_token') || undefined,
        updates: {
          docCompleted: true,
          cafCompleted: !!effectiveCafResult,
          submissionDate: new Date().toISOString(),
        }
      });

      // Limpar localStorage
      localStorage.removeItem(formDataStorageKey);
      localStorage.removeItem(documentsStorageKey);
      localStorage.removeItem('current_template_id');
      localStorage.removeItem('current_compliance_model');
      localStorage.removeItem('created_merchant_id');
      localStorage.removeItem('created_onboarding_case_id');
      localStorage.removeItem('created_doc_link_token');

      // Analytics SDK removido: o caseId já marca 'completed' server-side via publicComplianceCaseUpdate acima.

      toast.success('Documentos e verificação enviados com sucesso!');

      // Mark session as completed
      await completeSession();

      // Ir direto para tela de conclusão
      navigate(`/OnboardingCompletion?caseId=${onboardingCaseId}`);

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
      {/* Phase progress bar — always visible at top */}
      <div className="mb-6">
        <PhaseProgressBar
          current={currentStep === 'caf_verification' ? 'caf' : currentStep === 'done' ? 'done' : 'documents'}
          showCaf={!skipCaf}
        />
      </div>

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
            currentStep === 'docs_upload' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300' :
            'bg-green-100 text-green-700'
          }`}>
            {currentStep !== 'docs_upload' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">1</span>}
            Documentos
          </div>
          <div className="w-8 h-0.5 bg-slate-200" />
          {!skipCaf && (
            <>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                currentStep === 'caf_verification' ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-300' :
                currentStep === 'done' ? 'bg-green-100 text-green-700' :
                'bg-slate-100 text-slate-400'
              }`}>
                {currentStep === 'done' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-5 h-5 rounded-full bg-slate-300 text-white text-[10px] flex items-center justify-center">2</span>}
                Verificação CAF
              </div>
              <div className="w-8 h-0.5 bg-slate-200" />
            </>
          )}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
            currentStep === 'done' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
          }`}>
            <span className="w-5 h-5 rounded-full bg-slate-300 text-white text-[10px] flex items-center justify-center">{skipCaf ? '2' : '3'}</span>
            Conclusão
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-[var(--pagsmile-blue)] mb-2">
          {currentStep === 'caf_verification' ? 'Verificação de Identidade (CAF)' : 'Envio de Documentos'}
        </h1>
        <p className="text-[var(--pagsmile-blue)]/70 max-w-lg mx-auto">
          {currentStep === 'caf_verification'
            ? 'Capture seu documento e realize a prova de vida para verificar sua identidade.'
            : 'Envie os documentos solicitados para concluir sua solicitação de onboarding.'
          }
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeColor}`}>
            {badgeLabel || template.name}
          </div>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-3 mt-3">
          <AutoSaveIndicator
            saving={false}
            lastSaved={sessionLoaded}
            resumeUrl={getResumeUrl()}
          />
          {/* Continue on another device — QR code + email (cross-device handoff).
              Especially valuable on desktop where the CAF step needs a phone camera. */}
          {currentStep === 'docs_upload' && (
            <ContinueOnMobileButton
              resumeUrl={getResumeUrl()}
              prefilledEmail={(() => {
                try {
                  const fd = JSON.parse(localStorage.getItem(formDataStorageKey) || '{}');
                  for (const q of (questions || [])) {
                    const t = (q.text || '').toLowerCase();
                    if ((t.includes('email') || t.includes('e-mail')) && fd[q.id]) {
                      return String(fd[q.id]);
                    }
                  }
                } catch {}
                return '';
              })()}
            />
          )}
        </div>
      </div>

      {/* Banner informativo: documentos dos demais representantes e sócios */}
      {currentStep === 'docs_upload' && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 leading-relaxed">
            <p className="font-semibold mb-1">Importante — documentos de todos os representantes e sócios</p>
            <p className="text-blue-800/90">
              Inclua nos documentos abaixo as informações de <strong>todos os representantes legais e sócios da empresa</strong>,
              quando houver. Cada representante legal adicional também precisa concluir a verificação biométrica (CAF) —
              o link individual de cada um pode ser gerado na etapa anterior do questionário.
            </p>
          </div>
        </div>
      )}

      {/* Step 1: Upload de Documentos — ALWAYS uses BULLETPROOF uploader.
          If the OnboardingCase doesn't exist yet, we lazy-create it here via
          publicComplianceSubmit BEFORE rendering the uploader. This eliminates
          the legacy DynamicDocumentUploader path that was failing on public
          routes (tried to call SDK's UploadPrivateFile without an auth token). */}
      {currentStep === 'docs_upload' && (
        <BulletproofUploaderWithLazyCase
          template={template}
          questions={questions}
          templateModel={templateModel}
          formDataStorageKey={formDataStorageKey}
          documentsStorageKey={documentsStorageKey}
          flowType={flowType}
          documents={documents}
          setDocuments={setDocuments}
          onAllRequiredUploaded={setAllRequiredUploaded}
          onCaseReady={setLiveCaseInfo}
        />
      )}

      {/* Step 2: CAF Verification (DocumentDetector + FaceLiveness) */}
      {currentStep === 'caf_verification' && (
        <div className="mb-8">
          <CafVerificationStep
            personName={getPersonData().name}
            personCpf={getPersonData().cpf}
            onboardingCaseId={localStorage.getItem('created_onboarding_case_id') || ''}
            complianceModel={templateModel}
            merchantCnpj={(() => {
              const fd = JSON.parse(localStorage.getItem(formDataStorageKey) || '{}');
              for (const q of questions) {
                const text = (q.text || '').toLowerCase();
                if (text.includes('cnpj') && fd[q.id]) return String(fd[q.id]);
              }
              return '';
            })()}
            merchantEmail={(() => {
              const fd = JSON.parse(localStorage.getItem(formDataStorageKey) || '{}');
              for (const q of questions) {
                const text = (q.text || '').toLowerCase();
                if ((text.includes('email') || text.includes('e-mail')) && fd[q.id]) return String(fd[q.id]);
              }
              return '';
            })()}
            onComplete={(result) => {
              // Store the result in a ref so handleFinalSubmit can access it immediately
              // (setState is async so cafResult wouldn't be available yet)
              cafResultRef.current = result;
              setCafResult(result);
              setCurrentStep('done');
              // Auto-submit after CAF completes
              handleFinalSubmit(result);
            }}
          />
        </div>
      )}

      {/* Botões de Ação */}
      {currentStep === 'docs_upload' && (
        <>
          {/* Persistent validation banner — só aparece quando há pendência.
              Crítico no mobile: o toast some rápido e o botão fica colado
              na barra do navegador, então o cliente precisa ver O QUE FALTA
              de forma permanente acima do botão. */}
          {!docsValidation.canProceed && Object.keys(documents).length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 mb-1">{docsValidation.reason}</p>
                  {docsValidation.missingList.length > 0 && (
                    <ul className="text-xs text-amber-800 list-disc list-inside space-y-0.5">
                      {docsValidation.missingList.slice(0, 5).map((label, i) => (
                        <li key={i}>{label}</li>
                      ))}
                      {docsValidation.missingList.length > 5 && (
                        <li className="italic">+ {docsValidation.missingList.length - 5} outro(s)</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-8 pt-6 border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
            <Button
              variant="ghost"
              onClick={() => navigate(`/${questionnairePageName}`)}
              className="text-slate-500 hover:text-[var(--pagsmile-blue)] w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Questionário
            </Button>

            <Button
              onClick={handleProceedToCaf}
              disabled={isSubmitting}
              className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white px-8 h-12 rounded-xl shadow-lg shadow-green-500/20 disabled:opacity-50 w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : skipCaf ? (
                <>
                  Concluir Submissão
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Próximo: Verificação de Identidade
                  <ScanFace className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Mobile safe area: garante 24px extras embaixo no celular para que o
              botão NUNCA fique colado na barra do browser (causa #4 do diagnóstico). */}
          <div className="h-6 sm:h-0" />
        </>
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

      {/* Persistent block dialog — substitui o toast.error que desaparecia rápido */}
      <BlockedSubmitDialog
        open={blockDialog.open}
        variant={blockDialog.variant}
        missingList={blockDialog.missingList}
        reason={blockDialog.reason}
        caseId={liveCaseInfo.caseId}
        recovering={blockDialog.recovering}
        onClose={() => setBlockDialog((p) => ({ ...p, open: false }))}
        onRetry={() => {
          setBlockDialog((p) => ({ ...p, open: false }));
          handleProceedToCaf();
        }}
      />
    </div>
  );
}