import React from 'react';

export default function MinMaxMedianTable({ title, rows, formatter }) {
  const fmt = formatter || ((v) => v);

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-[#002443] to-[#003366]">
        <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider px-6 py-3">Métrica</th>
              <th className="text-right text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider px-4 py-3">Mínimo</th>
              <th className="text-right text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2bc196]" />
                  Mediana
                </span>
              </th>
              <th className="text-right text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider px-4 py-3">Média</th>
              <th className="text-right text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider px-4 py-3">Máximo</th>
              <th className="text-right text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider px-6 py-3">Qtd</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const range = row.stats.max - row.stats.min;
              const medianPos = range > 0 ? ((row.stats.median - row.stats.min) / range) * 100 : 50;
              return (
                <tr key={i} className="group border-b border-slate-50 last:border-b-0 hover:bg-[#2bc196]/[0.03] transition-colors duration-200">
                  <td className="px-6 py-3.5">
                    <span className="text-xs font-semibold text-[#002443]">{row.label}</span>
                    {/* Visual range bar */}
                    <div className="mt-1.5 h-1.5 w-full max-w-[160px] bg-slate-100 rounded-full overflow-hidden relative">
                      <div className="absolute inset-y-0 bg-gradient-to-r from-[#2bc196]/30 to-[#2bc196]/60 rounded-full" style={{ left: '0%', width: `${medianPos}%` }} />
                      <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#2bc196] rounded-full border-2 border-white shadow-sm" style={{ left: `${Math.max(5, Math.min(95, medianPos))}%`, transform: 'translate(-50%, -50%)' }} />
                    </div>
                  </td>
                  <td className="text-right px-4 py-3.5">
                    <span className="text-xs font-mono text-slate-400">{fmt(row.stats.min)}</span>
                  </td>
                  <td className="text-right px-4 py-3.5">
                    <span className="text-sm font-mono font-extrabold text-[#2bc196]">{fmt(row.stats.median)}</span>
                  </td>
                  <td className="text-right px-4 py-3.5">
                    <span className="text-xs font-mono text-[#002443]/70">{fmt(row.stats.avg)}</span>
                  </td>
                  <td className="text-right px-4 py-3.5">
                    <span className="text-xs font-mono text-slate-400">{fmt(row.stats.max)}</span>
                  </td>
                  <td className="text-right px-6 py-3.5">
                    <span className="inline-flex items-center justify-center min-w-[28px] h-6 rounded-full bg-slate-100 text-[10px] font-bold text-[#002443]/50">{row.stats.count}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}