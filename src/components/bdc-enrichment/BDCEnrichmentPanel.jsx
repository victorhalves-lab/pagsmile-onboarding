import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { 
  Loader2, RefreshCw, Building2, Users, Globe, Shield, 
  TrendingUp, Newspaper, Database, User,
  AlertOctagon, Phone
} from 'lucide-react';
import BDCScoreHeader from './BDCScoreHeader';
import BDCAnalysisSection from './BDCAnalysisSection';
import BDCContactsSection from './BDCContactsSection';
import BDCNarrativeReport from './BDCNarrativeReport';

export default function BDCEnrichmentPanel({ onboardingCaseId, merchant, complianceScore, onComplete, rawBdcResult }) {
  const [isRunning, setIsRunning] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [latestRawResult, setLatestRawResult] = useState(rawBdcResult || null);

  // Check if we have cached analysis in complianceScore
  const hasCachedAnalysis = complianceScore?.variaveis_aplicadas && complianceScore?.framework_version === 'v4.0' && complianceScore?.fase_2_completa;

  const runEnrichment = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('bdcEnrichCase', { onboardingCaseId });
      if (res.data?.error) throw new Error(res.data.error);
      setAnalysis(res.data.analysis);
      // Fetch fresh raw data after enrichment
      try {
        const validations = await base44.entities.ExternalValidationResult.filter(
          { onboardingCaseId, provider: 'BigDataCorp' }, '-created_date', 1
        );
        if (validations[0]?.resultData) setLatestRawResult(validations[0].resultData);
      } catch (_e) { /* ok */ }
      if (onComplete) onComplete();
    } catch (e) {
      console.error('BDC Enrichment error:', e);
      setError(e.message || 'Erro ao executar enriquecimento');
    }
    setIsRunning(false);
  };

  // Reconstruct analysis from cached complianceScore
  const displayAnalysis = analysis || (hasCachedAnalysis ? reconstructFromCache(complianceScore) : null);

  if (!displayAnalysis) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 inline-block mb-4">
            <Database className="w-10 h-10 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-[#002443] mb-2">Enriquecimento Big Data Corp</h3>
          <p className="text-sm text-[#002443]/60 mb-1">
            Consulta automática a 34 datasets da BDC para validar dados declarados, 
            identificar riscos ocultos e gerar score de compliance.
          </p>
          <p className="text-xs text-[#002443]/40 mb-6">
            {merchant?.type === 'PF' ? 'Endpoint: /pessoas (CPF)' : 'Endpoint: /empresas (CNPJ)'} — 
            Documento: {merchant?.cpfCnpj || 'N/D'}
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertOctagon className="w-4 h-4 inline mr-1" />
              {error}
            </div>
          )}
          <Button 
            onClick={runEnrichment} 
            disabled={isRunning || !merchant?.cpfCnpj}
            className="bg-[#002443] hover:bg-[#003366] text-white px-6 py-2.5 rounded-xl"
          >
            {isRunning ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Consultando BDC... (pode levar até 30s)</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-2" /> Executar Enriquecimento BDC</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  const isPF = displayAnalysis.type === 'PF';

  return (
    <div className="space-y-4">
      {/* Score Header */}
      <BDCScoreHeader analysis={displayAnalysis} />

      {/* Narrative Report — clear human-readable analysis */}
      <BDCNarrativeReport analysis={displayAnalysis} complianceScore={complianceScore} />

      {/* Re-run button */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={runEnrichment} 
          disabled={isRunning}
          className="text-xs rounded-lg border-slate-200"
        >
          {isRunning ? (
            <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Reconsultando...</>
          ) : (
            <><RefreshCw className="w-3 h-3 mr-1" /> Reconsultar BDC</>
          )}
        </Button>
      </div>

      {/* Analysis Sections */}
      {isPF ? (
        <>
          <BDCAnalysisSection 
            title="Identificação Pessoal" 
            icon={User} 
            items={displayAnalysis.sections?.identity?.items} 
            score={displayAnalysis.sections?.identity?.score} 
            accentColor="blue"
            defaultOpen={true}
          />
          <BDCAnalysisSection 
            title="Compliance / PLD / Processos" 
            icon={Shield} 
            items={displayAnalysis.sections?.compliance?.items} 
            score={displayAnalysis.sections?.compliance?.score} 
            accentColor="red"
            defaultOpen={true}
          />
          <BDCAnalysisSection 
            title="Reputação / Adverse Media" 
            icon={Newspaper} 
            items={displayAnalysis.sections?.reputation?.items} 
            score={displayAnalysis.sections?.reputation?.score} 
            accentColor="amber"
            defaultOpen={displayAnalysis.sections?.reputation?.score > 0}
          />
        </>
      ) : (
        <>
          <BDCAnalysisSection 
            title="Dados Cadastrais / Identificação" 
            icon={Building2} 
            items={displayAnalysis.sections?.identity?.items} 
            score={displayAnalysis.sections?.identity?.score} 
            accentColor="blue"
            defaultOpen={true}
          />
          <BDCAnalysisSection 
            title="Quadro Societário (QSA) / UBOs" 
            icon={Users} 
            items={displayAnalysis.sections?.owners?.items} 
            score={displayAnalysis.sections?.owners?.score} 
            accentColor="violet"
            defaultOpen={displayAnalysis.sections?.owners?.pepFound?.length > 0 || displayAnalysis.sections?.owners?.sanctionedFound?.length > 0}
          />
          <BDCAnalysisSection 
            title="Presença Digital / Atividade" 
            icon={Globe} 
            items={displayAnalysis.sections?.digital?.items} 
            score={displayAnalysis.sections?.digital?.score} 
            accentColor="cyan"
            defaultOpen={false}
          />
          <BDCAnalysisSection 
            title="Compliance / PLD / Sanções" 
            icon={Shield} 
            items={displayAnalysis.sections?.compliance?.items} 
            score={displayAnalysis.sections?.compliance?.score} 
            accentColor="red"
            defaultOpen={true}
          />
          <BDCAnalysisSection 
            title="Reputação / Adverse Media" 
            icon={Newspaper} 
            items={displayAnalysis.sections?.reputation?.items} 
            score={displayAnalysis.sections?.reputation?.score} 
            accentColor="amber"
            defaultOpen={displayAnalysis.sections?.reputation?.score > 0}
          />
          <BDCAnalysisSection 
            title="Indicadores Financeiros / Mercado" 
            icon={TrendingUp} 
            items={displayAnalysis.sections?.financial?.items} 
            score={displayAnalysis.sections?.financial?.score} 
            accentColor="emerald"
            defaultOpen={false}
          />
        </>
      )}

      {/* Contacts, Addresses, History — from raw BDC data */}
      {latestRawResult && (
        <BDCContactsSection rawResult={latestRawResult} />
      )}
    </div>
  );
}

function reconstructFromCache(cs) {
  if (!cs?.variaveis_aplicadas) return null;
  const sections = cs.variaveis_aplicadas;
  return {
    type: cs.segmento === 'subseller_pf' ? 'PF' : 'PJ',
    document: '',
    templateModel: cs.segmento,
    datasetGroup: 'CACHED',
    datasetsQueried: 0,
    queryDate: cs.data_analise_fase_2,
    elapsedMs: 0,
    blocks: (cs.bloqueios_ativos || []).map(b => {
      const parts = b.split('_');
      return { code: parts[0] || 'B??', label: parts.slice(1).join(' '), severity: 'BLOQUEIO', detail: '', score: 850 };
    }),
    hasBlock: (cs.bloqueios_ativos || []).length > 0,
    sections,
    scoring: {
      baseScore: cs.score_base_segmento || 0,
      variablesScore: cs.score_variaveis || 0,
      enrichmentScore: cs.score_enriquecimento || 0,
      finalScore: cs.score_final || 0,
      subfaixa: cs.subfaixa || '4',
      subfaixaNome: cs.subfaixa_nome || 'N/D',
    },
  };
}