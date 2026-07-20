import React from 'react';

/**
 * Sliders para distribuição de vendas por faixa de parcelamento (4 faixas somam 100%)
 * À vista (1x) / 2-6x / 7-12x / 13-21x
 */
const INSTALLMENT_RANGES = [
  { key: 'avista', label: 'À Vista (1x)', color: '#1356E2' },
  { key: 'de2a6x', label: '2 a 6x', color: '#E84B1C' },
  { key: 'de7a12x', label: '7 a 12x', color: '#0A0A0A' },
  { key: 'de13a21x', label: '13 a 21x', color: '#E84B1C' },
];

export default function SliderDistributionParcelamento({ values, onChange }) {
  const total = Object.values(values).reduce((sum, v) => sum + (v || 0), 0);

  const handleChange = (key, val) => {
    const newVal = Math.max(0, Math.min(100, parseInt(val) || 0));
    onChange({ ...values, [key]: newVal });
  };

  const isValid = total === 100;

  return (
    <div className="space-y-4">
      {INSTALLMENT_RANGES.map(({ key, label, color }) => (
        <div key={key} className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-[#0A0A0A]/80">{label}</span>
            <span className="text-sm font-bold" style={{ color }}>{values[key] || 0}%</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={values[key] || 0}
              onChange={(e) => handleChange(key, e.target.value)}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${color} 0%, ${color} ${values[key] || 0}%, #e5e7eb ${values[key] || 0}%, #e5e7eb 100%)`,
              }}
            />
            <input
              type="number"
              min={0}
              max={100}
              value={values[key] || 0}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-16 h-8 text-center text-sm font-mono rounded-lg border border-[#0A0A0A]/10 bg-white"
            />
          </div>
        </div>
      ))}

      <div className={`flex items-center justify-between p-3 rounded-xl text-sm font-bold ${isValid ? 'bg-[#1356E2]/10 text-[#1356E2]' : 'bg-red-50 text-red-600'}`}>
        <span>Total</span>
        <span>{total}% {isValid ? '✓' : `(faltam ${100 - total}%)`}</span>
      </div>
    </div>
  );
}