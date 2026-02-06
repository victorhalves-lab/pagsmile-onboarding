import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { 
  Building2, MapPin, FileText, Briefcase, Package, Users, UserCircle,
  ShieldAlert, UserX, AlertTriangle, Globe, FileCheck
} from 'lucide-react';

import StepNavigation from '../components/compliance/StepNavigation';
import { useOnboardingAnalytics } from '../components/analytics/useOnboardingAnalytics';

import StepL1aIdentificacao from '../components/compliance/steps/lite/StepL1aIdentificacao';
import StepL1bEndereco from '../components/compliance/steps/lite/StepL1bEndereco';
import StepL1cDescricao from '../components/compliance/steps/lite/StepL1cDescricao';
import StepL2aModelo from '../components/compliance/steps/lite/StepL2aModelo';
import StepL2bEntrega from '../components/compliance/steps/lite/StepL2bEntrega';
import StepL3aEstrutura from '../components/compliance/steps/lite/StepL3aEstrutura';
import StepL3bUBO from '../components/compliance/steps/lite/StepL3bUBO';
import StepL4aAtividade from '../components/compliance/steps/lite/StepL4aAtividade';
import StepL4bPEP from '../components/compliance/steps/lite/StepL4bPEP';
import StepL4cRiscos from '../components/compliance/steps/lite/StepL4cRiscos';
import StepL4dExterior from '../components/compliance/steps/lite/StepL4dExterior';
import StepL5aDeclaracoes from '../components/compliance/steps/lite/StepL5aDeclaracoes';

const STEPS = [
  { id: 'identificacao', title: 'Identificação', icon: Building2 },
  { id: 'endereco', title: 'Endereço', icon: MapPin },
  { id: 'descricao', title: 'Sobre o Negócio', icon: FileText },
  { id: 'modelo', title: 'Modelo de Negócio', icon: Briefcase },
  { id: 'entrega', title: 'Entrega', icon: Package },
  { id: 'estrutura', title: 'Estrutura', icon: Users },
  { id: 'ubo', title: 'Beneficiário Final', icon: UserCircle },
  { id: 'atividade', title: 'Atividade', icon: ShieldAlert },
  { id: 'pep', title: 'PEP e Sanções', icon: UserX },
  { id: 'riscos', title: 'Riscos', icon: AlertTriangle },
  { id: 'exterior', title: 'Internacional', icon: Globe },
  { id: 'declaracoes', title: 'Declarações', icon: FileCheck }
];

export default function ComplianceLite() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});

  const linkCode = localStorage.getItem('onboarding_link_code');
  
  const { trackPageComplete } = useOnboardingAnalytics({
    pageName: 'ComplianceLite',
    stepNumber: currentStep,
    totalSteps: STEPS.length,
    flowType: 'lite',
    linkCode
  });

  useEffect(() => {
    const savedData = localStorage.getItem('compliance_data_lite');
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('compliance_data_lite', JSON.stringify(formData));
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
    localStorage.setItem('compliance_data_lite', JSON.stringify(formData));
    navigate(createPageUrl('DocumentUploadLite'));
  };

  const renderStep = () => {
    const props = { formData, handleChange };
    
    switch (currentStep) {
      case 1: return <StepL1aIdentificacao {...props} />;
      case 2: return <StepL1bEndereco {...props} />;
      case 3: return <StepL1cDescricao {...props} />;
      case 4: return <StepL2aModelo {...props} />;
      case 5: return <StepL2bEntrega {...props} />;
      case 6: return <StepL3aEstrutura {...props} />;
      case 7: return <StepL3bUBO {...props} />;
      case 8: return <StepL4aAtividade {...props} />;
      case 9: return <StepL4bPEP {...props} />;
      case 10: return <StepL4cRiscos {...props} />;
      case 11: return <StepL4dExterior {...props} />;
      case 12: return <StepL5aDeclaracoes {...props} />;
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
            <div className="px-2 py-1 rounded-lg bg-teal-100 text-teal-700 text-xs font-semibold">
              LITE
            </div>
            <h3 className="font-bold text-[var(--pagsmile-blue)] text-sm">Perfil Simplificado</h3>
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
            <div className="px-2 py-1 rounded-lg bg-teal-100 text-teal-700 text-xs font-semibold">
              LITE
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