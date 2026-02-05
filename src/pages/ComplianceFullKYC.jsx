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
import Step3aEnderecoPrincipal from '../components/compliance/steps/Step3aEnderecoPrincipal';
import Step3bOutrosEnderecos from '../components/compliance/steps/Step3bOutrosEnderecos';
import Step4aAtividadePrincipal from '../components/compliance/steps/Step4aAtividadePrincipal';
import Step4bEscopoNegocio from '../components/compliance/steps/Step4bEscopoNegocio';
import Step4cProdutosServicos from '../components/compliance/steps/Step4cProdutosServicos';
import Step4dVolumetria from '../components/compliance/steps/Step4dVolumetria';
import Step4eURLsClientes from '../components/compliance/steps/Step4eURLsClientes';
import Step4fCanaisVenda from '../components/compliance/steps/Step4fCanaisVenda';
import Step5PerfilOperacional from '../components/compliance/steps/Step5PerfilOperacional';
import Step7aResponsaveis from '../components/compliance/steps/Step7aResponsaveis';
import Step7bCompliance from '../components/compliance/steps/Step7bCompliance';
import Step7cCanaisReputacao from '../components/compliance/steps/Step7cCanaisReputacao';
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
  { id: 'tipo_empresa', title: '2. Tipo Empresa', icon: FileText },
  { id: 'endereco_principal', title: '3. Endereço', icon: MapPin },
  { id: 'endereco_outros', title: '3. Outros Endereços', icon: MapPin },
  { id: 'atividade_principal', title: '4. Atividade Principal', icon: Briefcase },
  { id: 'atividade_escopo', title: '4. Escopo do Negócio', icon: Briefcase },
  { id: 'atividade_produtos', title: '4. Produtos/Serviços', icon: Briefcase },
  { id: 'atividade_volumetria', title: '4. Volumetria', icon: TrendingUp },
  { id: 'atividade_urls', title: '4. Presença Digital', icon: Briefcase },
  { id: 'atividade_canais', title: '4. Canais de Venda', icon: Store },
  { id: 'licenciamento', title: '5. Licenciamento', icon: Scale },
  { id: 'ubo', title: '6. Beneficiários', icon: Users },
  { id: 'socios', title: '7. Sócios', icon: UserCheck },
  { id: 'responsaveis_contato', title: '8. Responsáveis', icon: UserCircle },
  { id: 'responsaveis_compliance', title: '8. Compliance', icon: ShieldAlert },
  { id: 'canais_reputacao', title: '8. Canais & Reputação', icon: UserCircle },
  { id: 'compliance', title: '9. Compliance Check', icon: ShieldAlert },
  { id: 'pld', title: '10. PLD/FT', icon: ShieldCheck },
  { id: 'operacao', title: '11. Operação', icon: TrendingUp },
  { id: 'marketplace', title: '12. Marketplace', icon: Store },
  { id: 'seguranca', title: '13. Segurança', icon: Lock },
  { id: 'confirmacao', title: '14. Confirmação', icon: CheckCircle }
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
      case 3: return <Step3aEnderecoPrincipal {...baseProps} />;
      case 4: return <Step3bOutrosEnderecos {...baseProps} />;
      case 5: return <Step4aAtividadePrincipal {...baseProps} />;
      case 6: return <Step4bEscopoNegocio {...baseProps} />;
      case 7: return <Step4cProdutosServicos {...arrayProps} />;
      case 8: return <Step4dVolumetria {...baseProps} />;
      case 9: return <Step4eURLsClientes {...arrayProps} />;
      case 10: return <Step4fCanaisVenda {...baseProps} />;
      case 11: return <Section6Licenciamento {...baseProps} />;
      case 12: return <Section4UBO {...arrayProps} />;
      case 13: return <Section5Socios {...arrayProps} />;
      case 14: return <Step7aResponsaveis {...baseProps} />;
      case 15: return <Step7bCompliance {...baseProps} />;
      case 16: return <Step7cCanaisReputacao {...arrayProps} />;
      case 17: return <Step8CompliancePLD {...baseProps} />;
      case 18: return <Step10PLDOperacao {...baseProps} />;
      case 19: return <Step5PerfilOperacional {...baseProps} />;
      case 20: return <Section7Marketplace {...baseProps} />;
      case 21: return <Section8SegurancaCartao {...baseProps} />;
      case 22: return <Step11Confirmacao {...baseProps} />;
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

          {/* Botões de Ação - Fixos no Rodapé */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 z-40 lg:pl-[340px] transition-all duration-300">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={currentStep === 1 ? () => navigate(createPageUrl('ComplianceOnboardingStart')) : handlePrevious}
                className="text-[var(--pagsmile-blue)] hover:text-[var(--pagsmile-blue)]/80 hover:bg-[var(--pagsmile-blue)]/5 px-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentStep === 1 ? 'Início' : 'Voltar'}
              </Button>
              
              <Button
                onClick={isLastStep ? handleSubmit : handleNext}
                className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white px-10 h-11 rounded-full shadow-lg shadow-[var(--pagsmile-green)]/20 transition-transform active:scale-95"
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
          {/* Espaçador para o conteúdo não ficar escondido atrás do footer fixo */}
          <div className="h-24"></div>
        </div>
      </div>
    </div>
  );
}