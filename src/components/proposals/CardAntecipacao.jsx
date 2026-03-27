import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Clock } from 'lucide-react';
import TaxaInput from './TaxaInput';

const PRAZOS = [
  { value: 'D+1', label: 'D+1' },
  { value: 'D+2', label: 'D+2' },
  { value: 'D+7', label: 'D+7' },
  { value: 'D+15', label: 'D+15' },
  { value: 'D+30', label: 'D+30' },
  { value: 'FLUXO', label: 'Fluxo' },
];

export default function CardAntecipacao({ form, onUpdate, readOnly = false }) {
  const labelCls = "text-[10px] text-[#2bc196]/70 font-semibold uppercase tracking-wider";
  const inputCls = "bg-white/5 border-white/10 text-white h-11 rounded-xl placeholder:text-white/15 focus:border-[#2bc196] focus:ring-1 focus:ring-[#2bc196]";

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-[#2bc196]/10 flex items-center justify-center"><Clock className="w-3.5 h-3.5 text-[#2bc196]" /></div>
        <h2 className="text-sm font-bold text-white">Antecipação</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className={labelCls}>Taxa RAV</Label>
          <TaxaInput value={form.taxaAntecipacao || ''} onChange={(val) => !readOnly && onUpdate('taxaAntecipacao', val)} placeholder="0,00" suffix="a.m." disabled={readOnly} className={`${inputCls} text-right pr-14 ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`} />
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>Prazo de Recebimento</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {PRAZOS.map(p => (
              <button key={p.value} onClick={() => !readOnly && onUpdate('prazoRecebimento', p.value)} disabled={readOnly}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  form.prazoRecebimento === p.value
                    ? 'bg-[#2bc196] text-[#002443] shadow-lg shadow-[#2bc196]/20'
                    : 'bg-white/5 text-white/30 hover:text-white/50 hover:bg-white/[0.08] border border-white/5'
                }`}>{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-white/5">
        <Switch id="usa-antecipacao" checked={form.usaAntecipacao} onCheckedChange={(checked) => !readOnly && onUpdate('usaAntecipacao', checked)} disabled={readOnly}
          className="data-[state=checked]:bg-[#2bc196]" />
        <Label htmlFor="usa-antecipacao" className="text-xs text-white/40 cursor-pointer">Utiliza Antecipação?</Label>
      </div>

      {form.usaAntecipacao && (
        <div className="space-y-1.5">
          <Label className={labelCls}>% do TPV Antecipado</Label>
          <TaxaInput value={form.percentualAntecipacao || ''} onChange={(val) => !readOnly && onUpdate('percentualAntecipacao', val)} placeholder="100,00" suffix="%" disabled={readOnly} className={`${inputCls} text-right pr-10 ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`} />
        </div>
      )}
    </div>
  );
}