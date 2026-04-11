import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Shield, TrendingUp, TrendingDown, RefreshCw, Clock, AlertTriangle,
  CheckCircle2, AlertOctagon, Zap, Info, Lock, Eye, Activity
} from 'lucide-react';

const SUBFAIXA_CONFIG = {
  '1A': { label: 'VERDE EXPRESS', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgLight: 'bg-emerald-50', border: 'border-emerald-200', recommendation: 'APROVAÇÃO AUTOMÁTICA', recIcon: CheckCircle2, recColor: 'text-emerald-700' },
  '1B': { label: 'VERDE', color: 'bg-emerald-400', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50', border: 'border-emerald-200', recommendation: 'APROVAÇÃO AUTOMÁTICA', recIcon: CheckCircle2, recColor: 'text-emerald-700' },
  '2A': { label: 'AZUL LEVE', color: 'bg-blue-400', textColor: 'text-blue-700', bgLight: 'bg-blue-50', border: 'border-blue-200', recommendation: 'APROVAÇÃO COM CONDIÇÕES LEVES', recIcon: Zap, recColor: 'text-blue-700' },
  '2B': { label: 'AZUL', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50', border: 'border-blue-200', recommendation: 'APROVAÇÃO COM CONDIÇÕES', recIcon: Zap, recColor: 'text-blue-700' },
  '3A': { label: 'AMARELO', color: 'bg-amber-400', textColor: 'text-amber-700', bgLight: 'bg-amber-50', border: 'border-amber-200', recommendation: 'REVISÃO MANUAL RECOMENDADA', recIcon: AlertTriangle, recColor: 'text-amber-700' },
  '3B': { label: 'LARANJA', color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-50', border: 'border-orange-200', recommendation: 'REVISÃO MANUAL OBRIGATÓRIA', recIcon: AlertTriangle, recColor: 'text-orange-700' },
  '4': { label: 'VERMELHO', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50', border: 'border-red-200', recommendation: 'REVISÃO MANUAL CRÍTICA', recIcon: AlertOctagon, recColor: 'text-red-700' },
  '5': { label: 'BLOQUEIO', color: 'bg-red-700', textColor: 'text-red-800', bgLight: 'bg-red-50', border: 'border-red-300', recommendation: 'BLOQUEIO — RECUSA AUTOMÁTICA', recIcon: Lock, recColor: 'text-red-800' },
};

function ScoreDecompositionBar({ c1, c2, c3, total }) {
  if (c1 == null) return null;
  const max = 849;
  const safeTotal = Math.min(total || 0, max);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] text-[#002443]/50">
        <span className="font-bold uppercase tracking-wider">Decomposição do Score</span>
        <span className="text-[#002443]/30">—</span>
        <span>C1 (Base) + C2 (Variáveis) + C3 (Enriquecimento)</span>
      </div>
      <div className="w-full h-6 bg-slate-100 rounded-full overflow-hidden flex">
        {c1 > 0 && (
          <div
            className="h-full bg-slate-400 flex items-center justify-center text-[9px] text-white font-bold"
            style={{ width: `${(c1 / max) * 100}%`, minWidth: c1 > 0 ? '30px' : 0 }}
            title={`C1 Base Segmento: ${c1}`}
          >
            C1: {c1}
          </div>
        )}
        {c2 != null && c2 !== 0 && (
          <div
            className={`h-full flex items-center justify-center text-[9px] font-bold ${c2 > 0 ? 'bg-amber-400 text-amber-900' : 'bg-emerald-400 text-emerald-900'}`}
            style={{ width: `${(Math.abs(c2) / max) * 100}%`, minWidth: '30px' }}
            title={`C2 Variáveis: ${c2 > 0 ? '+' : ''}${c2}`}
          >
            C2: {c2 > 0 ? '+' : ''}{c2}
          </div>
        )}
        {c3 != null && c3 !== 0 && (
          <div
            className={`h-full flex items-center justify-center text-[9px] font-bold ${c3 > 0 ? 'bg-orange-400 text-orange-900' : 'bg-teal-400 text-teal-900'}`}
            style={{ width: `${(Math.abs(c3) / max) * 100}%`, minWidth: '30px' }}
            title={`C3 Enriquecimento: ${c3 > 0 ? '+' : ''}${c3}`}
          >
            C3: {c3 > 0 ? '+' : ''}{c3}
          </div>
        )}
      </div>
      <div className="flex gap-4 text-[10px]">
        <span className="text-slate-500"><span className="inline-block w-2 h-2 rounded-full bg-slate-400 mr-1" />C1 Base Segmento: <strong>{c1}</strong></span>
        <span className={c2 > 0 ? 'text-amber-600' : 'text-emerald-600'}><span className={`inline-block w-2 h-2 rounded-full mr-1 ${c2 > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />C2 Variáveis: <strong>{c2 > 0 ? '+' : ''}{c2}</strong></span>
        <span className={c3 > 0 ? 'text-orange-600' : 'text-teal-600'}><span className={`inline-block w-2 h-2 rounded-full mr-1 ${c3 > 0 ? 'bg-orange-400' : 'bg-teal-400'}`} />C3 Enriquecimento: <strong>{c3 > 0 ? '+' : ''}{c3}</strong></span>
      </div>
    </div>
  );
}

export default function UnifiedScoreHeader({ onboardingCase, complianceScore, validations }) {
  const currentScore = onboardingCase?.riskScoreV4;
  const currentSubfaixa = onboardingCase?.subfaixa;
  const config = SUBFAIXA_CONFIG[currentSubfaixa] || SUBFAIXA_CONFIG['4'];
  const RecIcon = config.recIcon;

  // Revalidation delta
  const revalidations = (validations || [])
    .filter(v => v.provider === 'BigDataCorp' && v.validationType === 'Revalidação BDC' && v.resultData?.scoreDelta != null)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const latestReval = revalidations[0];
  const lastDelta = latestReval?.resultData?.scoreDelta || 0;
  const lastRevalDate = latestReval?.created_date;
  const originalScore = latestReval?.resultData?.oldScore;

  // Score layers
  const c1 = complianceScore?.score_base_segmento;
  const c2 = complianceScore?.score_variaveis;
  const c3 = complianceScore?.score_enriquecimento;
  const bloqueios = onboardingCase?.bloqueiosAtivos || complianceScore?.bloqueios_ativos || [];
  const condicoes = onboardingCase?.condicoesAutomaticas || complianceScore?.condicoes_automaticas || [];
  const monitoramento = onboardingCase?.monitoramentoNivel || complianceScore?.monitoramento_nivel;
  const rollingReserve = onboardingCase?.rollingReservePercent || complianceScore?.rolling_reserve_percent || 0;
  const segmento = complianceScore?.segmento;

  const pct = currentScore != null ? Math.min(100, (currentScore / 849) * 100) : 0;

  // Fallback: if V4 score not available, show IA recommendation from ComplianceScore
  if (currentScore == null && !complianceScore) {
    return (
      <div className="bg-white rounded-2xl border border-[#002443]/8 p-6 text-center">
        <Shield className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-semibold text-[#002443]/60">Score de Risco não disponível</p>
        <p className="text-xs text-[#002443]/40 mt-1">Execute o Risk Scoring V4 para gerar a análise unificada</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#002443]/8 overflow-hidden">
      <div className={`h-2 ${config.color}`} />
      <div className="p-6 space-y-5">
        {/* Top row: Title + revalidation badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${config.bgLight}`}>
              <Shield className={`w-6 h-6 ${config.textColor}`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#002443]">Score de Risco Unificado</h3>
              <p className="text-xs text-[#002443]/40 mt-0.5">
                Framework V4 • 3 Camadas • Score 0–849
                {segmento && <> • Segmento: <strong className="text-[#002443]/60">{segmento}</strong></>}
              </p>
            </div>
          </div>
          {lastRevalDate && (
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">
                Revalidado {new Date(lastRevalDate).toLocaleDateString('pt-BR')}
              </span>
              {lastDelta !== 0 && (
                <span className={`text-xs font-mono font-bold ${lastDelta > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ({lastDelta >= 0 ? '+' : ''}{lastDelta})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Score + Subfaixa + Recommendation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Score card */}
          <div className={`p-5 rounded-xl ${config.bgLight} border ${config.border}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/50 mb-2">Score Final</p>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-4xl font-black ${config.textColor}`}>{currentScore ?? '—'}</span>
              <span className="text-sm text-[#002443]/30 font-medium">/849</span>
            </div>
            <div className="w-full h-2.5 bg-white/60 rounded-full mt-3 overflow-hidden">
              <div className={`h-full rounded-full ${config.color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-[#002443]/40 mt-1.5">0 = risco mínimo • 849 = risco máximo</p>
            {lastDelta !== 0 && originalScore != null && (
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#002443]/5">
                {lastDelta > 0 ? <TrendingUp className="w-3.5 h-3.5 text-red-500" /> : <TrendingDown className="w-3.5 h-3.5 text-green-500" />}
                <span className="text-[10px] text-[#002443]/50">Score anterior: {originalScore}</span>
                <span className={`text-[10px] font-mono font-bold ${lastDelta > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {lastDelta >= 0 ? '+' : ''}{lastDelta}
                </span>
              </div>
            )}
          </div>

          {/* Subfaixa + Monitoramento */}
          <div className="p-5 rounded-xl bg-[#f4f4f4] border border-[#002443]/5 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/50 mb-2">Classificação</p>
              <Badge className={`${config.bgLight} ${config.textColor} ${config.border} border text-base font-black px-4 py-1.5`}>
                {currentSubfaixa || '—'} — {config.label}
              </Badge>
            </div>
            <div className="mt-3 space-y-1.5">
              {monitoramento && (
                <div className="flex items-center gap-1.5 text-xs text-[#002443]/60">
                  <Eye className="w-3.5 h-3.5 text-[#002443]/40" />
                  <span>Monitoramento: <strong>{monitoramento}</strong></span>
                </div>
              )}
              {rollingReserve > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Rolling Reserve: <strong>{rollingReserve}%</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Recommendation */}
          <div className={`p-5 rounded-xl ${config.bgLight} border ${config.border} flex flex-col justify-between`}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/50 mb-2">Recomendação Framework</p>
              <div className="flex items-center gap-2">
                <RecIcon className={`w-5 h-5 ${config.recColor}`} />
                <span className={`text-sm font-bold ${config.recColor}`}>{config.recommendation}</span>
              </div>
            </div>
            {complianceScore?.recomendacao_final && (
              <div className="mt-3 pt-3 border-t border-[#002443]/10">
                <p className="text-[10px] text-[#002443]/40 mb-0.5">Recomendação IA SENTINEL:</p>
                <span className="text-xs font-semibold text-[#002443]/70">{complianceScore.recomendacao_final}</span>
                {complianceScore.nivel_confianca_ia && (
                  <span className="text-[10px] text-[#002443]/40 ml-2">({complianceScore.nivel_confianca_ia}% confiança)</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Score Decomposition Bar */}
        <ScoreDecompositionBar c1={c1} c2={c2} c3={c3} total={currentScore} />

        {/* Bloqueios */}
        {bloqueios.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertOctagon className="w-5 h-5 text-red-600" />
              <span className="text-sm font-bold text-red-800">{bloqueios.length} Bloqueio(s) Ativo(s) — Score forçado a 850+</span>
            </div>
            <p className="text-xs text-red-600 mb-2">Bloqueios são condições absolutas que impedem a aprovação, independente do score calculado.</p>
            <div className="flex flex-wrap gap-1.5">
              {bloqueios.map((b, i) => (
                <Badge key={i} className="bg-red-100 text-red-700 border-red-300 border text-xs font-mono">{b}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Condições Automáticas */}
        {condicoes.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-800">Condições Automáticas Aplicadas</span>
            </div>
            <p className="text-xs text-amber-600/80 mb-2">Estas condições foram automaticamente impostas pelo framework baseado na subfaixa.</p>
            <ul className="space-y-1">
              {condicoes.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                  <Activity className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}