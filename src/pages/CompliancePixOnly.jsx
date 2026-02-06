import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { 
  Building2, FileText, MapPin, Briefcase, TrendingUp, Users, 
  UserCircle, MessageSquare, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle 
} from 'lucide-react';

import StepNavigation from '../components/compliance/StepNavigation';
import { useOnboardingAnalytics } from '../components/analytics/useOnboardingAnalytics';

import StepP1Identificacao from '../components/compliance/steps/pix/StepP1Identificacao';
import StepP2RazaoSocial from '../components/compliance/steps/pix/StepP2RazaoSocial';
import StepP3TipoEmpresa from '../components/compliance/steps/pix/StepP3TipoEmpresa';
import StepP4Endereco from '../components/compliance/steps/pix/StepP4Endereco';
import StepP5Atividade from '../components/compliance/steps/pix/StepP5Atividade';
import StepP6Volume from '../components/compliance/steps/pix/StepP6Volume';
import StepP7Clientes from '../components/compliance/steps/pix/StepP7Clientes';
import StepP8Responsavel from '../components/compliance/steps/pix/StepP8Responsavel';
import StepP9SAC from '../components/compliance/steps/pix/StepP9SAC';
import StepP10Compliance from '../components/compliance/steps/pix/StepP10Compliance';
import StepP11PLDSancoes from '../components/compliance/steps/pix/StepP11PLDSancoes';
import StepP12PLDRiscos from '../components/compliance/steps/pix/StepP12PLDRiscos';
import StepP13Confirmacao from '../components/compliance/steps/pix/StepP13Confirmacao';

const STEPS = [
  { id: 'identificacao', title: 'Identificação', icon: Building2 },
  { id: 'razao_social', title: 'Razão Social', icon: FileText },
  { id: 'tipo_empresa', title: 'Tipo Empresa', icon: FileText },
  { id: 'endereco', title: 'Endereço', icon: MapPin },
  { id: 'atividade', title: 'Atividade', icon: Briefcase },
  { id: 'volume', title: 'Volume', icon: TrendingUp },
  { id: 'clientes', title: 'Clientes', icon: Users },
  { id: 'responsavel', title: 'Responsável', icon: UserCircle },
  { id: 'sac', title: 'SAC', icon: MessageSquare },
  { id: 'compliance', title: 'Compliance', icon: ShieldCheck },
  { id: 'pld_sancoes', title: 'Sanções', icon: ShieldAlert },
  { id: 'pld_riscos', title: 'Riscos', icon: AlertTriangle },
  { id: 'confirmacao', title: 'Confirmação', icon: CheckCircle }
];

export default function CompliancePixOnly() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});

  const linkCode = localStorage.getItem('onboarding_link_code');
  
  const { trackPageComplete } = useOnboardingAnalytics({
    pageName: 'CompliancePixOnly',
    stepNumber: currentStep,
    totalSteps: STEPS.length,
    flowType: 'pix_only',
    linkCode
  });

  useEffect(() => {
    const savedData = localStorage.getItem('compliance_data_pix');
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('compliance_data_pix', JSON.stringify(formData));
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
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
    localStorage.setItem('compliance_data_pix', JSON.stringify(formData));
    navigate(createPageUrl('DocumentUploadPix'));
  };

  const renderStep = () => {
    const props = { formData, handleChange };
    
    switch (currentStep) {
      case 1: return <StepP1Identificacao {...props} />;
      case 2: return <StepP2RazaoSocial {...props} />;
      case 3: return <StepP3TipoEmpresa {...props} />;
      case 4: return <StepP4Endereco {...props} />;
      case 5: return <StepP5Atividade {...props} />;
      case 6: return <StepP6Volume {...props} />;
      case 7: return <StepP7Clientes {...props} />;
      case 8: return <StepP8Responsavel {...props} />;
      case 9: return <StepP9SAC {...props} />;
      case 10: return <StepP10Compliance {...props} />;
      case 11: return <StepP11PLDSancoes {...props} />;
      case 12: return <StepP12PLDRiscos {...props} />;
      case 13: return <StepP13Confirmacao {...props} />;
      default: return null;
    }
  };

  const isLastStep = currentStep === STEPS.length;
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="flex gap-8 items-start">
      {/* Sidebar de Navegação */}
      <div className="hidden lg:block w-72 sticky top-24 space-y-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold">
              PIX
            </div>
            <h3 className="font-bold text-[var(--pagsmile-blue)] text-sm">Somente Pix</h3>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-[var(--pagsmile-green)] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Passo {currentStep} de {STEPS.length}
          </p>
        </div>

        <StepNavigation
          steps={STEPS}
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
            <div className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold">
              PIX
            </div>
            <span className="text-sm text-[var(--pagsmile-blue)]/70">
              Passo {currentStep} de {STEPS.length}
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
          {renderStep()}

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
                  Concluir
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