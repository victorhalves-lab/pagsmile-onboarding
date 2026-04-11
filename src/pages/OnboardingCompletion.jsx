import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Clock, Mail, Shield } from 'lucide-react';
import { useOnboardingAnalytics } from '../components/analytics/useOnboardingAnalytics';

export default function OnboardingCompletion() {
  const navigate = useNavigate();
  const linkCode = localStorage.getItem('onboarding_link_code');
  const flowType = localStorage.getItem('payment_method_type') === 'pix' ? 'pix_only' : 'full_kyc';
  const cafRedirectUrl = localStorage.getItem('caf_redirect_url');
  
  // Check if CAF was already completed via SDK (V4 flow)
  // If caseId is in URL, the client came from the SDK CAF flow and does NOT need the external link
  const urlParams = new URLSearchParams(window.location.search);
  const caseIdFromUrl = urlParams.get('caseId');
  const cafCompletedViaSdk = !!caseIdFromUrl;
  
  // Only show external CAF block for legacy flows that have a redirect URL and didn't complete via SDK
  const showExternalCafBlock = !cafCompletedViaSdk && !!cafRedirectUrl;
  
  const { trackOnboardingComplete } = useOnboardingAnalytics({
    pageName: 'OnboardingCompletion',
    flowType,
    linkCode
  });

  useEffect(() => {
    // Rastreia conclusão do onboarding
    trackOnboardingComplete();
    
    base44.analytics.track({
      eventName: 'compliance_stage_entered',
      properties: {
        stage: 'completed',
        flow_type: flowType || '',
      }
    });
    
    // Limpa dados de sessão
    sessionStorage.removeItem('onboarding_session_id');
  }, []);

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gradient-to-br from-[#002443] to-[#001020] flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        {/* Ícone de sucesso */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[var(--pagsmile-green)]/20 mb-4">
            <CheckCircle2 className="w-14 h-14 text-[var(--pagsmile-green)]" />
          </div>
        </div>

        {/* Mensagem principal */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Onboarding Concluído!
        </h1>
        <p className="text-slate-300 text-lg mb-8">
          Obrigado por completar o processo de compliance. Seus dados foram enviados com sucesso.
        </p>

        {/* Próximos passos */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-white mb-4">Próximos Passos:</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-[var(--pagsmile-green)]/20">
                <Clock className="w-5 h-5 text-[var(--pagsmile-green)]" />
              </div>
              <div>
                <h3 className="font-medium text-white">Análise em Andamento</h3>
                <p className="text-sm text-slate-400">
                  Nossa equipe de compliance irá analisar suas informações e documentos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-[var(--pagsmile-green)]/20">
                <Mail className="w-5 h-5 text-[var(--pagsmile-green)]" />
              </div>
              <div>
                <h3 className="font-medium text-white">Notificação por E-mail</h3>
                <p className="text-sm text-slate-400">
                  Você receberá um e-mail quando a análise for concluída.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-[var(--pagsmile-green)]/20">
                <Shield className="w-5 h-5 text-[var(--pagsmile-green)]" />
              </div>
              <div>
                <h3 className="font-medium text-white">Prazo Estimado</h3>
                <p className="text-sm text-slate-400">
                  O processo será concluído em até 24 horas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer CAF - Only for legacy flows that redirect to external CAF */}
        {showExternalCafBlock && (
          <div className="bg-amber-500/20 border border-amber-500/40 rounded-2xl p-6 mb-8 text-left">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-amber-500/20 shrink-0">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg mb-2">⚠️ Etapa Obrigatória - Verificação CAF</h3>
                <p className="text-slate-300 text-sm mb-4">
                  Para que seu processo de compliance seja aprovado, é <strong className="text-white">obrigatório</strong> preencher o formulário de verificação da CAF. 
                  Sem o preenchimento deste formulário, seu cadastro <strong className="text-white">não poderá ser finalizado</strong>.
                </p>
                <a
                  href={cafRedirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg"
                >
                  Preencher Formulário CAF
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Botão */}
        <Button
          onClick={() => navigate('/AdminDashboard')}
          variant="ghost"
          className="text-slate-400 hover:text-white px-8"
        >
          Ir para o Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        {/* Logo */}
        <div className="mt-12">
          <img 
            src="https://pagsmile.com/images/header/pagsmile_logo.svg" 
            alt="Pagsmile" 
            className="h-8 mx-auto opacity-50"
          />
        </div>
      </div>
    </div>
  );
}