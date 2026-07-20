import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign } from 'lucide-react';

function formatBRL(value) {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return `R$ ${value.toFixed(0)}`;
}

export default function TpvBySegmentChart({ data }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-4 h-4 text-[#1356E2]" />
        <h3 className="font-bold text-[#0A0A0A]">TPV por Segmento</h3>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal vertical={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={formatBRL} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={110} />
          <Tooltip formatter={(value) => [formatBRL(value), 'TPV']} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          <Bar dataKey="tpv" fill="#1356E2" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}