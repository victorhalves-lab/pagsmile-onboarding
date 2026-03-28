import React from 'react';

export default function MinMaxMedianTable({ title, rows, formatter }) {
  const fmt = formatter || ((v) => v);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 transition-all duration-500 hover:shadow-[0_8px_40px_-12px_rgba(0,36,67,0.1)]">
      {/* Premium header with mesh gradient */}
      <div className="relative px-6 py-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#002443] via-[#002443] to-[#003060]" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#2bc196]/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-20 h-20 bg-[#5cf7cf]/8 rounded-full blur-[30px] translate-y-1/2" />
        <h3 className="relative z-10 text-[12px] font-bold text-white/90 tracking-wide uppercase">{title}</h3>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#002443]/[0.04]">
              <th className="text-left text-[10px] font-bold text-[#002443]/30 uppercase tracking-[0.1em] px-6 py-3.5">Métrica</th>
              <th className="text-right text-[10px] font-bold text-[#002443]/30 uppercase tracking-[0.1em] px-4 py-3.5">Mínimo</th>
              <th className="text-right text-[10px] font-bold text-[#002443]/30 uppercase tracking-[0.1em] px-4 py-3.5">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2bc196] shadow-[0_0_6px_rgba(43,193,150,0.5)]" />
                  Mediana
                </span>
              </th>
              <th className="text-right text-[10px] font-bold text-[#002443]/30 uppercase tracking-[0.1em] px-4 py-3.5">Média</th>
              <th className="text-right text-[10px] font-bold text-[#002443]/30 uppercase tracking-[0.1em] px-4 py-3.5">Máximo</th>
              <th className="text-right text-[10px] font-bold text-[#002443]/30 uppercase tracking-[0.1em] px-6 py-3.5">Qtd</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const range = row.stats.max - row.stats.min;
              const medianPos = range > 0 ? ((row.stats.median - row.stats.min) / range) * 100 : 50;
              return (
                <tr key={i} className="border-b border-[#002443]/[0.03] last:border-b-0 hover:bg-gradient-to-r hover:from-[#2bc196]/[0.02] hover:to-transparent transition-colors duration-300">
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-semibold text-[#002443]/80">{row.label}</span>
                    {/* Visual range indicator */}
                    <div className="mt-2 h-[5px] w-full max-w-[180px] bg-[#002443]/[0.03] rounded-full overflow-hidden relative">
                      <div className="absolute inset-y-0 rounded-full bg-gradient-to-r from-[#2bc196]/20 to-[#2bc196]/40" style={{ left: '0%', width: `${medianPos}%` }} />
                      <div className="absolute top-1/2 w-3 h-3 rounded-full border-[2.5px] border-white shadow-[0_0_0_1px_rgba(43,193,150,0.6),0_2px_8px_rgba(43,193,150,0.3)]" style={{ left: `${Math.max(5, Math.min(95, medianPos))}%`, transform: 'translate(-50%, -50%)', backgroundColor: '#2bc196' }} />
                    </div>
                  </td>
                  <td className="text-right px-4 py-4">
                    <span className="text-[11px] font-mono text-[#002443]/25 tabular-nums">{fmt(row.stats.min)}</span>
                  </td>
                  <td className="text-right px-4 py-4">
                    <span className="text-[14px] font-mono font-extrabold text-[#2bc196] tabular-nums">{fmt(row.stats.median)}</span>
                  </td>
                  <td className="text-right px-4 py-4">
                    <span className="text-[11px] font-mono text-[#002443]/50 tabular-nums">{fmt(row.stats.avg)}</span>
                  </td>
                  <td className="text-right px-4 py-4">
                    <span className="text-[11px] font-mono text-[#002443]/25 tabular-nums">{fmt(row.stats.max)}</span>
                  </td>
                  <td className="text-right px-6 py-4">
                    <span className="inline-flex items-center justify-center min-w-[28px] h-6 rounded-lg bg-[#002443]/[0.04] text-[10px] font-bold text-[#002443]/35 tabular-nums">{row.stats.count}</span>
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