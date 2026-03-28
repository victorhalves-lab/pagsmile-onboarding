import React from 'react';
import { Card } from '@/components/ui/card';

export default function HorizontalBarList({ title, data, maxItems = 10, color = '#2bc196' }) {
  const items = data.slice(0, maxItems);
  const maxVal = items.length > 0 ? Math.max(...items.map(d => d.value)) : 1;
  const total = items.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#002443]">{title}</h3>
        <span className="text-[10px] text-[#002443]/40 font-mono">{total} total</span>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => {
          const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
          const pctTotal = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] font-medium text-[#002443] truncate max-w-[65%]">{item.name}</span>
                <span className="text-[11px] font-bold text-[#002443]">{item.value} <span className="text-[#002443]/30 font-normal">({pctTotal}%)</span></span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}