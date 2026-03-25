import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../../utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { 
  Building2, FileText, MapPin, Briefcase, TrendingUp, 
  Users, UserCircle, ShieldAlert, CheckCircle, Shield,
  Globe, AlertTriangle, MessageSquare, ShieldCheck, CreditCard
} from 'lucide-react';
import StepNavigation from './StepNavigation';
import DynamicQuestionRenderer from './DynamicQuestionRenderer';
import { useOnboardingAnalytics } from '../analytics/useOnboardingAnalytics';
import { useLeadPrefill } from './useLeadPrefill';
import { useComplianceSession } from '../../hooks/useComplianceSession';
import useComplianceFlags from '../../hooks/useComplianceFlags';
import AutoSaveIndicator from './AutoSaveIndicator';
import { toast } from 'sonner';

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
  onComplete // Callback opcional quando completa o questionário
}) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [sessionRestored, setSessionRestored] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cnpjAutocompleteData, setCnpjAutocompleteData] = useState(null);

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
    getResumeUrl
  } = useComplianceSession({ flowType, templateModel, storageKey });

  // Buscar template
  const { data: template, isLoading: loadingTemplate } = useQuery({
    queryKey: ['template', templateId, templateModel],
    queryFn: async () => {
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

  // Buscar perguntas do template
  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['questions', template?.id],
    queryFn: () => base44.entities.Question.filter(
      { questionnaireTemplateId: template.id }, 
      'order'
    ),
    enabled: !!template?.id
  });

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

  // Carregar dados salvos do localStorage
  useEffect(() => {
    if (storageKey) {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        setFormData(prev => {
          const local = JSON.parse(savedData);
          // Only set if we don't already have data
          return Object.keys(prev).length === 0 ? local : prev;
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

  // Salvar dados localmente e no servidor (debounced)
  useEffect(() => {
    if (storageKey && Object.keys(formData).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(formData));
      // Auto-save to server (debounced inside hook)
      saveProgress({
        currentStep,
        currentPhase: 'questionnaire',
        formData
      });
    }
  }, [formData, storageKey, currentStep, saveProgress]);

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
        toast.error(`Preencha todos os campos obrigatórios (${missing.length} campo${missing.length > 1 ? 's' : ''} pendente${missing.length > 1 ? 's' : ''}).`);
        return;
      }
      trackPageComplete({ stepNumber: currentStep });
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // Save step change immediately
      saveProgressNow({
        currentStep: nextStep,
        currentPhase: 'questionnaire',
        formData
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
      toast.error(`Preencha todos os campos obrigatórios (${missing.length} campo${missing.length > 1 ? 's' : ''} pendente${missing.length > 1 ? 's' : ''}).`);
      return;
    }
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
    // Save phase transition to documents
    saveProgressNow({
      currentStep: 1,
      currentPhase: 'documents',
      formData: finalFormData
    });
    if (onComplete) {
      onComplete({ formData, template, questions });
    } else {
      navigate(createPageUrl(documentUploadPage));
    }
  };

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

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header com badge + Auto-save indicator */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${badgeColor}`}>
            {badgeLabel || templateModel?.toUpperCase()}
          </div>
          <h3 className="font-bold text-[var(--pagsmile-blue)] text-sm">
            {template.name}
          </h3>
        </div>
        <AutoSaveIndicator
          saving={isSaving}
          lastSaved={sessionLoaded}
          resumeUrl={getResumeUrl()}
        />
      </div>

      {/* Navegação horizontal no topo */}
      <StepNavigation
        steps={steps}
        totalSteps={steps.length}
        currentStep={currentStep}
        onStepClick={setCurrentStep}
        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6"
      />

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 modern-shadow">
          {/* Banner de pré-preenchimento */}
          {hasPrefill && currentStep === 1 && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-800">Dados pré-preenchidos</p>
                <p className="text-xs text-emerald-600">
                  Identificamos {Object.keys(prefillSources).length} campos já informados no questionário de leads. Verifique e ajuste se necessário.
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
          />

          {/* Botões de Ação */}
          <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={currentStep === 1 ? () => navigate(createPageUrl('ComplianceOnboardingStart')) : handlePrevious}
              className="text-slate-500 hover:text-[var(--pagsmile-blue)] hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? 'Início' : 'Voltar'}
            </Button>
            
            <Button
              onClick={isLastStep ? handleSubmit : handleNext}
              className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white px-8 h-12 rounded-xl shadow-lg shadow-green-500/20"
            >
              {isLastStep ? (
                <>
                  Enviar Documentos
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
    </div>
  );
}