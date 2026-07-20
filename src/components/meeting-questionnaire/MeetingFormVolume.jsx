import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign } from 'lucide-react';

const PAYMENT_METHODS = ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto'];

export default function MeetingFormVolume({ form, updateField }) {
  const togglePaymentMethod = (method) => {
    const current = form.preferredPaymentMethods || [];
    if (current.includes(method)) {
      updateField('preferredPaymentMethods', current.filter(m => m !== method));
    } else {
      updateField('preferredPaymentMethods', [...current, method]);
    }
  };

  return (
    <Card className="border-[#0A0A0A]/5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="w-5 h-5 text-[#1356E2]" />
          Volume e Transações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>TPV Mensal (R$)</Label>
            <Input type="number" value={form.monthlyTpv} onChange={e => updateField('monthlyTpv', e.target.value)} placeholder="Ex: 500000" />
          </div>
          <div>
            <Label>Ticket Médio (R$)</Label>
            <Input type="number" value={form.averageTicket} onChange={e => updateField('averageTicket', e.target.value)} placeholder="Ex: 150" />
          </div>
          <div>
            <Label>Transações/Mês</Label>
            <Input type="number" value={form.monthlyTransactions} onChange={e => updateField('monthlyTransactions', e.target.value)} placeholder="Ex: 3000" />
          </div>
        </div>
        <div>
          <Label>Expectativa de Crescimento</Label>
          <Input value={form.growthExpectation} onChange={e => updateField('growthExpectation', e.target.value)} placeholder="Ex: 20% nos próximos 12 meses" />
        </div>

        <div>
          <Label className="mb-2 block">Métodos de Pagamento Prioritários</Label>
          <div className="flex flex-wrap gap-4">
            {PAYMENT_METHODS.map(method => (
              <label key={method} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={(form.preferredPaymentMethods || []).includes(method)}
                  onCheckedChange={() => togglePaymentMethod(method)}
                />
                <span className="text-sm">{method}</span>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}