import React from 'react';
import { BarChart3, TrendingUp, ArrowRight } from 'lucide-react';

function ScoreBar({ label, value, max = 1000, description }) {
  if (value === null || value === undefined) return null;
  const pct = Math.min(Math.abs(value) / max * 100, 100);
  const isNegative = value < 0;
  const color = isNegative ? 'bg-green-500' : value <= max * 0.3 ? 'bg-green-500' : value <= max * 0.6 ? 'bg-amber-500' : 'bg-red-500';
  
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-[var(--pinbank-blue)]/60 font-medium">{label}</span>
        <span className={`font-bold ${isNegative ? 'text-green-600' : value <= max * 0.3 ? 'text-green-600' : value <= max * 0.6 ? 'text-amber-600' : 'text-red-600'}`}>
          {isNegative ? '' : '+'}{value}
        </span>
      </div>
      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      {description && <p className="text-[10px] text-[var(--pinbank-blue)]/40 mt-1">{description}</p>}
    </div>
  );
}

export default function ComplianceScoreBreakdown({ score }) {
  const hasV4Breakdown = score.score_base_segmento != null || score.score_variaveis != null || score.score_enriquecimento != null;
  const hasLegacyBreakdown = score.score_questionario != null || score.score_validacao_externa != null;

  if (!hasV4Breakdown && !hasLegacyBreakdown) return null;

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-5">
      <h3 className="text-sm font-semibold text-[var(--pinbank-blue)] mb-1 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-[var(--pinbank-blue)]" />
        Decomposição do Score
      </h3>
      
      {hasV4Breakdown && (
        <>
          <p className="text-xs text-[var(--pinbank-blue)]/50 mb-4">
            Score V4 = Camada 1 (Base Segmento) + Camada 2 (Variáveis) + Camada 3 (Enriquecimento). 
            Resultado limitado a max(0, min(849, C1+C2+C3)). Scores ≥850 apenas por bloqueios B01-B10.
          </p>
          
          {/* Visual Formula */}
          <div className="flex items-center gap-2 mb-4 p-3 bg-[var(--pinbank-blue)]/5 rounded-lg overflow-x-auto">
            <div className="text-center flex-shrink-0">
              <p className="text-lg font-bold text-[var(--pinbank-blue)]">{score.score_base_segmento ?? '?'}</p>
              <p className="text-[9px] text-[var(--pinbank-blue)]/50">C1 Base</p>
            </div>
            <span className="text-lg text-[var(--pinbank-blue)]/30">+</span>
            <div className="text-center flex-shrink-0">
              <p className={`text-lg font-bold ${(score.score_variaveis || 0) < 0 ? 'text-green-600' : 'text-amber-600'}`}>{score.score_variaveis ?? '?'}</p>
              <p className="text-[9px] text-[var(--pinbank-blue)]/50">C2 Variáveis</p>
            </div>
            <span className="text-lg text-[var(--pinbank-blue)]/30">+</span>
            <div className="text-center flex-shrink-0">
              <p className={`text-lg font-bold ${(score.score_enriquecimento || 0) < 0 ? 'text-green-600' : 'text-amber-600'}`}>{score.score_enriquecimento ?? '?'}</p>
              <p className="text-[9px] text-[var(--pinbank-blue)]/50">C3 Enriquec.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--pinbank-blue)]/30 flex-shrink-0" />
            <div className="text-center flex-shrink-0">
              <p className="text-xl font-black text-[var(--pinbank-blue)]">{score.score_final ?? '?'}</p>
              <p className="text-[9px] text-[var(--pinbank-blue)]/50">Score Final</p>
            </div>
          </div>

          <div className="space-y-2">
            <ScoreBar label="Camada 1 — Score Base Segmento" value={score.score_base_segmento} max={500}
              description={`Definido pelo segmento "${score.segmento || '?'}". ${score.is_pix ? 'Inclui +30 do fluxo PIX.' : ''}`} />
            <ScoreBar label="Camada 2 — Variáveis V01-V60" value={score.score_variaveis} max={500}
              description="Soma de variáveis penalizadoras (+) e redutoras (–) identificadas nas respostas." />
            <ScoreBar label="Camada 3 — Enriquecimento E01-E11" value={score.score_enriquecimento} max={300}
              description="Dados de fontes externas: BDC, CAF, listas de sanções, processos judiciais." />
          </div>
        </>
      )}

      {hasLegacyBreakdown && (
        <>
          <p className="text-xs text-[var(--pinbank-blue)]/50 mb-4">
            Score legado composto por Fase 1 (Questionário) + Fase 2 (Validação Externa) + Bônus de Consistência.
          </p>
          <div className="space-y-2">
            <ScoreBar label="Fase 1 — Score Questionário (SQ)" value={score.score_questionario} description={score.classificacao_questionario ? `Classificação: ${score.classificacao_questionario}` : undefined} />
            <ScoreBar label="Fase 2 — Score Validação Externa (SVE)" value={score.score_validacao_externa} description={score.classificacao_validacao_externa ? `Classificação: ${score.classificacao_validacao_externa}` : undefined} />
            {score.bonus_consistencia != null && <ScoreBar label="Bônus de Consistência" value={score.bonus_consistencia} max={200} />}
            {score.score_geral_composto != null && (
              <div className="p-3 bg-[var(--pinbank-blue)]/5 rounded-lg text-center">
                <p className="text-xs text-[var(--pinbank-blue)]/50">Score Geral Composto (SGC)</p>
                <p className="text-2xl font-black text-[var(--pinbank-blue)]">{score.score_geral_composto}</p>
                {score.classificacao_geral && <p className="text-[10px] text-[var(--pinbank-blue)]/40">{score.classificacao_geral}</p>}
              </div>
            )}
          </div>
        </>
      )}

      {/* Phase completion */}
      <div className="flex gap-2 mt-4">
        {[
          { label: 'Fase 1', done: score.fase_1_completa, date: score.data_analise_fase_1 },
          { label: 'Fase 2', done: score.fase_2_completa, date: score.data_analise_fase_2 },
          { label: 'Fase 3', done: score.fase_3_completa, date: score.data_analise_fase_3 },
        ].map((p, i) => (
          <div key={i} className={`flex-1 text-center p-2 rounded-lg border text-xs ${p.done ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
            <p className="font-semibold">{p.label}</p>
            {p.done && p.date && <p className="text-[10px]">{new Date(p.date).toLocaleDateString('pt-BR')}</p>}
            {!p.done && <p className="text-[10px]">Pendente</p>}
          </div>
        ))}
      </div>
    </div>
  );
}