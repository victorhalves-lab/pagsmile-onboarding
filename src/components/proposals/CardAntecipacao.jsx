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

const PCT_ANTECIPACAO_OPCOES = [0, 20, 40, 60, 80, 100];

export default function CardAntecipacao({ form, onUpdate, readOnly = false }) {
  const labelCls = "text-[10px] text-[#FFB81C]/80 font-semibold uppercase tracking-wider";
  const inputCls = "bg-white/5 border-white/10 text-white h-11 rounded-xl placeholder:text-white/15 focus:border-[#1356E2] focus:ring-1 focus:ring-[#1356E2]";

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-[#1356E2]/10 flex items-center justify-center"><Clock className="w-3.5 h-3.5 text-[#E84B1C]" /></div>
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
                    ? 'bg-[#1356E2] text-[#0A0A0A] shadow-lg shadow-[#1356E2]/20'
                    : 'bg-white/5 text-white/30 hover:text-white/50 hover:bg-white/[0.08] border border-white/5'
                }`}>{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-white/5">
        <Switch id="usa-antecipacao" checked={form.usaAntecipacao} onCheckedChange={(checked) => !readOnly && onUpdate('usaAntecipacao', checked)} disabled={readOnly}
          className="data-[state=checked]:bg-[#1356E2]" />
        <Label htmlFor="usa-antecipacao" className="text-xs text-white/40 cursor-pointer">Utiliza Antecipação?</Label>
      </div>

      {form.usaAntecipacao && (
        <div className="space-y-1.5">
          <Label className={labelCls}>% do TPV Antecipado</Label>
          <div className="grid grid-cols-6 gap-1.5">
            {PCT_ANTECIPACAO_OPCOES.map(pct => {
              const current = Number(form.percentualAntecipacao);
              const isActive = current === pct;
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => !readOnly && onUpdate('percentualAntecipacao', pct)}
                  disabled={readOnly}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#1356E2] text-[#0A0A0A] shadow-lg shadow-[#1356E2]/20'
                      : 'bg-white/5 text-white/30 hover:text-white/50 hover:bg-white/[0.08] border border-white/5'
                  } ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {pct}%
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}