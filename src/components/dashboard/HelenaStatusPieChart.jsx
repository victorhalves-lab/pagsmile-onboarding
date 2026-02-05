import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Clock } from 'lucide-react';

export default function HelenaStatusPieChart({ 
  approvedIA = 0, 
  manualReview = 0, 
  rejectedIA = 0 
}) {
  const total = approvedIA + manualReview + rejectedIA;
  
  const data = [
    { 
      name: 'Aprovado IA', 
      value: approvedIA, 
      color: '#22c55e',
      percentage: total > 0 ? Math.round((approvedIA / total) * 100) : 0
    },
    { 
      name: 'Review Manual', 
      value: manualReview, 
      color: '#f97316',
      percentage: total > 0 ? Math.round((manualReview / total) * 100) : 0
    },
    { 
      name: 'Reprovado IA', 
      value: rejectedIA, 
      color: '#ef4444',
      percentage: total > 0 ? Math.round((rejectedIA / total) * 100) : 0
    }
  ].filter(d => d.value > 0);

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, percentage }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill={data.find(d => d.name === name)?.color || '#000'}
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight={500}
      >
        {`${name} (${percentage}%)`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-slate-500" />
        <h3 className="font-semibold text-slate-800">Distribuição por Status (Helena)</h3>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            label={CustomLabel}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [value.toLocaleString('pt-BR'), name]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}