import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ButtonSelector from './ButtonSelector';
import { HORARIO_PIX_OPTIONS } from './pixQuestionnaireData';

export default function StepVolumePix({ form, updateField, errors }) {
  useEffect(() => {
    const tpv = parseFloat(form.tpvPix);
    const ticket = parseFloat(form.ticketMedioPix);
    if (tpv > 0 && ticket > 0) {
      updateField('transacoesPix', String(Math.round(tpv / ticket)));
    }
  }, [form.tpvPix, form.ticketMedioPix]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#0A0A0A]">Volume PIX</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">TPV Mensal Esperado em PIX (R$) *</Label>
          <Input
            type="number"
            value={form.tpvPix || ''}
            onChange={e => updateField('tpvPix', e.target.value)}
            placeholder="150000"
            className={`text-xs ${errors?.tpvPix ? 'border-red-400' : ''}`}
          />
        </div>
        <div>
          <Label className="text-xs">Ticket Médio por PIX (R$) *</Label>
          <Input
            type="number"
            value={form.ticketMedioPix || ''}
            onChange={e => updateField('ticketMedioPix', e.target.value)}
            placeholder="75"
            className={`text-xs ${errors?.ticketMedioPix ? 'border-red-400' : ''}`}
          />
        </div>
        <div>
          <Label className="text-xs">Qtd Transações PIX/Mês</Label>
          <Input value={form.transacoesPix || ''} readOnly className="bg-[#f4f4f4] text-xs font-semibold" placeholder="Calculado" />
          <p className="text-[10px] text-[#0A0A0A]/40 mt-0.5">TPV ÷ Ticket Médio</p>
        </div>
      </div>

      <div>
        <Label className="text-xs mb-2 block">Horário principal de recebimento PIX *</Label>
        <ButtonSelector options={HORARIO_PIX_OPTIONS} value={form.horarioPix} onChange={v => updateField('horarioPix', v)} columns={4} />
        <p className="text-[10px] text-[#0A0A0A]/40 mt-1">PIX funciona 24/7. O horário define padrão de normalidade para monitoramento.</p>
      </div>
    </div>
  );
}