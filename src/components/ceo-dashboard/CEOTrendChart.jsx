import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function CEOTrendChart({ data }) {
  return (
    <div className="bg-white rounded-2xl border border-[#002443]/5 p-5">
      <h3 className="text-sm font-bold text-[#002443] mb-1">Tendência Mensal</h3>
      <p className="text-[10px] text-[#002443]/40 mb-4">Leads novos, convertidos e perdidos nos últimos 6 meses</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#002443" strokeOpacity={0.05} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#002443' }} />
            <YAxis tick={{ fontSize: 10, fill: '#002443' }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,36,67,0.1)', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="novos" stroke="#002443" strokeWidth={2} dot={{ r: 3 }} name="Novos" />
            <Line type="monotone" dataKey="convertidos" stroke="#2bc196" strokeWidth={2} dot={{ r: 3 }} name="Convertidos" />
            <Line type="monotone" dataKey="perdidos" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Perdidos" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}