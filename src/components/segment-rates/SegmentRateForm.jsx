import React from 'react';
import { Input } from '@/components/ui/input';
import { CreditCard, Smartphone, ReceiptText, Repeat, FileText } from 'lucide-react';

function RateField({ label, value, onChange, suffix = '%', prefix = '' }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-[#0A0A0A]/60 mb-1 block">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#0A0A0A]/40 font-medium">{prefix}</span>}
        <Input
          type="number"
          step="0.01"
          min="0"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
          className={`text-sm font-semibold h-9 ${prefix ? 'pl-9' : ''}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#0A0A0A]/40 font-medium">{suffix}</span>}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, color = '#0A0A0A' }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`p-1.5 rounded-lg`} style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <h3 className="text-sm font-bold text-[#0A0A0A]">{title}</h3>
    </div>
  );
}

export default function SegmentRateForm({ data, onChange }) {
  if (!data) return null;

  const update = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Informações Gerais */}
      <div className="bg-white rounded-xl border border-[#0A0A0A]/8 p-5">
        <SectionHeader icon={FileText} title="Informações do Segmento" color="#0A0A0A" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-[#0A0A0A]/60 mb-1 block">Nome do Segmento</label>
            <Input value={data.segmentName || ''} onChange={e => update('segmentName', e.target.value)} className="text-sm font-semibold h-9" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#0A0A0A]/60 mb-1 block">MCC</label>
            <Input value={data.mcc || ''} onChange={e => update('mcc', e.target.value)} className="text-sm font-semibold h-9" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#0A0A0A]/60 mb-1 block">Nível de Risco</label>
            <Input value={data.riskLevel || ''} onChange={e => update('riskLevel', e.target.value)} className="text-sm font-semibold h-9" />
          </div>
        </div>
      </div>

      {/* Taxas de Cartão de Crédito */}
      <div className="bg-white rounded-xl border border-[#0A0A0A]/8 p-5">
        <SectionHeader icon={CreditCard} title="Taxas de Cartão de Crédito (MDR)" color="#1356E2" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <RateField label="À Vista (1x)" value={data.mdrAvista} onChange={v => update('mdrAvista', v)} />
          <RateField label="2–6x" value={data.mdr2a6x} onChange={v => update('mdr2a6x', v)} />
          <RateField label="7–12x" value={data.mdr7a12x} onChange={v => update('mdr7a12x', v)} />
          <RateField label="13–21x" value={data.mdr13a21x} onChange={v => update('mdr13a21x', v)} />
        </div>
      </div>

      {/* Antecipação */}
      <div className="bg-white rounded-xl border border-[#0A0A0A]/8 p-5">
        <SectionHeader icon={Repeat} title="Antecipação de Recebíveis" color="#1356E2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RateField label="Taxa de Antecipação (% a.m.)" value={data.percentualAntecipacao} onChange={v => update('percentualAntecipacao', v)} />
        </div>
      </div>

      {/* PIX */}
      <div className="bg-white rounded-xl border border-[#0A0A0A]/8 p-5">
        <SectionHeader icon={Smartphone} title="PIX" color="#1356E2" />
        <div className="grid grid-cols-2 gap-4">
          <RateField label="Taxa Percentual" value={data.pixTaxaPercentual} onChange={v => update('pixTaxaPercentual', v)} />
          <RateField label="Taxa Fixa" value={data.pixTaxaFixa} onChange={v => update('pixTaxaFixa', v)} prefix="R$" suffix="" />
        </div>
      </div>

      {/* Taxas Adicionais */}
      <div className="bg-white rounded-xl border border-[#0A0A0A]/8 p-5">
        <SectionHeader icon={ReceiptText} title="Taxas Adicionais" color="#0A0A0A" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <RateField label="Fee por Transação" value={data.feeTransacao} onChange={v => update('feeTransacao', v)} prefix="R$" suffix="" />
          <RateField label="Antifraude" value={data.antifraude} onChange={v => update('antifraude', v)} prefix="R$" suffix="" />
          <RateField label="3DS" value={data.taxa3ds} onChange={v => update('taxa3ds', v)} prefix="R$" suffix="" />
          <RateField label="Boleto" value={data.boleto} onChange={v => update('boleto', v)} prefix="R$" suffix="" />
        </div>
      </div>
    </div>
  );
}