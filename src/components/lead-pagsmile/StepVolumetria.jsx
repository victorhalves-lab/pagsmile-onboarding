import React, { useEffect } from 'react';
import CurrencyNumberInput from './CurrencyNumberInput';
import ButtonSelector from './ButtonSelector';
import { FATURAMENTO_ANUAL_OPTIONS, FUNCIONARIOS_OPTIONS } from './pagsmileQuestionnaireData';

/** ETAPA 5 — Volumetria e Faturamento (P15-P17 + P15.1, P15.2) */
export default function StepVolumetria({ form, updateField, errors }) {
  // P17 — Auto-calc transações
  useEffect(() => {
    const tpv = parseFloat(form.tpvMensal) || 0;
    const ticket = parseFloat(form.ticketMedio) || 0;
    if (tpv > 0 && ticket > 0) {
      updateField('transacoesMes', String(Math.round(tpv / ticket)));
    }
  }, [form.tpvMensal, form.ticketMedio]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#002443]">Volumetria e Faturamento</h2>
      </div>

      {/* P15 — TPV Mensal */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-[#002443]">TPV Mensal (R$) *</label>
        <CurrencyNumberInput value={form.tpvMensal} onChange={(v) => updateField('tpvMensal', v)} placeholder="150.000" hasError={errors?.tpvMensal} />
        <p className="text-[10px] text-[#002443]/40">Volume total de pagamentos processados por mês</p>
      </div>

      {/* P15.1 — Faturamento Anual (NOVO v5.0) */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#002443]">Faturamento Anual da Empresa *</label>
        <ButtonSelector options={FATURAMENTO_ANUAL_OPTIONS} value={form.faturamentoAnual} onChange={(v) => updateField('faturamentoAnual', v)} columns={3} />
      </div>

      {/* P15.2 — Número de Funcionários (NOVO v5.0) */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#002443]">Número de Funcionários *</label>
        <ButtonSelector options={FUNCIONARIOS_OPTIONS} value={form.funcionarios} onChange={(v) => updateField('funcionarios', v)} columns={6} />
      </div>

      {/* P16 — Ticket Médio */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-[#002443]">Ticket Médio (R$) *</label>
        <CurrencyNumberInput value={form.ticketMedio} onChange={(v) => updateField('ticketMedio', v)} placeholder="150" hasError={errors?.ticketMedio} />
      </div>

      {/* P17 — Transações/Mês (AUTO) */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-[#002443]">Transações/Mês</label>
        <div className="h-12 rounded-xl bg-[#f4f4f4] border border-[#002443]/5 flex items-center px-4">
          <span className="text-sm font-mono font-semibold text-[#002443]">
            {form.transacoesMes ? Number(form.transacoesMes).toLocaleString('pt-BR') : '—'}
          </span>
          <span className="text-[10px] text-[#002443]/40 ml-2">Calculado automaticamente (TPV ÷ Ticket Médio)</span>
        </div>
      </div>
    </div>
  );
}