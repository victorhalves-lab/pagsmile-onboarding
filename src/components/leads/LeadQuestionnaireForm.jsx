import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2, User, Briefcase, DollarSign, PieChart, Clock,
  CreditCard, Package, FileText, CheckCircle, ArrowLeft, 
  ArrowRight, Loader2, ShieldCheck, HelpCircle, Search, Hash, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import LeadStepNavigation from './LeadStepNavigation';
import BusinessTypeExplainer from './BusinessTypeExplainer';
import PercentDistributionRow from './PercentDistributionRow';
import CardRatesGroup from './CardRatesGroup';
import ExpectedRatesInput from './ExpectedRatesInput';
import MCCSearchModal from './MCCSearchModal';
import { MCC_LIST } from './mccData';
import ProductTypePercentages, { PRODUCT_TYPE_QUESTION_ID } from './ProductTypePercentages';
import AutoSaveIndicator from './AutoSaveIndicator';
import FormFieldError from './FormFieldError';
import ConfirmationReview from './ConfirmationReview';
import LeadCnpjAutocompleteField from './LeadCnpjAutocompleteField';
import CurrencyInput from './CurrencyInput';
import PhoneInput from './PhoneInput';
import EmailInput from './EmailInput';
import CnaeCoherenceAlert from './CnaeCoherenceAlert';
import SiteValidationBadge from './SiteValidationBadge';
import { computeSilentFlags, computeLeadScore } from '@/hooks/useLeadSilentFlags';

function MCCNameDisplay({ mccCode }) {
  const found = MCC_LIST.find(m => m.mcc === mccCode.padStart(4, '0'));
  if (!found) return null;
  return (
    <div className="flex items-center gap-2 bg-[#2bc196]/5 border border-[#2bc196]/20 rounded-xl px-4 py-2.5">
      <CheckCircle className="w-4 h-4 text-[#2bc196] shrink-0" />
      <span className="text-sm font-medium text-[#002443]">{found.name}</span>
      <span className="text-xs text-[#002443]/50">({found.nameEn})</span>
    </div>
  );
}

// IDs das perguntas que devem ser removidas (duplicadas/redundantes)
const HIDDEN_QUESTION_IDS = [
  '69a65e03864a4c3f8c03117e', // "Qual o modelo de negócio da sua empresa?" (duplicada da etapa 1)
  '69a5cd07afab70a7ca2184dc', // "Qual o principal tipo de produto/serviço que sua empresa vende/transaciona?" (redundante)
  '69a5cd11afab70a7ca2184e2', // "Quantas transações por mês..." (será calculado automaticamente)
];

// IDs das perguntas que precisam de campo "Outro" para descrição
const QUESTIONS_WITH_OTHER_DESCRIPTION = [
  '69a5cd07afab70a7ca2184d8', // "Qual o principal tipo de produto/serviço que sua empresa oferece?"
  '69a5cd07afab70a7ca2184dd', // "Selecione as categorias de produtos..."
  '69a5cd44afab70a7ca2184ff', // "Processador de pagamento atual"
  '69a5cd07afab70a7ca2184da', // "Sua empresa atua em qual(is) modelo(s) de negócio?"
  '69a5cd07afab70a7ca2184de', // "Quais os seus principais canais de venda?"
];

// IDs das perguntas de valores monetários
const MONETARY_QUESTION_IDS = [
  '69a5cd11afab70a7ca2184e0', // TPV Mensal
  '69a5cd11afab70a7ca2184e1', // Ticket Médio
];

// ID da pergunta "Descreva brevemente todos os produtos/serviços..."
const DESCRIPTION_QUESTION_ID = '69a5cd07afab70a7ca2184d9';

// IDs para cálculo automático de transações
const TPV_QUESTION_ID = '69a5cd11afab70a7ca2184e0';
const TICKET_MEDIO_QUESTION_ID = '69a5cd11afab70a7ca2184e1';
const TRANSACOES_MES_QUESTION_ID = '69a5cd11afab70a7ca2184e2';

// === GRUPOS DE PERCENTUAIS (renderizados lado a lado) ===
// Distribuição TPV: Cartão de Crédito + PIX + Boleto = 100%
const TPV_DISTRIBUTION_IDS = {
  cartao: '69a5cd22afab70a7ca2184e9',
  pix: '69a5cd22afab70a7ca2184ea',
  boleto: '69a5cd22afab70a7ca2184eb',
};

// Distribuição Bandeiras: Visa + Master + Elo + Amex + Outras = 100%
const BANDEIRA_DISTRIBUTION_IDS = {
  visa: '69a5cd22afab70a7ca2184ec',
  master: '69a5cd22afab70a7ca2184ed',
  elo_amex_outras: '69a5cd22afab70a7ca2184ee',
};

// Distribuição Parcelamento: À Vista + 2-6x + 7-12x = 100%
const PARCELAMENTO_DISTRIBUTION_IDS = {
  vista: '69a5cd22afab70a7ca2184ef',
  parcela_2_6: '69a5cd22afab70a7ca2184f0',
  parcela_7_12: '69a5cd22afab70a7ca2184f1',
};

// IDs das taxas de cartão por bandeira (renderizados como grupo via CardRatesGroup)
const CARD_RATE_QUESTION_IDS = [
  '69a5cd44afab70a7ca218502', // À Vista - Visa
  '69a5cd44afab70a7ca218503', // À Vista - Mastercard
  '69a8621316a6e3a86682f6e3', // À Vista - Amex
  '69a8621316a6e3a86682f6e4', // À Vista - Elo
  '69a5cd45afab70a7ca218504', // À Vista - Outras
  '69a5cd45afab70a7ca218505', // 2-6x - Visa
  '69a5cd45afab70a7ca218506', // 2-6x - Mastercard
  '69a8621316a6e3a86682f6e5', // 2-6x - Amex
  '69a8621316a6e3a86682f6e6', // 2-6x - Elo
  '69a5cd45afab70a7ca218507', // 2-6x - Outras
  '69a5cd45afab70a7ca218508', // 7-12x - Visa
  '69a5cd45afab70a7ca218509', // 7-12x - Mastercard
  '69a8621316a6e3a86682f6e7', // 7-12x - Amex
  '69a8621316a6e3a86682f6e8', // 7-12x - Elo
  '69a5cd45afab70a7ca21850a', // 7-12x - Outras
];

// O primeiro ID do grupo de taxas de cartão - usado como trigger para renderizar o CardRatesGroup
const CARD_RATE_TRIGGER_ID = '69a5cd44afab70a7ca218502';

// ID da pergunta "Você opera com cartão de crédito hoje?"
const USA_CARTAO_QUESTION_ID = '69a5cd44afab70a7ca218501';

// Campos obrigatórios de expectativa de taxas
const EXPECTED_RATE_KEYS = ['mdr1x', 'mdr2a6x', 'mdr7a12x', 'antecipacao', 'feeTransacao', 'antifraude', 'taxa3ds'];

// Todos os IDs que devem ser ocultados da renderização normal (serão renderizados como grupo)
const GROUPED_PERCENT_IDS = [
  ...Object.values(TPV_DISTRIBUTION_IDS),
  ...Object.values(BANDEIRA_DISTRIBUTION_IDS),
  ...Object.values(PARCELAMENTO_DISTRIBUTION_IDS),
];

