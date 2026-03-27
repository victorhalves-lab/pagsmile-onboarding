import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

const BANDEIRAS = ['visa', 'mastercard', 'elo', 'amex', 'outras'];
const BANDEIRA_LABELS = { visa: 'Visa', mastercard: 'Mastercard', elo: 'Elo', amex: 'Amex', outras: 'Outras' };
const FAIXAS = ['avista', 'de2a6x', 'de7a12x', 'de13a21x'];
const FAIXA_LABELS = { avista: 'À Vista', de2a6x: '2x a 6x', de7a12x: '7x a 12x', de13a21x: '13x a 21x' };

function RateInput({ value, onChange }) {
  return (
    <Input
      type="number"
      step="0.01"
      min="0"
      value={value || ''}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      placeholder="0.00"
      className="border-[#002443]/10 h-8 text-xs text-center w-full"
    />
  );
}

export default function PartnerMDRTable({ mdr = {}, onChange, readOnly = false }) {
  const updateRate = (bandeira, faixa, value) => {
    onChange({
      ...mdr,
      [bandeira]: {
        ...(mdr[bandeira] || {}),
        [faixa]: value
      }
    });
  };

  const copyFirstBrand = () => {
    const source = mdr.mastercard || mdr.visa || {};
    if (!source.avista && !source.de2a6x && !source.de7a12x && !source.de13a21x) {
      toast.error('Preencha pelo menos uma bandeira primeiro');
      return;
    }
    const newMdr = {};
    BANDEIRAS.forEach(b => { newMdr[b] = { ...source }; });
    onChange(newMdr);
    toast.success('Taxas copiadas para todas as bandeiras');
  };

  if (readOnly) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#002443]/10">
              <th className="text-left py-2 px-2 text-[#002443]/40 font-semibold w-24">Bandeira</th>
              {FAIXAS.map(f => (
                <th key={f} className="text-center py-2 px-2 text-[#002443]/40 font-semibold">{FAIXA_LABELS[f]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BANDEIRAS.map(b => (
              <tr key={b} className="border-b border-[#002443]/[0.03]">
                <td className="py-2 px-2 font-semibold text-[#002443]">{BANDEIRA_LABELS[b]}</td>
                {FAIXAS.map(f => {
                  const val = mdr[b]?.[f] || 0;
                  return (
                    <td key={f} className="text-center py-2 px-2 text-[#002443]">
                      {val ? `${val.toFixed(2)}%` : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-[10px] text-[#002443]/40 font-bold uppercase tracking-wider">MDR Crédito (%)</p>
        <Button variant="ghost" size="sm" onClick={copyFirstBrand} className="text-[10px] text-[#002443]/40 hover:text-[#2bc196] h-7">
          <Copy className="w-3 h-3 mr-1" /> Copiar 1ª para todas
        </Button>
      </div>
      <div className="rounded-xl border border-[#002443]/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#f4f4f4]">
                <th className="text-left py-2 px-3 text-[#002443]/40 font-semibold w-24">Bandeira</th>
                {FAIXAS.map(f => (
                  <th key={f} className="text-center py-2 px-2 text-[#002443]/40 font-semibold">{FAIXA_LABELS[f]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BANDEIRAS.map(b => (
                <tr key={b} className="border-t border-[#002443]/[0.03]">
                  <td className="py-2 px-3 font-semibold text-[#002443]">{BANDEIRA_LABELS[b]}</td>
                  {FAIXAS.map(f => (
                    <td key={f} className="py-1.5 px-2">
                      <RateInput
                        value={mdr[b]?.[f]}
                        onChange={(val) => updateRate(b, f, val)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}