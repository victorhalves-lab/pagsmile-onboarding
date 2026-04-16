import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Shield, AlertTriangle, CheckCircle2, XCircle, Info, ChevronDown, ChevronRight,
  TrendingUp, TrendingDown, Lock, Eye, BarChart3, Target, Zap, Clock, 
  ArrowUpRight, Activity, Gauge, Search, FileWarning, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ComplianceFindingsSection from './ComplianceFindingsSection';
import ComplianceVariablesDetail from './ComplianceVariablesDetail';
import ComplianceScoreBreakdown from './ComplianceScoreBreakdown';
import ComplianceMonitoringPanel from './ComplianceMonitoringPanel';
import ComplianceDecisionMatrix from './ComplianceDecisionMatrix';
import ComplianceCrossValidation from './ComplianceCrossValidation';
import SentinelAnalysisPanel from '@/components/compliance/SentinelAnalysisPanel';
import SentinelTextFormatter from '@/components/compliance/SentinelTextFormatter';
import DatasetResultsSummary from './DatasetResultsSummary';
import CafResultsSummaryBusiness from './CafResultsSummaryBusiness';
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

export default function CadastroComplianceTab({ score, latestCase, allScores = [], allCases = [], allCaseIds = [], integrationLogs = [], validations = [] }) {
  const [activeSection, setActiveSection] = useState(null);

  // Fetch findings for all cases
  const { data: findings = [] } = useQuery({
    queryKey: ['cadastro-findings', allCaseIds],
    queryFn: async () => {
      if (!allCaseIds.length) return [];
      const results = await Promise.all(allCaseIds.map(id => base44.entities.ComplianceFinding.filter({ onboarding_case_id: id })));
      return results.flat();
    },
    enabled: allCaseIds.length > 0,
  });

  // Also fetch findings by score id
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

  // Merge and dedupe findings
  const allFindings = React.useMemo(() => {
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

  const toggleSection = (id) => setActiveSection(prev => prev === id ? null : id);

  // Compute risk level color
  const getRiskColor = (val, isV4 = true) => {
    if (val == null) return 'text-gray-500';
    if (isV4) {
      if (val <= 200) return 'text-green-600';
      if (val <= 400) return 'text-blue-600';
      if (val <= 600) return 'text-amber-600';
      return 'text-red-600';
    }
    if (val >= 80) return 'text-green-600';
    if (val >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getRiskBg = (val, isV4 = true) => {
    if (val == null) return 'bg-gray-50';
    if (isV4) {
      if (val <= 200) return 'bg-green-50';
      if (val <= 400) return 'bg-blue-50';
      if (val <= 600) return 'bg-amber-50';
      return 'bg-red-50';
    }
    if (val >= 80) return 'bg-green-50';
    if (val >= 50) return 'bg-amber-50';
    return 'bg-red-50';
  };

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
    <div className="space-y-4 mt-4">
      {/* ═══ Hero Score Card ═══ */}
      {(score || latestCase?.riskScoreV4 != null) && (
        <div className={`rounded-xl border overflow-hidden ${getRiskBg(scoreVal, isV4)}`}>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-[var(--pagsmile-green)]" />
              <h3 className="text-sm font-bold text-[var(--pagsmile-blue)]">Análise de Risco Completa</h3>
              {isV4 && <Badge className="bg-[var(--pagsmile-blue)] text-white text-[10px]">Framework v4.0</Badge>}
            </div>
            
            {/* Main Score Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
              <div className="bg-white/80 backdrop-blur rounded-lg p-3 text-center border border-white/50">
                <p className={`text-3xl font-black ${getRiskColor(scoreVal, isV4)}`}>{scoreVal ?? '—'}</p>
                <p className="text-[10px] text-[var(--pagsmile-blue)]/50 font-medium">Score Final</p>
                {isV4 && <p className="text-[9px] text-[var(--pagsmile-blue)]/30">escala 0-1000</p>}
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-3 text-center border border-white/50">
                <p className="text-xl font-bold text-[var(--pagsmile-blue)]">{effectiveSubfaixa || '—'}</p>
                <p className="text-[10px] text-[var(--pagsmile-blue)]/50 font-medium">{effectiveSubfaixaNome || 'Subfaixa'}</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-3 text-center border border-white/50">
                <p className="text-sm font-bold text-[var(--pagsmile-blue)]">{effectiveRecomendacao || '—'}</p>
                <p className="text-[10px] text-[var(--pagsmile-blue)]/50 font-medium">Recomendação</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-3 text-center border border-white/50">
                <p className="text-sm font-bold text-[var(--pagsmile-blue)]">{(effectiveMonitoramento || '').replace(/_/g, ' ') || '—'}</p>
                <p className="text-[10px] text-[var(--pagsmile-blue)]/50 font-medium">Monitoramento</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-3 text-center border border-white/50">
                <p className="text-sm font-bold text-[var(--pagsmile-blue)]">{effectiveConfianca != null ? `${effectiveConfianca}%` : '—'}</p>
                <p className="text-[10px] text-[var(--pagsmile-blue)]/50 font-medium">Confiança IA</p>
              </div>
            </div>

            {/* Extra context */}
            <div className="flex flex-wrap gap-2 text-xs">
              {score?.segmento && <Badge variant="outline" className="text-[10px]">Segmento: {score.segmento}</Badge>}
              {score?.is_pix && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Fluxo PIX</Badge>}
              {score?.decisao_automatica && <Badge className="bg-blue-100 text-blue-700 text-[10px]"><Zap className="w-3 h-3 mr-1" />Decisão Automática (Data-First v7)</Badge>}
              {!score?.decisao_automatica && (effectiveSubfaixa === '4' || effectiveSubfaixa === '5') && <Badge className="bg-red-100 text-red-700 text-[10px]">⚠️ Revisão Manual (Subfaixa 4+)</Badge>}
              {effectiveSubfaixa && ['3A','3B'].includes(effectiveSubfaixa) && score?.decisao_automatica && <Badge className="bg-amber-100 text-amber-700 text-[10px]">Aprovado com Condições Rigorosas</Badge>}
              {(score?.rolling_reserve_percent > 0 || latestCase?.rollingReservePercent > 0) && <Badge className="bg-orange-100 text-orange-700 text-[10px]">Rolling Reserve: {score?.rolling_reserve_percent || latestCase?.rollingReservePercent}%</Badge>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Data Confidence — Which datasets returned data ═══ */}
      <BDCDataConfidence analysis={bdcAnalysis} analiseDimensional={score?.analise_dimensional} />

      {/* ═══ Risk Heatmap — Radar by dimension ═══ */}
      <BDCRiskHeatmap analysis={bdcAnalysis} analiseDimensional={score?.analise_dimensional} />

      {/* ═══ Decision Matrix (7 Dimensions) ═══ */}
      {score && <ComplianceDecisionMatrix score={score} />}

      {/* ═══ Cross-Validation Declarado vs Confirmado ═══ */}
      {score?.cross_validation?.length > 0 && <ComplianceCrossValidation crossValidation={score.cross_validation} />}

      {/* ═══ Score Breakdown (3 Layers) ═══ */}
      {score && <ComplianceScoreBreakdown score={score} />}

      {/* ═══ Findings Section ═══ */}
      <ComplianceFindingsSection findings={allFindings} findingsBySeverity={findingsBySeverity} />

      {/* ═══ SENTINEL Analysis — Formatted ═══ */}
      <SentinelAnalysisPanel score={score} latestCase={latestCase} />

      {/* ═══ Dataset Results Summary — What each BDC dataset found ═══ */}
      <DatasetResultsSummary score={score} />

      {/* ═══ CAF Results — Business Language ═══ */}
      <CafResultsSummaryBusiness integrationLogs={integrationLogs} validations={validations} />

      {/* ═══ Bloqueios Ativos ═══ */}
      {score?.bloqueios_ativos?.length > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-5">
          <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Bloqueios Ativos ({score.bloqueios_ativos.length})
          </h3>
          <p className="text-xs text-red-600/70 mb-3">Bloqueios B01-B10 são condições automáticas que elevam o score a 850+ (Subfaixa 5 — Bloqueio Total).</p>
          <div className="space-y-2">
            {score.bloqueios_ativos.map((b, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-red-100/50 rounded-lg">
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-700">{b}</p>
                  <p className="text-[11px] text-red-600/60 mt-0.5">Requer resolução antes do desbloqueio</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Pontos Positivos / Atenção / Red Flags ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {score?.pontos_positivos?.length > 0 && (
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <h3 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Pontos Positivos ({score.pontos_positivos.length})
            </h3>
            <ul className="space-y-1.5">
              {score.pontos_positivos.map((p, i) => (
                <li key={i} className="text-xs text-green-700/80 flex items-start gap-2 p-2 bg-green-100/40 rounded-lg">
                  <TrendingDown className="w-3 h-3 flex-shrink-0 mt-0.5 text-green-500" />
                  <span>{cleanFlagText(p)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {score?.pontos_atencao?.length > 0 && (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Pontos de Atenção ({score.pontos_atencao.length})
            </h3>
            <ul className="space-y-1.5">
              {score.pontos_atencao.map((p, i) => (
                <li key={i} className="text-xs text-amber-700/80 flex items-start gap-2 p-2 bg-amber-100/40 rounded-lg">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5 text-amber-500" />
                  <span>{cleanFlagText(p)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {score?.red_flags?.length > 0 && (
          <div className="bg-red-50 rounded-xl border border-red-200 p-4 md:col-span-2">
            <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Red Flags ({score.red_flags.length})
            </h3>
            <div className="space-y-2">
              {score.red_flags.map((r, i) => {
                const { source, text } = parseRedFlag(r);
                return (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 bg-red-100/40 rounded-lg">
                    <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-red-700/90 leading-relaxed">{text}</p>
                      {source && (
                        <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded bg-red-100 text-[9px] font-medium text-red-600 border border-red-200">
                          Fonte: {source}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Condições Automáticas ═══ */}
      {(latestCase?.condicoesAutomaticas?.length > 0 || score?.condicoes_automaticas?.length > 0) && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
          <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Condições Automáticas Aplicadas
          </h3>
          <p className="text-xs text-amber-600/70 mb-3">Condições impostas pelo framework de risco para este nível de classificação.</p>
          <ul className="space-y-1.5">
            {(score?.condicoes_automaticas || latestCase?.condicoesAutomaticas || []).map((c, i) => (
              <li key={i} className="text-xs text-amber-700/80 flex items-start gap-2 p-2 bg-amber-100/50 rounded-lg">
                <Target className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ═══ Variables V4 Detail ═══ */}
      {score && <ComplianceVariablesDetail score={score} />}

      {/* ═══ Monitoring & Reserves ═══ */}
      {score && <ComplianceMonitoringPanel score={score} />}

      {/* ═══ Manual Review Recommendations ═══ */}
      {(score?.recomendacoes_revisao_manual || score?.perguntas_sugeridas?.length > 0 || score?.documentos_adicionais_sugeridos?.length > 0) && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
          <h3 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Recomendações para Revisão Manual
          </h3>
          
          {score.recomendacoes_revisao_manual && (
            <div className="mb-3">
              <SentinelTextFormatter text={score.recomendacoes_revisao_manual} />
            </div>
          )}
          
          {score.perguntas_sugeridas?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-blue-700 mb-1.5">Perguntas Sugeridas ao Merchant</p>
              <ul className="space-y-1">
                {score.perguntas_sugeridas.map((q, i) => (
                  <li key={i} className="text-xs text-blue-700/70 p-2 bg-blue-100/50 rounded-lg flex items-start gap-2">
                    <Search className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {score.documentos_adicionais_sugeridos?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-1.5">Documentos Adicionais Sugeridos</p>
              <ul className="space-y-1">
                {score.documentos_adicionais_sugeridos.map((d, i) => (
                  <li key={i} className="text-xs text-blue-700/70 p-2 bg-blue-100/50 rounded-lg flex items-start gap-2">
                    <FileWarning className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ═══ Cases Timeline ═══ */}
      {allCases.length > 1 && (
        <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
          <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--pagsmile-green)]" />
            Histórico de Casos ({allCases.length})
          </h3>
          <div className="space-y-2">
            {[...allCases].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(c => {
              const caseScore = allScores.find(s => s.onboarding_case_id === c.id);
              return (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-xs">
                  <div className="flex items-center gap-3">
                    <Shield className="w-3.5 h-3.5 text-[var(--pagsmile-blue)]/30" />
                    <span className="font-medium">{c.status}</span>
                    {c.subfaixaNome && <Badge variant="outline" className="text-[10px]">{c.subfaixaNome}</Badge>}
                    {(c.riskScoreV4 ?? caseScore?.score_final) != null && (
                      <span className={`font-bold ${getRiskColor(c.riskScoreV4 ?? caseScore?.score_final, true)}`}>
                        V4: {c.riskScoreV4 ?? caseScore?.score_final}
                      </span>
                    )}
                  </div>
                  <span className="text-[var(--pagsmile-blue)]/40">{new Date(c.created_date).toLocaleDateString('pt-BR')}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Score Overrides ═══ */}
      {score?.overrides_aplicados?.length > 0 && (
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
          <h3 className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Overrides Aplicados ({score.overrides_aplicados.length})
          </h3>
          <ul className="space-y-1.5">
            {score.overrides_aplicados.map((o, i) => (
              <li key={i} className="text-xs text-purple-700/80 p-2 bg-purple-100/50 rounded-lg">{o}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ═══ Utility: Clean flag text — removes "SENTINEL: ", "V4: " prefixes and [FONTE:...] brackets ═══
function cleanFlagText(text) {
  if (!text) return '';
  return text
    .replace(/^(SENTINEL|V4|CAF):\s*/i, '')
    .replace(/\[FONTE:\s*[^\]]+\]\s*/gi, '')
    .replace(/\[([^\]]+)\]/g, '($1)')
    .trim();
}

function parseRedFlag(text) {
  if (!text) return { source: '', text: '' };
  // Extract source prefix (V4:, SENTINEL:, CAF:)
  const prefixMatch = text.match(/^(SENTINEL|V4|CAF):\s*/i);
  const prefix = prefixMatch ? prefixMatch[1].toUpperCase() : '';
  let cleaned = prefixMatch ? text.slice(prefixMatch[0].length) : text;
  
  // Extract [FONTE: ...] 
  let source = prefix;
  const fonteMatch = cleaned.match(/\[FONTE:\s*([^\]]+)\]/i);
  if (fonteMatch) {
    source = (prefix ? prefix + ' — ' : '') + fonteMatch[1].trim();
    cleaned = cleaned.replace(fonteMatch[0], '').trim();
  }
  
  // Clean remaining brackets
  cleaned = cleaned.replace(/\[([^\]]+)\]/g, '($1)').trim();
  
  return { source, text: cleaned };
}