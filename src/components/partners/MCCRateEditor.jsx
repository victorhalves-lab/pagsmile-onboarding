import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react';

const BANDEIRAS = ['visa', 'mastercard', 'elo', 'amex', 'hiper'];
const BANDEIRA_LABELS = { visa: 'Visa', mastercard: 'Mastercard', elo: 'Elo', amex: 'Amex', hiper: 'Hiper' };
const FAIXA_COLS = [
  { key: 'debito', label: 'Débito' },
  { key: 'avista', label: 'Crédito 1x' },
  { key: 'de2a6x', label: '2x-6x' },
  { key: 'de7a12x', label: '7x-12x' },
  { key: 'de13a24x', label: '13x-24x' },
];

export default function MCCRateEditor({ mccItem, index, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(true);

  const updateField = (field, value) => {
    onChange(index, { ...mccItem, [field]: value });
  };

  const updateRate = (bandeira, faixa, value) => {
    const rates = { ...(mccItem.rates || {}) };
    rates[bandeira] = { ...(rates[bandeira] || {}), [faixa]: value };
    onChange(index, { ...mccItem, rates });
  };

  return (
    <div className="rounded-xl border border-[#002443]/10 overflow-hidden">
      <div className="bg-[#f4f4f4] px-3 py-2 flex items-center gap-2">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 flex-1 text-left">
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-[#002443]/30" /> : <ChevronRight className="w-3.5 h-3.5 text-[#002443]/30" />}
          <Badge className="bg-[#002443]/10 text-[#002443] border-0 text-[10px] font-mono">{mccItem.mccCode || '????'}</Badge>
          <span className="text-xs font-semibold text-[#002443]">{mccItem.mccDescription || 'Sem descrição'}</span>
        </button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400" onClick={() => onRemove(index)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {expanded && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={mccItem.mccCode || ''}
              onChange={(e) => updateField('mccCode', e.target.value)}
              placeholder="Código MCC (ex: 4816)"
              className="border-[#002443]/10 h-8 text-xs"
            />
            <Input
              value={mccItem.mccDescription || ''}
              onChange={(e) => updateField('mccDescription', e.target.value)}
              placeholder="Descrição (ex: Rede de Computadores)"
              className="border-[#002443]/10 h-8 text-xs"
            />
          </div>
          
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
                {BANDEIRAS.map(b => (
                  <tr key={b} className="border-t border-[#002443]/[0.03]">
                    <td className="py-1.5 px-2 font-semibold text-[#002443] text-xs">{BANDEIRA_LABELS[b]}</td>
                    {FAIXA_COLS.map(f => (
                      <td key={f.key} className="py-1 px-1">
                        <Input
                          type="number"
                          step="0.0001"
                          min="0"
                          value={mccItem.rates?.[b]?.[f.key] || ''}
                          onChange={(e) => updateRate(b, f.key, parseFloat(e.target.value) || 0)}
                          placeholder="0.0000"
                          className="border-[#002443]/10 h-7 text-[10px] text-center w-full"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}