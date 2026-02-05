import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';

export default function ComplianceFunnelChart({ data }) {
  // data deve ter formato: [{ name: 'Submissões', value: 1247 }, ...]
  const colors = {
    'Submissões': '#3b82f6',
    'Análise IA': '#8b5cf6',
    'Aprovadas IA': '#f97316',
    'Manual Review': '#eab308',
    'Aprovadas Final': '#22c55e'
  };

  const defaultData = [
    { name: 'Submissões', value: 0 },
    { name: 'Análise IA', value: 0 },
    { name: 'Aprovadas IA', value: 0 },
    { name: 'Manual Review', value: 0 },
    { name: 'Aprovadas Final', value: 0 }
  ];

  const chartData = data || defaultData;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-[var(--pagsmile-blue)]/70" />
        <h3 className="font-semibold text-[var(--pagsmile-blue)]">Funil de Compliance</h3>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis 
            dataKey="name" 
            type="category" 
            tick={{ fontSize: 12 }} 
            stroke="#94a3b8" 
            width={100}
          />
          <Tooltip 
            formatter={(value) => [value.toLocaleString('pt-BR'), 'Total']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[entry.name] || '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}