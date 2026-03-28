import React, { useState } from 'react';

export default function HorizontalBarList({ title, data, maxItems = 10, color = '#2bc196' }) {
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const items = data.slice(0, maxItems);
  const maxVal = items.length > 0 ? Math.max(...items.map(d => d.value)) : 1;
  const total = items.reduce((s, d) => s + d.value, 0);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 p-5 transition-all duration-500 hover:shadow-[0_8px_40px_-12px_rgba(0,36,67,0.1)]">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#2bc196]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[13px] font-bold text-[#002443] tracking-tight">{title}</h3>
          <span className="text-[10px] font-bold text-[#002443]/20 bg-[#002443]/[0.03] px-2.5 py-1 rounded-lg tabular-nums">{total}</span>
        </div>
        <div className="space-y-3.5">
          {items.map((item, i) => {
            const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
            const pctTotal = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
            const isHovered = hoveredIdx === i;
            return (
              <div
                key={i}
                className="group/item cursor-default"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(-1)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-300 tabular-nums" style={{ backgroundColor: isHovered ? color : 'rgba(0,36,67,0.04)', color: isHovered ? 'white' : 'rgba(0,36,67,0.3)' }}>
                      {i + 1}
                    </span>
                    <span className="text-[11px] font-semibold text-[#002443]/80 truncate group-hover/item:text-[#002443] transition-colors">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0 ml-3">
                    <span className="text-[12px] font-extrabold text-[#002443] tabular-nums">{item.value}</span>
                    <span className="text-[10px] text-[#002443]/20 font-semibold w-8 text-right tabular-nums">{pctTotal}%</span>
                  </div>
                </div>
                <div className="w-full h-[6px] bg-[#002443]/[0.03] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${pct}%`,
                      background: isHovered
                        ? `linear-gradient(90deg, ${color}, ${color}dd)`
                        : `linear-gradient(90deg, ${color}50, ${color}25)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}