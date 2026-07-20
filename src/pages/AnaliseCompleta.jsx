import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, User, Shield, Database, Fingerprint, AlertOctagon, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import AnaliseResumoExecutivo from '@/components/analise-completa/AnaliseResumoExecutivo';
import BdcV4AnalysisPanel from '@/components/analise-completa/BdcV4AnalysisPanel';
import AnaliseCafCompleta from '@/components/analise-completa/AnaliseCafCompleta';
import AnaliseBdcCompleta from '@/components/analise-completa/AnaliseBdcCompleta';
import AnaliseCruzada from '@/components/analise-completa/AnaliseCruzada';
import AnaliseTimelineIntegracoes from '@/components/analise-completa/AnaliseTimelineIntegracoes';
import AnaliseCompletaV5_2 from '@/components/analise-completa/v5_2/AnaliseCompletaV5_2';

export default function AnaliseCompleta() {
  const urlParams = new URLSearchParams(window.location.search);
  const merchantId = urlParams.get('id');

  const { data: merchant, isLoading } = useQuery({
    queryKey: ['analise-merchant', merchantId],
    queryFn: async () => {
      const list = await base44.entities.Merchant.filter({ id: merchantId });
      return list[0] || null;
    },
    enabled: !!merchantId,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['analise-cases', merchantId],
    queryFn: () => base44.entities.OnboardingCase.filter({ merchantId }),
    enabled: !!merchantId,
  });

  const allCaseIds = useMemo(() => cases.map(c => c.id), [cases]);

  const { data: validations = [] } = useQuery({
    queryKey: ['analise-validations', allCaseIds],
    queryFn: async () => {
      const results = await Promise.all(allCaseIds.map(id => base44.entities.ExternalValidationResult.filter({ onboardingCaseId: id })));
      return results.flat();
    },
    enabled: allCaseIds.length > 0,
  });

  const { data: integrationLogs = [] } = useQuery({
    queryKey: ['analise-intlogs', allCaseIds],
    queryFn: async () => {
      const results = await Promise.all(allCaseIds.map(id => base44.entities.IntegrationLog.filter({ onboarding_case_id: id })));
      return results.flat();
    },
    enabled: allCaseIds.length > 0,
  });

  const { data: scores = [] } = useQuery({
    queryKey: ['analise-scores', allCaseIds],
    queryFn: async () => {
      const results = await Promise.all(allCaseIds.map(id => base44.entities.ComplianceScore.filter({ onboarding_case_id: id })));
      return results.flat();
    },
    enabled: allCaseIds.length > 0,
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['analise-responses', allCaseIds],
    queryFn: async () => {
      const results = await Promise.all(allCaseIds.map(id => base44.entities.QuestionnaireResponse.filter({ onboardingCaseId: id })));
      return results.flat();
    },
    enabled: allCaseIds.length > 0,
  });

  const latestCase = useMemo(() => cases.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0] || null, [cases]);
  const latestScore = useMemo(() => scores.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0] || null, [scores]);

  // Separate CAF vs BDC data
  const cafValidations = validations.filter(v => v.provider === 'CAF');
  const bdcValidations = validations.filter(v => v.provider === 'BigDataCorp');
  const cafLogs = integrationLogs.filter(l => l.provider === 'CAF');
  const bdcLogs = integrationLogs.filter(l => l.provider === 'BigDataCorp');

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--pinbank-blue)]/50">Merchant não encontrado</p>
        <Link to="/Cadastro"><button className="mt-4 text-sm underline">Voltar ao Cadastro</button></Link>
      </div>
    );
  }

  const formatDoc = (doc) => {
    if (!doc) return '—';
    if (doc.length === 14) return doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    if (doc.length === 11) return doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    return doc;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Navigation */}
      <Link to={`/CadastroDetalhe?id=${merchantId}`} className="inline-flex items-center gap-2 text-sm text-[var(--pinbank-blue)]/60 hover:text-[var(--pinbank-blue)] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar ao Cadastro
      </Link>

      {/* Page Header */}
      <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${merchant.type === 'PJ' ? 'bg-blue-50' : 'bg-purple-50'}`}>
            {merchant.type === 'PJ' ? <Building2 className="w-6 h-6 text-blue-600" /> : <User className="w-6 h-6 text-purple-600" />}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[var(--pinbank-blue)]">
              Análise Completa — Validações Externas
            </h1>
            <p className="text-sm text-[var(--pinbank-blue)]/50">
              {merchant.companyName || merchant.fullName} • {formatDoc(merchant.cpfCnpj)} • {merchant.type}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200">
              <Fingerprint className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-700">{cafValidations.length + cafLogs.length} CAF</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
              <Database className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-700">{bdcValidations.length + bdcLogs.length} BDC</span>
            </div>
          </div>
        </div>
      </div>

      {/* [V5.2 Fase 6.4-B] Roteamento condicional:
          • Casos v5.2 → novo layout DOC6 (Hero Verdict + 4 abas)
          • Casos v4.0/v5.1 → layout V4 legado preservado 100% intacto */}
      {latestCase?.framework_version === 'v5.2' ? (
        <AnaliseCompletaV5_2
          merchant={merchant}
          latestCase={latestCase}
          latestScore={latestScore}
          cafValidations={cafValidations}
          cafLogs={cafLogs}
          bdcValidations={bdcValidations}
          bdcLogs={bdcLogs}
          integrationLogs={integrationLogs}
          validations={validations}
          responses={responses}
        />
      ) : (
        <>
          {/* 1. Resumo Executivo — linguagem de negócio */}
          <AnaliseResumoExecutivo
            merchant={merchant}
            latestCase={latestCase}
            latestScore={latestScore}
            cafValidations={cafValidations}
            cafLogs={cafLogs}
            bdcValidations={bdcValidations}
            bdcLogs={bdcLogs}
          />

          {/* 2. Análise de Risco V4 — Visão Microscópica com explicações */}
          <BdcV4AnalysisPanel latestScore={latestScore} />

          {/* 3. Análise Cruzada CAF + BDC */}
          <AnaliseCruzada
            merchant={merchant}
            cafValidations={cafValidations}
            cafLogs={cafLogs}
            bdcValidations={bdcValidations}
            bdcLogs={bdcLogs}
            responses={responses}
          />

          {/* 4. CAF — Todos os resultados microscópicos */}
          <AnaliseCafCompleta
            cafValidations={cafValidations}
            cafLogs={cafLogs}
            merchant={merchant}
            latestCase={latestCase}
          />

          {/* 5. BDC — Dados brutos por dataset */}
          <AnaliseBdcCompleta
            bdcValidations={bdcValidations}
            bdcLogs={bdcLogs}
            merchant={merchant}
            latestScore={latestScore}
            responses={responses}
          />

          {/* 6. Timeline de todas as integrações */}
          <AnaliseTimelineIntegracoes
            integrationLogs={integrationLogs}
            validations={validations}
          />
        </>
      )}
    </div>
  );
}