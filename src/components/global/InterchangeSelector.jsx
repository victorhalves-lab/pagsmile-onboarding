import React from 'react';
import { CreditCard, Sparkles } from 'lucide-react';
import { INTERCHANGE_SUMMARY } from '@/lib/global/interchangeData';

/**
 * Seletor rico de Interchange usado em GlobalProposalCreation.
 * Mostra 3 preços (low/avg/high) por bandeira e combinado, em cards comparáveis lado a lado.
 * Substitui o <Select> simples — preserva os mesmos values aceitos pela proposta:
 * visa_low, visa_avg, visa_high, master_low, master_avg, master_high,
 * combined_low, combined_avg, combined_high, custom.
 */
export default function InterchangeSelector({ value, onChange, customPct, customFixed, onCustomChange }) {
  const groups = [
    { brand: 'visa',     label: 'Visa',         data: INTERCHANGE_SUMMARY.visa,     color: 'from-blue-50 to-indigo-50',    border: 'border-blue-200' },
    { brand: 'master',   label: 'Mastercard',   data: INTERCHANGE_SUMMARY.master,   color: 'from-orange-50 to-red-50',     border: 'border-orange-200' },
    { brand: 'combined', label: 'Combined',     data: INTERCHANGE_SUMMARY.combined, color: 'from-[#2bc196]/8 to-[#5cf7cf]/8', border: 'border-[#2bc196]/30' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {groups.map(g => (
          <div key={g.brand} className={`rounded-xl border ${g.border} bg-gradient-to-br ${g.color} p-3`}>
            <div className="flex items-center gap-1.5 mb-2">
              <CreditCard className="w-3.5 h-3.5 text-[#002443]/60" />
              <span className="text-[11px] font-bold text-[#002443]">{g.label}</span>
            </div>
            <div className="space-y-1.5">
              {['low', 'avg', 'high'].map(tier => {
                const val = `${g.brand}_${tier}`;
                const isActive = value === val;
                const data = g.data[tier];
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => onChange(val)}
                    className={`w-full text-left p-2 rounded-lg border transition-all ${
                      isActive
                        ? 'bg-[#2bc196] text-white border-[#2bc196] shadow-sm'
                        : 'bg-white text-[#002443] border-[#002443]/10 hover:border-[#2bc196]/40'
                    }`}
                  >
                    <div className="text-[9px] uppercase font-bold tracking-wider opacity-70">
                      {tier === 'low' ? 'Lowest' : tier === 'avg' ? 'Average' : 'Highest'}
                    </div>
                    <div className="text-sm font-mono font-semibold mt-0.5">
                      {data.percentage.toFixed(3)}%
                    </div>
                    <div className="text-[10px] font-mono opacity-70">
                      + ${data.fixed.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Custom */}
      <button
        type="button"
        onClick={() => onChange('custom')}
        className={`w-full p-3 rounded-xl border-2 border-dashed transition-all flex items-center gap-3 ${
          value === 'custom'
            ? 'border-[#2bc196] bg-[#2bc196]/5'
            : 'border-[#002443]/15 hover:border-[#2bc196]/40 bg-white'
        }`}
      >
        <Sparkles className={`w-4 h-4 ${value === 'custom' ? 'text-[#2bc196]' : 'text-[#002443]/40'}`} />
        <div className="text-left flex-1">
          <div className="text-xs font-bold text-[#002443]">Custom</div>
          <div className="text-[10px] text-[#002443]/60">Define seus próprios valores de interchange</div>
        </div>
        {value === 'custom' && (
          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
            <input
              type="number" step="0.001"
              value={customPct}
              onChange={e => onCustomChange?.('pct', e.target.value)}
              className="w-20 h-8 rounded-md border border-[#002443]/15 px-2 text-xs font-mono"
              placeholder="%"
            />
            <input
              type="number" step="0.01"
              value={customFixed}
              onChange={e => onCustomChange?.('fixed', e.target.value)}
              className="w-20 h-8 rounded-md border border-[#002443]/15 px-2 text-xs font-mono"
              placeholder="$"
            />
          </div>
        )}
      </button>
    </div>
  );
}