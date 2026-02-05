import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { 
  Building2, FileText, MapPin, Briefcase, TrendingUp, 
  Users, UserCircle, ShieldAlert, AlertTriangle, ShieldCheck, CheckCircle 
} from 'lucide-react';

import ProgressBar from '../components/compliance/ProgressBar';
import StepNavigation from '../components/compliance/StepNavigation';
import { useOnboardingAnalytics } from '../components/analytics/useOnboardingAnalytics';

import Step1Identificacao from '../components/compliance/steps/Step1Identificacao';
import Step2TipoEmpresa from '../components/compliance/steps/Step2TipoEmpresa';
import Step3Endereco from '../components/compliance/steps/Step3Endereco';
import Step4Atividade from '../components/compliance/steps/Step4Atividade';
import Step5Volumetria from '../components/compliance/steps/Step5Volumetria';
import Step6PerfilClientes from '../components/compliance/steps/Step6PerfilClientes';
import Step7Responsaveis from '../components/compliance/steps/Step7Responsaveis';
import Step8PLDSancoes from '../components/compliance/steps/Step8PLDSancoes';
import Step9PLDRiscos from '../components/compliance/steps/Step9PLDRiscos';
import Step10PLDOperacao from '../components/compliance/steps/Step10PLDOperacao';
import Step11Confirmacao from '../components/compliance/steps/Step11Confirmacao';

const STEPS = [
  { id: 'identificacao', title: 'Identificação da Empresa', icon: Building2 },
  { id: 'tipo_empresa', title: 'Tipo de Empresa', icon: FileText },
  { id: 'endereco', title: 'Endereço Comercial', icon: MapPin },
  { id: 'atividade', title: 'Atividade Econômica', icon: Briefcase },
  { id: 'volumetria', title: 'Volumetria Financeira', icon: TrendingUp },
  { id: 'perfil_clientes', title: 'Perfil de Clientes', icon: Users },
  { id: 'responsaveis', title: 'Responsáveis', icon: UserCircle },
  { id: 'pld_sancoes', title: 'PLD - Sanções', icon: ShieldAlert },
  { id: 'pld_riscos', title: 'PLD - Riscos', icon: AlertTriangle },
  { id: 'pld_operacao', title: 'PLD - Operação', icon: ShieldCheck },
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
      case 1: return <Step1Identificacao {...props} />;
      case 2: return <Step2TipoEmpresa {...props} />;
      case 3: return <Step3Endereco {...props} />;
      case 4: return <Step4Atividade {...props} />;
      case 5: return <Step5Volumetria {...props} />;
      case 6: return <Step6PerfilClientes {...props} />;
      case 7: return <Step7Responsaveis {...props} />;
      case 8: return <Step8PLDSancoes {...props} />;
      case 9: return <Step9PLDRiscos {...props} />;
      case 10: return <Step10PLDOperacao {...props} />;
      case 11: return <Step11Confirmacao {...props} />;
      default: return null;
    }
  };

  const isLastStep = currentStep === STEPS.length;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50">
      {/* Header fixo */}
      <div className="sticky top-[57px] z-40 bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Compliance Pix</h1>
              <p className="text-sm text-slate-500">{STEPS[currentStep - 1].title}</p>
            </div>
          </div>
          <ProgressBar currentStep={currentStep} totalSteps={STEPS.length} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Navegação lateral - Desktop */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-[180px]">
              <StepNavigation
                steps={STEPS}
                currentStep={currentStep}
                onStepClick={setCurrentStep}
              />
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8">
              {renderStep()}
            </div>

            {/* Botões de navegação */}
            <div className="flex justify-between mt-6 gap-4">
              <Button
                variant="outline"
                onClick={currentStep === 1 ? () => navigate(createPageUrl('ComplianceOnboardingStart')) : handlePrevious}
                className="flex-1 md:flex-none"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentStep === 1 ? 'Voltar ao Início' : 'Anterior'}
              </Button>
              
              <Button
                onClick={isLastStep ? handleSubmit : handleNext}
                className="flex-1 md:flex-none bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white"
              >
                {isLastStep ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Finalizar e Enviar Documentos
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação mobile - Bolinhas */}
      <div className="lg:hidden fixed bottom-20 left-0 right-0 bg-white border-t border-slate-200 p-3">
        <div className="flex justify-center gap-2 overflow-x-auto">
          {STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => index + 1 <= currentStep && setCurrentStep(index + 1)}
              disabled={index + 1 > currentStep}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all flex-shrink-0 ${
                index + 1 === currentStep
                  ? 'bg-[var(--pagsmile-green)] text-white'
                  : index + 1 < currentStep
                  ? 'bg-[var(--pagsmile-green)]/20 text-[var(--pagsmile-green)]'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {index + 1 < currentStep ? <Check className="w-4 h-4" /> : index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}