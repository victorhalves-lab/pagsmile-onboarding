import React from 'react';
import { ArrowRight, Equal, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';

/**
 * [V5.2 Fase 6.5.3] Linha de métrica do Comparator.
 *
 * Renderiza UM atributo lado a lado (V4 vs V5.2) com indicador visual de divergência.
 *
 * Props:
 * - label: nome do atributo (ex: "Score Final", "Subfaixa / Categoria", "Decisão IA")
 * - v4Value: valor V4 (string ou número)
 * - v5_2Value: valor V5.2
 * - divergenceMode: 'numeric' | 'categorical' | 'text'
 *   - numeric → calcula delta automaticamente
 *   - categorical → match exato OK, diff = warning
 *   - text → não destaca divergência (informativo)
 * - hint: texto curto opcional (tooltip-style abaixo do label)
 * - critical: se true, marca diff em vermelho (ex: bloqueio ativo)
 */
export default function ComparatorMetricRow({
  label,
  hint,
  v4Value,
  v5_2Value,
  divergenceMode = 'categorical',
  critical = false,
}) {
  const v4Display = formatValue(v4Value);
  const v5_2Display = formatValue(v5_2Value);
  const diff = computeDivergence(v4Value, v5_2Value, divergenceMode);

  return (
    <div className="grid grid-cols-12 gap-3 items-center py-3 border-b border-slate-100 last:border-b-0">
      {/* Label */}
      <div className="col-span-12 md:col-span-3">
        <p className="text-xs font-bold text-[#002443]">{label}</p>
        {hint && (
          <p className="text-[10px] text-[#002443]/55 mt-0.5 flex items-start gap-1">
            <Info className="w-2.5 h-2.5 mt-0.5 shrink-0" />
            <span>{hint}</span>
          </p>
        )}
      </div>

      {/* V4 value */}
      <div className="col-span-5 md:col-span-4">
        <div className="px-3 py-2 rounded-lg bg-blue-50/60 border border-blue-100">
          <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600 mb-0.5">V4</p>
          <p className="text-sm font-semibold text-[#002443] break-words">{v4Display}</p>
        </div>
      </div>

      {/* Arrow + divergence indicator */}
      <div className="col-span-2 md:col-span-1 flex items-center justify-center">
        <DivergenceIcon diff={diff} critical={critical} />
      </div>

      {/* V5.2 value */}
      <div className="col-span-5 md:col-span-4">
        <div className={`px-3 py-2 rounded-lg border ${
          diff.type === 'match'
            ? 'bg-[#2bc196]/5 border-[#2bc196]/20'
            : critical
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#2bc196] mb-0.5">V5.2</p>
          <p className="text-sm font-semibold text-[#002443] break-words">{v5_2Display}</p>
          {diff.type === 'numeric' && diff.delta !== 0 && (
            <p className={`text-[10px] mt-0.5 font-medium ${
              diff.delta > 0 ? 'text-emerald-700' : 'text-red-700'
            }`}>
              {diff.delta > 0 ? '+' : ''}{diff.delta} pts vs V4
              {diff.pctText ? ` (${diff.pctText})` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DivergenceIcon({ diff, critical }) {
  if (diff.type === 'match') {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <Equal className="w-4 h-4 text-emerald-600" />
        <span className="text-[8px] font-bold text-emerald-700 uppercase">Igual</span>
      </div>
    );
  }
  if (diff.type === 'numeric') {
    const Icon = diff.delta > 0 ? TrendingUp : TrendingDown;
    const colorClass = diff.delta > 0 ? 'text-emerald-600' : 'text-red-600';
    return (
      <div className="flex flex-col items-center gap-0.5">
        <Icon className={`w-4 h-4 ${colorClass}`} />
        <span className={`text-[8px] font-bold uppercase ${colorClass}`}>
          {diff.delta > 0 ? 'Subiu' : 'Caiu'}
        </span>
      </div>
    );
  }
  // categorical or text divergence
  if (critical) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <AlertTriangle className="w-4 h-4 text-red-600" />
        <span className="text-[8px] font-bold text-red-700 uppercase">Crítico</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-0.5">
      <ArrowRight className="w-4 h-4 text-amber-600" />
      <span className="text-[8px] font-bold text-amber-700 uppercase">Mudou</span>
    </div>
  );
}

function formatValue(v) {
  if (v === undefined || v === null || v === '') return '—';
  if (Array.isArray(v)) {
    if (v.length === 0) return '—';
    return v.join(', ');
  }
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (typeof v === 'number') return v.toLocaleString('pt-BR');
  return String(v);
}

function computeDivergence(v4, v5_2, mode) {
  const v4Empty = v4 === undefined || v4 === null || v4 === '';
  const v5Empty = v5_2 === undefined || v5_2 === null || v5_2 === '';
  if (v4Empty && v5Empty) return { type: 'match' };

  if (mode === 'numeric') {
    const a = Number(v4) || 0;
    const b = Number(v5_2) || 0;
    if (a === b) return { type: 'match' };
    const delta = b - a;
    const pctText = a > 0 ? `${((delta / a) * 100).toFixed(0)}%` : '';
    return { type: 'numeric', delta, pctText };
  }

  if (mode === 'text') {
    // Sempre informativo — não destaca diff
    return { type: 'text' };
  }

  // categorical (default)
  const aStr = JSON.stringify(v4 ?? '');
  const bStr = JSON.stringify(v5_2 ?? '');
  return aStr === bStr ? { type: 'match' } : { type: 'categorical' };
}