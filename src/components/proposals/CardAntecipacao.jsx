import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import TaxaInput from './TaxaInput';

const PRAZOS = [
  { value: 'D+1', label: 'D+1' },
  { value: 'D+2', label: 'D+2' },
  { value: 'D+7', label: 'D+7' },
  { value: 'D+15', label: 'D+15' },
  { value: 'D+30', label: 'D+30' },
  { value: 'FLUXO', label: 'No Fluxo' },
];

export default function CardAntecipacao({ form, onUpdate }) {
  return (
    <div className="space-y-4 pt-4 border-t border-white/10">
      <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Antecipação</h2>
          {/* Optional: Switch to toggle section availability if needed, currently implied by fields */}
      </div>
      
      {/* Container Style from image */}
      <div className="bg-[#18181b] p-4 rounded-lg border border-white/5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Taxa RAV</Label>
              <div className="relative">
                  <TaxaInput
                    value={form.taxaAntecipacao || ''}
                    onChange={(val) => onUpdate('taxaAntecipacao', val)}
                    placeholder="0,00"
                    className="bg-[#09090b] border-white/10 text-white h-10 pr-12 text-right"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">a.m.</span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Prazo de Recebimento</Label>
              <Select 
                value={form.prazoRecebimento || 'D+1'} 
                onValueChange={(v) => onUpdate('prazoRecebimento', v)}
              >
                <SelectTrigger className="bg-[#09090b] border-white/10 text-white h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10 text-white">
                  {PRAZOS.map(p => (
                    <SelectItem key={p.value} value={p.value} className="focus:bg-white/10 focus:text-white cursor-pointer">
                        {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 pt-2">
               <Switch 
                  id="usa-antecipacao"
                  checked={form.usaAntecipacao}
                  onCheckedChange={(checked) => onUpdate('usaAntecipacao', checked)}
                  className="data-[state=checked]:bg-[#2bc196]"
               />
               <Label htmlFor="usa-antecipacao" className="text-xs text-slate-400 cursor-pointer">
                   Utiliza Antecipação?
               </Label>
          </div>
          
          {form.usaAntecipacao && (
              <div className="space-y-1.5 pt-2">
                 <Label className="text-xs text-slate-400">% do TPV Antecipado</Label>
                  <div className="relative">
                      <TaxaInput
                        value={form.percentualAntecipacao || ''}
                        onChange={(val) => onUpdate('percentualAntecipacao', val)}
                        placeholder="100,00"
                        className="bg-[#09090b] border-white/10 text-white h-10 pr-8 text-right"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">%</span>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
}