import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
// SDK-FREE: this component runs on PUBLIC pages (anonymous clients filling compliance).
// The @base44/sdk fails with 401 on a private app when there's no auth session.
// callPublicFunction hits /functions/* directly via fetch with credentials:'omit'.
import { callPublicFunction } from '@/lib/publicApi';

import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Loader2, ShieldCheck } from 'lucide-react';
// CafeRedirectMessage kept for v1/v2 models with cafRedirectUrl
import CafeRedirectMessage from './CafeRedirectMessage';
import { 
  Building2, FileText, MapPin, Briefcase, TrendingUp, 
  Users, UserCircle, ShieldAlert, CheckCircle, Shield,
  Globe, AlertTriangle, MessageSquare, CreditCard
} from 'lucide-react';
import StepNavigation from './StepNavigation';
import DynamicQuestionRenderer from './DynamicQuestionRenderer';
import QuestionnaireToDocsBridge from './QuestionnaireToDocsBridge';
import { useOnboardingAnalytics } from '../analytics/useOnboardingAnalytics';
import { useLeadPrefill } from './useLeadPrefill';
import { useComplianceSession } from '../../hooks/useComplianceSession';
import useComplianceFlags from '../../hooks/useComplianceFlags';
import AutoSaveIndicator from './AutoSaveIndicator';
import { toast } from 'sonner';
import {
  trackOnboardingStepCompleted,
  trackOnboardingDropoff,
  trackOnboardingStarted,
  trackOnboardingCompleted,
  trackOnboardingValidationFailed,
} from '@/lib/onboardingTracker';

// Mapeamento de ícones por palavra-chave no título da pergunta
const ICON_MAPPINGS = {
  'cnpj': Building2,
  'razão': Building2,
  'fantasia': Building2,
  'empresa': Building2,
  'identificação': Building2,
  'endereço': MapPin,
  'cep': MapPin,
  'cidade': MapPin,
  'estado': MapPin,
  'atividade': Briefcase,
  'negócio': Briefcase,
  'produto': Briefcase,
  'serviço': Briefcase,
  'volume': TrendingUp,
  'ticket': TrendingUp,
  'faturamento': TrendingUp,
  'cliente': Users,
  'perfil': Users,
  'responsável': UserCircle,
  'representante': UserCircle,
  'sócio': UserCircle,
  'cpf': UserCircle,
  'email': MessageSquare,
  'telefone': MessageSquare,
  'sac': MessageSquare,
  'compliance': ShieldCheck,
  'pep': ShieldAlert,
  'sanção': ShieldAlert,
  'risco': AlertTriangle,
  'pld': Shield,
  'ilegal': AlertTriangle,
  'internacional': Globe,
  'exterior': Globe,
  'declaração': CheckCircle,
  'autorização': CheckCircle,
  'veracidade': CheckCircle,
  'default': FileText
};

function getIconForQuestion(questionText) {
  const lowerText = questionText.toLowerCase();
  for (const [keyword, Icon] of Object.entries(ICON_MAPPINGS)) {
    if (keyword !== 'default' && lowerText.includes(keyword)) {
      return Icon;
    }
  }
  return ICON_MAPPINGS.default;
}

// Gera um título descritivo para um grupo de perguntas baseado no conteúdo semântico
function generateStepTitle(questions) {
  const allText = questions.map(q => q.text.toLowerCase()).join(' ');
  
  // Ordem importa: verificações mais específicas primeiro
  if (/cnpj|razão social|nome fantasia/.test(allText)) return 'Identificação da Empresa';
  if (/tipo de empresa|porte|natureza jurídica|constituição/.test(allText)) return 'Tipo e Porte da Empresa';
  if (/cep|endereço|estado|cidade|bairro|logradouro|complemento/.test(allText) && /principal|sede/.test(allText)) return 'Endereço Principal';
  if (/cep|endereço|estado|cidade|bairro|logradouro/.test(allText)) return 'Endereço e Localização';
  if (/descrição da atividade|descrição do negócio|atividade principal|objeto social/.test(allText)) return 'Descrição da Atividade';
  if (/website|url|domínio|site|app|aplicativo/.test(allText)) return 'Presença Digital';
  if (/outros negócios|possui outros|empresas relacionadas|grupo econômico/.test(allText)) return 'Empresas Relacionadas';
  if (/qual o modelo|modelo de negócio|b2b|b2c|tipo de operação/.test(allText)) return 'Modelo de Negócio';
  if (/volume mensal|tpv|volume transacion|faturamento/.test(allText)) return 'Volume Transacional';
  if (/ticket médio|valor médio|ticket/.test(allText)) return 'Ticket Médio e Valores';
  if (/produto|serviço|o que vende|categoria/.test(allText) && !/compliance|pld/.test(allText)) return 'Produtos e Serviços';
  if (/canal de venda|e-commerce|loja física|online/.test(allText)) return 'Canais de Venda';
  if (/cliente|público|consumidor|perfil.*cliente|target/.test(allText) && !/compliance/.test(allText)) return 'Perfil de Clientes';
  if (/sócio|proprietário|quadro societário|participação|ubo|beneficiário final/.test(allText)) return 'Estrutura Societária';
  if (/representante|responsável|contato|cargo|diretor|gerente/.test(allText)) return 'Responsáveis e Contatos';
  if (/cpf.*responsável|rg|documento.*pessoal|identidade/.test(allText)) return 'Documentos Pessoais';
  if (/compliance|programa de compliance|política|regulament/.test(allText) && /pld|lavagem|financiamento/.test(allText)) return 'PLD/FT e Compliance';
  if (/compliance|programa de compliance|política/.test(allText)) return 'Programa de Compliance';
  if (/pep|pessoa.*politicamente|exposta/.test(allText)) return 'PEP e Pessoas Expostas';
  if (/sanção|sanções|lista restritiva|embargo|ofac/.test(allText)) return 'Sanções e Listas Restritivas';
  if (/risco|mitigação|controle|monitoramento/.test(allText)) return 'Gestão de Riscos';
  if (/pld|lavagem|financiamento.*terrorismo|prevenção/.test(allText)) return 'Prevenção à Lavagem';
  if (/sac|atendimento|ouvidoria|suporte|reclamação/.test(allText)) return 'SAC e Atendimento';
  if (/email|telefone|contato/.test(allText) && !/sócio|responsável/.test(allText)) return 'Dados de Contato';
  if (/internacional|exterior|cross.?border|câmbio/.test(allText)) return 'Operações Internacionais';
  if (/marketplace|seller|sub.?merchant|plataforma/.test(allText)) return 'Estrutura de Marketplace';
  if (/cartão|bandeira|adquirente|credenciadora|maquininha/.test(allText)) return 'Operações com Cartão';
  if (/licença|licenciamento|autorização|regulador|bacen/.test(allText)) return 'Licenciamento e Regulação';
  if (/declaração|veracidade|autorizo|termo|confirmo/.test(allText)) return 'Declarações e Termos';
  if (/entrega|logística|prazo|frete|envio/.test(allText)) return 'Entrega e Logística';
  if (/cancelamento|reembolso|chargeback|disputa|estorno/.test(allText)) return 'Cancelamento e Disputas';
  if (/recorrência|assinatura|subscription|cobrança recorrente/.test(allText)) return 'Modelo de Recorrência';
  if (/governança|diretoria|conselho|estrutura.*gestão/.test(allText)) return 'Governança Corporativa';
  if (/kyc|know your customer|verificação.*identidade/.test(allText)) return 'Verificação de Identidade';
  
  // Fallback: usa o ícone mapeado para gerar um título genérico
  const Icon = getIconForQuestion(questions[0].text);
  const iconTitles = {
    [Building2]: 'Dados Cadastrais',
    [MapPin]: 'Endereço',
    [Briefcase]: 'Informações do Negócio',
    [TrendingUp]: 'Dados Financeiros',
    [Users]: 'Perfil de Clientes',
    [UserCircle]: 'Responsáveis',
    [MessageSquare]: 'Contato',
    [ShieldCheck]: 'Compliance',
    [ShieldAlert]: 'Riscos e PEP',
    [AlertTriangle]: 'Pontos de Atenção',
    [Shield]: 'PLD/FT',
    [Globe]: 'Operações Internacionais',
    [CheckCircle]: 'Confirmação',
  };
  
  return iconTitles[Icon] || 'Informações Adicionais';
}

