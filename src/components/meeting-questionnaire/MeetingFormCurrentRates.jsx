import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Check } from 'lucide-react';

export default function MeetingFormCurrentRates({ form, updateField }) {
  return (
    <Card className="border-[#002443]/5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="w-5 h-5 text-[#2bc196]" />
          Taxas e Custos Atuais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* MDR */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">MDR Cartão de Crédito</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-[#002443]/60">1x (%)</Label>
              <Input type="number" step="0.01" value={form.currentMdr1x} onChange={e => updateField('currentMdr1x', e.target.value)} placeholder="Ex: 2.5" />
            </div>
            <div>
              <Label className="text-xs text-[#002443]/60">2-6x (%)</Label>
              <Input type="number" step="0.01" value={form.currentMdr2to6x} onChange={e => updateField('currentMdr2to6x', e.target.value)} placeholder="Ex: 3.2" />
            </div>
            <div>
              <Label className="text-xs text-[#002443]/60">7-12x (%)</Label>
              <Input type="number" step="0.01" value={form.currentMdr7to12x} onChange={e => updateField('currentMdr7to12x', e.target.value)} placeholder="Ex: 4.0" />
            </div>
          </div>
        </div>

        {/* PIX & Boleto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Taxa PIX (%)</Label>
            <Input type="number" step="0.01" value={form.currentPixRate} onChange={e => updateField('currentPixRate', e.target.value)} placeholder="Ex: 0.99" />
          </div>
          <div>
            <Label>Taxa Boleto (R$)</Label>
            <Input type="number" step="0.01" value={form.currentBoletoRate} onChange={e => updateField('currentBoletoRate', e.target.value)} placeholder="Ex: 3.50" />
          </div>
        </div>

        {/* Antecipação */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Antecipação</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-[#002443]/60">Tipo de Antecipação</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[
                  { v: 'D+1', l: 'D+1' },
                  { v: 'D+2', l: 'D+2' },
                  { v: 'D+3', l: 'D+3' },
                  { v: 'D+15', l: 'D+15' },
                  { v: 'D+30', l: 'D+30' },
                  { v: 'nao_utiliza', l: 'Não utiliza' },
                ].map(opt => (
                  <button key={opt.v} type="button" onClick={() => updateField('anticipationType', opt.v)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                      form.anticipationType === opt.v
                        ? 'bg-[#2bc196] border-[#2bc196] text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-[#2bc196]/50'
                    }`}>
                    {form.anticipationType === opt.v && <Check className="w-2.5 h-2.5 inline mr-1" />}{opt.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs text-[#002443]/60">Taxa de Antecipação (%)</Label>
              <Input type="number" step="0.01" value={form.anticipationRate} onChange={e => updateField('anticipationRate', e.target.value)} placeholder="Ex: 1.8" />
            </div>
          </div>
        </div>

        {/* Fee transação */}
        <div>
          <Label>Fee por Transação (R$)</Label>
          <Input type="number" step="0.01" value={form.transactionFee} onChange={e => updateField('transactionFee', e.target.value)} placeholder="Ex: 0.40" />
        </div>

        {/* Antifraude */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Antifraude</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-[#002443]/60">Provedor de Antifraude</Label>
              <Input value={form.antiFraudProvider} onChange={e => updateField('antiFraudProvider', e.target.value)} placeholder="Ex: ClearSale, Konduto, etc." />
            </div>
            <div>
              <Label className="text-xs text-[#002443]/60">Custo do Antifraude (R$)</Label>
              <Input type="number" step="0.01" value={form.antiFraudCost} onChange={e => updateField('antiFraudCost', e.target.value)} placeholder="Ex: 0.65" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}