import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SLAsForm({ contract, onChange }) {
  const Field = ({ label, field, placeholder, type = 'text', suffix }) => (
    <div className="space-y-1">
      <Label className="text-[10px] text-[#0A0A0A]/50 uppercase tracking-wider">{label}</Label>
      <div className="relative">
        <Input
          type={type}
          value={contract[field] ?? ''}
          onChange={e => onChange(field, type === 'number' ? (e.target.value === '' ? null : parseFloat(e.target.value)) : e.target.value)}
          placeholder={placeholder}
          className={suffix ? 'pr-10 text-right' : ''}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#0A0A0A]/30">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* SLA de Disponibilidade */}
      <div>
        <h3 className="text-sm font-bold text-[#0A0A0A] border-b border-[#0A0A0A]/10 pb-2 mb-3">SLA de Disponibilidade</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Uptime Garantido" field="slaUptime" placeholder="99,9%" />
          <Field label="Tempo de Resposta" field="slaResponseTime" placeholder="< 200ms" />
        </div>
      </div>

      {/* SLA de Suporte */}
      <div>
        <h3 className="text-sm font-bold text-[#0A0A0A] border-b border-[#0A0A0A]/10 pb-2 mb-3">SLA de Suporte</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Crítico" field="supportCriticalSLA" placeholder="1 hora" />
          <Field label="Alto" field="supportHighSLA" placeholder="4 horas" />
          <Field label="Médio" field="supportMediumSLA" placeholder="8 horas" />
          <Field label="Baixo" field="supportLowSLA" placeholder="24 horas" />
        </div>
      </div>

      {/* Reserva de Risco Pix */}
      <div>
        <h3 className="text-sm font-bold text-[#0A0A0A] border-b border-[#0A0A0A]/10 pb-2 mb-3">Reserva de Risco - Pix</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Percentual Reserva" field="pixRiskReservePercentage" placeholder="5" type="number" suffix="%" />
          <Field label="Dias de Retenção" field="pixRiskReserveDays" placeholder="30" type="number" suffix="dias" />
        </div>
      </div>

      {/* Reserva de Risco Cartão */}
      <div>
        <h3 className="text-sm font-bold text-[#0A0A0A] border-b border-[#0A0A0A]/10 pb-2 mb-3">Reserva de Risco - Cartão</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Percentual Reserva" field="cardRiskReservePercentage" placeholder="10" type="number" suffix="%" />
          <Field label="Dias de Retenção" field="cardRiskReserveDays" placeholder="180" type="number" suffix="dias" />
          <Field label="Liberação Parcial" field="cardRiskReservePartialReleaseDays" placeholder="90" type="number" suffix="dias" />
        </div>
      </div>

      {/* Chargeback */}
      <div>
        <h3 className="text-sm font-bold text-[#0A0A0A] border-b border-[#0A0A0A]/10 pb-2 mb-3">Chargeback</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Taxa de Chargeback" field="chargebackFee" placeholder="50,00" type="number" suffix="R$" />
          <Field label="Threshold CB" field="chargebackThreshold" placeholder="1,0" type="number" suffix="%" />
        </div>
      </div>
    </div>
  );
}