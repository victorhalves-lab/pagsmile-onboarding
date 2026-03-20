import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function ComplianceStatsCards({ stats, statusFilter, onStatusFilterChange }) {
  const cards = [
    { key: 'all', label: 'Total', value: stats.total, color: 'text-[#002443]', border: 'border-[#2bc196]', ring: 'ring-[#2bc196]/20' },
    { key: 'Pendente', label: 'Pendentes', value: stats.pendente, color: 'text-yellow-600', border: 'border-yellow-500', ring: 'ring-yellow-500/20' },
    { key: 'Em Processamento', label: 'Processando', value: stats.processando, color: 'text-blue-600', border: 'border-blue-500', ring: 'ring-blue-500/20' },
    { key: 'Manual', label: 'Revisão Manual', value: stats.manual, color: 'text-orange-600', border: 'border-orange-500', ring: 'ring-orange-500/20' },
    { key: 'Aprovado', label: 'Aprovados', value: stats.aprovado, color: 'text-green-600', border: 'border-green-500', ring: 'ring-green-500/20' },
    { key: 'Recusado', label: 'Recusados', value: stats.recusado, color: 'text-red-600', border: 'border-red-500', ring: 'ring-red-500/20' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(s => (
        <button 
          key={s.key}
          onClick={() => onStatusFilterChange(s.key)}
          className={`bg-white rounded-2xl border p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${
            statusFilter === s.key ? `${s.border} ring-2 ${s.ring}` : 'border-[#002443]/5'
          }`}
        >
          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="text-xs text-[#282828]/50">{s.label}</p>
          {s.key === 'Manual' && stats.slaAtRisk > 0 && (
            <p className="text-[10px] text-red-500 font-medium mt-1">{stats.slaAtRisk} com SLA em risco</p>
          )}
        </button>
      ))}
    </div>
  );
}