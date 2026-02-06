import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { 
  Building2, Users, UserCircle, ShieldAlert, TrendingUp, Settings, 
  ShieldCheck, FileCheck, Store, Globe, RefreshCw, AlertTriangle, UserX
} from 'lucide-react';

import StepNavigation from '../components/compliance/StepNavigation';
import { useOnboardingAnalytics } from '../components/analytics/useOnboardingAnalytics';

// Seções Base
import StepE1Identificacao from '../components/compliance/steps/ecommerce/StepE1Identificacao';
import StepE2SociosGovernanca from '../components/compliance/steps/ecommerce/StepE2SociosGovernanca';
import StepE2bRepresentante from '../components/compliance/steps/ecommerce/StepE2bRepresentante';
import StepE2cPEPSancoes from '../components/compliance/steps/ecommerce/StepE2cPEPSancoes';
import StepE3PerfilTransacional from '../components/compliance/steps/ecommerce/StepE3PerfilTransacional';
import StepE4FlagsModelo from '../components/compliance/steps/ecommerce/StepE4FlagsModelo';
import StepE5PLDFT from '../components/compliance/steps/ecommerce/StepE5PLDFT';
import StepE6Declaracoes from '../components/compliance/steps/ecommerce/StepE6Declaracoes';

// Módulos Dinâmicos
import ModuleAMarketplace from '../components/compliance/steps/ecommerce/ModuleAMarketplace';
import ModuleBInternacional from '../components/compliance/steps/ecommerce/ModuleBInternacional';
import ModuleCRecorrencia from '../components/compliance/steps/ecommerce/ModuleCRecorrencia';
import ModuleDDisputas from '../components/compliance/steps/ecommerce/ModuleDDisputas';
import ModuleEPEPSancoes from '../components/compliance/steps/ecommerce/ModuleEPEPSancoes';

// Steps base sempre exibidos
const BASE_STEPS = [
  { id: 'identificacao', title: 'Identificação', icon: Building2, component: StepE1Identificacao },
  { id: 'socios', title: 'Sócios e Governança', icon: Users, component: StepE2SociosGovernanca },
  { id: 'representante', title: 'Representante Legal', icon: UserCircle, component: StepE2bRepresentante },
  { id: 'pep_sancoes', title: 'PEP e Sanções', icon: ShieldAlert, component: StepE2cPEPSancoes },
  { id: 'perfil_transacional', title: 'Perfil Transacional', icon: TrendingUp, component: StepE3PerfilTransacional },
  { id: 'flags_modelo', title: 'Modelo de Negócio', icon: Settings, component: StepE4FlagsModelo },
  { id: 'pld_ft', title: 'PLD/FT', icon: ShieldCheck, component: StepE5PLDFT },
  { id: 'declaracoes', title: 'Declarações', icon: FileCheck, component: StepE6Declaracoes },
];

// Módulos dinâmicos
const DYNAMIC_MODULES = {
  marketplace: { id: 'mod_marketplace', title: 'Módulo Marketplace', icon: Store, component: ModuleAMarketplace },
  internacional: { id: 'mod_internacional', title: 'Módulo Internacional', icon: Globe, component: ModuleBInternacional },
  recorrencia: { id: 'mod_recorrencia', title: 'Módulo Recorrência', icon: RefreshCw, component: ModuleCRecorrencia },
  disputas: { id: 'mod_disputas', title: 'Módulo Disputas', icon: AlertTriangle, component: ModuleDDisputas },
  pep_detalhamento: { id: 'mod_pep_detalhamento', title: 'Detalhamento PEP/Sanções', icon: UserX, component: ModuleEPEPSancoes },
};

export default function ComplianceEcommerce() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    quadroSocietario: [],
    dadosColetadosSeller: []
  });

  const linkCode = localStorage.getItem('onboarding_link_code');

  // Determinar quais módulos dinâmicos estão ativos
  const activeModules = useMemo(() => {
    const modules = [];
    
    // Módulo A - Marketplace (se operaMarketplace = Sim)
    if (formData.operaMarketplace === 'Sim') {
      modules.push(DYNAMIC_MODULES.marketplace);
    }
    
    // Módulo B - Internacional (se temCrossBorder = Sim)
    if (formData.temCrossBorder === 'Sim') {
      modules.push(DYNAMIC_MODULES.internacional);
    }
    
    // Módulo C - Recorrência (se temRecorrencia = Sim)
    if (formData.temRecorrencia === 'Sim') {
      modules.push(DYNAMIC_MODULES.recorrencia);
    }
    
    // Módulo D - Disputas (se chargebackRate = maior_10)
    if (formData.chargebackRate === 'maior_10') {
      modules.push(DYNAMIC_MODULES.disputas);
    }
    
    // Módulo E - Detalhamento PEP/Sanções (se algumPEP = Sim ou algumSancionado = Sim)
    if (formData.algumPEP === 'Sim' || formData.algumSancionado === 'Sim') {
      modules.push(DYNAMIC_MODULES.pep_detalhamento);
    }
    
    return modules;
  }, [formData.operaMarketplace, formData.temCrossBorder, formData.temRecorrencia, formData.chargebackRate, formData.algumPEP, formData.algumSancionado]);

  // Combinar steps base + módulos dinâmicos
  const STEPS = useMemo(() => {
    return [...BASE_STEPS, ...activeModules];
  }, [activeModules]);

  const { trackPageComplete } = useOnboardingAnalytics({
    pageName: 'ComplianceEcommerce',
    stepNumber: currentStep,
    totalSteps: STEPS.length,
    flowType: 'ecommerce',
    linkCode
  });

  useEffect(() => {
    const savedData = localStorage.getItem('compliance_data_ecommerce');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setFormData({
        ...parsed,
        quadroSocietario: parsed.quadroSocietario || [],
        dadosColetadosSeller: parsed.dadosColetadosSeller || []
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('compliance_data_ecommerce', JSON.stringify(formData));
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
    localStorage.setItem('compliance_data_ecommerce', JSON.stringify(formData));
    navigate(createPageUrl('DocumentUploadEcommerce'));
  };

  const renderStep = () => {
    const step = STEPS[currentStep - 1];
    if (!step) return null;
    
    const StepComponent = step.component;
    return <StepComponent formData={formData} handleChange={handleChange} />;
  };

  const isLastStep = currentStep === STEPS.length;
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="flex gap-8 items-start">
      {/* Sidebar de Navegação */}
      <div className="hidden lg:block w-72 sticky top-24 space-y-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="px-2 py-1 rounded-lg bg-orange-100 text-orange-700 text-xs font-semibold">
              E-COMMERCE
            </div>
            <h3 className="font-bold text-[var(--pagsmile-blue)] text-sm">E-commerce Known</h3>
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
          {activeModules.length > 0 && (
            <p className="text-xs text-orange-600 mt-2">
              +{activeModules.length} módulo(s) ativado(s)
            </p>
          )}
        </div>

        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
          <StepNavigation
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
            className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100"
          />
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 min-w-0">
        {/* Mobile Progress */}
        <div className="lg:hidden mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-1 rounded-lg bg-orange-100 text-orange-700 text-xs font-semibold">
              E-COMMERCE
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