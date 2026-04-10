import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Shield, TrendingUp, TrendingDown, Minus, RefreshCw, Clock, AlertTriangle,
  CheckCircle2, AlertOctagon, Zap,
} from 'lucide-react';

const SUBFAIXA_CONFIG = {
  '1A': { label: 'VERDE EXPRESS', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgLight: 'bg-emerald-50', border: 'border-emerald-200' },
  '1B': { label: 'VERDE', color: 'bg-emerald-400', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50', border: 'border-emerald-200' },
  '2A': { label: 'AZUL LEVE', color: 'bg-blue-400', textColor: 'text-blue-700', bgLight: 'bg-blue-50', border: 'border-blue-200' },
  '2B': { label: 'AZUL', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50', border: 'border-blue-200' },
  '3A': { label: 'AMARELO', color: 'bg-amber-400', textColor: 'text-amber-700', bgLight: 'bg-amber-50', border: 'border-amber-200' },
  '3B': { label: 'LARANJA', color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-50', border: 'border-orange-200' },
  '4': { label: 'VERMELHO', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50', border: 'border-red-200' },
  '5': { label: 'BLOQUEIO', color: 'bg-red-700', textColor: 'text-red-800', bgLight: 'bg-red-50', border: 'border-red-300' },
};

export default function CaseScoreHeader({ onboardingCase, complianceScore, validations }) {
  const currentScore = onboardingCase?.riskScoreV4;
  const currentSubfaixa = onboardingCase?.subfaixa;
  const config = SUBFAIXA_CONFIG[currentSubfaixa] || SUBFAIXA_CONFIG['4'];

  // Find latest revalidation to show delta
  const revalidations = (validations || [])
    .filter(v => v.provider === 'BigDataCorp' && v.validationType === 'Revalidação BDC' && v.resultData?.scoreDelta != null)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const latestReval = revalidations[0];
  const lastDelta = latestReval?.resultData?.scoreDelta || 0;
  const lastRevalDate = latestReval?.created_date;
  const originalScore = latestReval?.resultData?.oldScore;

  // Score decomposition from ComplianceScore
  const c1 = complianceScore?.score_base_segmento;
  const c2 = complianceScore?.score_variaveis;
  const c3 = complianceScore?.score_enriquecimento;
  const bloqueios = onboardingCase?.bloqueiosAtivos || complianceScore?.bloqueios_ativos || [];

  const pct = currentScore != null ? Math.min(100, (currentScore / 849) * 100) : 0;

  if (currentScore == null) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#002443]/8 overflow-hidden">
      <div className={`h-1.5 ${config.color}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${config.bgLight}`}>
              <Shield className={`w-5 h-5 ${config.textColor}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#002443]">Score de Risco Unificado</h3>
              <p className="text-[10px] text-[#002443]/40 mt-0.5">
                Framework v4 • 3 Camadas
                {lastRevalDate && (
                  <> • Revalidado em {new Date(lastRevalDate).toLocaleDateString('pt-BR')}</>
                )}
              </p>
            </div>
          </div>

          {/* Revalidation badge */}
          {lastRevalDate && (
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1">
              <RefreshCw className="w-3 h-3 text-blue-600" />
              <span className="text-[10px] font-medium text-blue-700">
                Revalidado {new Date(lastRevalDate).toLocaleDateString('pt-BR')}
              </span>
              {lastDelta !== 0 && (
                <span className={`text-[10px] font-mono font-bold ${lastDelta > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ({lastDelta >= 0 ? '+' : ''}{lastDelta})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Score grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Final score */}
          <div className={`col-span-2 lg:col-span-1 p-4 rounded-xl ${config.bgLight} border ${config.border}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#002443]/50 mb-1">Score Atual</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-black ${config.textColor}`}>{currentScore}</span>
              <span className="text-sm text-[#002443]/30">/849</span>
            </div>
            <div className="w-full h-2 bg-white/60 rounded-full mt-2 overflow-hidden">
              <div className={`h-full rounded-full ${config.color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
            </div>
            {/* Delta from revalidation */}
            {lastDelta !== 0 && originalScore != null && (
              <div className="flex items-center gap-1.5 mt-2">
                {lastDelta > 0 ? <TrendingUp className="w-3 h-3 text-red-500" /> :
                 <TrendingDown className="w-3 h-3 text-green-500" />}
                <span className="text-[10px] text-[#002443]/50">Era {originalScore}</span>
                <span className={`text-[10px] font-mono font-bold ${lastDelta > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {lastDelta >= 0 ? '+' : ''}{lastDelta}
                </span>
              </div>
            )}
          </div>

          {/* Subfaixa */}
          <div className="p-4 rounded-xl bg-[#f4f4f4] border border-[#002443]/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#002443]/50 mb-1">Subfaixa</p>
            <Badge className={`${config.bgLight} ${config.textColor} ${config.border} border text-sm font-bold px-3 py-1`}>
              {currentSubfaixa} — {config.label}
            </Badge>
            {onboardingCase?.monitoramentoNivel && (
              <p className="text-[10px] text-[#002443]/40 mt-1.5">
                Monitoramento: {onboardingCase.monitoramentoNivel}
              </p>
            )}
          </div>

          {/* Camada 1 */}
          <div className="p-4 rounded-xl bg-[#f4f4f4] border border-[#002443]/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#002443]/50 mb-1">C1 — Base Segmento</p>
            <span className="text-2xl font-bold text-[#002443]">{c1 ?? '—'}</span>
            <span className="text-xs text-[#002443]/40 ml-1">pts</span>
          </div>

          {/* Camada 2 */}
          <div className="p-4 rounded-xl bg-[#f4f4f4] border border-[#002443]/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#002443]/50 mb-1">C2 — Variáveis</p>
            <span className={`text-2xl font-bold ${c2 > 0 ? 'text-amber-600' : c2 < 0 ? 'text-emerald-600' : 'text-[#002443]'}`}>
              {c2 != null ? (c2 > 0 ? '+' : '') + c2 : '—'}
            </span>
            <span className="text-xs text-[#002443]/40 ml-1">pts</span>
          </div>

          {/* Camada 3 */}
          <div className="p-4 rounded-xl bg-[#f4f4f4] border border-[#002443]/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#002443]/50 mb-1">C3 — Enriquecimento</p>
            <span className={`text-2xl font-bold ${c3 > 0 ? 'text-amber-600' : c3 < 0 ? 'text-emerald-600' : 'text-[#002443]'}`}>
              {c3 != null ? (c3 > 0 ? '+' : '') + c3 : '—'}
            </span>
            <span className="text-xs text-[#002443]/40 ml-1">pts</span>
          </div>
        </div>

        {/* Bloqueios */}
        {bloqueios.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertOctagon className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-red-800">{bloqueios.length} Bloqueio(s) Ativo(s)</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {bloqueios.map((b, i) => (
                  <Badge key={i} className="bg-red-100 text-red-700 border-red-300 border text-[9px] font-mono">{b}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recommendation bar */}
        {currentScore != null && bloqueios.length === 0 && (
          <div className={`mt-3 p-2.5 rounded-xl ${config.bgLight} border ${config.border} flex items-center gap-2`}>
            {currentScore <= 200 ? (
              <><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-xs font-semibold text-emerald-700">Recomendação: APROVAÇÃO AUTOMÁTICA</span></>
            ) : currentScore <= 500 ? (
              <><Zap className="w-4 h-4 text-blue-600" /><span className="text-xs font-semibold text-blue-700">Recomendação: APROVAÇÃO COM CONDIÇÕES</span></>
            ) : currentScore <= 700 ? (
              <><Clock className="w-4 h-4 text-amber-600" /><span className="text-xs font-semibold text-amber-700">Recomendação: REVISÃO MANUAL</span></>
            ) : (
              <><AlertOctagon className="w-4 h-4 text-red-600" /><span className="text-xs font-semibold text-red-700">Recomendação: RECUSA</span></>
            )}
          </div>
        )}
      </div>
    </div>
  );
}