import React from 'react';
import { Input } from '@/components/ui/input';
import EmailInput from '../leads/EmailInput';
import PhoneInput from '../leads/PhoneInput';
import ButtonSelector from './ButtonSelector';
import { CARGO_OPTIONS } from './pagsmileQuestionnaireData';

/** ETAPA 3 — Contato (P6-P9) */
export default function StepContato({ form, updateField, errors }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#002443]">Contato</h2>
        <p className="text-xs text-[#002443]/50 mt-1">Dados para comunicação comercial</p>
      </div>

      {/* P6 — E-mail */}
      <div className="space-y-1" data-field="email">
        <label className="text-sm font-semibold text-[#002443]">E-mail de Contato *</label>
        <EmailInput
          value={form.email || ''}
          onChange={(v) => updateField('email', v)}
          onSiteSuggestion={(site) => { if (!form.presencaDigital) updateField('presencaDigital', site); }}
          hasError={errors?.email}
        />
        {errors?.email && <p className="text-xs text-red-500">E-mail inválido</p>}
      </div>

      {/* P7 — Telefone */}
      <div className="space-y-1" data-field="phone">
        <label className="text-sm font-semibold text-[#002443]">Celular / WhatsApp *</label>
        <PhoneInput
          value={form.phone || ''}
          onChange={(v) => updateField('phone', v)}
          hasError={errors?.phone}
        />
        {errors?.phone && <p className="text-xs text-red-500">Telefone inválido (DDD + número, ex: 11 99999-9999)</p>}
      </div>

      {/* P8 — Nome do Contato */}
      <div className="space-y-1" data-field="contactName">
        <label className="text-sm font-semibold text-[#002443]">Nome do Contato *</label>
        <Input
          value={form.contactName || ''}
          onChange={(e) => updateField('contactName', e.target.value)}
          placeholder="Nome completo"
          className={`h-12 rounded-xl ${errors?.contactName ? 'border-red-400' : ''}`}
        />
        {errors?.contactName && <p className="text-xs text-red-500">Campo obrigatório</p>}
      </div>

      {/* P9 — Cargo */}
      <div className="space-y-2" data-field="cargo">
        <label className="text-sm font-semibold text-[#002443]">Cargo *</label>
        <ButtonSelector
          options={CARGO_OPTIONS}
          value={form.cargo}
          onChange={(v) => updateField('cargo', v)}
          allowOther
          otherValue={form.cargoOutro}
          onOtherChange={(v) => updateField('cargoOutro', v)}
        />
        {errors?.cargo && <p className="text-xs text-red-500">Cargo é obrigatório</p>}
        {errors?.cargoOutro && <p className="text-xs text-red-500">Descreva o cargo</p>}
      </div>
    </div>
  );
}