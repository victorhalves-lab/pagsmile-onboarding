import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, CheckCircle, Clock } from 'lucide-react';

export default function ComplianceOnboardingStart() {
  const navigate = useNavigate();

  const features = [
    { icon: Shield, title: 'Seguro e Confiável', description: 'Seus dados são protegidos com criptografia de ponta' },
    { icon: CheckCircle, title: 'Processo Simples', description: 'Apenas alguns passos para completar seu cadastro' },
    { icon: Clock, title: 'Rápido', description: 'Aprovação em até 24 horas após envio' }
  ];

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-2xl mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Bem-vindo ao Onboarding Pagsmile
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Vamos começar o processo de cadastro. Prepare seus documentos e informações para um processo rápido e seguro.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-lg mb-4">
                  <Icon className="w-6 h-6 text-[var(--primary)]" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">O que você vai precisar:</h2>
          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
              <span className="text-slate-700">Documentos de identificação (RG, CNH ou Passaporte)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
              <span className="text-slate-700">CPF ou CNPJ (para empresas)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
              <span className="text-slate-700">Comprovante de endereço atualizado</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
              <span className="text-slate-700">Informações bancárias</span>
            </li>
          </ul>

          <Button
            onClick={() => navigate(createPageUrl('MerchantTypeSelection'))}
            className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:opacity-90 text-white h-12 text-lg"
          >
            Iniciar Cadastro
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade
        </p>
      </div>
    </div>
  );
}