// Configuração dos grupos para renderização
const PERCENT_GROUPS = [
  {
    trigger: TPV_DISTRIBUTION_IDS.cartao, // primeiro ID do grupo -> renderiza o grupo inteiro
    title: 'Distribuição do seu TPV (%) — Cartão de Crédito, PIX e Boleto',
    required: true,
    fields: [
      { id: TPV_DISTRIBUTION_IDS.cartao, label: 'Cartão de Crédito', placeholder: '60' },
      { id: TPV_DISTRIBUTION_IDS.pix, label: 'PIX', placeholder: '30' },
      { id: TPV_DISTRIBUTION_IDS.boleto, label: 'Boleto', placeholder: '10' },
    ],
  },
  {
    trigger: BANDEIRA_DISTRIBUTION_IDS.visa,
    title: 'Percentual de vendas por bandeira (%)',
    required: false,
    fields: [
      { id: BANDEIRA_DISTRIBUTION_IDS.visa, label: 'Visa', placeholder: '50' },
      { id: BANDEIRA_DISTRIBUTION_IDS.master, label: 'Mastercard', placeholder: '35' },
      { id: BANDEIRA_DISTRIBUTION_IDS.elo_amex_outras, label: 'Elo / Amex / Outras', placeholder: '15' },
    ],
  },
  {
    trigger: PARCELAMENTO_DISTRIBUTION_IDS.vista,
    title: 'Percentual de crédito por parcelamento (%)',
    required: false,
    fields: [
      { id: PARCELAMENTO_DISTRIBUTION_IDS.vista, label: 'À Vista (1x)', placeholder: '40' },
      { id: PARCELAMENTO_DISTRIBUTION_IDS.parcela_2_6, label: '2x a 6x', placeholder: '40' },
      { id: PARCELAMENTO_DISTRIBUTION_IDS.parcela_7_12, label: '7x a 12x', placeholder: '20' },
    ],
  },
];

const STORAGE_KEY = 'lead_questionnaire_data'; // v2

// === DETECÇÃO DINÂMICA DE GRUPOS DE PERCENTUAIS (V2) ===
// Detecta grupos de % por texto quando os IDs hardcoded V1 não existem
function detectV2PercentGroups(allQuestions) {
  const groups = [];
  
  // Grupo 1: Crédito/PIX/Boleto
  const creditoPct = allQuestions.find(q => q.type === 'NUMBER' && (q.text || '').toLowerCase().includes('cartão de crédito') && (q.text || '').includes('%'));
  const pixPct = allQuestions.find(q => q.type === 'NUMBER' && (q.text || '').toLowerCase().includes('pix') && (q.text || '').includes('%') && !(q.text || '').toLowerCase().includes('med'));
  const boletoPct = allQuestions.find(q => q.type === 'NUMBER' && (q.text || '').toLowerCase().includes('boleto') && (q.text || '').includes('%'));
  
  if (creditoPct && pixPct && boletoPct) {
    groups.push({
      trigger: creditoPct.id,
      title: 'Distribuição do seu TPV (%) — Cartão de Crédito, PIX e Boleto',
      required: false,
      ids: [creditoPct.id, pixPct.id, boletoPct.id],
      fields: [
        { id: creditoPct.id, label: 'Cartão de Crédito', placeholder: '60' },
        { id: pixPct.id, label: 'PIX', placeholder: '30' },
        { id: boletoPct.id, label: 'Boleto', placeholder: '10' },
      ],
    });
  }
  
  // Grupo 2: Bandeiras (Visa/Master/Outras)
  const visaPct = allQuestions.find(q => q.type === 'NUMBER' && (q.text || '').toLowerCase().includes('visa') && (q.text || '').includes('%'));
  const masterPct = allQuestions.find(q => q.type === 'NUMBER' && (q.text || '').toLowerCase().includes('mastercard') && (q.text || '').includes('%'));
  const outrasBandPct = allQuestions.find(q => q.type === 'NUMBER' && (q.text || '').toLowerCase().includes('elo') && (q.text || '').toLowerCase().includes('bandeira') && (q.text || '').includes('%'));
  
  if (visaPct && masterPct && outrasBandPct) {
    groups.push({
      trigger: visaPct.id,
      title: 'Percentual de vendas por bandeira (%)',
      required: false,
      ids: [visaPct.id, masterPct.id, outrasBandPct.id],
      fields: [
        { id: visaPct.id, label: 'Visa', placeholder: '50' },
        { id: masterPct.id, label: 'Mastercard', placeholder: '35' },
        { id: outrasBandPct.id, label: 'Elo / Outras', placeholder: '15' },
      ],
    });
  }
  
  // Grupo 3: Parcelamento (À Vista/2-6x/7-12x)
  const vistaPct = allQuestions.find(q => q.type === 'NUMBER' && (q.text || '').toLowerCase().includes('à vista') && (q.text || '').toLowerCase().includes('parcelamento') && (q.text || '').includes('%'));
  const parc26 = allQuestions.find(q => q.type === 'NUMBER' && (q.text || '').toLowerCase().includes('2 a 6x') && (q.text || '').includes('%'));
  const parc712 = allQuestions.find(q => q.type === 'NUMBER' && (q.text || '').toLowerCase().includes('7 a 12x') && (q.text || '').includes('%'));
  
  if (vistaPct && parc26 && parc712) {
    groups.push({
      trigger: vistaPct.id,
      title: 'Percentual de crédito por parcelamento (%)',
      required: false,
      ids: [vistaPct.id, parc26.id, parc712.id],
      fields: [
        { id: vistaPct.id, label: 'À Vista (1x)', placeholder: '40' },
        { id: parc26.id, label: '2x a 6x', placeholder: '40' },
        { id: parc712.id, label: '7x a 12x', placeholder: '20' },
      ],
    });
  }
  
  return groups;
}

// Detectar taxas de cartão V2 (MDR por bandeira)
function detectV2CardRates(allQuestions) {
  return allQuestions.filter(q => 
    q.type === 'NUMBER' && (q.text || '').toLowerCase().includes('mdr') && (q.text || '').includes('%')
  );
}

// Detectar se uma pergunta é campo CNPJ gatilho para autocomplete (Lead v2.0)
const isLeadCnpjTrigger = (question) => {
  return question.type === 'CPF_CNPJ' && (question.text || '').toLowerCase().trim() === 'cnpj';
};

// Detectar se um campo foi preenchido via autocomplete CNPJ
const isAutofilledByApi = (question, cnpjData) => {
  if (!cnpjData) return false;
  const t = (question.text || '').toLowerCase().trim();
  return t === 'razão social' || t === 'nome fantasia';
};

