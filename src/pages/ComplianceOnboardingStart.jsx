import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { QrCode, CreditCard, Wallet, ArrowRight, ArrowLeft, ShieldCheck, Zap, ShoppingCart, Cloud } from 'lucide-react';
import SelectionButton from '../components/compliance/SelectionButton';
import { trackLinkClick } from '../components/analytics/useOnboardingAnalytics';

export default function ComplianceOnboardingStart() {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      localStorage.setItem('onboarding_link_code', refCode);
      trackLinkClick(refCode);
    }
  }, []);

  const paymentMethods = [
    {
      value: 'lite',
      label: 'Perfil Lite',
      description: 'Questionário simplificado para PMEs que precisam de agilidade.',
      details: 'Ideal para pequenas e médias empresas.',
      icon: <Zap className="w-8 h-8" />
    },
    {
      value: 'saas',
      label: 'SaaS / Recorrência',
      description: 'Fast Track para empresas de SaaS com modelo de assinatura.',
      details: 'Otimizado para recorrência online.',
      icon: <Cloud className="w-8 h-8" />
    },
    {
      value: 'ecommerce',
      label: 'E-commerce',
      description: 'Questionário completo para lojas virtuais e marketplaces.',
      details: 'Otimizado para operações de e-commerce.',
      icon: <ShoppingCart className="w-8 h-8" />
    },
    {
      value: 'pix',
      label: 'Somente Pix',
      description: 'Habilite recebimentos e pagamentos via Pix com compliance simplificado.',
      details: 'Ideal para operações ágeis.',
      icon: <QrCode className="w-8 h-8" />
    },
    {
      value: 'card',
      label: 'Somente Cartão',
      description: 'Habilite processamento de cartões de crédito e débito.',
      details: 'Para negócios que precisam de abrangência.',
      icon: <CreditCard className="w-8 h-8" />
    },
    {
      value: 'both',
      label: 'Solução Completa',
      description: 'Unifique Pix e Cartões em uma única integração robusta.',
      details: 'A escolha recomendada para crescimento.',
      icon: <Wallet className="w-8 h-8" />
    }
  ];

  const handleContinue = () => {
    if (selectedMethod) {
      localStorage.setItem('payment_method_type', selectedMethod);
      if (selectedMethod === 'lite') {
        navigate('/ComplianceLite');
      } else if (selectedMethod === 'saas') {
        navigate('/ComplianceSaaS');
      } else if (selectedMethod === 'ecommerce') {
        navigate('/ComplianceEcommerce');
      } else if (selectedMethod === 'pix') {
        navigate('/CompliancePixOnly');
      } else {
        navigate('/ComplianceFullKYC');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12 animate-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-[var(--pagsmile-green)] to-[var(--pagsmile-blue)] text-white mb-6 shadow-xl shadow-green-900/10">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--pagsmile-blue)] mb-6 tracking-tight">
            Bem-vindo ao Processo de Onboarding da PagSmile
          </h1>
          <p className="text-lg text-[var(--pagsmile-blue)]/70 max-w-2xl mx-auto leading-relaxed">
            Selecione como deseja operar para iniciarmos a análise de compliance personalizada do seu perfil.
          </p>
        </div>

        <div className="mb-12 animate-in slide-in-from-bottom-10 duration-1000 delay-100">
          <SelectionButton
            options={paymentMethods}
            value={selectedMethod}
            onChange={setSelectedMethod}
            columns={4}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto animate-in slide-in-from-bottom-12 duration-1000 delay-200">
          <Button
            onClick={handleContinue}
            disabled={!selectedMethod}
            className="h-14 px-8 text-lg bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white rounded-xl w-full shadow-lg shadow-green-500/20 transition-all hover:scale-105"
          >
            Começar Agora
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
        
        <p className="text-center text-slate-400 text-sm mt-8 animate-in fade-in duration-1000 delay-500">
          Ambiente seguro e criptografado de ponta a ponta.
        </p>
      </div>
    </div>
  );
}