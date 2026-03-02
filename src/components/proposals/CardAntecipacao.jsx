import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { TrendingUp } from 'lucide-react';
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

export default function CardAntecipacao({ rav, onUpdate }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[var(--pagsmile-green)]" />
          Antecipação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Taxa RAV *</Label>
            <TaxaInput
              value={rav?.taxa || ''}
              onChange={(val) => onUpdate({ ...rav, taxa: val })}
              suffix="% a.m."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Prazo de Recebimento</Label>
            <Select 
              value={rav?.prazo || 'D+1'} 
              onValueChange={(v) => onUpdate({ ...rav, prazo: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRAZOS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}