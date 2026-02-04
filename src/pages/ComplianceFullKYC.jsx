import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { 
  Building2, FileText, MapPin, Briefcase, TrendingUp, 
  Users, UserCircle, ShieldAlert, AlertTriangle, ShieldCheck, CheckCircle,
  UserCheck, Scale, Store, Lock
} from 'lucide-react';

import ProgressBar from '../components/compliance/ProgressBar';
import StepNavigation from '../components/compliance/StepNavigation';

import Step1Identificacao from '../components/compliance/steps/Step1Identificacao';
import Step2TipoEmpresa from '../components/compliance/steps/Step2TipoEmpresa';
import Step3Endereco from '../components/compliance/steps/Step3Endereco';
import Step4Atividade from '../components/compliance/steps/Step4Atividade';
import Step5Volumetria from '../components/compliance/steps/Step5Volumetria';
import Step6PerfilClientes from '../components/compliance/steps/Step6PerfilClientes';
import Step7Responsaveis from '../components/compliance/steps/Step7Responsaveis';
import Section4UBO from '../components/compliance/steps/Section4UBO';
import Section5Socios from '../components/compliance/steps/Section5Socios';
import Section6Licenciamento from '../components/compliance/steps/Section6Licenciamento';
import Section7Marketplace from '../components/compliance/steps/Section7Marketplace';
import Section8SegurancaCartao from '../components/compliance/steps/Section8SegurancaCartao';
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
  { id: 'ubo', title: 'Beneficiários Finais (UBO)', icon: Users },
  { id: 'socios', title: 'Sócios e Administradores', icon: UserCheck },
  { id: 'licenciamento', title: 'Licenciamento', icon: Scale },
  { id: 'marketplace', title: 'Marketplace', icon: Store },
  { id: 'seguranca_cartao', title: 'Segurança de Cartão', icon: Lock },
  { id: 'pld_sancoes', title: 'PLD - Sanções', icon: ShieldAlert },
  { id: 'pld_riscos', title: 'PLD - Riscos', icon: AlertTriangle },
  { id: 'pld_operacao', title: 'PLD - Operação', icon: ShieldCheck },
  { id: 'confirmacao', title: 'Confirmação', icon: CheckCircle }
];

export default function ComplianceFullKYC() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    ubos: [],
    socios: []
  });

  useEffect(() => {
    const savedData = localStorage.getItem('compliance_data_full');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setFormData({
        ...parsed,
        ubos: parsed.ubos || [],
        socios: parsed.socios || []
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
      case 4: return <Step4Atividade {...baseProps} />;
      case 5: return <Step5Volumetria {...baseProps} />;
      case 6: return <Step6PerfilClientes {...baseProps} />;
      case 7: return <Step7Responsaveis {...baseProps} />;
      case 8: return <Section4UBO {...arrayProps} />;
      case 9: return <Section5Socios {...arrayProps} />;
      case 10: return <Section6Licenciamento {...baseProps} />;
      case 11: return <Section7Marketplace {...baseProps} />;
      case 12: return <Section8SegurancaCartao {...baseProps} />;
      case 13: return <Step8PLDSancoes {...baseProps} />;
      case 14: return <Step9PLDRiscos {...baseProps} />;
      case 15: return <Step10PLDOperacao {...baseProps} />;
      case 16: return <Step11Confirmacao {...baseProps} />;
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
              <h1 className="text-xl font-bold text-slate-800">Compliance Completo</h1>
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
            <div className="sticky top-[180px] max-h-[calc(100vh-220px)] overflow-y-auto">
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
        <div className="flex justify-center gap-1.5 overflow-x-auto px-2">
          {STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => index + 1 <= currentStep && setCurrentStep(index + 1)}
              disabled={index + 1 > currentStep}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all flex-shrink-0 ${
                index + 1 === currentStep
                  ? 'bg-[var(--pagsmile-green)] text-white'
                  : index + 1 < currentStep
                  ? 'bg-[var(--pagsmile-green)]/20 text-[var(--pagsmile-green)]'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {index + 1 < currentStep ? <Check className="w-3 h-3" /> : index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}