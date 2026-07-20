import React from 'react';

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

export const DISTRIBUTION_QUESTION_IDS = DISTRIBUTION_GROUPS.flatMap(g => g.fields.map(f => f.id));

export default function PercentDistributionDisplay({ questionnaireData }) {
  return (
    <div className="space-y-4">
      {DISTRIBUTION_GROUPS.map(group => {
        const values = group.fields.map(f => {
          const raw = questionnaireData[f.id];
          return { ...f, value: raw !== undefined && raw !== null && raw !== '' ? parseFloat(raw) : null };
        });
        const total = values.reduce((sum, v) => sum + (v.value || 0), 0);
        const hasAny = values.some(v => v.value !== null);

        return (
          <div key={group.title} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">{group.icon}</span>
              <span className="text-xs font-bold text-[#0A0A0A]/70 uppercase tracking-wider">{group.title}</span>
              {hasAny && (
                <span className={`text-[10px] ml-auto px-2.5 py-1 rounded-full font-bold border ${
                  Math.abs(total - 100) < 0.1
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  Total: {total.toFixed(0)}%
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {values.map(v => (
                <div key={v.id} className="text-center bg-white rounded-lg border border-[#e2e8f0] p-3">
                  <p className="text-[10px] text-[#0A0A0A]/50 mb-1 font-medium">{v.label}</p>
                  {v.value !== null ? (
                    <p className="text-2xl font-bold text-indigo-600">{v.value.toFixed(0)}%</p>
                  ) : (
                    <p className="text-lg text-[#0A0A0A]/15 font-bold">—</p>
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