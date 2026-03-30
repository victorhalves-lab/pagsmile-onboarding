import React from 'react';
import TrendLineChart from '../dashboard/TrendLineChart';

export default function LeadsTrendChart({ data }) {
  const lines = [
    { dataKey: 'novos', name: 'Novos Leads', color: '#002443' },
    { dataKey: 'convertidos', name: 'Convertidos', color: '#22c55e' },
    { dataKey: 'perdidos', name: 'Perdidos', color: '#ef4444' }
  ];

  return (
    <TrendLineChart
      data={data}
      title="Tendência de Leads (6 meses)"
      lines={lines}
    />
  );
}