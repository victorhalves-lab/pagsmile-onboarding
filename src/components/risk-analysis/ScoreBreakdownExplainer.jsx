import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { describeVariable } from './variableDictionary';

/**
 * ScoreBreakdownExplainer — expandable section under the Score Panel V4 (Bloco 2).
 * Decodes variaveis_negativas[] and variaveis_positivas[] into human-readable rows.
 */

function VariableRow({ variable, direction }) {
  const desc = describeVariable(variable);
  const isNeg = direction === 'negative';

  return (
    <div className={`flex items-start gap-2.5 p-2 rounded-lg ${isNeg ? 'bg-red-50/40' : 'bg-emerald-50/40'}`}>
      <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${isNeg ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
        {desc.code}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-[12px] font-semibold ${isNeg ? 'text-red-800' : 'text-emerald-800'} leading-snug`}>
          {desc.title}
        </p>
        {desc.suffix && desc.hasKnownTitle && (
          <p className={`text-[10px] ${isNeg ? 'text-red-700/60' : 'text-emerald-700/60'} italic mt-0.5`}>
            contexto: {desc.suffix}
          </p>
        )}
      </div>
      {desc.category && (
        <span className="text-[9px] uppercase tracking-wider font-bold text-[#002443]/40 shrink-0">
          {desc.category}
        </span>
      )}
    </div>
  );
}

export default function ScoreBreakdownExplainer({ complianceScore, segmento }) {
  const [open, setOpen] = useState(false);

  if (!complianceScore) return null;

  const c1 = complianceScore.score_base_segmento || 0;
  const c2 = complianceScore.score_variaveis || 0;
  const c3 = complianceScore.score_enriquecimento || 0;
  const total = complianceScore.score_final || 0;

  const negativeVars = complianceScore.variaveis_negativas || [];
  const positiveVars = complianceScore.variaveis_positivas || [];

  const hasAnyVar = negativeVars.length + positiveVars.length > 0;

  return (
    <div className="rounded-xl border border-[#002443]/10 bg-slate-50/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 p-3 hover:bg-slate-50 transition-colors text-left"
      >
        <BookOpen className="w-4 h-4 text-[#002443]/60" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-[#002443]">Entenda o Score V4</p>
          <p className="text-[10px] text-[#002443]/50">
            Como as 3 camadas (C1 + C2 + C3) formam o score final de {total}/849
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#002443]/40" /> : <ChevronDown className="w-4 h-4 text-[#002443]/40" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-[#002443]/8 pt-3">
          {/* C1 */}
          <LayerCard
            layer="C1"
            title="Base do Segmento"
            value={c1}
            sign="neutral"
            explanation={`Todo caso parte de uma pontuação base definida pelo segmento${segmento ? ` (aqui: "${segmento}")` : ''}. Segmentos de maior risco intrínseco (ex: marketplace, dropshipping) partem com score mais alto; segmentos de menor risco (SaaS B2B) partem com score mais baixo.`}
            items={[{ label: `Score base do segmento${segmento ? ` "${segmento}"` : ''}`, value: `${c1} pts` }]}
          />

          {/* C2 */}
          <LayerCard
            layer="C2"
            title="Variáveis de Risco (V01-V60)"
            value={c2}
            sign={c2 > 0 ? 'negative' : c2 < 0 ? 'positive' : 'neutral'}
            explanation="Cada variável do framework soma (+) pontos ao score quando identificada na análise BDC. Quanto mais variáveis de risco, maior o score (pior). A ausência de variáveis mantém o score igual ao base C1."
          >
            {hasAnyVar ? (
              negativeVars.length > 0 ? (
                <div className="space-y-1">
                  {negativeVars.map((v, i) => <VariableRow key={`neg-${i}`} variable={v} direction="negative" />)}
                </div>
              ) : (
                <p className="text-[11px] text-emerald-700 italic py-1">✓ Nenhuma variável de risco aplicada nesta camada.</p>
              )
            ) : (
              <p className="text-[11px] text-[#002443]/50 italic py-1">Variáveis aplicadas não disponíveis para este caso.</p>
            )}
          </LayerCard>

          {/* C3 */}
          <LayerCard
            layer="C3"
            title="Enriquecimento (E01-E15)"
            value={c3}
            sign={c3 < 0 ? 'positive' : c3 > 0 ? 'negative' : 'neutral'}
            explanation="Enriquecimentos são sinais POSITIVOS que REDUZEM (−) o score (melhoram o caso). Exemplos: empresa com mais de 5 anos, zero processos, certificações relevantes. Um caso sem enriquecimento fica com C3=0."
          >
            {positiveVars.length > 0 ? (
              <div className="space-y-1">
                {positiveVars.map((v, i) => <VariableRow key={`pos-${i}`} variable={v} direction="positive" />)}
              </div>
            ) : (
              <p className="text-[11px] text-[#002443]/50 italic py-1">Nenhum enriquecimento positivo identificado neste caso.</p>
            )}
          </LayerCard>

          {/* Footer: total + rule */}
          <div className="p-3 rounded-lg bg-[#002443] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#2bc196]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                  Score Final = C1 + C2 + C3
                </span>
              </div>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-white/60 text-xs">{c1}</span>
                <span className="text-white/40">+</span>
                <span className={c2 > 0 ? 'text-red-300' : 'text-emerald-300'}>{c2 > 0 ? '+' : ''}{c2}</span>
                <span className="text-white/40">+</span>
                <span className={c3 < 0 ? 'text-emerald-300' : 'text-red-300'}>{c3 > 0 ? '+' : ''}{c3}</span>
                <span className="text-white/40 mx-1">=</span>
                <span className="text-[#2bc196] font-black text-lg">{total}</span>
              </div>
            </div>
            <p className="text-[10px] text-white/50 mt-1.5">
              Quanto menor o score, melhor. 0-200 ≈ aprovação automática · 850+ ≈ bloqueio.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function LayerCard({ layer, title, value, sign, explanation, items, children }) {
  const tone = sign === 'negative'
    ? 'border-red-200 bg-red-50/30'
    : sign === 'positive'
      ? 'border-emerald-200 bg-emerald-50/30'
      : 'border-slate-200 bg-white';

  const Icon = sign === 'negative' ? TrendingUp : sign === 'positive' ? TrendingDown : Layers;
  const iconColor = sign === 'negative' ? 'text-red-500' : sign === 'positive' ? 'text-emerald-500' : 'text-[#002443]/40';
  const valueColor = sign === 'negative' ? 'text-red-700' : sign === 'positive' ? 'text-emerald-700' : 'text-[#002443]';

  return (
    <div className={`rounded-lg border ${tone} p-3 space-y-2`}>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] font-bold bg-[#002443] text-white px-2 py-0.5 rounded">{layer}</span>
        <span className="text-[12px] font-bold text-[#002443] flex-1">{title}</span>
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        <span className={`font-mono text-sm font-black ${valueColor}`}>
          {value > 0 ? '+' : ''}{value} pts
        </span>
      </div>
      <p className="text-[11px] text-[#002443]/60 leading-relaxed">{explanation}</p>
      {items && items.length > 0 && (
        <div className="pt-1 border-t border-current/10 space-y-1">
          {items.map((it, i) => (
            <div key={i} className="flex justify-between text-[11px]">
              <span className="text-[#002443]/70">{it.label}</span>
              <span className="font-mono font-bold text-[#002443]">{it.value}</span>
            </div>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}