export default function LeadQuestionnaireForm({ template, questions: rawQuestions, linkCode, onboardingLink, onSubmit }) {
  // Filtrar perguntas ocultas (duplicadas/redundantes)
  // Também ocultar "Quantidade de Transações por Mês" pois é calculada automaticamente (TPV / Ticket Médio)
  const questions = rawQuestions.filter(q => {
    if (HIDDEN_QUESTION_IDS.includes(q.id)) return false;
    // Ocultar campo de transações por mês (será calculado automaticamente)
    const qText = (q.text || '').toLowerCase();
    if (q.type === 'NUMBER' && (qText.includes('quantidade de transações') || qText.includes('transações por mês'))) return false;
    return true;
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mccModalOpen, setMccModalOpen] = useState(false);
  const [mccQuestionId, setMccQuestionId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const [cnpjApiData, setCnpjApiData] = useState(null);
  const autoSaveRef = useRef(null);
  const firstErrorRef = useRef(null);

  // Check if this is a v2.0 template with CNPJ autocomplete
  const isV2Template = template?.model === 'LeadCompletoAutocomplete';

  // Perguntas de taxa de cartão (para passar ao CardRatesGroup)
  const cardRateQuestions = questions.filter(q => CARD_RATE_QUESTION_IDS.includes(q.id));
  
  // V2 dynamic groups: detectar grupos de % por texto
  const v2PercentGroups = React.useMemo(() => isV2Template ? detectV2PercentGroups(questions) : [], [questions, isV2Template]);
  const v2GroupedIds = React.useMemo(() => v2PercentGroups.flatMap(g => g.ids), [v2PercentGroups]);
  
  // V2 card rate questions
  const v2CardRates = React.useMemo(() => isV2Template ? detectV2CardRates(questions) : [], [questions, isV2Template]);
  const v2CardRateIds = React.useMemo(() => v2CardRates.map(q => q.id), [v2CardRates]);
  
  // V2: detectar pergunta "Processa cartão" para condicionalidade
  const v2ProcCartaoQ = React.useMemo(() => {
    if (!isV2Template) return null;
    return questions.find(q => q.type === 'BOOLEAN' && (q.text || '').toLowerCase().includes('processa') && (q.text || '').toLowerCase().includes('cartão'));
  }, [questions, isV2Template]);

  // Filtrar perguntas visíveis:
  // - Taxas de cartão: ocultar individualmente, renderizar via trigger (primeiro ID)
  // - Grupos percentuais: ocultar individualmente, renderizar via trigger
  // - V2 groups: also hide grouped percent fields (render via trigger)
  // - V2 card rates: hide from individual rendering (render via first MDR question)
  const v2CardRateTrigger = v2CardRateIds.length > 0 ? v2CardRateIds[0] : null;
  const visibleQuestions = questions.filter(q => {
    // V1 card rates
    if (CARD_RATE_QUESTION_IDS.includes(q.id) && q.id !== CARD_RATE_TRIGGER_ID) return false;
    // V1 percent groups
    if (GROUPED_PERCENT_IDS.includes(q.id) && !PERCENT_GROUPS.some(g => g.trigger === q.id)) return false;
    // V2 percent groups: hide non-trigger IDs
    if (v2GroupedIds.includes(q.id) && !v2PercentGroups.some(g => g.trigger === q.id)) return false;
    // V2 card rates: hide non-trigger IDs
    if (v2CardRateIds.includes(q.id) && q.id !== v2CardRateTrigger) return false;
    return true;
  });

  // Agrupar perguntas visíveis em steps (5 perguntas por step)
  const QUESTIONS_PER_STEP = 5;
  const steps = [];
  for (let i = 0; i < visibleQuestions.length; i += QUESTIONS_PER_STEP) {
    steps.push(visibleQuestions.slice(i, i + QUESTIONS_PER_STEP));
  }
  // Adicionar step de confirmação
  const totalSteps = steps.length + 1;

  // Carregar dados do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  // Auto-save a cada 2 segundos
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      if (Object.keys(formData).length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        setLastSaved(new Date());
      }
    }, 2000);
    return () => clearInterval(autoSaveRef.current);
  }, [formData]);

  // Limpar erros quando o usuário muda de step
  useEffect(() => {
    setValidationErrors({});
  }, [currentStep]);

  // Encontrar IDs dinâmicos de TPV, Ticket Médio e Transações (funciona tanto para v1 quanto v2)
  const tpvQuestion = rawQuestions.find(q => q.id === TPV_QUESTION_ID || (q.type === 'NUMBER' && (q.text || '').toLowerCase().includes('tpv')));
  const ticketMedioQuestion = rawQuestions.find(q => q.id === TICKET_MEDIO_QUESTION_ID || (q.type === 'NUMBER' && (q.text || '').toLowerCase().includes('ticket')));
  const transacoesQuestion = rawQuestions.find(q => q.id === TRANSACOES_MES_QUESTION_ID || (q.type === 'NUMBER' && ((q.text || '').toLowerCase().includes('quantidade de transações') || (q.text || '').toLowerCase().includes('transações por mês'))));
  const tpvId = tpvQuestion?.id;
  const ticketMedioId = ticketMedioQuestion?.id;
  const transacoesId = transacoesQuestion?.id || TRANSACOES_MES_QUESTION_ID;

  // Detectar pergunta "Meios de Pagamento Desejados" V2
  const meiosPagQ = React.useMemo(() => {
    if (!isV2Template) return null;
    return questions.find(q => q.type === 'MULTI_SELECT' && (q.text || '').toLowerCase().includes('meios de pagamento'));
  }, [questions, isV2Template]);
  
  // Detectar perguntas de % Crédito/PIX/Boleto V2
  const creditoPctQ = React.useMemo(() => questions.find(q => q.type === 'NUMBER' && (q.text || '').toLowerCase().includes('cartão de crédito') && (q.text || '').includes('%')), [questions]);
  const pixPctQ = React.useMemo(() => questions.find(q => q.type === 'NUMBER' && (q.text || '').toLowerCase().includes('pix') && (q.text || '').includes('%') && !(q.text || '').toLowerCase().includes('med')), [questions]);
  const boletoPctQ = React.useMemo(() => questions.find(q => q.type === 'NUMBER' && (q.text || '').toLowerCase().includes('boleto') && (q.text || '').includes('%')), [questions]);

  const updateField = useCallback((fieldId, value) => {
    setFormData(prev => {
      const newData = { ...prev, [fieldId]: value };
      
      // Cálculo automático de transações por mês (TPV / Ticket Médio)
      if (tpvId && ticketMedioId && (fieldId === tpvId || fieldId === ticketMedioId)) {
        const tpv = parseFloat(fieldId === tpvId ? value : prev[tpvId]) || 0;
        const ticketMedio = parseFloat(fieldId === ticketMedioId ? value : prev[ticketMedioId]) || 0;
        
        if (tpv > 0 && ticketMedio > 0) {
          newData[transacoesId] = Math.round(tpv / ticketMedio);
        }
      }
      
      // P71: Auto-selecionar "Meios de Pagamento Desejados" baseado nos %
      if (meiosPagQ && (fieldId === creditoPctQ?.id || fieldId === pixPctQ?.id || fieldId === boletoPctQ?.id)) {
        const meios = [];
        const credVal = parseFloat(fieldId === creditoPctQ?.id ? value : (prev[creditoPctQ?.id] || 0)) || 0;
        const pixVal = parseFloat(fieldId === pixPctQ?.id ? value : (prev[pixPctQ?.id] || 0)) || 0;
        const bolVal = parseFloat(fieldId === boletoPctQ?.id ? value : (prev[boletoPctQ?.id] || 0)) || 0;
        if (credVal > 0) meios.push('Cartão de Crédito');
        if (pixVal > 0) meios.push('PIX');
        if (bolVal > 0) meios.push('Boleto');
        if (meios.length > 0) {
          newData[meiosPagQ.id] = meios;
        }
      }
      
      return newData;
    });
  }, [tpvId, ticketMedioId, transacoesId, meiosPagQ, creditoPctQ, pixPctQ, boletoPctQ]);

  // Verificar lógica condicional
  const shouldShowQuestion = (question) => {
    if (!question.conditionalLogic?.dependsOn) return true;
    const depValue = formData[question.conditionalLogic.dependsOn];
    const expectedValue = question.conditionalLogic.value;
    const operator = question.conditionalLogic.operator || 'equals';

    switch (operator) {
      case 'equals': return String(depValue) === String(expectedValue);
      case 'not_equals': return String(depValue) !== String(expectedValue);
      case 'contains': {
        // Suporte para arrays (MULTI_SELECT) e strings
        if (Array.isArray(depValue)) {
          return depValue.some(v => String(v).includes(expectedValue));
        }
        return String(depValue || '').includes(expectedValue);
      }
      default: return true;
    }
  };

  // Verificar se pergunta precisa de campo "Outro" para descrição
  const needsOtherDescription = (questionId, value) => {
    // Check by ID (V1) or check if value contains "Outro" for any MULTI_SELECT/SELECT
    const hasOtherSelected = Array.isArray(value) 
      ? value.some(v => v?.toLowerCase().includes('outro'))
      : String(value || '').toLowerCase().includes('outro');
    if (!hasOtherSelected) return false;
    // For V1 IDs, use explicit list; for V2, detect by question having "Outro" in options
    if (QUESTIONS_WITH_OTHER_DESCRIPTION.includes(questionId)) return true;
    const q = questions.find(q => q.id === questionId);
    if (q && (q.type === 'SELECT' || q.type === 'MULTI_SELECT')) {
      return (q.options || []).some(o => o.toLowerCase().includes('outro'));
    }
    return false;
  };

  // Validar step atual — acumula todos os erros
  const validateStep = () => {
    if (currentStep >= steps.length) return true;
    const stepQuestions = steps[currentStep].filter(shouldShowQuestion);
    const errors = {};
    
    for (const q of stepQuestions) {
      const isRequired = q.type !== 'FILE_UPLOAD' ? true : q.isRequired;
      if (isRequired) {
        const val = formData[q.id];
        // BOOLEAN: false is a valid answer, don't treat it as empty
        const isEmpty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
        if (isEmpty && val !== false) {
          errors[q.id] = 'Este campo é obrigatório';
          continue;
        }
        
        const minLength = q.validationRules?.minLength || (q.id === DESCRIPTION_QUESTION_ID ? 75 : undefined);
        if (minLength && String(val).length < minLength) {
          errors[q.id] = `Mínimo de ${minLength} caracteres (atual: ${String(val).length})`;
        }
      }
      
      if (needsOtherDescription(q.id, formData[q.id])) {
        const otherDesc = formData[`${q.id}_outro_descricao`];
        if (!otherDesc || otherDesc.trim().length < 10) {
          errors[`${q.id}_outro`] = 'Descreva "Outros" (mínimo 10 caracteres)';
        }
      }
    }
    
    // Validar expectativa de taxas
    const stepQuestionIds = new Set(steps[currentStep].map(q => q.id));
    const usaCartaoValue = formData[USA_CARTAO_QUESTION_ID];
    const naoOperaCartao = usaCartaoValue === false || usaCartaoValue === 'false';
    
    if (naoOperaCartao && stepQuestionIds.has(USA_CARTAO_QUESTION_ID)) {
      const rates = formData._expectedRates || {};
      const missingRates = EXPECTED_RATE_KEYS.filter(key => 
        rates[key] === undefined || rates[key] === null || rates[key] === ''
      );
      if (missingRates.length > 0) {
        errors['_expectedRates'] = 'Preencha todos os campos de Expectativa de Taxas';
      }
    }

    // Validar percentuais de tipo de produto/serviço
    if (stepQuestionIds.has(PRODUCT_TYPE_QUESTION_ID)) {
      const selectedTypes = formData[PRODUCT_TYPE_QUESTION_ID];
      if (Array.isArray(selectedTypes) && selectedTypes.length > 0) {
        const pcts = formData._product_percentages || {};
        const total = selectedTypes.reduce((sum, t) => sum + (parseFloat(pcts[t]) || 0), 0);
        const allFilled = selectedTypes.every(t => pcts[t] !== undefined && pcts[t] !== '' && pcts[t] !== null);
        if (!allFilled || Math.abs(total - 100) > 0.01) {
          errors['_product_percentages'] = `A soma deve ser 100% (atual: ${total.toFixed(0)}%)`;
        }
      }
    }

    // Validar grupos de percentuais (V1)
    for (const group of PERCENT_GROUPS) {
      if (!stepQuestionIds.has(group.trigger)) continue;
      const vals = group.fields.map(f => parseFloat(formData[f.id]) || 0);
      const anyFilled = group.fields.some(f => formData[f.id] !== undefined && formData[f.id] !== '' && formData[f.id] !== null);
      const total = vals.reduce((a, b) => a + b, 0);
      
      if (group.required && (!anyFilled || Math.abs(total - 100) > 0.01)) {
        errors[group.trigger] = `A soma deve ser 100% (atual: ${total.toFixed(0)}%)`;
      } else if (anyFilled && Math.abs(total - 100) > 0.01) {
        errors[group.trigger] = `Se preenchido, a soma deve ser 100% (atual: ${total.toFixed(0)}%)`;
      }
    }
    
    // Validar grupos de percentuais (V2 dinâmico)
    for (const group of v2PercentGroups) {
      if (!stepQuestionIds.has(group.trigger)) continue;
      const vals = group.fields.map(f => parseFloat(formData[f.id]) || 0);
      const anyFilled = group.fields.some(f => formData[f.id] !== undefined && formData[f.id] !== '' && formData[f.id] !== null);
      const total = vals.reduce((a, b) => a + b, 0);
      
      if (anyFilled && Math.abs(total - 100) > 0.01) {
        errors[group.trigger] = `A soma deve ser 100% (atual: ${total.toFixed(0)}%)`;
      }
    }

    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error('Por favor, corrija os campos destacados em vermelho.');
      // Scroll para o primeiro erro
      setTimeout(() => {
        const firstErrorEl = document.querySelector('[data-field-error="true"]');
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const generateProtocolo = () => {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    return `PAG-QL-${year}-${seq}`;
  };

  const calculateQualityScore = () => {
    // Usar score aprimorado baseado em dados de enriquecimento do CNPJ
    return computeLeadScore(formData, questions, cnpjApiData);
  };

  const handleSubmit = async () => {
    if (!formData.aceite_termos || !formData.aceite_privacidade) {
      toast.error('Você precisa aceitar os termos e a política de privacidade');
      return;
    }

    setIsSubmitting(true);

    const protocolo = generateProtocolo();
    const qualityScore = calculateQualityScore();

    // Buscar Introducer: priorizar onboardingLink, depois utm_source da URL
    let introducerData = {};
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source') || '';
    
    if (onboardingLink?.introducerId) {
      const introducers = await base44.entities.Introducer.filter({ id: onboardingLink.introducerId });
      if (introducers.length > 0) {
        introducerData = {
          introducerId: introducers[0].id,
          introducerReferralCode: introducers[0].referralCode,
          introducerName: introducers[0].name,
        };
      }
    } else if (onboardingLink?.introducerReferralCode) {
      const introducers = await base44.entities.Introducer.filter({ referralCode: onboardingLink.introducerReferralCode, status: 'active' });
      if (introducers.length > 0) {
        introducerData = {
          introducerId: introducers[0].id,
          introducerReferralCode: introducers[0].referralCode,
          introducerName: introducers[0].name,
        };
      }
    } else if (utmSource) {
      const introducers = await base44.entities.Introducer.filter({ referralCode: utmSource, status: 'active' });
      if (introducers.length > 0) {
        introducerData = {
          introducerId: introducers[0].id,
          introducerReferralCode: introducers[0].referralCode,
          introducerName: introducers[0].name,
        };
      }
    }

    // Determinar businessSubCategory a partir da primeira pergunta (order 1)
    let businessSubCategory = 'MERCHAN';
    for (const q of rawQuestions) {
      const text = (q.text || '').toLowerCase();
      if (text.includes('sua empresa é principalmente') || text.includes('o que sua empresa é') || text.includes('tipo de empresa')) {
        const answer = String(formData[q.id] || '').toLowerCase();
        if (answer.includes('gateway')) businessSubCategory = 'GATEWAY';
        else if (answer.includes('marketplace')) businessSubCategory = 'MARKETPLACE';
        else businessSubCategory = 'MERCHAN';
        break;
      }
    }

    // Buscar template de compliance vinculado dinamicamente pela businessSubCategory
    let recommendedComplianceTemplateId = template.linkedComplianceTemplateId || '';
    if (!recommendedComplianceTemplateId || recommendedComplianceTemplateId === 'auto_by_subcategory') {
      const complianceTemplates = await base44.entities.QuestionnaireTemplate.filter({
        category: 'COMPLIANCE',
        subCategory: businessSubCategory,
        isActive: true
      });
      if (complianceTemplates.length > 0) {
        // If the lead was filled via a v2.0 template, prefer v2.0 compliance templates
        const isV2Lead = template.model === 'LeadCompletoAutocomplete';
        const v2Template = complianceTemplates.find(t => t.version === 2.0 || (t.model || '').includes('Autocomplete'));
        const v1Template = complianceTemplates.find(t => t.version !== 2.0 && !(t.model || '').includes('Autocomplete'));
        if (isV2Lead && v2Template) {
          recommendedComplianceTemplateId = v2Template.id;
        } else {
          recommendedComplianceTemplateId = (v1Template || complianceTemplates[0]).id;
        }
      }
    }

    // Encontrar valores relevantes
    const findFieldValue = (keywords) => {
      for (const q of questions) {
        const text = q.text?.toLowerCase() || '';
        if (keywords.some(kw => text.includes(kw)) && formData[q.id]) {
          return formData[q.id];
        }
      }
      return '';
    };

    // Calcular flags silenciosas (NÃO exibidas ao lead)
    const silentFlags = computeSilentFlags(formData, rawQuestions, cnpjApiData);
    
    // Enriquecimento CNPJ completo (para análise interna)
    const cnpjEnrichment = cnpjApiData ? {
      capital_social: cnpjApiData.capital_social,
      idade_empresa_anos: cnpjApiData.idade_empresa_anos,
      situacao_cadastral: cnpjApiData.situacao_cadastral,
      descricao_situacao_cadastral: cnpjApiData.descricao_situacao_cadastral,
      porte: cnpjApiData.porte,
      opcao_pelo_simples: cnpjApiData.opcao_pelo_simples,
      opcao_pelo_mei: cnpjApiData.opcao_pelo_mei,
      cnae_fiscal: cnpjApiData.cnae_fiscal,
      cnae_fiscal_descricao: cnpjApiData.cnae_fiscal_descricao,
      cnaes_secundarios: cnpjApiData.cnaes_secundarios,
      qsa: cnpjApiData.qsa,
      email_receita: cnpjApiData.email,
      telefone_receita: cnpjApiData.telefone,
      endereco: cnpjApiData.endereco,
      situacao_especial: cnpjApiData.situacao_especial,
      setor_regulado: cnpjApiData.setor_regulado,
      anexo_i: cnpjApiData.anexo_i,
      mcc_sugerido: cnpjApiData.mcc_sugerido,
      site_sugerido: cnpjApiData.site_sugerido,
      limites_volume: cnpjApiData.limites_volume,
    } : null;

    const leadData = {
      email: findFieldValue(['e-mail', 'email']) || '',
      fullName: findFieldValue(['razão social', 'razao social']) || findFieldValue(['nome completo']) || '',
      cpfCnpj: findFieldValue(['cnpj', 'cpf']) || '',
      phone: findFieldValue(['celular', 'telefone']) || '',
      companyName: findFieldValue(['fantasia', 'nome fantasia']) || '',
      website: findFieldValue(['site', 'website', 'url']) || '',
      mcc: findFieldValue(['mcc']) || '',
      contactName: findFieldValue(['contato_nome', 'nome do contato', 'nome completo do contato']) || '',
      contactRole: findFieldValue(['cargo']) || '',
      status: 'questionario_preenchido',
      businessSubCategory,
      leadQuestionnaireTemplateId: template.id,
      recommendedComplianceTemplateId,
      tpvMensal: parseFloat(findFieldValue(['tpv']) || '0') || 0,
      ticketMedio: parseFloat(findFieldValue(['ticket']) || '0') || 0,
      transacoesMes: parseFloat(formData[transacoesId] || '0') || 0,
      expectativaCrescimento: findFieldValue(['crescimento']) || '',
      protocolo,
      origemLead: utmSource,
      onboardingLinkCode: linkCode || '',
      questionnaireData: {
        ...formData,
        _silentFlags: silentFlags,
        _cnpjEnrichment: cnpjEnrichment,
        _emailType: (() => {
          const email = findFieldValue(['e-mail', 'email']) || '';
          const freeDomains = ['gmail.com','hotmail.com','outlook.com','yahoo.com','yahoo.com.br'];
          if (email.includes('@')) {
            const domain = email.split('@')[1]?.toLowerCase();
            return freeDomains.includes(domain) ? 'personal' : 'corporate';
          }
          return 'unknown';
        })(),
      },
      ...introducerData,
      expectedRates: (formData[USA_CARTAO_QUESTION_ID] === false || formData[USA_CARTAO_QUESTION_ID] === 'false')
        ? Object.fromEntries(
            EXPECTED_RATE_KEYS.map(k => [k, parseFloat((formData._expectedRates || {})[k]) || 0])
          )
        : undefined,
      priscilaQualityScore: qualityScore,
      priscilaRiskLevel: 'EM_ANALISE',
      lastInteractionDate: new Date().toISOString()
    };

    const lead = await base44.entities.Lead.create(leadData);

    // Registrar atividade
    await base44.entities.LeadActivity.create({
      leadId: lead.id,
      activityType: 'questionario_preenchido',
      description: `Questionário de leads preenchido via link ${linkCode || 'direto'}. Protocolo: ${protocolo}`,
      performedBy: leadData.email || 'cliente',
      activityDate: new Date().toISOString()
    });

    // Limpar localStorage
    localStorage.removeItem(STORAGE_KEY);

    setIsSubmitting(false);
    onSubmit({ ...leadData, id: lead.id });
  };

  const isBusinessTypeQuestion = (question) => {
    const text = (question.text || '').toLowerCase();
    const opts = (question.options || []).map(o => o.toLowerCase()).join(' ');
    const combined = text + ' ' + opts;
    return (combined.includes('merchant') || combined.includes('merchan')) &&
           (combined.includes('gateway') || combined.includes('marketplace'));
  };

  const isMCCQuestion = (question) => {
    const text = (question.text || '').toLowerCase();
    return text.includes('mcc') && !isBusinessTypeQuestion(question);
  };

  const renderQuestionDefault = (question) => {
    const rawValue = formData[question.id];
    const value = rawValue !== undefined && rawValue !== null ? rawValue : '';
    const fieldError = validationErrors[question.id];
    const hasError = !!fieldError;
    const errorBorderClass = hasError ? 'border-red-400 ring-1 ring-red-300' : '';

    return (
      <div key={question.id} className="space-y-2" data-field-error={hasError ? "true" : undefined}>
        <Label className="text-sm font-semibold text-[var(--pagsmile-blue)]">
          {question.text}
          {question.type !== 'FILE_UPLOAD' && <span className="text-red-500 ml-1">*</span>}
          {question.type === 'FILE_UPLOAD' && question.isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {isBusinessTypeQuestion(question) && currentStep === 0 && <BusinessTypeExplainer />}
        {isBusinessTypeQuestion(question) && isV2Template && cnpjApiData && (
          <CnaeCoherenceAlert cnpjData={cnpjApiData} selectedType={value} />
        )}
        {question.helpText && (
          <p className="text-xs text-[var(--pagsmile-blue)]/60 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            {question.helpText}
          </p>
        )}

        {question.type === 'TEXT' && (
          <>
            {(question.id === DESCRIPTION_QUESTION_ID || (question.validationRules?.minLength >= 50 && (question.text || '').toLowerCase().includes('descrev'))) ? (
              <div className="space-y-2">
                <Textarea
                  value={value}
                  onChange={(e) => updateField(question.id, e.target.value)}
                  placeholder={question.placeholder || ''}
                  className={`min-h-[120px] rounded-xl resize-none ${errorBorderClass}`}
                  maxLength={500}
                />
                <div className="flex justify-between items-center text-xs">
                  {(() => {
                    const minLen = question.validationRules?.minLength || 75;
                    return (
                      <span className={`${String(value).length < minLen ? 'text-amber-600' : 'text-[var(--pagsmile-green)]'}`}>
                        {String(value).length < minLen 
                          ? `Faltam ${minLen - String(value).length} caracteres (mínimo ${minLen})` 
                          : '✓ Mínimo atingido'}
                      </span>
                    );
                  })()}
                  <span className="text-[var(--pagsmile-blue)]/50">
                    {String(value).length}/500
                  </span>
                </div>
                <FormFieldError error={fieldError} />
              </div>
            ) : (
              <>
                <Input
                  value={value}
                  onChange={(e) => updateField(question.id, e.target.value)}
                  placeholder={question.placeholder || ''}
                  className={`h-12 rounded-xl ${errorBorderClass}`}
                />
                {/* Validação de site em background (V2) */}
                {isV2Template && (question.text || '').toLowerCase().includes('site') && value && value.length > 5 && (
                  <SiteValidationBadge siteUrl={value} updateField={updateField} />
                )}
                <FormFieldError error={fieldError} />
              </>
            )}
          </>
        )}

        {question.type === 'NUMBER' && (() => {
          const qText = (question.text || '').toLowerCase();
          const isPercent = qText.includes('(%)') || qText.includes('% ');
          const isCurrency = qText.includes('(r$)') || qText.includes('r$') || MONETARY_QUESTION_IDS.includes(question.id) || qText.includes('tpv') || qText.includes('ticket médio') || qText.includes('faturamento');
          
          if (isCurrency) {
            return (
              <>
                <CurrencyInput
                  value={value}
                  onChange={(val) => updateField(question.id, val)}
                  placeholder={question.placeholder || '0,00'}
                  hasError={hasError}
                />
                <FormFieldError error={fieldError} />
              </>
            );
          }
          
          const prefix = isPercent ? '%' : null;
          return (
            <>
              <div className="relative">
                {prefix && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--pagsmile-blue)]/60 font-semibold text-sm">
                    {prefix}
                  </span>
                )}
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={value}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || parseFloat(val) >= 0) {
                      updateField(question.id, val);
                    }
                  }}
                  placeholder={question.placeholder || ''}
                  className={`h-12 rounded-xl ${isPercent ? 'pr-10' : ''} ${errorBorderClass}`}
                />
              </div>
              <FormFieldError error={fieldError} />
            </>
          );
        })()}

        {question.type === 'EMAIL' && (
          <>
            <EmailInput
              value={value}
              onChange={(val) => updateField(question.id, val)}
              placeholder={question.placeholder || 'email@empresa.com'}
              hasError={hasError}
              questionId={question.id}
              onSiteSuggestion={(suggestedSite) => {
                // Sugerir site baseado no domínio do e-mail (P5)
                if (isV2Template) {
                  const siteQ = questions.find(q => (q.text || '').toLowerCase().includes('site da empresa'));
                  if (siteQ && !formData[siteQ.id]) {
                    updateField(siteQ.id, suggestedSite);
                  }
                }
              }}
            />
            <FormFieldError error={fieldError} />
          </>
        )}

        {question.type === 'PHONE' && (
          <>
            <PhoneInput
              value={value}
              onChange={(val) => updateField(question.id, val)}
              placeholder={question.placeholder || '(11) 99999-9999'}
              hasError={hasError}
            />
            <FormFieldError error={fieldError} />
          </>
        )}

        {question.type === 'CPF_CNPJ' && !isLeadCnpjTrigger(question) && (
          <>
            <Input
              value={value}
              onChange={(e) => updateField(question.id, e.target.value)}
              placeholder={question.placeholder || 'Digite o CPF ou CNPJ'}
              className={`h-12 rounded-xl ${errorBorderClass}`}
            />
            <FormFieldError error={fieldError} />
          </>
        )}

        {question.type === 'DATE' && (
          <>
            <Input
              type="date"
              value={value}
              onChange={(e) => updateField(question.id, e.target.value)}
              className={`h-12 rounded-xl ${errorBorderClass}`}
            />
            <FormFieldError error={fieldError} />
          </>
        )}

        {isMCCQuestion(question) ? (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/40" />
                <Input
                  value={value}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    updateField(question.id, val);
                  }}
                  placeholder="Digite o código MCC (4 dígitos)"
                  className={`h-12 rounded-xl pl-11 font-mono text-lg tracking-wider ${errorBorderClass}`}
                  maxLength={4}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMccQuestionId(question.id);
                  setMccModalOpen(true);
                }}
                className="h-12 px-5 rounded-xl shrink-0"
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar MCC
              </Button>
            </div>
            {value && value.length === 4 && <MCCNameDisplay mccCode={value} />}
            <FormFieldError error={fieldError} />
          </div>
        ) : null}

        {!isMCCQuestion(question) && question.type === 'SELECT' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(question.options || []).map((opt, i) => {
                const isSelected = value === opt;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => updateField(question.id, opt)}
                    className={`relative p-4 text-left rounded-2xl border transition-all duration-200 flex items-start gap-3 ${
                      isSelected 
                        ? 'border-[#2bc196] bg-[#2bc196]/5 shadow-sm ring-1 ring-[#2bc196]' 
                        : 'border-slate-200 bg-white hover:border-[#2bc196]/30 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected ? 'border-[#2bc196] bg-[#2bc196]' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={`font-medium text-sm leading-tight ${isSelected ? 'text-[#002443]' : 'text-[#002443]/70'}`}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {/* Campo de descrição para "Outros" */}
            {QUESTIONS_WITH_OTHER_DESCRIPTION.includes(question.id) && needsOtherDescription(question.id, value) && (
              <div className={`mt-4 p-4 bg-slate-50 rounded-xl border ${validationErrors[`${question.id}_outro`] ? 'border-red-300' : 'border-slate-200'}`}>
                <Label className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-2 block">
                  Descreva o que seria "Outros" <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={formData[`${question.id}_outro_descricao`] || ''}
                  onChange={(e) => updateField(`${question.id}_outro_descricao`, e.target.value)}
                  placeholder="Especifique detalhadamente..."
                  className={`min-h-[80px] rounded-xl resize-none ${validationErrors[`${question.id}_outro`] ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                />
                <FormFieldError error={validationErrors[`${question.id}_outro`]} />
              </div>
            )}
            <FormFieldError error={fieldError} />
          </div>
        )}

        {question.type === 'MULTI_SELECT' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(question.options || []).map((opt, i) => {
                const selected = Array.isArray(value) ? value.includes(opt) : false;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const current = Array.isArray(value) ? value : [];
                      const updated = selected
                        ? current.filter(v => v !== opt)
                        : [...current, opt];
                      updateField(question.id, updated);
                    }}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                      selected
                        ? 'bg-[#2bc196] text-white border-[#2bc196] shadow-sm scale-[1.02]'
                        : 'bg-white text-[#002443]/70 border-slate-200 hover:border-[#2bc196]/50 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            
            {/* Campo de descrição para "Outros" */}
            {QUESTIONS_WITH_OTHER_DESCRIPTION.includes(question.id) && needsOtherDescription(question.id, value) && (
              <div className={`mt-4 p-4 bg-slate-50 rounded-xl border ${validationErrors[`${question.id}_outro`] ? 'border-red-300' : 'border-slate-200'}`}>
                <Label className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-2 block">
                  Descreva o que seria "Outros" <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={formData[`${question.id}_outro_descricao`] || ''}
                  onChange={(e) => updateField(`${question.id}_outro_descricao`, e.target.value)}
                  placeholder="Especifique detalhadamente..."
                  className={`min-h-[80px] rounded-xl resize-none ${validationErrors[`${question.id}_outro`] ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                />
                <FormFieldError error={validationErrors[`${question.id}_outro`]} />
              </div>
            )}
            <FormFieldError error={fieldError} />
          </div>
        )}

        {question.type === 'FILE_UPLOAD' && (
          <div className="space-y-2">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-[#2bc196]/50 transition-colors">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                id={`file-${question.id}`}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  toast.info('Enviando arquivo...');
                  const { file_url } = await base44.integrations.Core.UploadFile({ file });
                  updateField(question.id, file_url);
                  toast.success('Arquivo enviado com sucesso!');
                }}
              />
              {formData[question.id] ? (
                <div className="space-y-2">
                  <CheckCircle className="w-8 h-8 text-[var(--pagsmile-green)] mx-auto" />
                  <p className="text-sm font-medium text-[var(--pagsmile-green)]">Arquivo enviado</p>
                  <div className="flex gap-2 justify-center">
                    <a href={formData[question.id]} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--pagsmile-green)] underline">Ver arquivo</a>
                    <button type="button" onClick={() => updateField(question.id, '')} className="text-xs text-red-500 underline">Remover</button>
                  </div>
                </div>
              ) : (
                <label htmlFor={`file-${question.id}`} className="cursor-pointer space-y-2">
                  <FileText className="w-8 h-8 text-[var(--pagsmile-blue)]/30 mx-auto" />
                  <p className="text-sm font-medium text-[var(--pagsmile-blue)]/70">Clique para enviar arquivo</p>
                  <p className="text-xs text-[var(--pagsmile-blue)]/40">PDF, PNG, JPG (máx. 10MB)</p>
                </label>
              )}
            </div>
          </div>
        )}

        {question.type === 'BOOLEAN' && (
          <>
            <div className={`flex bg-slate-100 p-1.5 rounded-xl w-full sm:w-72 relative shadow-inner ${hasError ? 'ring-1 ring-red-300' : ''}`}>
              <button
                type="button"
                onClick={() => updateField(question.id, true)}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all z-10 ${
                  value === true ? 'text-white' : 'text-[#002443]/50 hover:text-[#002443]'
                }`}
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => updateField(question.id, false)}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all z-10 ${
                  value === false ? 'text-white' : 'text-[#002443]/50 hover:text-[#002443]'
                }`}
              >
                Não
              </button>
              {/* Fundo animado (Pílula) */}
              <div 
                className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#2bc196] rounded-lg transition-all duration-300 ease-in-out shadow-sm"
                style={{
                  left: value === true ? '6px' : value === false ? 'calc(50% + 0px)' : '6px',
                  opacity: value === '' || value === undefined ? 0 : 1
                }}
              />
            </div>
            <FormFieldError error={fieldError} />
          </>
        )}
      </div>
    );
  };

  const renderQuestion = (question) => {
    if (!shouldShowQuestion(question)) return null;

    // CNPJ autocomplete field for v2.0 Lead templates
    if (isV2Template && isLeadCnpjTrigger(question)) {
      return (
        <LeadCnpjAutocompleteField
          key={question.id}
          value={formData[question.id] || ''}
          onChange={(qId, val) => updateField(qId, val)}
          questionId={question.id}
          questions={questions}
          formData={formData}
          updateField={updateField}
          error={validationErrors[question.id]}
          onCnpjDataLoaded={(data) => setCnpjApiData(data)}
        />
      );
    }

    // Após a pergunta principal de tipos de produto, renderizar os percentuais
    if (question.id === PRODUCT_TYPE_QUESTION_ID) {
      return (
        <React.Fragment key={`${question.id}-with-pct`}>
          {renderQuestionDefault(question)}
          <ProductTypePercentages formData={formData} updateField={updateField} error={validationErrors['_product_percentages']} />
        </React.Fragment>
      );
    }

    // Expectativa de taxas — renderizar quando NÃO opera com cartão
    if (question.id === USA_CARTAO_QUESTION_ID) {
      const usaCartaoVal = formData[USA_CARTAO_QUESTION_ID];
      const naoOpera = usaCartaoVal === false || usaCartaoVal === 'false';
      return (
        <React.Fragment key={`${question.id}-wrapper`}>
          {renderQuestionDefault(question)}
          {naoOpera && (
            <ExpectedRatesInput
              formData={formData}
              updateField={updateField}
              error={validationErrors['_expectedRates']}
            />
          )}
        </React.Fragment>
      );
    }

    // Taxas de cartão por bandeira — renderizar como grupo via CardRatesGroup
    if (question.id === CARD_RATE_TRIGGER_ID) {
      const usaCartao = formData[USA_CARTAO_QUESTION_ID];
      if (usaCartao === true || usaCartao === 'true') {
        return (
          <CardRatesGroup
            key="card-rates-group"
            questions={cardRateQuestions}
            formData={formData}
            updateField={updateField}
          />
        );
      }
      return null;
    }
    if (CARD_RATE_QUESTION_IDS.includes(question.id)) {
      return null;
    }
    
    // Se a pergunta é parte de um grupo de percentuais V1, não renderizar individualmente
    if (GROUPED_PERCENT_IDS.includes(question.id)) {
      const group = PERCENT_GROUPS.find(g => g.trigger === question.id);
      if (group) {
        return (
          <PercentDistributionRow
            key={question.id}
            title={group.title}
            fields={group.fields}
            formData={formData}
            updateField={updateField}
            required={group.required}
            error={validationErrors[group.trigger]}
          />
        );
      }
      return null;
    }
    
    // V2: Grupos de percentuais dinâmicos
    if (v2GroupedIds.includes(question.id)) {
      const group = v2PercentGroups.find(g => g.trigger === question.id);
      if (group) {
        return (
          <PercentDistributionRow
            key={question.id}
            title={group.title}
            fields={group.fields}
            formData={formData}
            updateField={updateField}
            required={group.required}
            error={validationErrors[group.trigger]}
          />
        );
      }
      return null;
    }
    
    // V2: Card rates group (MDR por bandeira) — renderizar como CardRatesGroup
    if (v2CardRateIds.includes(question.id)) {
      if (question.id === v2CardRateTrigger) {
        // Verificar se processa cartão
        if (v2ProcCartaoQ) {
          const procCartao = formData[v2ProcCartaoQ.id];
          if (procCartao !== true && procCartao !== 'true') return null;
        }
        return (
          <CardRatesGroup
            key="v2-card-rates-group"
            questions={v2CardRates}
            formData={formData}
            updateField={updateField}
          />
        );
      }
      return null;
    }

    return renderQuestionDefault(question);
  };

  const handleGoToStep = (stepIdx) => {
    setCurrentStep(stepIdx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isLastStep = currentStep === totalSteps - 1;
  const isConfirmationStep = currentStep >= steps.length;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png" 
          alt="Pagsmile" 
          className="h-8 mx-auto mb-6"
        />
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--pagsmile-blue)]">
          {template.name || 'Questionário Comercial'}
        </h1>
        <p className="text-[var(--pagsmile-blue)]/70 mt-2">
          {template.description || 'Preencha os dados abaixo para iniciar seu cadastro'}
        </p>
        <div className="mt-3 flex justify-center">
          <AutoSaveIndicator lastSaved={lastSaved} />
        </div>
      </div>

      {/* Step Navigation */}
      <LeadStepNavigation 
        currentStep={currentStep} 
        totalSteps={totalSteps}
        steps={steps}
        questions={questions}
      />

      {/* Formulário */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm mt-6">
        {isConfirmationStep ? (
          <ConfirmationReview
            questions={questions}
            formData={formData}
            steps={steps}
            onGoToStep={handleGoToStep}
            updateField={updateField}
            shouldShowQuestion={shouldShowQuestion}
          />
        ) : (
          <div className="space-y-6">
            {steps[currentStep]?.map(q => {
              const rendered = renderQuestion(q);
              
              // Após o Ticket Médio, mostrar o campo calculado de transações
              // Também detectar campos TPV/Ticket do template v2 pelo texto
              const isTicketMedioQ = q.id === TICKET_MEDIO_QUESTION_ID || (q.type === 'NUMBER' && (q.text || '').toLowerCase().includes('ticket'));
              const tpvQ = steps[currentStep]?.find(sq => sq.id === TPV_QUESTION_ID || (sq.type === 'NUMBER' && (sq.text || '').toLowerCase().includes('tpv')));
              const ticketQ = steps[currentStep]?.find(sq => sq.id === TICKET_MEDIO_QUESTION_ID || (sq.type === 'NUMBER' && (sq.text || '').toLowerCase().includes('ticket')));
              
              if (isTicketMedioQ && tpvQ && ticketQ) {
                const tpv = parseFloat(formData[tpvQ.id]) || 0;
                const ticketMedio = parseFloat(formData[ticketQ.id]) || 0;
                const transacoes = tpv > 0 && ticketMedio > 0 ? Math.round(tpv / ticketMedio) : 0;
                
                return (
                  <React.Fragment key={q.id}>
                    {rendered}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-[var(--pagsmile-blue)]">
                        Estimativa de transações por mês
                        <span className="text-xs font-normal text-[var(--pagsmile-blue)]/50 ml-2">(calculado automaticamente: TPV ÷ Ticket Médio)</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={transacoes || ''}
                          readOnly
                          className="h-12 rounded-xl bg-slate-50 cursor-not-allowed"
                          placeholder="Preencha TPV e Ticket Médio acima"
                        />
                      </div>
                      {transacoes > 0 && (
                        <p className="text-xs text-[var(--pagsmile-green)] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          ≈ {transacoes.toLocaleString('pt-BR')} transações/mês
                        </p>
                      )}
                    </div>
                  </React.Fragment>
                );
              }
              
              return rendered;
            })}
          </div>
        )}

        {/* Botões de Navegação */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="text-[var(--pagsmile-blue)]/70"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white px-8 h-12 rounded-xl shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  Enviar Questionário
                  <ShieldCheck className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-[var(--pagsmile-blue)] hover:bg-[var(--pagsmile-blue)]/90 text-white px-8 h-12 rounded-xl"
            >
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Segurança */}
      <div className="text-center mt-6">
        <p className="text-xs text-[var(--pagsmile-blue)]/40 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Seus dados estão protegidos e serão tratados com confidencialidade.
        </p>
      </div>

      {/* Modal de busca MCC */}
      <MCCSearchModal
        isOpen={mccModalOpen}
        onClose={() => setMccModalOpen(false)}
        onSelect={(mccCode) => {
          if (mccQuestionId) {
            updateField(mccQuestionId, mccCode);
          }
        }}
      />
    </div>
  );
}