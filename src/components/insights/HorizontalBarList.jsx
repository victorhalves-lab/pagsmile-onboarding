import React, { useState } from 'react';

export default function HorizontalBarList({ title, data, maxItems = 10, color = '#2bc196' }) {
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const items = data.slice(0, maxItems);
  const maxVal = items.length > 0 ? Math.max(...items.map(d => d.value)) : 1;
  const total = items.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-100 p-5 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#002443]">{title}</h3>
        <span className="text-[10px] font-bold text-[#002443]/30 bg-slate-50 px-2 py-0.5 rounded-full">{total}</span>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => {
          const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
          const pctTotal = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
          const isHovered = hoveredIdx === i;
          return (
            <div
              key={i}
              className="group cursor-default"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(-1)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[10px] font-bold w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200" style={{ backgroundColor: isHovered ? color : '#f1f5f9', color: isHovered ? 'white' : '#002443' }}>
                    {i + 1}
                  </span>
                  <span className="text-[11px] font-semibold text-[#002443] truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-xs font-extrabold text-[#002443] tabular-nums">{item.value}</span>
                  <span className="text-[10px] text-[#002443]/30 font-medium w-8 text-right">{pctTotal}%</span>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: isHovered ? `linear-gradient(90deg, ${color}, ${color}cc)` : `linear-gradient(90deg, ${color}80, ${color}40)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}