// Agrupa perguntas em steps lógicos
function groupQuestionsIntoSteps(questions, questionsPerStep = 4) {
  const steps = [];
  let currentStep = [];

  questions.forEach((q, index) => {
    currentStep.push(q);
    
    if (currentStep.length >= questionsPerStep || index === questions.length - 1) {
      const stepQuestions = [...currentStep];
      const Icon = getIconForQuestion(stepQuestions[0].text);
      const title = generateStepTitle(stepQuestions);
      steps.push({
        id: `step_${steps.length + 1}`,
        title,
        icon: Icon,
        questions: stepQuestions
      });
      currentStep = [];
    }
  });

  // Desambiguar títulos repetidos adicionando numeração
  const titleCount = {};
  steps.forEach(step => {
    titleCount[step.title] = (titleCount[step.title] || 0) + 1;
  });
  
  const titleIndex = {};
  steps.forEach(step => {
    if (titleCount[step.title] > 1) {
      titleIndex[step.title] = (titleIndex[step.title] || 0) + 1;
      step.title = `${step.title} (${titleIndex[step.title]}/${titleCount[step.title]})`;
    }
  });

  return steps;
}

export default function DynamicQuestionnaire({
  templateId,
  templateModel, // 'lite', 'pix', 'full', 'ecommerce'
  storageKey,
  documentUploadPage,
  flowType,
  badgeLabel,
  badgeColor = 'bg-blue-100 text-blue-700',
  questionsPerStep = 4,
  cafRedirectUrl,
  cafRedirectUrlMap, // Map of segment value → CAF URL (dynamic per segment)
  onComplete, // Callback opcional quando completa o questionário
  branding, // { name, logoUrl, primaryColor, secondaryColor } — white-label opcional
  isPublicView = false // true = esconde dados internos (enriquecimento, flags) do cliente
}) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [sessionRestored, setSessionRestored] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cnpjAutocompleteData, setCnpjAutocompleteData] = useState(null);
  const [showCafRedirect, setShowCafRedirect] = useState(false);
  const [isCompletingCaf, setIsCompletingCaf] = useState(false);
  const [resolvedCafRedirectUrl, setResolvedCafRedirectUrl] = useState(null);
  // Bridge entre questionário e upload de documentos (Opção B — salvar e continuar depois)
  const [showDocsBridge, setShowDocsBridge] = useState(false);
  const [bridgeNavParams, setBridgeNavParams] = useState('');

  const linkCode = localStorage.getItem('onboarding_link_code');

  // Session management for save & resume
  const {
    sessionToken,
    isLoading: sessionLoading,
    sessionLoaded,
    savedFormData,
    savedStep,
    savedPhase,
    saveProgress,
    saveProgressNow,
    completeSession,
    getResumeUrl
  } = useComplianceSession({ flowType, templateModel, storageKey });

  // Public-safe read: template + questions in ONE round-trip via service-role backend.
  // Admin-protected entities cannot be read directly by anonymous clients.
  const { data: bundle, isLoading: loadingBundle } = useQuery({
    queryKey: ['templateBundle', templateId, templateModel],
    queryFn: async () => {
      const payload = templateId ? { kind: 'template_with_questions', id: templateId }
                                  : { kind: 'template_with_questions', model: templateModel };
      const res = await callPublicFunction('publicReadContext', payload);
      return { template: res?.template || null, questions: res?.questions || [] };
    },
    enabled: !!(templateId || templateModel),
  });
  const template = bundle?.template || null;
  const questions = bundle?.questions || [];
  const loadingTemplate = loadingBundle;
  const loadingQuestions = loadingBundle;

  // Pré-preenchimento com dados do Lead
  const { prefillData, prefillSources, hasPrefill, lead } = useLeadPrefill(questions);

  // Agrupar perguntas em steps
  const steps = groupQuestionsIntoSteps(questions, questionsPerStep);

  // Compute compliance validation flags in real-time
  const complianceAlerts = useComplianceFlags(questions, formData, cnpjAutocompleteData);

  const { trackPageComplete } = useOnboardingAnalytics({
    pageName: `Compliance${templateModel?.charAt(0).toUpperCase()}${templateModel?.slice(1)}`,
    stepNumber: currentStep,
    totalSteps: steps.length,
    flowType: flowType || templateModel,
    linkCode
  });

  // Track step start time for duration calculation
  const stepStartTimeRef = React.useRef(Date.now());
  const onboardingStartTimeRef = React.useRef(Date.now());
  const hasTrackedStart = React.useRef(false);

  // Track onboarding_started once steps are loaded
  useEffect(() => {
    if (steps.length > 0 && !hasTrackedStart.current) {
      hasTrackedStart.current = true;
      trackOnboardingStarted({ totalSteps: steps.length, flowType, templateModel });
      // Analytics removido: base44.analytics depende do SDK autenticado (falha em públicas).
      // O tracking de funil é feito via onboardingTracker (server-side via função pública).
    }
  }, [steps.length, flowType, templateModel]);

  // Reset step timer when step changes
  useEffect(() => {
    stepStartTimeRef.current = Date.now();
  }, [currentStep]);

  // Track drop-off on page unload
  useEffect(() => {
    const handleUnload = () => {
      const timeOnStep = Math.round((Date.now() - stepStartTimeRef.current) / 1000);
      const stepData = steps[currentStep - 1];
      trackOnboardingDropoff({
        stepNumber: currentStep,
        totalSteps: steps.length,
        stepTitle: stepData?.title,
        flowType,
        templateModel,
        timeOnStepSec: timeOnStep,
      });
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [currentStep, steps, flowType, templateModel]);

  // Restore session data if available (from server)
  useEffect(() => {
    if (sessionLoaded && savedFormData && Object.keys(savedFormData).length > 0 && !sessionRestored) {
      setFormData(prev => {
        // Merge: server data as base, local data on top
        const merged = { ...savedFormData, ...prev };
        return Object.keys(merged).length > Object.keys(prev).length ? merged : prev;
      });
      if (savedStep && savedStep > 1) {
        setCurrentStep(savedStep);
      }
      setSessionRestored(true);
    }
  }, [sessionLoaded, savedFormData, savedStep, sessionRestored]);

  // Carregar dados salvos do localStorage (apenas se pertencem ao lead atual)
  useEffect(() => {
    if (storageKey) {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        setFormData(prev => {
          // Only restore if we don't already have data from session
          if (Object.keys(prev).length > 0) return prev;
          const local = JSON.parse(savedData);
          return local;
        });
      }
    }
  }, [storageKey]);

  // Aplicar pré-preenchimento do Lead (apenas para campos vazios)
  useEffect(() => {
    if (hasPrefill && Object.keys(prefillData).length > 0) {
      setFormData(prev => {
        const merged = { ...prev };
        for (const [questionId, value] of Object.entries(prefillData)) {
          // Só preenche se o campo estiver vazio
          if (!merged[questionId] && merged[questionId] !== false) {
            merged[questionId] = value;
          }
        }
        return merged;
      });
    }
  }, [hasPrefill, JSON.stringify(prefillData)]);

  // Extract clientEmail and clientName from formData (look in question answers)
  const clientInfo = React.useMemo(() => {
    let email = '';
    let name = '';
    // Try from lead first
    if (lead) {
      email = lead.email || '';
      name = lead.fullName || lead.companyName || '';
    }
    // Also scan formData for email/name fields
    if (questions.length > 0) {
      questions.forEach(q => {
        const t = (q.text || '').toLowerCase().trim();
        const val = formData[q.id];
        if (!val) return;
        if (!email && (q.type === 'EMAIL' || t === 'e-mail' || t === 'email')) email = val;
        if (!name && (t === 'razão social' || t === 'nome fantasia')) name = val;
      });
    }
    return { email, name };
  }, [formData, questions, lead]);

  // Salvar dados localmente e no servidor (debounced)
  useEffect(() => {
    if (storageKey && Object.keys(formData).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(formData));
      // Auto-save to server (debounced inside hook)
      saveProgress({
        currentStep,
        currentPhase: 'questionnaire',
        formData,
        clientEmail: clientInfo.email,
        clientName: clientInfo.name,
      });
    }
  }, [formData, storageKey, currentStep, saveProgress, clientInfo.email, clientInfo.name]);

  const handleFieldChange = (questionId, value) => {
    setFormData(prev => ({ ...prev, [questionId]: value }));
  };

  // Handler de autocomplete CEP (ViaCEP) — preenche subcampos de endereço
  const handleCepData = (cepData) => {
    if (!cepData || !questions.length) return;
    const fieldMap = {};
    questions.forEach(q => {
      const t = (q.text || '').toLowerCase().trim();
      if (t === 'logradouro' && cepData.logradouro) fieldMap[q.id] = cepData.logradouro;
      else if (t === 'bairro' && cepData.bairro) fieldMap[q.id] = cepData.bairro;
      else if ((t === 'cidade' || t === 'município') && cepData.localidade) fieldMap[q.id] = cepData.localidade;
      else if ((t === 'uf' || t === 'estado') && cepData.uf) fieldMap[q.id] = cepData.uf;
    });
    setFormData(prev => {
      const merged = { ...prev };
      for (const [qId, val] of Object.entries(fieldMap)) {
        if (val) merged[qId] = val;
      }
      return merged;
    });
  };

  // Handler de autocomplete CNPJ — preenche campos automaticamente
  // Para Lead: Razão Social, Nome Fantasia, Site, MCC
  // Para Compliance: todos os 12+ campos cadastrais (A1-A11)
  const handleCnpjAutocomplete = (apiData) => {
    setCnpjAutocompleteData(apiData);
    // Persistir os dados brutos da API no formData para uso posterior (analyzeCnpjEnrichment)
    if (apiData) {
      setFormData(prev => ({ ...prev, __cnpj_raw_data: apiData }));
      
      // Trigger full screening in background (CEIS, CNEP, PEP sócios, países sancionados)
      if (apiData.situacao_cadastral === 2 && apiData.qsa) {
        const cnpjQ = questions.find(q => (q.text || '').toLowerCase() === 'cnpj' && q.type === 'CPF_CNPJ');
        const cnpj = cnpjQ ? (formData[cnpjQ.id] || '') : '';
        if (cnpj && cnpj.length >= 14) {
          callPublicFunction('sanctionsScreening', {
            action: 'fullScreening',
            cnpj,
            qsa: apiData.qsa
          }).then(res => {
            setFormData(prev => ({ ...prev, __screening_result: res }));
          }).catch(() => {});
        }
      }
    }
    if (!apiData || !questions.length) return;

    // Mapear campos da API para perguntas com base no texto da pergunta (case-insensitive)
    const fieldMap = {};
    questions.forEach(q => {
      const t = (q.text || '').toLowerCase().trim();
      
      // === Campos de autocomplete direto (exibidos e preenchidos) ===
      if (t === 'razão social') fieldMap[q.id] = apiData.razao_social;
      else if (t === 'nome fantasia') fieldMap[q.id] = apiData.nome_fantasia || '';
      else if (t === 'tipo de empresa') fieldMap[q.id] = apiData.tipo_empresa;
      else if (t === 'cnae principal') {
        const cnae = String(apiData.cnae_fiscal || '');
        const formatted = cnae.length === 7 
          ? `${cnae.slice(0,4)}-${cnae.slice(4,5)}/${cnae.slice(5)} — ${apiData.cnae_fiscal_descricao}` 
          : apiData.cnae_fiscal_descricao;
        fieldMap[q.id] = formatted;
      }
      else if (t === 'cnaes secundários') {
        const cnaes = (apiData.cnaes_secundarios || []);
        fieldMap[q.id] = cnaes.length > 0 
          ? cnaes.map(c => `${c.codigo} — ${c.descricao}`).join('; ') 
          : 'Nenhuma atividade secundária registrada.';
      }
      else if (t === 'situação cadastral') fieldMap[q.id] = apiData.descricao_situacao_cadastral;
      else if (t === 'capital social') {
        fieldMap[q.id] = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(apiData.capital_social || 0);
      }
      else if (t === 'porte da empresa') {
        const porteMap = { 'ME': 'Microempresa (ME)', 'EPP': 'Empresa de Pequeno Porte (EPP)', 'DEMAIS': 'Demais' };
        fieldMap[q.id] = porteMap[apiData.porte] || apiData.porte;
      }
      // Endereço (7 subcampos)
      else if (t === 'cep') fieldMap[q.id] = apiData.endereco?.cep || '';
      else if (t === 'logradouro') fieldMap[q.id] = apiData.endereco?.logradouro || '';
      else if (t === 'número') fieldMap[q.id] = apiData.endereco?.numero || '';
      else if (t === 'complemento') fieldMap[q.id] = apiData.endereco?.complemento || '';
      else if (t === 'bairro') fieldMap[q.id] = apiData.endereco?.bairro || '';
      else if (t === 'cidade' || t === 'município') fieldMap[q.id] = apiData.endereco?.municipio || '';
      else if (t === 'uf' || t === 'estado') fieldMap[q.id] = apiData.endereco?.uf || '';
      // Data e contatos da Receita
      else if (t.includes('data de início')) {
        const d = apiData.data_inicio_atividade;
        fieldMap[q.id] = d ? d.split('-').reverse().join('/') : '';
      }
      else if (t === 'e-mail da receita federal' || t === 'email da receita federal') fieldMap[q.id] = apiData.email || '';
      else if (t === 'telefone da receita federal') fieldMap[q.id] = apiData.telefone || '';
      
      // === Campos de sugestão (preenchidos mas editáveis) ===
      else if ((t === 'código mcc' || t === 'mcc pretendido') && apiData.mcc_sugerido) {
        fieldMap[q.id] = apiData.mcc_sugerido;
      }
      else if (t === 'site da empresa' && apiData.site_sugerido) {
        fieldMap[q.id] = apiData.site_sugerido;
      }
      
      // === Licenciamento (C1) — setor regulado ===
      else if ((t === 'licenciamento' || t.includes('licenciamento') || t.includes('regulado')) && q.type === 'BOOLEAN') {
        if (apiData.setor_regulado?.regulado) {
          fieldMap[q.id] = true;
        }
      }
      
      // === Atividade Restrita / Proibida (I5/I6) ===
      else if ((t.includes('produto restrito') || t.includes('atividade restrita') || t === 'i5') && q.type === 'BOOLEAN') {
        if (apiData.anexo_i?.restrito) {
          fieldMap[q.id] = true;
        }
      }
      else if ((t.includes('produto proibido') || t.includes('atividade proibida') || t === 'i6') && q.type === 'BOOLEAN') {
        if (apiData.anexo_i?.proibido) {
          fieldMap[q.id] = true;
        }
      }
      
      // === Faturamento Anual sugerido (Lead Pergunta 27) ===
      else if ((t.includes('faturamento anual') || t.includes('faixa de faturamento')) && apiData.faixa_faturamento_sugerida) {
        fieldMap[q.id] = apiData.faixa_faturamento_sugerida;
      }
    });

    // === QSA → pré-preencher UBOs (D1-D8) e Sócios (E1-E6) ===
    if (apiData.qsa && apiData.qsa.length > 0) {
      // Formato: serializar QSA em texto para campos de texto livre, ou em array de objetos
      const qsaFormatted = apiData.qsa.map(s => 
        `${s.nome_socio} — ${s.qualificacao_socio}${s.data_entrada_sociedade ? ` (desde ${s.data_entrada_sociedade})` : ''}`
      ).join('\n');
      
      questions.forEach(q => {
        const t = (q.text || '').toLowerCase().trim();
        if (t.includes('ubo') || t.includes('beneficiário final') || t.includes('beneficiários finais') ||
            t.includes('quadro societário') || t.includes('sócios') || t.includes('administradores')) {
          if (q.type === 'TEXT' && !fieldMap[q.id]) {
            fieldMap[q.id] = qsaFormatted;
          }
        }
        // D3 — Nacionalidade UBO: default "Brasileira" (pais raramente vem preenchido)
        if ((t.includes('nacionalidade') && (t.includes('ubo') || t.includes('beneficiário'))) && !fieldMap[q.id]) {
          fieldMap[q.id] = 'Brasileira';
        }
      });
    }

    setFormData(prev => {
      const merged = { ...prev };
      for (const [qId, val] of Object.entries(fieldMap)) {
        if (val !== undefined && val !== null && val !== '') {
          merged[qId] = val;
        }
      }
      return merged;
    });
  };

  const validateCurrentStep = () => {
    const currentQuestions = currentStepData.questions;
    const missingFields = currentQuestions.filter(q => {
      if (!q.isRequired) return false;
      // Check conditional logic - skip validation if question is hidden
      if (q.conditionalLogic && q.conditionalLogic.dependsOn) {
        const depValue = formData[q.conditionalLogic.dependsOn];
        const normalize = (val) => {
          if (val === true || val === 'true') return 'true';
          if (val === false || val === 'false') return 'false';
          return String(val || '').toLowerCase();
        };
        const nDep = normalize(depValue);
        const nExp = normalize(q.conditionalLogic.value);
        const op = q.conditionalLogic.operator;
        if (op === 'equals' && nDep !== nExp) return false;
        if (op === 'not_equals' && nDep === nExp) return false;
      }
      const val = formData[q.id];
      if (val === undefined || val === null || val === '') return true;
      if (Array.isArray(val) && val.length === 0) return true;
      return false;
    });
    return missingFields;
  };

  // Validação de bloqueio: CNPJ inativo impede avanço
  const isCnpjBlocked = () => {
    if (!cnpjAutocompleteData) return false;
    // Se situação cadastral não é ATIVA (código 2), bloquear
    return cnpjAutocompleteData.situacao_cadastral !== 2;
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      // Verificar se CNPJ inativo bloqueia o avanço
      if (isCnpjBlocked()) {
        toast.error('O CNPJ informado não está com situação ATIVA na Receita Federal. Apenas empresas ativas podem prosseguir.');
        return;
      }
      const missing = validateCurrentStep();
      if (missing.length > 0) {
        trackOnboardingValidationFailed({
          stepNumber: currentStep, totalSteps: steps.length,
          stepTitle: currentStepData?.title, flowType, templateModel,
          missingFieldsCount: missing.length,
        });
        // Analytics SDK removido (já rastreado via trackOnboardingValidationFailed).
        toast.error(`Preencha todos os campos obrigatórios (${missing.length} campo${missing.length > 1 ? 's' : ''} pendente${missing.length > 1 ? 's' : ''}).`);
        return;
      }
      const timeOnStep = Math.round((Date.now() - stepStartTimeRef.current) / 1000);
      trackOnboardingStepCompleted({
        stepNumber: currentStep, totalSteps: steps.length,
        stepTitle: currentStepData?.title, flowType, templateModel,
        timeOnStepSec: timeOnStep,
      });
      trackPageComplete({ stepNumber: currentStep });
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // Save step change immediately
      saveProgressNow({
        currentStep: nextStep,
        currentPhase: 'questionnaire',
        formData,
        clientEmail: clientInfo.email,
        clientName: clientInfo.name,
      });
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = () => {
    // Verificar bloqueio CNPJ inativo antes de submeter
    if (isCnpjBlocked()) {
      toast.error('O CNPJ informado não está com situação ATIVA na Receita Federal. Apenas empresas ativas podem prosseguir.');
      return;
    }
    const missing = validateCurrentStep();
    if (missing.length > 0) {
      trackOnboardingValidationFailed({
        stepNumber: currentStep, totalSteps: steps.length,
        stepTitle: currentStepData?.title, flowType, templateModel,
        missingFieldsCount: missing.length,
      });
      // Analytics SDK removido (já rastreado via trackOnboardingValidationFailed).
      toast.error(`Preencha todos os campos obrigatórios (${missing.length} campo${missing.length > 1 ? 's' : ''} pendente${missing.length > 1 ? 's' : ''}).`);
      return;
    }
    // Track final step + full completion
    const timeOnStep = Math.round((Date.now() - stepStartTimeRef.current) / 1000);
    trackOnboardingStepCompleted({
      stepNumber: currentStep, totalSteps: steps.length,
      stepTitle: currentStepData?.title, flowType, templateModel,
      timeOnStepSec: timeOnStep,
    });
    const totalTime = Math.round((Date.now() - onboardingStartTimeRef.current) / 1000);
    trackOnboardingCompleted({ totalSteps: steps.length, flowType, templateModel, totalTimeSec: totalTime });
    // Analytics SDK removido (já rastreado via trackOnboardingCompleted que usa função pública).
    // Salvar flags de compliance no formData para análise interna
    const finalFormData = { ...formData, __complianceFlags: complianceAlerts };
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(finalFormData));
    }
    if (template?.id) {
      localStorage.setItem('current_template_id', template.id);
    }
    if (templateModel) {
      localStorage.setItem('current_compliance_model', templateModel);
    }

    // Resolve dynamic CAF URL from segment if map is provided
    const resolvedCafUrl = (() => {
      if (cafRedirectUrl) return cafRedirectUrl;
      if (cafRedirectUrlMap) {
        // Find the segment question answer in formData
        for (const q of questions) {
          const t = (q.text || '').toLowerCase();
          if (t.includes('segmento') && q.type === 'SELECT') {
            const segValue = finalFormData[q.id];
            if (segValue && cafRedirectUrlMap[segValue]) return cafRedirectUrlMap[segValue];
          }
        }
        // Fallback: first URL in map
        const urls = Object.values(cafRedirectUrlMap);
        return urls.length > 0 ? urls[0] : null;
      }
      return null;
    })();

    // ── STRUCTURAL FIX (2026-04-21) ──
    // Previously: if a template had `cafRedirectUrl`, the questionnaire jumped STRAIGHT to the
    // external CAF URL (cadastro.io), SKIPPING the internal document upload step. This caused
    // clients to never upload the mandatory business documents (contrato social, balanço, PLD
    // policies, etc.) defined in template.requiredDocuments.
    //
    // New rule: if the template has ANY required documents, ALWAYS pass through the internal
    // upload page first (/DocumentUploadFull). Only after documents are satisfied (uploaded
    // OR justified via "não tenho"), the client proceeds to CAF identity verification.
    //
    // This guarantees the full compliance funnel: Questionnaire → Documents → CAF → Done.
    const templateHasRequiredDocs = Array.isArray(template?.requiredDocuments) && template.requiredDocuments.length > 0;

    // Only redirect directly to external CAF if the template has NO required docs.
    // Otherwise, always go through the internal upload flow.
    if (resolvedCafUrl && !templateHasRequiredDocs) {
      saveProgressNow({
        currentStep,
        currentPhase: 'questionnaire',
        formData: finalFormData,
        clientEmail: clientInfo.email,
        clientName: clientInfo.name,
      });
      createMerchantAndCase(finalFormData);
      setResolvedCafRedirectUrl(resolvedCafUrl);
      setShowCafRedirect(true);
      window.scrollTo(0, 0);
      return;
    }

    // Save phase transition to documents
    saveProgressNow({
      currentStep: 1,
      currentPhase: 'documents',
      formData: finalFormData,
      clientEmail: clientInfo.email,
      clientName: clientInfo.name,
    });

    // For subseller flows: do NOT create Merchant+Case here.
    // The case must only be created AFTER docs+CAF are completed (in DynamicDocumentUploadPage.handleFinalSubmit).
    // This prevents the analysis pipeline from running before documents are uploaded.
    const isSubsellerFlow = flowType === 'subseller' || flowType === 'subseller_pf';
    if (!isSubsellerFlow) {
      // Create Merchant + OnboardingCase for visibility in compliance dashboard
      createMerchantAndCase(finalFormData);
    }

    if (onComplete) {
      onComplete({ formData: finalFormData, template, questions });
    } else {
      // Passa model + templateId + caseId na URL para que a página de upload
      // funcione mesmo se o cliente limpar cache ou recarregar direto naquela URL.
      // O localStorage vira apenas um fallback, não a única fonte de verdade.
      const params = new URLSearchParams();
      if (templateModel) params.set('model', templateModel);
      if (template?.id) params.set('templateId', template.id);
      const existingCaseId = localStorage.getItem('created_onboarding_case_id');
      if (existingCaseId) params.set('caseId', existingCaseId);
      const qs = params.toString();
      // Em vez de navegar direto (o que deixava o cliente confuso e gerava casos sem docs),
      // mostramos a tela-ponte explicando que falta a Etapa 2 — com opção de continuar
      // agora ou receber link por email para retomar depois (Opção B).
      setBridgeNavParams(qs);
      setShowDocsBridge(true);
      window.scrollTo(0, 0);
    }
  };

  const handleBridgeContinue = () => {
    setShowDocsBridge(false);
    navigate(`/${documentUploadPage}${bridgeNavParams ? `?${bridgeNavParams}` : ''}`);
  };

  // Helper: create Merchant + OnboardingCase from compliance data so it appears in "Recebidos"
  const merchantCreatedRef = React.useRef(false);
  const createMerchantAndCase = useCallback(async (finalFormData) => {
    // Prevent duplicate creation
    if (merchantCreatedRef.current) return null;
    merchantCreatedRef.current = true;

    // Extract CNPJ/CPF, name, email from formData using questions
    let cnpj = '', fullName = '', companyName = '', email = '', phone = '';
    let dateOfBirth = '', nationality = '', motherName = '';
    // Detect PF if template is PF type
    const isPF = template?.merchantType === 'PF';
    let merchantType = isPF ? 'PF' : 'PJ';

    // Sort questions by order to ensure the first CNPJ/email/phone field wins
    const sortedQuestions = [...questions].sort((a, b) => (a.order || 0) - (b.order || 0));
    sortedQuestions.forEach(q => {
      const t = (q.text || '').toLowerCase().trim();
      const val = finalFormData[q.id];
      if (!val) return;
      // Only take the FIRST matching CNPJ/CPF field (by order), not subsequent ones
      if (!cnpj && (q.type === 'CPF_CNPJ' || t === 'cnpj' || t === 'cpf')) cnpj = val;
      if (!fullName && (t === 'razão social' || t === 'nome completo')) fullName = val;
      if (!companyName && t === 'nome fantasia') companyName = val;
      if (!email && (q.type === 'EMAIL' || t === 'e-mail' || t === 'email')) email = val;
      if (!phone && (q.type === 'PHONE' || t === 'telefone')) phone = val;
      if (!dateOfBirth && t === 'data de nascimento') dateOfBirth = val;
      if (!nationality && t === 'nacionalidade') nationality = val;
      if (!motherName && (t === 'nome da mãe' || t === 'nome da mae')) motherName = val;
    });
    // Fallback from lead
    if (lead) {
      if (!cnpj) cnpj = lead.cpfCnpj || '';
      if (!fullName) fullName = lead.fullName || '';
      if (!companyName) companyName = lead.companyName || '';
      if (!email) email = lead.email || '';
      if (!phone) phone = lead.phone || '';
    }
    if (!cnpj && !email) { merchantCreatedRef.current = false; return null; }

    // Check if lead already has an onboardingCaseId (avoid duplicates)
    const leadId = localStorage.getItem('lead_id_for_compliance') || localStorage.getItem('fechamento_lead_id');
    if (leadId && lead?.onboardingCaseId) { return null; }

    // Detect subseller link (public-safe) to propagate parentMerchantId.
    // Anonymous clients can't query OnboardingLink directly — goes through the service-role endpoint.
    let parentMerchantId = null;
    let isSubsellerLink = false;
    if (linkCode) {
      try {
        const res = await callPublicFunction('publicReadContext', {
          kind: 'subseller_link_info', uniqueCode: linkCode,
        });
        const link = res?.link;
        if (link?.linkType === 'SUBSELLER_COMPLIANCE' && link.parentMerchantId) {
          parentMerchantId = link.parentMerchantId;
          isSubsellerLink = true;
        }
      } catch (_) {}
    }

    // Build responses array for backend
    // Note: Redact any accidental file/URL values from questionnaire responses — uploads
    // are separately handled via DocumentUpload entity.
    const responsesToCreate = [];
    questions.forEach(q => {
      const val = finalFormData[q.id];
      if (val === undefined || val === null || String(q.id).startsWith('__')) return;
      const resp = { questionId: q.id, questionText: q.text, questionType: q.type };
      if (typeof val === 'boolean') resp.valueBoolean = val;
      else if (typeof val === 'number') resp.valueNumber = val;
      else if (Array.isArray(val)) resp.valueArray = val;
      else resp.valueText = String(val);
      responsesToCreate.push(resp);
    });

    // Submit via backend function (asServiceRole, server-side validated)
    const res = await callPublicFunction('publicComplianceSubmit', {
      templateId: template?.id || '',
      linkCode: linkCode || undefined,
      leadId: leadId || undefined,
      merchantData: {
        type: merchantType, cpfCnpj: cnpj,
        fullName: fullName || companyName || 'N/A',
        companyName: companyName || fullName || '',
        email: email || 'nao-informado@placeholder.com',
        phone: phone || '',
        onboardingStatus: 'Em Análise',
        ...(isPF && dateOfBirth && { dateOfBirth }),
        ...(isPF && nationality && { nationality }),
        ...(isPF && motherName && { motherName }),
      },
      onboardingCaseData: {
        status: 'Pendente',
        priority: 'medium',
      },
      responses: responsesToCreate,
    });

    if (res?.error || !res?.ok) {
      merchantCreatedRef.current = false;
      return null;
    }

    // Persist IDs so the document upload page can reuse them
    localStorage.setItem('created_merchant_id', res.merchantId);
    localStorage.setItem('created_onboarding_case_id', res.onboardingCaseId);
    // Persist docLinkToken so public endpoints (publicComplianceCaseUpdate, cafVerifyResult)
    // can authenticate updates for this specific case instead of accepting anonymous writes.
    if (res.docLinkToken) {
      localStorage.setItem('created_doc_link_token', res.docLinkToken);
    }

    return { merchantId: res.merchantId, onboardingCaseId: res.onboardingCaseId, docLinkToken: res.docLinkToken };
  }, [questions, lead, template, linkCode]);

  // Callback quando o cliente confirma que concluiu na CAF
  const handleCafCompletion = useCallback(async () => {
    setIsCompletingCaf(true);
    // Salvar dados finais com fase 'completed'
    const finalFormData = { ...formData, __complianceFlags: complianceAlerts };
    await saveProgressNow({
      currentStep,
      currentPhase: 'completed',
      formData: finalFormData,
      clientEmail: clientInfo.email,
      clientName: clientInfo.name,
    });

    // Create Merchant + OnboardingCase for visibility in compliance dashboard
    await createMerchantAndCase(finalFormData);

    await completeSession();
    setIsCompletingCaf(false);
    // Persist the segment-specific CAF URL for the completion page
    const cafUrl = resolvedCafRedirectUrl || cafRedirectUrl;
    if (cafUrl) {
      localStorage.setItem('caf_redirect_url', cafUrl);
    }
    navigate('/OnboardingCompletion');
  }, [formData, complianceAlerts, currentStep, saveProgressNow, completeSession, navigate, createMerchantAndCase, clientInfo]);

  if (sessionLoading || loadingTemplate || loadingQuestions) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
        <span className="ml-3 text-[#002443]/70">Carregando questionário...</span>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-[#002443] mb-2">Questionário não encontrado</h2>
        <p className="text-[#002443]/70">O template de questionário solicitado não está disponível.</p>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto text-slate-400 mb-4" />
        <h2 className="text-xl font-bold text-[#002443] mb-2">Nenhuma pergunta configurada</h2>
        <p className="text-[#002443]/70">Este questionário ainda não possui perguntas.</p>
      </div>
    );
  }

  const isLastStep = currentStep === steps.length;
  const progress = (currentStep / steps.length) * 100;
  const currentStepData = steps[currentStep - 1];

  const StepIcon = currentStepData?.icon || FileText;

  // Mostrar tela de redirecionamento CAF
  const activeCafUrl = resolvedCafRedirectUrl || cafRedirectUrl;
  if (showCafRedirect && activeCafUrl) {
    return (
      <CafeRedirectMessage
        redirectUrl={activeCafUrl}
        onConfirmCompletion={handleCafCompletion}
        isCompleting={isCompletingCaf}
      />
    );
  }

  // Bridge: questionário → upload de documentos (Opção B — explica, oferece "continuar depois")
  if (showDocsBridge) {
    return (
      <QuestionnaireToDocsBridge
        onContinueNow={handleBridgeContinue}
        resumeUrl={getResumeUrl()}
        clientEmail={clientInfo.email}
        clientName={clientInfo.name}
        branding={branding}
      />
    );
  }

  const bPrimary = branding?.primaryColor || '#2bc196';
  const bSecondary = branding?.secondaryColor || '#002443';
  const hasBranding = !!branding?.name;

  // Generate lighter variant of primary color for backgrounds
  const brandStyles = hasBranding ? `
    .custom-branded .brand-progress-bar { background: linear-gradient(to right, ${bSecondary}, ${bPrimary}) !important; }
    .custom-branded .brand-step-current { background-color: ${bSecondary} !important; color: white !important; box-shadow: 0 0 0 3px ${bSecondary}33 !important; }
    .custom-branded .brand-step-completed { background-color: ${bPrimary} !important; color: white !important; }
    .custom-branded .brand-step-icon-bg { background: linear-gradient(to bottom right, ${bSecondary}0D, ${bPrimary}1A) !important; }
    .custom-branded .brand-step-icon { color: ${bSecondary}B3 !important; }
    .custom-branded .brand-prefill-bg { background-color: ${bPrimary}12 !important; border-color: ${bPrimary}40 !important; }
    .custom-branded .brand-prefill-icon-bg { background-color: ${bPrimary}20 !important; }
    .custom-branded .brand-prefill-icon { color: ${bPrimary} !important; }
    .custom-branded .brand-prefill-title { color: ${bSecondary} !important; }
    .custom-branded .brand-prefill-desc { color: ${bPrimary} !important; }
    .custom-branded .brand-btn-back { color: ${bSecondary}99 !important; border-color: ${bSecondary}20 !important; }
    .custom-branded .brand-btn-back:hover { color: ${bSecondary} !important; border-color: ${bSecondary}40 !important; }
    .custom-branded .brand-btn-next { background-color: ${bPrimary} !important; box-shadow: 0 10px 15px -3px ${bPrimary}33 !important; }
    .custom-branded .brand-btn-next:hover { background-color: ${bPrimary}E6 !important; }
    .custom-branded .brand-text-primary { color: ${bSecondary} !important; }
    .custom-branded .brand-text-muted { color: ${bSecondary}80 !important; }
    .custom-branded .brand-security-text { color: ${bSecondary}66 !important; }
    .custom-branded .brand-select-active { background-color: ${bPrimary} !important; color: white !important; border-color: ${bPrimary} !important; }
    .custom-branded .brand-select-hover:not(.brand-select-active) { border-color: ${bPrimary} !important; color: ${bPrimary} !important; }
    .custom-branded .brand-autosave-text { color: ${bPrimary} !important; }
    .custom-branded .brand-badge-receita { background-color: ${bPrimary}12 !important; color: ${bPrimary} !important; border-color: ${bPrimary}40 !important; }
    .custom-branded .brand-input-valid { border-color: ${bPrimary} !important; box-shadow: 0 0 0 1px ${bPrimary}40 !important; }
    .custom-branded .brand-icon-valid { color: ${bPrimary} !important; }
    .custom-branded .brand-cnpj-summary { background-color: ${bPrimary}08 !important; border-color: ${bPrimary}20 !important; }
    .custom-branded .brand-cnpj-summary-title { color: ${bSecondary} !important; }
    .custom-branded .brand-cnpj-summary-desc { color: ${bPrimary} !important; }
    .custom-branded .brand-autofill-bg { background-color: ${bPrimary}08 !important; border-color: ${bPrimary}30 !important; }
    .custom-branded .brand-autofill-text { color: ${bPrimary} !important; }
    .custom-branded .brand-autofill-icon { color: ${bPrimary}99 !important; }
    .custom-branded .brand-loading-spinner { color: ${bPrimary} !important; }
    .custom-branded .brand-top-bar { background: linear-gradient(to right, ${bSecondary}, ${bPrimary}, ${bPrimary}99) !important; }
    .custom-branded .brand-left-bar { background: linear-gradient(to bottom, ${bSecondary}, ${bPrimary}, ${bPrimary}99) !important; }
  ` : '';

  return (
    <div className={`max-w-3xl mx-auto ${hasBranding ? 'custom-branded' : ''}`} style={hasBranding ? { '--brand-primary': bPrimary, '--brand-secondary': bSecondary } : undefined}>
      {hasBranding && <style>{brandStyles}</style>}
      {/* Header com logo, badge e auto-save */}
      <div className="text-center mb-6">
        {hasBranding ? (
          <>
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.name} className="h-9 mx-auto mb-3 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: bPrimary }}>
                {branding.name.charAt(0)}
              </div>
            )}
            <div className="w-16 h-1 rounded-full mx-auto mb-3" style={{ backgroundColor: bPrimary }} />
          </>
        ) : (
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png" 
            alt="Pagsmile" 
            className="h-7 mx-auto mb-4"
          />
        )}
        <div className="flex items-center justify-center gap-2 mb-1">
          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide ${hasBranding ? '' : badgeColor}`}
            style={hasBranding ? { backgroundColor: bPrimary + '20', color: bPrimary } : undefined}
          >
            {hasBranding
              ? branding.name
              : (badgeLabel || templateModel?.toUpperCase() || '').replace(/\s*v?\d+(\.\d+)?\s*$/i, '').trim()}
          </div>
        </div>
        <h1 className="text-xl md:text-2xl font-bold mt-2" style={hasBranding ? { color: bSecondary } : { color: '#002443' }}>
          {(template.name || '').replace(/\s*v?\d+(\.\d+)?\s*$/i, '').trim()}
        </h1>
        <div className="mt-3 flex justify-center">
          <AutoSaveIndicator
            saving={isSaving}
            lastSaved={sessionLoaded}
            resumeUrl={getResumeUrl()}
          />
        </div>
      </div>

      {/* Navegação horizontal no topo */}
      <StepNavigation
        steps={steps}
        totalSteps={steps.length}
        currentStep={currentStep}
        onStepClick={setCurrentStep}
        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6"
        hasBranding={hasBranding}
      />

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 modern-shadow">
          {/* Step title com ícone */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl brand-step-icon-bg bg-gradient-to-br from-[#002443]/5 to-[#2bc196]/10">
              <StepIcon className="w-5 h-5 brand-step-icon text-[#002443]/70" />
            </div>
            <div>
              <h2 className="text-lg font-bold brand-text-primary text-[#002443]">{currentStepData.title}</h2>
              <p className="text-xs brand-text-muted text-[#002443]/50">Etapa {currentStep} de {steps.length}</p>
            </div>
          </div>

          {/* Banner de pré-preenchimento */}
          {hasPrefill && currentStep === 1 && (
            <div className="mb-6 p-3.5 brand-prefill-bg bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <div className="p-2 brand-prefill-icon-bg bg-emerald-100 rounded-lg">
                <Check className="w-4 h-4 brand-prefill-icon text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold brand-prefill-title text-emerald-800">Dados pré-preenchidos do questionário comercial</p>
                <p className="text-xs brand-prefill-desc text-emerald-600 mt-0.5">
                  {Object.keys(prefillSources).length} campos foram preenchidos automaticamente. Verifique e ajuste se necessário.
                </p>
              </div>
            </div>
          )}

          {/* Perguntas do Step */}
          <DynamicQuestionRenderer
            questions={currentStepData.questions}
            formData={formData}
            onFieldChange={handleFieldChange}
            showTitle={false}
            allQuestions={questions}
            prefillSources={prefillSources}
            cnpjAutocompleteData={cnpjAutocompleteData}
            onCnpjAutocomplete={handleCnpjAutocomplete}
            onCepData={handleCepData}
            complianceAlerts={complianceAlerts}
            hideAlerts={true}
            isPublicView={isPublicView}
            hasBranding={hasBranding}
          />

          {/* Botões de Ação */}
          <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? () => navigate(-1) : handlePrevious}
              className="brand-btn-back text-[#002443]/60 hover:text-[#002443] border-slate-200 hover:border-slate-300 hover:bg-slate-50 h-11 px-5 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? 'Voltar' : 'Voltar'}
            </Button>
            
            <Button
              onClick={isLastStep ? handleSubmit : handleNext}
              className={`brand-btn-next ${hasBranding ? '' : 'bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90'} text-white px-8 h-12 rounded-xl shadow-lg transition-all hover:scale-[1.02]`}
              style={hasBranding ? { backgroundColor: bPrimary, boxShadow: `0 10px 15px -3px ${bPrimary}33` } : undefined}
            >
              {isLastStep ? (
                <>
                  {cafRedirectUrl ? 'Finalizar Questionário' : 'Enviar Documentos'}
                  <Check className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
      </div>

      {/* Footer de segurança */}
      <div className="text-center mt-6">
        <p className="text-xs brand-security-text flex items-center justify-center gap-1" style={{ color: (hasBranding ? bSecondary : '#002443') + '66' }}>
          <ShieldCheck className="w-3 h-3" />
          Seus dados estão protegidos e serão tratados com confidencialidade.
        </p>
        {hasBranding && (
          <p className="text-[10px] mt-2 opacity-30" style={{ color: bSecondary }}>
            Powered by PagSmile
          </p>
        )}
      </div>
    </div>
  );
}