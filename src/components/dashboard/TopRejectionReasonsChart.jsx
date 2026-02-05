import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TopRejectionReasonsChart({ data }) {
  // data deve ter formato: [{ reason: 'Documento Inválido', count: 45 }, ...]
  const defaultData = [
    { reason: 'Documento Inválido', count: 0 },
    { reason: 'Dados Inconsistentes', count: 0 },
    { reason: 'Alto Risco Fraude', count: 0 },
    { reason: 'PEP Não Declarado', count: 0 },
    { reason: 'Atividade Suspeita', count: 0 }
  ];

  const chartData = data?.length > 0 ? data : defaultData;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-800 mb-4">Top 5 Causas de Reprovação (Helena)</h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis 
            dataKey="reason" 
            type="category" 
            tick={{ fontSize: 11 }} 
            stroke="#94a3b8" 
            width={120}
          />
          <Tooltip 
            formatter={(value) => [value.toLocaleString('pt-BR'), 'Ocorrências']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
          <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}