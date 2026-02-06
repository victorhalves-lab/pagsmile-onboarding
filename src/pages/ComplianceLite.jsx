import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { 
  Building2, Briefcase, Users, ShieldAlert, FileCheck, CheckCircle 
} from 'lucide-react';

import ProgressBar from '../components/compliance/ProgressBar';
import StepNavigation from '../components/compliance/StepNavigation';
import { useOnboardingAnalytics } from '../components/analytics/useOnboardingAnalytics';

import StepL1Identificacao from '../components/compliance/steps/lite/StepL1Identificacao';
import StepL2ModeloNegocio from '../components/compliance/steps/lite/StepL2ModeloNegocio';
import StepL3EstruturaSocietaria from '../components/compliance/steps/lite/StepL3EstruturaSocietaria';
import StepL4ComplianceRisco from '../components/compliance/steps/lite/StepL4ComplianceRisco';
import StepL5Declaracoes from '../components/compliance/steps/lite/StepL5Declaracoes';

const STEPS = [
  { id: 'identificacao', title: 'Identificação', icon: Building2 },
  { id: 'modelo_negocio', title: 'Modelo de Negócio', icon: Briefcase },
  { id: 'estrutura', title: 'Estrutura Societária', icon: Users },
  { id: 'compliance', title: 'Compliance', icon: ShieldAlert },
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
      case 1: return <StepL1Identificacao {...props} />;
      case 2: return <StepL2ModeloNegocio {...props} />;
      case 3: return <StepL3EstruturaSocietaria {...props} />;
      case 4: return <StepL4ComplianceRisco {...props} />;
      case 5: return <StepL5Declaracoes {...props} />;
      default: return null;
    }
  };

  // Validação básica por step
  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return formData.cnpj && formData.razaoSocial && formData.enderecoComercial && formData.descricaoNegocio;
      case 2:
        return formData.modeloNegocio && formData.canalVenda && 
               formData.entregaProdutoFisico !== undefined && 
               formData.entregaDigitalServico !== undefined;
      case 3:
        return formData.tipoEmpresa && formData.representanteLegalNome && 
               formData.representanteLegalCPF && formData.representanteLegalEmail &&
               formData.existeUBO !== undefined;
      case 4:
        return formData.atividadeIlegal !== undefined && formData.exigeLicenca !== undefined &&
               formData.socioPEP !== undefined && formData.socioSancionado !== undefined &&
               formData.atuaCripto !== undefined && formData.atuaJogos !== undefined &&
               formData.encerramentoConta !== undefined && formData.operacaoExterior !== undefined;
      case 5:
        return formData.declaracaoVeracidade && formData.declaracaoAutorizacao && formData.declaracaoLegalidade;
      default:
        return true;
    }
  };

  const isLastStep = currentStep === STEPS.length;
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="flex gap-8 items-start">
      {/* Sidebar de Navegação */}
      <div className="hidden lg:block w-80 sticky top-24 space-y-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="px-2 py-1 rounded-lg bg-teal-100 text-teal-700 text-xs font-semibold">
              LITE
            </div>
            <h3 className="font-bold text-[var(--pagsmile-blue)]">Perfil Simplificado</h3>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-[var(--pagsmile-green)] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-slate-500">
            Passo {currentStep} de {STEPS.length}: <span className="text-[var(--pagsmile-green)] font-medium">{STEPS[currentStep-1].title}</span>
          </p>
        </div>

        <StepNavigation
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
        />

        {/* Info Box */}
        <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
          <p className="text-sm text-teal-800 font-medium mb-2">Questionário Simplificado</p>
          <p className="text-xs text-teal-700">
            Este questionário foi otimizado para pequenas e médias empresas. 
            O preenchimento leva aproximadamente 5 minutos.
          </p>
        </div>
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

        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100 modern-shadow">
          {renderStep()}

          {/* Botões de Ação */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-100">
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
              disabled={!canContinue()}
              className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white px-8 h-12 rounded-xl shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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