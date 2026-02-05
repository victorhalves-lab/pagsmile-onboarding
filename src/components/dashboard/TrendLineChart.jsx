import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function TrendLineChart({ 
  data, 
  title,
  lines = [
    { dataKey: 'ia', name: 'Análises IA', color: '#22c55e' },
    { dataKey: 'manual', name: 'Análises Manual', color: '#f97316' }
  ],
  height = 280
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="font-semibold text-[var(--pagsmile-blue)] mb-4">{title}</h3>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
          <Legend 
            iconType="circle"
            wrapperStyle={{ paddingTop: '20px' }}
          />
          {lines.map((line, index) => (
            <Line 
              key={index}
              type="monotone" 
              dataKey={line.dataKey} 
              name={line.name}
              stroke={line.color} 
              strokeWidth={2}
              dot={{ r: 4, fill: line.color }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}