import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FileText } from 'lucide-react';

const STATUS_COLORS = {
  rascunho: '#94a3b8',
  enviada: '#1356E2',
  visualizada: '#8B5CF6',
  aceita: '#1356E2',
  recusada: '#ef4444',
  contraproposta: '#F59E0B',
  expirada: '#6b7280',
  cancelada: '#0A0A0A',
};

const STATUS_LABELS = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  visualizada: 'Visualizada',
  aceita: 'Aceita',
  recusada: 'Recusada',
  contraproposta: 'Contraproposta',
  expirada: 'Expirada',
  cancelada: 'Cancelada',
};

export default function ProposalStatusPieChart({ proposals }) {
  const statusCounts = {};
  proposals.forEach(p => {
    const s = p.status || 'rascunho';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  const data = Object.entries(statusCounts)
    .map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      color: STATUS_COLORS[status] || '#94a3b8',
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-[#0A0A0A]/70" />
        <h3 className="font-bold text-[#0A0A0A]">Status das Propostas</h3>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [value.toLocaleString('pt-BR'), name]} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}