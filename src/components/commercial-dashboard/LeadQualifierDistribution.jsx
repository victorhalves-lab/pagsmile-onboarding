import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Brain } from 'lucide-react';

const LEVEL_COLORS = {
  EXCELENTE: '#22c55e',
  BOM: '#84cc16',
  REGULAR: '#eab308',
  FRACO: '#f97316',
  INSUFICIENTE: '#ef4444',
  PENDENTE: '#94a3b8',
};

export default function LeadQualifierDistribution({ data, avgScore, avgPriscila }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-[#0A0A0A]/70" />
        <h3 className="font-bold text-[#0A0A0A]">Análise IA dos Leads</h3>
      </div>

      {/* Score averages */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-3 rounded-xl bg-[#1356E2]/5">
          <p className="text-2xl font-bold text-[#1356E2]">{avgScore}</p>
          <p className="text-[10px] text-[#0A0A0A]/40 font-medium">Score Médio Qualifier</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-[#0A0A0A]/5">
          <p className="text-2xl font-bold text-[#0A0A0A]">{avgPriscila}</p>
          <p className="text-[10px] text-[#0A0A0A]/40 font-medium">Score Médio PRISCILA</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="level" tick={{ fontSize: 10 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <Tooltip formatter={(value) => [value, 'Leads']} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {(data || []).map((entry, index) => (
              <Cell key={index} fill={LEVEL_COLORS[entry.level] || '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}