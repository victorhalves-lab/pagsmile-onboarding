import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { QrCode, CreditCard, Wallet, ArrowRight, ArrowLeft } from 'lucide-react';
import SelectionButton from '../components/compliance/SelectionButton';

export default function ComplianceOnboardingStart() {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState(null);

  const paymentMethods = [
    {
      value: 'pix',
      label: 'Somente Pix',
      description: 'Habilite recebimentos e pagamentos via Pix de forma rápida.',
      details: 'Processo de compliance simplificado e ágil.',
      icon: <QrCode className="w-5 h-5" />
    },
    {
      value: 'card',
      label: 'Somente Cartão',
      description: 'Habilite recebimentos com cartão de crédito e débito.',
      details: 'Requer compliance completo para bandeiras e adquirentes.',
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      value: 'both',
      label: 'Pix e Cartão',
      description: 'Habilite todos os métodos de pagamento para seu negócio.',
      details: 'Combina Pix e cartão com compliance unificado.',
      icon: <Wallet className="w-5 h-5" />
    }
  ];

  const handleContinue = () => {
    if (selectedMethod) {
      localStorage.setItem('payment_method_type', selectedMethod);
      
      if (selectedMethod === 'pix') {
        navigate(createPageUrl('CompliancePixOnly'));
      } else {
        navigate(createPageUrl('ComplianceFullKYC'));
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gradient-to-br from-[#002443] to-[#001020] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--pagsmile-green)]/10 mb-4">
              <Wallet className="w-8 h-8 text-[var(--pagsmile-green)]" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-3">
              Complete seu Compliance
            </h1>
            <p className="text-slate-600 text-lg">
              Sua conta está quase pronta! Precisamos de algumas informações para ativar seus serviços.
            </p>
          </div>

          {/* Seleção de método */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-700 mb-4">
                Selecione o método de pagamento desejado:
              </h2>
              <SelectionButton
                options={paymentMethods}
                value={selectedMethod}
                onChange={setSelectedMethod}
                columns={1}
              />
            </div>

            {/* Detalhes do método selecionado */}
            {selectedMethod && (
              <div className="p-4 rounded-xl bg-[var(--pagsmile-green)]/5 border border-[var(--pagsmile-green)]/20">
                <p className="text-sm text-slate-600">
                  {paymentMethods.find(m => m.value === selectedMethod)?.details}
                </p>
              </div>
            )}
          </div>

          {/* Navegação */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl('AdminDashboard'))}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para o Dashboard
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!selectedMethod}
              className="flex-1 bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white"
            >
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-slate-400 text-sm mt-6">
          Seus dados estão protegidos e serão tratados com total confidencialidade.
        </p>
      </div>
    </div>
  );
}