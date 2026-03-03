import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';

export default function ClienteForm({ contract, onChange, preFilledFields = [] }) {
  const isPreFilled = (field) => preFilledFields.includes(field);

  const Field = ({ label, field, placeholder, type = 'text' }) => (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-xs font-semibold text-[#002443]/70 uppercase tracking-wider">{label}</Label>
        {isPreFilled(field) && (
          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Auto</span>
        )}
      </div>
      <Input
        type={type}
        value={contract[field] || ''}
        onChange={e => onChange(field, e.target.value)}
        placeholder={placeholder}
        className={isPreFilled(field) ? 'border-green-200 bg-green-50/30' : ''}
      />
    </div>
  );

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-bold text-[#002443] border-b border-[#002443]/10 pb-2">Dados do Contratante</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Razão Social" field="clientName" placeholder="Nome completo da empresa" />
        <Field label="CNPJ" field="clientDocument" placeholder="00.000.000/0000-00" />
      </div>

      <Field label="Endereço" field="clientAddress" placeholder="Rua, número, complemento" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Cidade" field="clientCity" placeholder="São Paulo" />
        <Field label="Estado (UF)" field="clientState" placeholder="SP" />
        <Field label="CEP" field="clientZipCode" placeholder="00000-000" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="E-mail" field="clientEmail" placeholder="contato@empresa.com" type="email" />
        <Field label="Telefone" field="clientPhone" placeholder="(11) 99999-9999" />
      </div>

      <h3 className="text-sm font-bold text-[#002443] border-b border-[#002443]/10 pb-2 mt-6">Representante Legal</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Nome" field="clientRepresentativeName" placeholder="Nome do representante" />
        <Field label="Cargo" field="clientRepresentativeRole" placeholder="Diretor, Sócio..." />
        <Field label="CPF" field="clientRepresentativeCPF" placeholder="000.000.000-00" />
      </div>
    </div>
  );
}