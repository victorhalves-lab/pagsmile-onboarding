import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// SDK-FREE: ComplianceResume is a PUBLIC page (anonymous clients arriving from
// e-mail / QR code). The @base44/sdk fails with 401 on private apps when there's
// no auth session. callPublicFunction hits /functions/* directly via fetch.
import { callPublicFunction } from '@/lib/publicApi';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// All dynamic V4 models go through ComplianceDinamico with ?model= param
const DYNAMIC_MODELS = new Set([
  'merchant', 'gateway', 'marketplace',
  'ComplianceMerchantAutocomplete', 'ComplianceGatewayAutocomplete', 'ComplianceMarketplaceAutocomplete',
  'ComplianceGatewayV4', 'ComplianceMarketplaceV4', 'CompliancePlataformaVerticalV4',
  'ComplianceEcommerceV4', 'ComplianceInfoprodutosV4', 'ComplianceEducacaoV4',
  'ComplianceSaaSV4', 'ComplianceMerchantLinkV4', 'ComplianceMPEV4', 'ComplianceDropshippingV4',
  'CompliancePixMerchantV4', 'CompliancePixIntermediarioV4', 'subseller_v2',
]);

// Legacy fixed-page models only
const LEGACY_FLOW_PAGES = {
  pix: { questionnaire: '/CompliancePixOnly', documents: '/DocumentUploadPix' },
  lite: { questionnaire: '/ComplianceLite', documents: '/DocumentUploadLite' },
  saas: { questionnaire: '/ComplianceSaaS', documents: '/DocumentUploadSaaS' },
  ecommerce: { questionnaire: '/ComplianceEcommerce', documents: '/DocumentUploadEcommerce' },
  full_kyc: { questionnaire: '/ComplianceFullKYC', documents: '/DocumentUploadFull' },
  subseller: { questionnaire: '/SubsellerQuestionnaire', documents: '/SubsellerQuestionnaire' },
};

export default function ComplianceResume() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    async function loadSession() {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('session');

      if (!token) {
        setError('Link de retomada inválido. Verifique o link e tente novamente.');
        setLoading(false);
        return;
      }

      try {
        const response = await callPublicFunction('loadComplianceProgress', { sessionToken: token });

        if (!response?.found) {
          setError('Sessão não encontrada ou expirada.');
          setLoading(false);
          return;
        }

        if (response.session?.status === 'completed') {
          setError('Este questionário já foi concluído.');
          setLoading(false);
          return;
        }

        const sess = response.session;
        setSession(sess);

        // Restore session token to localStorage
        localStorage.setItem('compliance_session_token', token);

        if (sess.linkCode) {
          localStorage.setItem('onboarding_link_code', sess.linkCode);
        }
        if (sess.templateModel) {
          localStorage.setItem('current_compliance_model', sess.templateModel);
        }

        // Determine target page based on model
        const model = sess.templateModel || sess.flowType;
        let url;

        if (DYNAMIC_MODELS.has(model)) {
          const docPage = model.startsWith('CompliancePix') ? '/DocumentUploadPix' : '/DocumentUploadFull';
          if (sess.currentPhase === 'documents') {
            url = docPage + `?session=${token}`;
          } else {
            url = `/ComplianceDinamico?model=${model}&session=${token}`;
          }
        } else {
          const pages = LEGACY_FLOW_PAGES[model] || LEGACY_FLOW_PAGES.full_kyc;
          url = sess.currentPhase === 'documents' ? pages.documents : pages.questionnaire;
          url += (url.includes('?') ? '&' : '?') + `session=${token}`;
        }

        if (model === 'subseller' && sess.linkCode) {
          url += (url.includes('?') ? '&' : '?') + `ref=${sess.linkCode}`;
        }

        // Brief display then redirect
        setTimeout(() => {
          navigate(url, { replace: true });
        }, 1500);

      } catch (e) {
        console.error('Failed to load session:', e);
        setError('Erro ao carregar a sessão. Tente novamente.');
        setLoading(false);
      }
    }

    loadSession();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center px-4">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-[var(--pinbank-blue)] mb-2">Não foi possível retomar</h2>
        <p className="text-[var(--pinbank-blue)]/70 mb-6">{error}</p>
        <Button
          onClick={() => navigate('/ComplianceOnboardingStart')}
          className="bg-[var(--pinbank-blue)] hover:bg-[var(--pinbank-blue)]/90 text-white"
        >
          Iniciar Novo Questionário
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center px-4">
      <div className="p-4 rounded-2xl bg-[var(--pinbank-blue)]/10 mb-6">
        <RefreshCw className="w-12 h-12 text-[var(--pinbank-blue)] animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-[var(--pinbank-blue)] mb-2">Retomando seu questionário...</h2>
      <p className="text-[var(--pinbank-blue)]/70">
        {session ? (
          <>Carregando seus dados salvos. Você estava na etapa {session.currentStep}.</>
        ) : (
          <>Localizando seu progresso...</>
        )}
      </p>
    </div>
  );
}