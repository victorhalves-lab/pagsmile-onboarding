import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, Lock, XCircle, Zap, Clock, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// V2 components — redesigned
import IntegrationTimeline from '@/components/compliance-v2/IntegrationTimeline';
import BDCFullAnalysis from '@/components/compliance-v2/BDCFullAnalysis';
import CAFFullAnalysis from '@/components/compliance-v2/CAFFullAnalysis';
import FindingsSectionV2 from '@/components/compliance-v2/FindingsSectionV2';
import SentinelReportV2 from '@/components/compliance-v2/SentinelReportV2';
import ConditionsSection from '@/components/compliance-v2/ConditionsSection';
import PointsAndFlags from '@/components/compliance-v2/PointsAndFlags';

// Existing components that are already good
import ComplianceScoreBreakdown from './ComplianceScoreBreakdown';
import ComplianceDecisionMatrix from './ComplianceDecisionMatrix';
import ComplianceCrossValidation from './ComplianceCrossValidation';
import ComplianceVariablesDetail from './ComplianceVariablesDetail';
import ComplianceMonitoringPanel from './ComplianceMonitoringPanel';
import DatasetResultsSummary from './DatasetResultsSummary';
import BDCDataConfidence from '@/components/bdc-enrichment/BDCDataConfidence';
import BDCRiskHeatmap from '@/components/bdc-enrichment/BDCRiskHeatmap';

