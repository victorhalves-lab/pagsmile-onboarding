import React from 'react';
import TrendLineChart from '../dashboard/TrendLineChart';

export default function LeadsTrendChart({ data }) {
  const lines = [
    { dataKey: 'novos', name: 'Novos Leads', color: '#0A0A0A' },
    { dataKey: 'convertidos', name: 'Convertidos', color: '#1356E2' },
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