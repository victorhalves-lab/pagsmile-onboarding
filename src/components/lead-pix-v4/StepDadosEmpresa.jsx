import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LeadCnpjAutocompleteField from '@/components/leads/LeadCnpjAutocompleteField';
import SiteValidationBadge from '@/components/leads/SiteValidationBadge';

export default function StepDadosEmpresa({ form, updateField, cnpjData, setCnpjData, errors }) {
  const handleCnpjData = (data) => {
    setCnpjData(data);
    if (data.razao_social) updateField('razaoSocial', data.razao_social);
    if (data.nome_fantasia) updateField('nomeFantasia', data.nome_fantasia);
    if (data.site_sugerido) updateField('presencaDigital', data.site_sugerido);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#002443]">Dados da Empresa</h2>
      <p className="text-xs text-[#002443]/50">Digite o CNPJ para preenchimento automático via Receita Federal.</p>

      <LeadCnpjAutocompleteField
        value={form.cnpj || ''}
        onChange={(val) => updateField('cnpj', val)}
        onCnpjData={handleCnpjData}
        error={errors?.cnpj}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Razão Social *</Label>
          <Input value={form.razaoSocial || ''} readOnly className="bg-[#f4f4f4] text-xs" placeholder="Preenchido via CNPJ" />
        </div>
        <div>
          <Label className="text-xs">Nome Fantasia *</Label>
          <Input
            value={form.nomeFantasia || ''}
            onChange={e => updateField('nomeFantasia', e.target.value)}
            placeholder="Nome fantasia / Descriptor PIX"
            className={`text-xs ${errors?.nomeFantasia ? 'border-red-400' : ''}`}
          />
          <p className="text-[10px] text-[#002443]/40 mt-0.5">Nome que aparece para quem paga via PIX</p>
        </div>
      </div>

      <div>
        <Label className="text-xs">Presença Digital (site, Instagram, etc.) *</Label>
        <div className="flex gap-2 items-center">
          <Input
            value={form.presencaDigital || ''}
            onChange={e => updateField('presencaDigital', e.target.value)}
            placeholder="https://... ou @instagram ou 'Não possuo'"
            className="text-xs flex-1"
          />
          {form.presencaDigital && form.presencaDigital !== 'Não possuo' && (
            <SiteValidationBadge url={form.presencaDigital} />
          )}
        </div>
      </div>
    </div>
  );
}