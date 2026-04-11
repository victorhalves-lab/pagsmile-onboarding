import React from 'react';
import { Shield, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function ScoreBlock({ label, value, max = 1000 }) {
  if (value === null || value === undefined) return null;
  const pct = Math.min((value / max) * 100, 100);
  const color = value <= 300 ? 'bg-green-500' : value <= 600 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[var(--pagsmile-blue)]/50">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function CadastroComplianceTab({ score, latestCase, allScores = [], allCases = [] }) {
  if (!score && !latestCase) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-10 text-center mt-4">
        <Shield className="w-10 h-10 mx-auto mb-3 text-[var(--pagsmile-blue)]/20" />
        <p className="text-sm text-[var(--pagsmile-blue)]/50">Nenhuma análise de compliance disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Score Summary */}
      {score && (
        <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
          <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--pagsmile-green)]" />
            Score de Risco
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-[var(--pagsmile-blue)]">{score.score_final ?? score.score_geral_composto ?? '—'}</p>
              <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Score Final</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-[var(--pagsmile-blue)]">{score.subfaixa || '—'}</p>
              <p className="text-[10px] text-[var(--pagsmile-blue)]/50">{score.subfaixa_nome || 'Subfaixa'}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-bold text-[var(--pagsmile-blue)]">{score.recomendacao_final || '—'}</p>
              <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Recomendação</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-bold text-[var(--pagsmile-blue)]">{score.monitoramento_nivel || '—'}</p>
              <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Monitoramento</p>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-3">
            <ScoreBlock label="Score Base Segmento" value={score.score_base_segmento} />
            <ScoreBlock label="Score Variáveis" value={score.score_variaveis} />
            <ScoreBlock label="Score Enriquecimento" value={score.score_enriquecimento} max={300} />
          </div>
        </div>
      )}

      {/* IA Explanation */}
      {latestCase?.iaExplanation && (
        <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
          <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            Parecer da IA
          </h3>
          <p className="text-sm text-[var(--pagsmile-blue)]/70 leading-relaxed">{latestCase.iaExplanation}</p>
          {latestCase.iaDecision && (
            <Badge className={`mt-2 text-xs ${
              latestCase.iaDecision === 'Aprovado' ? 'bg-green-100 text-green-700' :
              latestCase.iaDecision === 'Recusado' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>Decisão IA: {latestCase.iaDecision}</Badge>
          )}
        </div>
      )}

      {/* Bloqueios */}
      {score?.bloqueios_ativos?.length > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Bloqueios Ativos ({score.bloqueios_ativos.length})
          </h3>
          <ul className="space-y-1">
            {score.bloqueios_ativos.map((b, i) => (
              <li key={i} className="text-xs text-red-700/80">{b}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Condições Automáticas */}
      {latestCase?.condicoesAutomaticas?.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Condições Automáticas
          </h3>
          <ul className="space-y-1">
            {latestCase.condicoesAutomaticas.map((c, i) => (
              <li key={i} className="text-xs text-amber-700/80 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pontos Positivos/Atenção */}
      {score?.pontos_positivos?.length > 0 && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <h3 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Pontos Positivos
          </h3>
          <ul className="space-y-1">
            {score.pontos_positivos.map((p, i) => (
              <li key={i} className="text-xs text-green-700/80">{p}</li>
            ))}
          </ul>
        </div>
      )}

      {score?.pontos_atencao?.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <h3 className="text-sm font-semibold text-amber-700 mb-2">Pontos de Atenção</h3>
          <ul className="space-y-1">
            {score.pontos_atencao.map((p, i) => (
              <li key={i} className="text-xs text-amber-700/80">{p}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Parecer Final / Sumário Executivo */}
      {score?.sumario_executivo && (
        <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
          <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />Sumário Executivo
          </h3>
          <p className="text-sm text-[var(--pagsmile-blue)]/70 leading-relaxed whitespace-pre-wrap">{score.sumario_executivo}</p>
        </div>
      )}

      {score?.parecer_final && (
        <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
          <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-2">Parecer Final</h3>
          <p className="text-sm text-[var(--pagsmile-blue)]/70 leading-relaxed whitespace-pre-wrap">{score.parecer_final}</p>
        </div>
      )}

      {/* V4 Variables Detail */}
      {(score?.variaveis_positivas?.length > 0 || score?.variaveis_negativas?.length > 0) && (
        <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
          <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-3">Variáveis V4</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {score.variaveis_positivas?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-700 mb-1">Positivas (Redutoras)</p>
                <ul className="space-y-0.5">
                  {score.variaveis_positivas.map((v, i) => <li key={i} className="text-[11px] text-green-700/80">+ {v}</li>)}
                </ul>
              </div>
            )}
            {score.variaveis_negativas?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-700 mb-1">Negativas (Penalizadoras)</p>
                <ul className="space-y-0.5">
                  {score.variaveis_negativas.map((v, i) => <li key={i} className="text-[11px] text-red-700/80">– {v}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rolling Reserve & Monitoramento */}
      {(score?.rolling_reserve_percent > 0 || score?.monitoramento_detalhes) && (
        <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
          <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-3">Monitoramento & Reservas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {score.rolling_reserve_percent > 0 && <div><p className="text-[var(--pagsmile-blue)]/50">Rolling Reserve</p><p className="font-bold text-amber-700">{score.rolling_reserve_percent}%</p></div>}
            {score.monitoramento_nivel && <div><p className="text-[var(--pagsmile-blue)]/50">Nível Monitoramento</p><p className="font-bold">{score.monitoramento_nivel}</p></div>}
            {score.promocao_proxima_data && <div><p className="text-[var(--pagsmile-blue)]/50">Próxima Promoção</p><p className="font-bold">{new Date(score.promocao_proxima_data).toLocaleDateString('pt-BR')}</p></div>}
            {score.promocao_destino && <div><p className="text-[var(--pagsmile-blue)]/50">Destino Promoção</p><p className="font-bold">{score.promocao_destino}</p></div>}
          </div>
        </div>
      )}

      {/* All Cases Timeline */}
      {allCases.length > 1 && (
        <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
          <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-3">Histórico de Casos ({allCases.length})</h3>
          <div className="space-y-2">
            {[...allCases].sort((a,b) => new Date(b.created_date) - new Date(a.created_date)).map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-[var(--pagsmile-blue)]/30" />
                  <span className="font-medium">{c.status}</span>
                  {c.subfaixaNome && <span className="text-[var(--pagsmile-blue)]/40">({c.subfaixaNome})</span>}
                  {c.riskScoreV4 != null && <span className="text-[var(--pagsmile-blue)]/40">V4: {c.riskScoreV4}</span>}
                </div>
                <span className="text-[var(--pagsmile-blue)]/40">{new Date(c.created_date).toLocaleDateString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}