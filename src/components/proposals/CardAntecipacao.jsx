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
    <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#002443]">Antecipação</h2>
      </div>
      
      <div className="bg-[#f4f4f4] p-4 rounded-xl border border-[#002443]/5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#282828]/50 font-medium">Taxa RAV</Label>
              <div className="relative">
                  <TaxaInput
                    value={form.taxaAntecipacao || ''}
                    onChange={(val) => onUpdate('taxaAntecipacao', val)}
                    placeholder="0,00"
                    className="bg-white border-[#002443]/10 text-[#002443] h-10 pr-12 text-right rounded-lg"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#282828]/40">a.m.</span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-[#282828]/50 font-medium">Prazo de Recebimento</Label>
              <Select 
                value={form.prazoRecebimento || 'D+1'} 
                onValueChange={(v) => onUpdate('prazoRecebimento', v)}
              >
                <SelectTrigger className="bg-white border-[#002443]/10 text-[#002443] h-10 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRAZOS.map(p => (
                    <SelectItem key={p.value} value={p.value} className="cursor-pointer">
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
                  <Label htmlFor="usa-antecipacao" className="text-xs text-[#282828]/50 cursor-pointer">
                   Utiliza Antecipação?
               </Label>
          </div>
          
          {form.usaAntecipacao && (
              <div className="space-y-1.5 pt-2">
                 <Label className="text-xs text-[#282828]/50 font-medium">% do TPV Antecipado</Label>
                  <div className="relative">
                      <TaxaInput
                        value={form.percentualAntecipacao || ''}
                        onChange={(val) => onUpdate('percentualAntecipacao', val)}
                        placeholder="100,00"
                        className="bg-white border-[#002443]/10 text-[#002443] h-10 pr-8 text-right rounded-lg"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#282828]/40">%</span>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
}