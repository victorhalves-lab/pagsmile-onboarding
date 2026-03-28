import React from 'react';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const FALLBACK = ['#2bc196', '#002443', '#36706c', '#5cf7cf', '#94a3b8', '#f59e0b', '#ef4444', '#8b5cf6'];

const RADIAN = Math.PI / 180;
function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#002443" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight={600}>
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function DonutChart({ title, data, colorMap = {}, height = 220 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-[#002443]">{title}</h3>
        <span className="text-[10px] text-[#002443]/40 font-mono">{total}</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} label={renderLabel} labelLine={false} paddingAngle={2}>
            {data.map((entry, i) => <Cell key={i} fill={colorMap[entry.name] || FALLBACK[i % FALLBACK.length]} />)}
          </Pie>
          <Tooltip formatter={(val) => [val, 'Qtd']} />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorMap[entry.name] || FALLBACK[i % FALLBACK.length] }} />
            <span className="text-[10px] text-[#002443]/60">{entry.name}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}