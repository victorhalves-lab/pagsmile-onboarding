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
  Globe, AlertTriangle, MessageSquare, ShieldCheck
} from 'lucide-react';
import StepNavigation from './StepNavigation';
import DynamicQuestionRenderer from './DynamicQuestionRenderer';
import { useOnboardingAnalytics } from '../analytics/useOnboardingAnalytics';

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

// Agrupa perguntas em steps lógicos
function groupQuestionsIntoSteps(questions, questionsPerStep = 4) {
  const steps = [];
  let currentStep = [];
  let currentStepTitle = '';

  questions.forEach((q, index) => {
    if (currentStep.length === 0) {
      currentStepTitle = q.text.split(' ').slice(0, 2).join(' ');
    }
    
    currentStep.push(q);
    
    if (currentStep.length >= questionsPerStep || index === questions.length - 1) {
      const Icon = getIconForQuestion(currentStep[0].text);
      steps.push({
        id: `step_${steps.length + 1}`,
        title: currentStepTitle,
        icon: Icon,
        questions: [...currentStep]
      });
      currentStep = [];
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

  const linkCode = localStorage.getItem('onboarding_link_code');

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

  // Agrupar perguntas em steps
  const steps = groupQuestionsIntoSteps(questions, questionsPerStep);

  const { trackPageComplete } = useOnboardingAnalytics({
    pageName: `Compliance${templateModel?.charAt(0).toUpperCase()}${templateModel?.slice(1)}`,
    stepNumber: currentStep,
    totalSteps: steps.length,
    flowType: flowType || templateModel,
    linkCode
  });

  // Carregar dados salvos
  useEffect(() => {
    if (storageKey) {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
    }
  }, [storageKey]);

  // Salvar dados
  useEffect(() => {
    if (storageKey && Object.keys(formData).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    }
  }, [formData, storageKey]);

  const handleFieldChange = (questionId, value) => {
    setFormData(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      trackPageComplete({ stepNumber: currentStep });
      setCurrentStep(currentStep + 1);
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
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    }
    if (template?.id) {
      localStorage.setItem('current_template_id', template.id);
    }
    if (onComplete) {
      onComplete({ formData, template, questions });
    } else {
      navigate(createPageUrl(documentUploadPage));
    }
  };

  if (loadingTemplate || loadingQuestions) {
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
    <div className="flex gap-8 items-start">
      {/* Sidebar de Navegação */}
      <div className="hidden lg:block w-72 sticky top-24 space-y-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${badgeColor}`}>
              {badgeLabel || templateModel?.toUpperCase()}
            </div>
            <h3 className="font-bold text-[var(--pagsmile-blue)] text-sm">
              {template.name}
            </h3>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-[var(--pagsmile-green)] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Passo {currentStep} de {steps.length}
          </p>
        </div>

        <StepNavigation
          steps={steps.map((s, i) => ({
            id: s.id,
            title: `${i + 1}. ${s.title}`,
            icon: s.icon
          }))}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
          className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100"
        />
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 min-w-0">
        {/* Mobile Progress */}
        <div className="lg:hidden mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${badgeColor}`}>
              {badgeLabel || templateModel?.toUpperCase()}
            </div>
            <span className="text-sm text-[var(--pagsmile-blue)]/70">
              Passo {currentStep} de {steps.length}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--pagsmile-green)] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 modern-shadow">
          {/* Título do Step */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#002443] flex items-center gap-3">
              {currentStepData.icon && <currentStepData.icon className="w-6 h-6 text-[var(--pagsmile-green)]" />}
              {currentStepData.title}
            </h2>
          </div>

          {/* Perguntas do Step */}
          <DynamicQuestionRenderer
            questions={currentStepData.questions}
            formData={formData}
            onFieldChange={handleFieldChange}
            showTitle={false}
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
    </div>
  );
}