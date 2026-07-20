import React from 'react';
import { Zap, Target, Lock, Eye, Search, FileWarning, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SentinelTextFormatter from '@/components/compliance/SentinelTextFormatter';

export default function ConditionsSection({ score, latestCase }) {
  const conditions = score?.condicoes_automaticas || latestCase?.condicoesAutomaticas || [];
  const rollingReserve = score?.rolling_reserve_percent || latestCase?.rollingReservePercent || 0;
  const monitoring = score?.monitoramento_nivel || latestCase?.monitoramentoNivel;
  const hasReview = score?.recomendacoes_revisao_manual || score?.perguntas_sugeridas?.length > 0 || score?.documentos_adicionais_sugeridos?.length > 0;

  if (!conditions.length && !rollingReserve && !monitoring && !hasReview) return null;

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-amber-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100"><ShieldCheck className="w-5 h-5 text-amber-600" /></div>
          <div>
            <h3 className="text-base font-bold text-[var(--pinbank-blue)]">Condições, Mitigações & Recomendações</h3>
            <p className="text-xs text-[var(--pinbank-blue)]/40 mt-0.5">Restrições impostas pelo framework de risco e sugestões para revisão manual</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Quick metrics */}
        {(rollingReserve > 0 || monitoring) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rollingReserve > 0 && (
              <div className="p-4 rounded-xl bg-orange-50 border-2 border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-bold text-orange-700">Rolling Reserve</span>
                </div>
                <p className="text-2xl font-black text-orange-700">{rollingReserve}%</p>
                <p className="text-[11px] text-orange-600/70 mt-1">Percentual do volume retido como garantia. Liberado após período de observação sem incidentes.</p>
              </div>
            )}
            {monitoring && (
              <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-700">Monitoramento</span>
                </div>
                <p className="text-lg font-black text-blue-700">{monitoring.replace(/_/g, ' ')}</p>
                <p className="text-[11px] text-blue-600/70 mt-1">Nível de acompanhamento pós-onboarding aplicado pela plataforma.</p>
              </div>
            )}
          </div>
        )}

        {/* Automatic conditions */}
        {conditions.length > 0 && (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-700">Condições Automáticas ({conditions.length})</span>
            </div>
            <p className="text-[11px] text-amber-600/60 mb-3">Impostas automaticamente pelo framework de risco para esta subfaixa.</p>
            <div className="space-y-2">
              {conditions.map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-white/70 rounded-lg border border-amber-100">
                  <Target className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                  <p className="text-xs text-amber-700/80 leading-relaxed">{c}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual review recommendations */}
        {hasReview && (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-700">Recomendações para Revisão Manual</span>
            </div>

            {score?.recomendacoes_revisao_manual && (
              <div className="mb-3 p-3 bg-white/70 rounded-lg border border-blue-100">
                <SentinelTextFormatter text={score.recomendacoes_revisao_manual} />
              </div>
            )}

            {score?.perguntas_sugeridas?.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">Perguntas a Fazer ao Merchant</p>
                <ul className="space-y-1.5">
                  {score.perguntas_sugeridas.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 p-2.5 bg-white/70 rounded-lg border border-blue-100 text-xs text-blue-700/80">
                      <Search className="w-3 h-3 flex-shrink-0 mt-0.5 text-blue-500" />{q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {score?.documentos_adicionais_sugeridos?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">Documentos a Solicitar</p>
                <ul className="space-y-1.5">
                  {score.documentos_adicionais_sugeridos.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 p-2.5 bg-white/70 rounded-lg border border-blue-100 text-xs text-blue-700/80">
                      <FileWarning className="w-3 h-3 flex-shrink-0 mt-0.5 text-blue-500" />{d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}