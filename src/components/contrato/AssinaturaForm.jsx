import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AssinaturaForm({ contract, onChange }) {
  const Field = ({ label, field, placeholder, type = 'text', suffix }) => (
    <div className="space-y-1">
      <Label className="text-[10px] text-[#002443]/50 uppercase tracking-wider">{label}</Label>
      <div className="relative">
        <Input
          type={type}
          value={contract[field] ?? ''}
          onChange={e => onChange(field, type === 'number' ? (e.target.value === '' ? null : parseFloat(e.target.value)) : e.target.value)}
          placeholder={placeholder}
          className={suffix ? 'pr-12 text-right' : ''}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#002443]/30">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Data e Vigência */}
      <div>
        <h3 className="text-sm font-bold text-[#002443] border-b border-[#002443]/10 pb-2 mb-3">Data e Vigência</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data do Contrato" field="contractDate" placeholder="" type="date" />
          <Field label="Duração (meses)" field="contractDurationMonths" placeholder="24" type="number" suffix="meses" />
        </div>
      </div>

      {/* Multa Rescisória - Cliente */}
      <div>
        <h3 className="text-sm font-bold text-[#002443] border-b border-[#002443]/10 pb-2 mb-3">Multa Rescisória - Contratante</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Percentual" field="earlyTerminationPenaltyPercentage" placeholder="10" type="number" suffix="%" />
          <Field label="Valor Máximo" field="earlyTerminationPenaltyMaxAmount" placeholder="50000" type="number" suffix="R$" />
        </div>
      </div>

      {/* Multa Rescisória - Pagsmile */}
      <div>
        <h3 className="text-sm font-bold text-[#002443] border-b border-[#002443]/10 pb-2 mb-3">Multa Rescisória - Pagsmile</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Percentual" field="pagsmileEarlyTerminationPenaltyPercentage" placeholder="10" type="number" suffix="%" />
          <Field label="Valor Máximo" field="pagsmileEarlyTerminationPenaltyMaxAmount" placeholder="50000" type="number" suffix="R$" />
        </div>
      </div>

      {/* Representante Pagsmile */}
      <div>
        <h3 className="text-sm font-bold text-[#002443] border-b border-[#002443]/10 pb-2 mb-3">Representante Pagsmile</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Nome" field="pagsmileRepresentativeName" placeholder="Nome completo" />
          <Field label="Cargo" field="pagsmileRepresentativeRole" placeholder="Diretor" />
          <Field label="CPF" field="pagsmileRepresentativeCPF" placeholder="000.000.000-00" />
        </div>
      </div>

      {/* Testemunhas */}
      <div>
        <h3 className="text-sm font-bold text-[#002443] border-b border-[#002443]/10 pb-2 mb-3">Testemunhas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 p-3 rounded-xl bg-[#002443]/[0.02] border border-[#002443]/5">
            <p className="text-xs font-semibold text-[#002443]/70">Testemunha 1</p>
            <Field label="Nome" field="witness1Name" placeholder="Nome completo" />
            <Field label="CPF" field="witness1CPF" placeholder="000.000.000-00" />
          </div>
          <div className="space-y-3 p-3 rounded-xl bg-[#002443]/[0.02] border border-[#002443]/5">
            <p className="text-xs font-semibold text-[#002443]/70">Testemunha 2</p>
            <Field label="Nome" field="witness2Name" placeholder="Nome completo" />
            <Field label="CPF" field="witness2CPF" placeholder="000.000.000-00" />
          </div>
        </div>
      </div>

      {/* Cláusulas Customizadas */}
      <div>
        <h3 className="text-sm font-bold text-[#002443] border-b border-[#002443]/10 pb-2 mb-3">Cláusulas Customizadas</h3>
        <textarea
          value={contract.customClauses || ''}
          onChange={e => onChange('customClauses', e.target.value)}
          placeholder="Adicione cláusulas especiais para este contrato..."
          className="w-full h-32 border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2bc196]"
        />
      </div>

      {/* Notas internas */}
      <div>
        <h3 className="text-sm font-bold text-[#002443] border-b border-[#002443]/10 pb-2 mb-3">Notas Internas</h3>
        <textarea
          value={contract.clientSuggestions || ''}
          onChange={e => onChange('clientSuggestions', e.target.value)}
          placeholder="Observações internas do time comercial..."
          className="w-full h-20 border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2bc196]"
        />
      </div>
    </div>
  );
}