import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#002443', '#36706c', '#2bc196', '#5cf7cf', '#eab308', '#3b82f6', '#22c55e'];

export default function CEOFunnelOverview({ data }) {
  return (
    <div className="bg-white rounded-2xl border border-[#002443]/5 p-5">
      <h3 className="text-sm font-bold text-[#002443] mb-1">Funil Comercial Completo</h3>
      <p className="text-[10px] text-[#002443]/40 mb-4">Distribuição de leads por etapa do funil</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#002443" strokeOpacity={0.05} />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#002443' }} />
            <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: '#002443' }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,36,67,0.1)', fontSize: 12 }}
              formatter={(v) => [v, 'Leads']}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}