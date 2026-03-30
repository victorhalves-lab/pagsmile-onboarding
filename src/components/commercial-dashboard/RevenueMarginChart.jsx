import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

function formatBRL(value) {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return `R$ ${value.toFixed(0)}`;
}

export default function RevenueMarginChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[#2bc196]" />
          <h3 className="font-bold text-[#002443]">Receita vs Custo vs Margem</h3>
        </div>
        <div className="flex items-center justify-center h-[240px] text-sm text-[#002443]/40">
          Sem dados de rentabilidade em propostas aceitas
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-[#2bc196]" />
        <h3 className="font-bold text-[#002443]">Receita vs Custo vs Margem</h3>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={formatBRL} />
          <Tooltip formatter={(value) => [formatBRL(value)]} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} />
          <Bar dataKey="receita" name="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="custo" name="Custo" fill="#ef4444" radius={[4, 4, 0, 0]} />
          <Bar dataKey="margem" name="Margem" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}