import React from 'react';

/**
 * Barra de progresso simples para steps públicos.
 */
export default function StepProgress({ current, total, labels = [] }) {
  const pct = ((current + 1) / total) * 100;
  return (
    <div className="px-5 pt-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/50">
          {labels[current] || `Step ${current + 1}`}
        </span>
        <span className="text-[10px] font-mono text-[#002443]/40">{current + 1}/{total}</span>
      </div>
      <div className="h-1.5 bg-[#002443]/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#2bc196] to-[#5cf7cf] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}