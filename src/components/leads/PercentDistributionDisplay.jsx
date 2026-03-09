import React from 'react';
import { PieChart } from 'lucide-react';

/**
 * Exibe grupos de distribuição percentual (TPV, Bandeiras, Parcelamento) no modal de respostas.
 */

const DISTRIBUTION_GROUPS = [
  {
    title: 'Distribuição do TPV',
    icon: '💳',
    fields: [
      { id: '69a5cd22afab70a7ca2184e9', label: 'Cartão de Crédito' },
      { id: '69a5cd22afab70a7ca2184ea', label: 'PIX' },
      { id: '69a5cd22afab70a7ca2184eb', label: 'Boleto' },
    ],
  },
  {
    title: 'Distribuição por Bandeira',
    icon: '🏷️',
    fields: [
      { id: '69a5cd22afab70a7ca2184ec', label: 'Visa' },
      { id: '69a5cd22afab70a7ca2184ed', label: 'Mastercard' },
      { id: '69a5cd22afab70a7ca2184ee', label: 'Elo / Amex / Outras' },
    ],
  },
  {
    title: 'Distribuição por Parcelamento',
    icon: '📊',
    fields: [
      { id: '69a5cd22afab70a7ca2184ef', label: 'À Vista (1x)' },
      { id: '69a5cd22afab70a7ca2184f0', label: '2x a 6x' },
      { id: '69a5cd22afab70a7ca2184f1', label: '7x a 12x' },
    ],
  },
];

// Export the IDs for the parent to know which questions are handled here
export const DISTRIBUTION_QUESTION_IDS = DISTRIBUTION_GROUPS.flatMap(g => g.fields.map(f => f.id));

export default function PercentDistributionDisplay({ questionnaireData }) {
  return (
    <div className="space-y-4">
      {DISTRIBUTION_GROUPS.map(group => {
        const values = group.fields.map(f => {
          const raw = questionnaireData[f.id];
          return {
            ...f,
            value: raw !== undefined && raw !== null && raw !== '' ? parseFloat(raw) : null,
          };
        });
        const total = values.reduce((sum, v) => sum + (v.value || 0), 0);
        const hasAny = values.some(v => v.value !== null);

        return (
          <div key={group.title} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">{group.icon}</span>
              <span className="text-xs font-bold text-white/60 uppercase tracking-wider">{group.title}</span>
              {hasAny && (
                <span className={`text-[10px] ml-auto px-2 py-0.5 rounded-full font-bold ${
                  Math.abs(total - 100) < 0.1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  Total: {total.toFixed(0)}%
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {values.map(v => (
                <div key={v.id} className="text-center">
                  <p className="text-[10px] text-white/40 mb-1">{v.label}</p>
                  {v.value !== null ? (
                    <p className="text-lg font-bold text-cyan-400">{v.value.toFixed(0)}%</p>
                  ) : (
                    <p className="text-sm text-white/15">—</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}