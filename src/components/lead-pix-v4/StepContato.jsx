import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EmailInput from '@/components/leads/EmailInput';
import PhoneInput from '@/components/leads/PhoneInput';
import ButtonSelector from './ButtonSelector';
import { CARGO_OPTIONS } from './pixQuestionnaireData';

export default function StepContato({ form, updateField, errors }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#0A0A0A]">Contato</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">E-mail de Contato *</Label>
          <EmailInput value={form.email || ''} onChange={v => updateField('email', v)} error={errors?.email} />
        </div>
        <div>
          <Label className="text-xs">Celular / WhatsApp *</Label>
          <PhoneInput value={form.phone || ''} onChange={v => updateField('phone', v)} error={errors?.phone} />
        </div>
      </div>

      <div>
        <Label className="text-xs">Nome do Contato *</Label>
        <Input
          value={form.contactName || ''}
          onChange={e => updateField('contactName', e.target.value)}
          placeholder="Nome completo"
          className={`text-xs ${errors?.contactName ? 'border-red-400' : ''}`}
        />
      </div>

      <div>
        <Label className="text-xs mb-2 block">Cargo *</Label>
        <ButtonSelector options={CARGO_OPTIONS} value={form.cargo} onChange={v => updateField('cargo', v)} columns={3} />
        {form.cargo === 'Outro' && (
          <Input value={form.cargoOutro || ''} onChange={e => updateField('cargoOutro', e.target.value)} placeholder="Qual cargo?" className="mt-2 text-xs" />
        )}
      </div>
    </div>
  );
}