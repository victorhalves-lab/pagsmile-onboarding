import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign } from 'lucide-react';

export default function PixFormBusiness({ form, updateField }) {
  return (
    <Card className="border-[#0A0A0A]/5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="w-5 h-5 text-[#1356E2]" />
          Volume e Modelo de Negócio PIX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>TPV / Faturamento Mensal em PIX (R$) *</Label>
            <Input type="number" value={form.pixTpv} onChange={e => updateField('pixTpv', e.target.value)} placeholder="Ex: 150000" />
          </div>
          <div>
            <Label>Ticket Médio em PIX (R$) *</Label>
            <Input type="number" value={form.pixTicketMedio} onChange={e => updateField('pixTicketMedio', e.target.value)} placeholder="Ex: 75" />
          </div>
          <div>
            <Label>Volume de Transações PIX/Mês</Label>
            <Input 
              type="number" 
              value={form.pixVolume} 
              readOnly 
              className="bg-[#f4f4f4] font-semibold" 
              placeholder="Calculado automaticamente" 
            />
            <p className="text-[10px] text-[#0A0A0A]/50 mt-1">Calculado: TPV ÷ Ticket Médio</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Modelo de Negócio *</Label>
            <Textarea value={form.businessModel} onChange={e => updateField('businessModel', e.target.value)} placeholder="Descreva brevemente como sua empresa opera" rows={3} />
          </div>
          <div>
            <Label>O que vende/comercializa? *</Label>
            <Textarea value={form.whatSells} onChange={e => updateField('whatSells', e.target.value)} placeholder="Ex: Produtos eletrônicos, serviços digitais, etc." rows={3} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}