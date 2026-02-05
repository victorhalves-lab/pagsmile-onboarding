import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { 
  Building2, FileText, MapPin, Briefcase, TrendingUp, 
  Users, UserCircle, ShieldAlert, CheckCircle,
  UserCheck, Scale, Store, Lock, ShieldCheck
} from 'lucide-react';

import ProgressBar from '../components/compliance/ProgressBar';
import StepNavigation from '../components/compliance/StepNavigation';
import { useOnboardingAnalytics } from '../components/analytics/useOnboardingAnalytics';

import Step1Identificacao from '../components/compliance/steps/Step1Identificacao';
import Step2TipoEmpresa from '../components/compliance/steps/Step2TipoEmpresa';
import Step3Endereco from '../components/compliance/steps/Step3Endereco';
import Step4AtividadeNegocios from '../components/compliance/steps/Step4AtividadeNegocios';
import Step5PerfilOperacional from '../components/compliance/steps/Step5PerfilOperacional';
import Step7Responsaveis from '../components/compliance/steps/Step7Responsaveis';
import Section4UBO from '../components/compliance/steps/Section4UBO';
import Section5Socios from '../components/compliance/steps/Section5Socios';
import Section6Licenciamento from '../components/compliance/steps/Section6Licenciamento';
import Section7Marketplace from '../components/compliance/steps/Section7Marketplace';
import Section8SegurancaCartao from '../components/compliance/steps/Section8SegurancaCartao';
import Step8CompliancePLD from '../components/compliance/steps/Step8CompliancePLD';
import Step10PLDOperacao from '../components/compliance/steps/Step10PLDOperacao';
import Step11Confirmacao from '../components/compliance/steps/Step11Confirmacao';

const STEPS = [
  { id: 'identificacao', title: '1. Identificação', icon: Building2 },
  { id: 'tipo_empresa', title: '1. Tipo Empresa', icon: FileText },
  { id: 'endereco', title: '1. Endereço', icon: MapPin },
  { id: 'atividade', title: '2. Atividade', icon: Briefcase },
  { id: 'licenciamento', title: '3. Licenciamento', icon: Scale },
  { id: 'ubo', title: '4. Beneficiários', icon: Users },
  { id: 'socios', title: '5. Sócios', icon: UserCheck },
  { id: 'responsaveis', title: '6. Responsáveis', icon: UserCircle },
  { id: 'compliance', title: '7. Compliance', icon: ShieldAlert },
  { id: 'pld', title: '8. PLD/FT', icon: ShieldCheck },
  { id: 'operacao', title: '9. Operação', icon: TrendingUp },
  { id: 'marketplace', title: '10. Marketplace', icon: Store },
  { id: 'seguranca', title: '11. Segurança', icon: Lock },
  { id: 'confirmacao', title: '12. Confirmação', icon: CheckCircle }
];

export default function ComplianceFullKYC() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    ubos: [],
    socios: [],
    topProdutos: [],
    divisaoPercentual: [],
    topClientes: [],
    canaisAtendimentoLista: [],
    canaisVenda: []
  });

  const linkCode = localStorage.getItem('onboarding_link_code');
  
  const { trackPageComplete } = useOnboardingAnalytics({
    pageName: 'ComplianceFullKYC',
    stepNumber: currentStep,
    totalSteps: STEPS.length,
    flowType: 'full_kyc',
    linkCode
  });

  useEffect(() => {
    const savedData = localStorage.getItem('compliance_data_full');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setFormData({
        ...parsed,
        ubos: parsed.ubos || [],
        socios: parsed.socios || [],
        topProdutos: parsed.topProdutos || [],
        divisaoPercentual: parsed.divisaoPercentual || [],
        topClientes: parsed.topClientes || [],
        canaisAtendimentoLista: parsed.canaisAtendimentoLista || [],
        canaisVenda: parsed.canaisVenda || []
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('compliance_data_full', JSON.stringify(formData));
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (fieldId, index, subField, value) => {
    setFormData(prev => {
      const newArray = [...(prev[fieldId] || [])];
      if (!newArray[index]) return prev;
      newArray[index] = { ...newArray[index], [subField]: value };
      return { ...prev, [fieldId]: newArray };
    });
  };

  const handleAddArrayItem = (fieldId, newItem) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || []), newItem]
    }));
  };

  const handleRemoveArrayItem = (fieldId, index) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: (prev[fieldId] || []).filter((_, i) => i !== index)
    }));
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
    localStorage.setItem('compliance_data_full', JSON.stringify(formData));
    navigate(createPageUrl('DocumentUploadFull'));
  };

  const renderStep = () => {
    const baseProps = { formData, handleChange };
    const arrayProps = { ...baseProps, handleArrayChange, handleAddArrayItem, handleRemoveArrayItem };
    
    switch (currentStep) {
      case 1: return <Step1Identificacao {...baseProps} />;
      case 2: return <Step2TipoEmpresa {...baseProps} />;
      case 3: return <Step3Endereco {...baseProps} />;
      case 4: return <Step4AtividadeNegocios {...arrayProps} />;
      case 5: return <Section6Licenciamento {...baseProps} />;
      case 6: return <Section4UBO {...arrayProps} />;
      case 7: return <Section5Socios {...arrayProps} />;
      case 8: return <Step7Responsaveis {...arrayProps} />;
      case 9: return <Step8CompliancePLD {...baseProps} />;
      case 10: return <Step10PLDOperacao {...baseProps} />;
      case 11: return <Step5PerfilOperacional {...baseProps} />;
      case 12: return <Section7Marketplace {...baseProps} />;
      case 13: return <Section8SegurancaCartao {...baseProps} />;
      case 14: return <Step11Confirmacao {...baseProps} />;
      default: return null;
    }
  };

  const isLastStep = currentStep === STEPS.length;
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="flex gap-8 items-start">
      {/* Sidebar de Navegação */}
      <div className="hidden lg:block w-80 sticky top-24 space-y-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-[var(--pagsmile-blue)] mb-2">Progresso</h3>
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

        <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
          <StepNavigation
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
          />
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 min-w-0">
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