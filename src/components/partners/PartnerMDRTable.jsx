import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';

const BANDEIRA_LABELS = {
  mastercard: 'Mastercard', visa: 'Visa', elo: 'Elo',
  amex: 'Amex', hiper: 'Hiper', todas: 'Todas'
};

const FAIXA_COLS = [
  { key: 'debito', label: 'Débito' },
  { key: 'avista', label: 'Crédito 1x' },
  { key: 'de2a6x', label: '2x-6x' },
  { key: 'de7a12x', label: '7x-12x' },
  { key: 'de13a24x', label: '13x-24x' },
];

function formatRate(val) {
  if (!val && val !== 0) return '-';
  return `${(val * 100).toFixed(2).replace('.', ',')}%`;
}

function MCCBlock({ mccItem }) {
  const bandeiras = Object.keys(mccItem.rates || {});
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#f4f4f4]/50">
            <th className="text-left py-1.5 px-2 text-[#002443]/40 font-semibold w-24">Bandeira</th>
            {FAIXA_COLS.map(f => (
              <th key={f.key} className="text-center py-1.5 px-2 text-[#002443]/40 font-semibold">{f.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bandeiras.map(b => (
            <tr key={b} className="border-t border-[#002443]/[0.03]">
              <td className="py-1.5 px-2 font-semibold text-[#002443] text-xs">{BANDEIRA_LABELS[b] || b}</td>
              {FAIXA_COLS.map(f => (
                <td key={f.key} className="text-center py-1.5 px-2 text-[#002443] text-xs">
                  {formatRate(mccItem.rates[b]?.[f.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PartnerMDRTable({ mdrByMcc = [], compact = false }) {
  const [expandedMcc, setExpandedMcc] = useState(null);

  if (!mdrByMcc.length) {
    return <p className="text-xs text-[#002443]/30 py-4 text-center">Nenhuma taxa por MCC cadastrada</p>;
  }

  if (compact) {
    return (
      <div className="space-y-1">
        {mdrByMcc.map((item, idx) => (
          <div key={idx}>
            <button
              onClick={() => setExpandedMcc(expandedMcc === idx ? null : idx)}
              className="flex items-center gap-2 w-full text-left py-1.5 px-2 rounded-lg hover:bg-[#f4f4f4] transition-colors"
            >
              {expandedMcc === idx 
                ? <ChevronDown className="w-3 h-3 text-[#002443]/30" /> 
                : <ChevronRight className="w-3 h-3 text-[#002443]/30" />
              }
              <Badge variant="outline" className="text-[10px] border-[#002443]/10 font-mono">{item.mccCode}</Badge>
              <span className="text-xs text-[#002443]/70">{item.mccDescription}</span>
            </button>
            {expandedMcc === idx && (
              <div className="ml-5 mt-1 mb-2">
                <MCCBlock mccItem={item} />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mdrByMcc.map((item, idx) => (
        <div key={idx} className="rounded-xl border border-[#002443]/5 overflow-hidden">
          <div className="bg-[#f4f4f4] px-3 py-2 flex items-center gap-2">
            <Badge className="bg-[#002443]/10 text-[#002443] border-0 text-[10px] font-mono">{item.mccCode}</Badge>
            <span className="text-xs font-semibold text-[#002443]">{item.mccDescription}</span>
          </div>
          <div className="p-2">
            <MCCBlock mccItem={item} />
          </div>
        </div>
      ))}
    </div>
  );
}