function reconstructAnalysis(cs) {
  if (!cs?.variaveis_aplicadas) return null;
  return {
    type: cs.segmento === 'subseller_pf' ? 'PF' : 'PJ',
    templateModel: cs.segmento,
    datasetGroup: 'CACHED',
    datasetsQueried: 0,
    queryDate: cs.data_analise_fase_2,
    elapsedMs: 0,
    blocks: (cs.bloqueios_ativos || []).map(b => {
      const parts = b.split('_');
      return { code: parts[0] || 'B??', label: parts.slice(1).join(' '), severity: 'BLOQUEIO' };
    }),
    hasBlock: (cs.bloqueios_ativos || []).length > 0,
    sections: cs.variaveis_aplicadas,
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

const getRiskColor = (val, isV4) => {
  if (val == null) return 'text-gray-500';
  if (isV4) { if (val <= 200) return 'text-green-600'; if (val <= 400) return 'text-blue-600'; if (val <= 600) return 'text-amber-600'; return 'text-red-600'; }
  if (val >= 80) return 'text-green-600'; if (val >= 50) return 'text-amber-600'; return 'text-red-600';
};

const getRiskBg = (val, isV4) => {
  if (val == null) return 'bg-gray-50';
  if (isV4) { if (val <= 200) return 'bg-green-50'; if (val <= 400) return 'bg-blue-50'; if (val <= 600) return 'bg-amber-50'; return 'bg-red-50'; }
  if (val >= 80) return 'bg-green-50'; if (val >= 50) return 'bg-amber-50'; return 'bg-red-50';
};

export default function CadastroComplianceTab({ score, latestCase, allScores = [], allCases = [], allCaseIds = [], integrationLogs = [], validations = [] }) {
  // Fetch findings
  const { data: findings = [] } = useQuery({
    queryKey: ['cadastro-findings', allCaseIds],
    queryFn: async () => {
      if (!allCaseIds.length) return [];
      const results = await Promise.all(allCaseIds.map(id => base44.entities.ComplianceFinding.filter({ onboarding_case_id: id })));
      return results.flat();
    },
    enabled: allCaseIds.length > 0,
  });
  const scoreIds = allScores.map(s => s.id).filter(Boolean);
  const { data: findingsByScore = [] } = useQuery({
    queryKey: ['cadastro-findings-score', scoreIds],
    queryFn: async () => {
      if (!scoreIds.length) return [];
      const results = await Promise.all(scoreIds.map(id => base44.entities.ComplianceFinding.filter({ compliance_score_id: id })));
      return results.flat();
    },
    enabled: scoreIds.length > 0,
  });

  const allFindings = useMemo(() => {
    const map = new Map();
    [...findings, ...findingsByScore].forEach(f => map.set(f.id, f));
    return Array.from(map.values()).sort((a, b) => {
      const sev = { BLOQUEANTE: 0, CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4, INFO: 5 };
      return (sev[a.severidade] ?? 6) - (sev[b.severidade] ?? 6);
    });
  }, [findings, findingsByScore]);

  const bdcAnalysis = useMemo(() => reconstructAnalysis(score), [score]);

  if (!score && !latestCase) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-10 text-center mt-4">
        <Shield className="w-10 h-10 mx-auto mb-3 text-[var(--pagsmile-blue)]/20" />
        <p className="text-sm text-[var(--pagsmile-blue)]/50">Nenhuma análise de compliance disponível</p>
      </div>
    );
  }

  const scoreVal = score?.score_final ?? latestCase?.riskScoreV4 ?? score?.score_geral_composto ?? latestCase?.riskScore;
  const isV4 = score?.framework_version === 'v4.0' || score?.score_final != null || latestCase?.riskScoreV4 != null;
  const effectiveSubfaixa = score?.subfaixa || latestCase?.subfaixa;
  const effectiveSubfaixaNome = score?.subfaixa_nome || latestCase?.subfaixaNome;
  const effectiveRecomendacao = score?.recomendacao_final || latestCase?.iaDecision;
  const effectiveMonitoramento = score?.monitoramento_nivel || latestCase?.monitoramentoNivel;
  const effectiveConfianca = score?.nivel_confianca_ia;
  const findingsBySeverity = {
    BLOQUEANTE: allFindings.filter(f => f.severidade === 'BLOQUEANTE').length,
    CRITICAL: allFindings.filter(f => f.severidade === 'CRITICAL').length,
    HIGH: allFindings.filter(f => f.severidade === 'HIGH').length,
    MEDIUM: allFindings.filter(f => f.severidade === 'MEDIUM').length,
    LOW: allFindings.filter(f => f.severidade === 'LOW').length,
    INFO: allFindings.filter(f => f.severidade === 'INFO').length,
  };

  return (
    <div className="space-y-5 mt-4">
      {/* ═══ 1. HERO SCORE CARD ═══ */}
      {(score || latestCase?.riskScoreV4 != null) && (
        <div className={`rounded-xl border-2 overflow-hidden ${getRiskBg(scoreVal, isV4)}`}>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-[var(--pagsmile-green)]" />
              <h3 className="text-sm font-bold text-[var(--pagsmile-blue)]">Resumo Executivo — Análise de Risco</h3>
              {isV4 && <Badge className="bg-[var(--pagsmile-blue)] text-white text-[10px]">Framework v4.0</Badge>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 text-center border border-white/50">
                <p className={`text-3xl font-black ${getRiskColor(scoreVal, isV4)}`}>{scoreVal ?? '—'}</p>
                <p className="text-[10px] text-[var(--pagsmile-blue)]/50 font-bold">Score Final</p>
                {isV4 && <p className="text-[9px] text-[var(--pagsmile-blue)]/30">escala 0-1000</p>}
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 text-center border border-white/50">
                <p className="text-xl font-bold text-[var(--pagsmile-blue)]">{effectiveSubfaixa || '—'}</p>
                <p className="text-[10px] text-[var(--pagsmile-blue)]/50 font-bold">{effectiveSubfaixaNome || 'Subfaixa'}</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 text-center border border-white/50">
                <p className="text-sm font-bold text-[var(--pagsmile-blue)]">{effectiveRecomendacao || '—'}</p>
                <p className="text-[10px] text-[var(--pagsmile-blue)]/50 font-bold">Decisão</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 text-center border border-white/50">
                <p className="text-sm font-bold text-[var(--pagsmile-blue)]">{(effectiveMonitoramento || '').replace(/_/g, ' ') || '—'}</p>
                <p className="text-[10px] text-[var(--pagsmile-blue)]/50 font-bold">Monitoramento</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 text-center border border-white/50">
                <p className="text-sm font-bold text-[var(--pagsmile-blue)]">{effectiveConfianca != null ? `${effectiveConfianca}%` : '—'}</p>
                <p className="text-[10px] text-[var(--pagsmile-blue)]/50 font-bold">Confiança IA</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {score?.segmento && <Badge variant="outline" className="text-[10px]">Segmento: {score.segmento}</Badge>}
              {score?.is_pix && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Fluxo PIX</Badge>}
              {score?.decisao_automatica && <Badge className="bg-blue-100 text-blue-700 text-[10px]"><Zap className="w-3 h-3 mr-1" />Decisão Automática (Data-First v7)</Badge>}
              {!score?.decisao_automatica && ['4', '5'].includes(effectiveSubfaixa) && <Badge className="bg-red-100 text-red-700 text-[10px]">⚠️ Revisão Manual (Subfaixa 4+)</Badge>}
              {effectiveSubfaixa && ['3A', '3B'].includes(effectiveSubfaixa) && score?.decisao_automatica && <Badge className="bg-amber-100 text-amber-700 text-[10px]">Aprovado com Condições Rigorosas</Badge>}
              {(score?.rolling_reserve_percent > 0 || latestCase?.rollingReservePercent > 0) && <Badge className="bg-orange-100 text-orange-700 text-[10px]">Rolling Reserve: {score?.rolling_reserve_percent || latestCase?.rollingReservePercent}%</Badge>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 2. TIMELINE DE INTEGRAÇÕES ═══ */}
      <IntegrationTimeline integrationLogs={integrationLogs} validations={validations} />

      {/* ═══ 3. BIG DATA CORP — ANÁLISE COMPLETA ═══ */}
      <BDCFullAnalysis integrationLogs={integrationLogs} validations={validations} />

      {/* ═══ 4. CAF — ANÁLISE COMPLETA ═══ */}
      <CAFFullAnalysis integrationLogs={integrationLogs} validations={validations} />

      {/* ═══ 5. CROSS-VALIDATION ═══ */}
      {score?.cross_validation?.length > 0 && <ComplianceCrossValidation crossValidation={score.cross_validation} />}

      {/* ═══ 6. FINDINGS ═══ */}
      <FindingsSectionV2 findings={allFindings} findingsBySeverity={findingsBySeverity} />

      {/* ═══ 7. SCORE BREAKDOWN ═══ */}
      {score && <ComplianceScoreBreakdown score={score} />}

      {/* ═══ 8. CONDIÇÕES & RECOMENDAÇÕES ═══ */}
      <ConditionsSection score={score} latestCase={latestCase} />

      {/* ═══ 9. SENTINEL REPORT ═══ */}
      <SentinelReportV2 score={score} latestCase={latestCase} />

      {/* ═══ 10. PONTOS & RED FLAGS ═══ */}
      <PointsAndFlags score={score} />

      {/* ═══ 11. BLOQUEIOS ═══ */}
      {score?.bloqueios_ativos?.length > 0 && (
        <div className="bg-red-50 rounded-xl border-2 border-red-200 p-5">
          <h3 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4" />Bloqueios Ativos ({score.bloqueios_ativos.length})
          </h3>
          <p className="text-[11px] text-red-600/70 mb-3">Bloqueios B01-B10 elevam o score a 850+ (Subfaixa 5 — Bloqueio Total).</p>
          <div className="space-y-2">
            {score.bloqueios_ativos.map((b, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-red-100/50 rounded-lg">
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-700">{b}</p>
                  <p className="text-[11px] text-red-600/60 mt-0.5">Requer resolução antes do desbloqueio</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ 12. DATA CONFIDENCE & HEATMAP ═══ */}
      <BDCDataConfidence analysis={bdcAnalysis} analiseDimensional={score?.analise_dimensional} />
      <BDCRiskHeatmap analysis={bdcAnalysis} analiseDimensional={score?.analise_dimensional} />

      {/* ═══ 13. DECISION MATRIX ═══ */}
      {score && <ComplianceDecisionMatrix score={score} />}

      {/* ═══ 14. DATASET RESULTS (legacy) ═══ */}
      <DatasetResultsSummary score={score} />

      {/* ═══ 15. VARIABLES V4 ═══ */}
      {score && <ComplianceVariablesDetail score={score} />}

      {/* ═══ 16. MONITORING ═══ */}
      {score && <ComplianceMonitoringPanel score={score} />}

      {/* ═══ 17. OVERRIDES ═══ */}
      {score?.overrides_aplicados?.length > 0 && (
        <div className="bg-purple-50 rounded-xl border-2 border-purple-200 p-5">
          <h3 className="text-sm font-bold text-purple-700 mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" />Overrides Aplicados ({score.overrides_aplicados.length})
          </h3>
          <ul className="space-y-1.5">
            {score.overrides_aplicados.map((o, i) => (
              <li key={i} className="text-xs text-purple-700/80 p-2.5 bg-purple-100/50 rounded-lg">{o}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ═══ 18. HISTÓRICO ═══ */}
      {allCases.length > 1 && (
        <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
          <h3 className="text-sm font-bold text-[var(--pagsmile-blue)] mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--pagsmile-green)]" />Histórico de Casos ({allCases.length})
          </h3>
          <div className="space-y-2">
            {[...allCases].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(c => {
              const cs = allScores.find(s => s.onboarding_case_id === c.id);
              return (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-xs">
                  <div className="flex items-center gap-3">
                    <Shield className="w-3.5 h-3.5 text-[var(--pagsmile-blue)]/30" />
                    <span className="font-medium">{c.status}</span>
                    {c.subfaixaNome && <Badge variant="outline" className="text-[10px]">{c.subfaixaNome}</Badge>}
                    {(c.riskScoreV4 ?? cs?.score_final) != null && (
                      <span className={`font-bold ${getRiskColor(c.riskScoreV4 ?? cs?.score_final, true)}`}>V4: {c.riskScoreV4 ?? cs?.score_final}</span>
                    )}
                  </div>
                  <span className="text-[var(--pagsmile-blue)]/40">{new Date(c.created_date).toLocaleDateString('pt-BR')}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}