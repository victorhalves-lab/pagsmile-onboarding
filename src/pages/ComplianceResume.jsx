import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FLOW_PAGES = {
  pix: { questionnaire: 'CompliancePixOnly', documents: 'DocumentUploadPix' },
  lite: { questionnaire: 'ComplianceLite', documents: 'DocumentUploadLite' },
  saas: { questionnaire: 'ComplianceSaaS', documents: 'DocumentUploadSaaS' },
  ecommerce: { questionnaire: 'ComplianceEcommerce', documents: 'DocumentUploadEcommerce' },
  full_kyc: { questionnaire: 'ComplianceFullKYC', documents: 'DocumentUploadFull' },
  merchant: { questionnaire: 'ComplianceDinamico', documents: 'DocumentUploadFull' },
  gateway: { questionnaire: 'ComplianceDinamico', documents: 'DocumentUploadFull' },
  marketplace: { questionnaire: 'ComplianceDinamico', documents: 'DocumentUploadFull' },
  subseller: { questionnaire: 'SubsellerQuestionnaire', documents: 'SubsellerQuestionnaire' },
};

const STORAGE_KEYS = {
  pix: 'compliance_data_pix',
  lite: 'compliance_data_lite',
  saas: 'compliance_data_saas',
  ecommerce: 'compliance_data_ecommerce',
  merchant: 'compliance_data_merchant',
  gateway: 'compliance_data_gateway',
  marketplace: 'compliance_data_marketplace',
  full_kyc: 'compliance_data_merchant',
};

const DOC_STORAGE_KEYS = {
  pix: 'documents_pix',
  lite: 'documents_lite',
  saas: 'documents_saas',
  ecommerce: 'documents_ecommerce',
  merchant: 'documents_merchant',
  gateway: 'documents_gateway',
  marketplace: 'documents_marketplace',
  full_kyc: 'documents_merchant',
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
        const response = await base44.functions.invoke('loadComplianceProgress', { sessionToken: token });

        if (!response.data?.found) {
          setError('Sessão não encontrada ou expirada.');
          setLoading(false);
          return;
        }

        if (response.data.session.status === 'completed') {
          setError('Este questionário já foi concluído.');
          setLoading(false);
          return;
        }

        const sess = response.data.session;
        setSession(sess);

        // Restore data to localStorage
        localStorage.setItem('compliance_session_token', token);

        if (sess.linkCode) {
          localStorage.setItem('onboarding_link_code', sess.linkCode);
        }

        const storageKey = STORAGE_KEYS[sess.templateModel] || STORAGE_KEYS[sess.flowType];
        if (storageKey && sess.formData && Object.keys(sess.formData).length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(sess.formData));
        }

        const docStorageKey = DOC_STORAGE_KEYS[sess.templateModel] || DOC_STORAGE_KEYS[sess.flowType];
        if (docStorageKey && sess.documentsData && Object.keys(sess.documentsData).length > 0) {
          localStorage.setItem(docStorageKey, JSON.stringify(sess.documentsData));
        }

        if (sess.templateModel) {
          localStorage.setItem('current_compliance_model', sess.templateModel);
        }

        // Determine target page
        const model = sess.templateModel || sess.flowType;
        const pages = FLOW_PAGES[model] || FLOW_PAGES.full_kyc;
        
        let targetPage;
        if (sess.currentPhase === 'documents') {
          targetPage = pages.documents;
        } else {
          targetPage = pages.questionnaire;
        }

        // Add model param for dynamic questionnaires
        let url = createPageUrl(targetPage);
        if (['merchant', 'gateway', 'marketplace'].includes(model) && targetPage === 'ComplianceDinamico') {
          url += `?model=${model}`;
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
        <h2 className="text-xl font-bold text-[var(--pagsmile-blue)] mb-2">Não foi possível retomar</h2>
        <p className="text-[var(--pagsmile-blue)]/70 mb-6">{error}</p>
        <Button
          onClick={() => navigate(createPageUrl('ComplianceOnboardingStart'))}
          className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white"
        >
          Iniciar Novo Questionário
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center px-4">
      <div className="p-4 rounded-2xl bg-[var(--pagsmile-green)]/10 mb-6">
        <RefreshCw className="w-12 h-12 text-[var(--pagsmile-green)] animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-[var(--pagsmile-blue)] mb-2">Retomando seu questionário...</h2>
      <p className="text-[var(--pagsmile-blue)]/70">
        {session ? (
          <>Carregando seus dados salvos. Você estava na etapa {session.currentStep}.</>
        ) : (
          <>Localizando seu progresso...</>
        )}
      </p>
    </div>
  );
}