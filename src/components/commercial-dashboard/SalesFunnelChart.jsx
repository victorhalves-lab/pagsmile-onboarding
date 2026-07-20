import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';

const FUNNEL_COLORS = ['#0A0A0A', '#E84B1C', '#1356E2', '#8B5CF6', '#F59E0B', '#1356E2', '#E84B1C'];

export default function SalesFunnelChart({ data }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-[#0A0A0A]/70" />
        <h3 className="font-bold text-[#0A0A0A]">Funil de Vendas</h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal vertical={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={120} />
          <Tooltip formatter={(value) => [value.toLocaleString('pt-BR'), 'Total']} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {(data || []).map((_, index) => (
              <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}