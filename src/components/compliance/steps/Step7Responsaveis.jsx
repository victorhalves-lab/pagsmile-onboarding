import React from 'react';
import { UserCircle } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';

export default function Step7Responsaveis({ formData, handleChange }) {
  return (
    <FormSection
      title="Responsáveis pela Empresa"
      subtitle="Dados dos principais contatos e representantes legais."
      icon={UserCircle}
    >
      {/* Representante Legal */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
        <h3 className="font-semibold text-slate-800">Representante Legal</h3>
        
        <FormField
          label="Nome Completo"
          required
          value={formData.responsavelNome}
          onChange={(value) => handleChange('responsavelNome', value)}
          placeholder="Nome completo do representante legal"
        />
        
        <FormField
          label="CPF"
          required
          value={formData.responsavelCPF}
          onChange={(value) => handleChange('responsavelCPF', value)}
          placeholder="000.000.000-00"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="E-mail"
            required
            type="email"
            value={formData.responsavelEmail}
            onChange={(value) => handleChange('responsavelEmail', value)}
            placeholder="email@empresa.com"
          />
          
          <FormField
            label="Telefone"
            required
            value={formData.responsavelTelefone}
            onChange={(value) => handleChange('responsavelTelefone', value)}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      {/* Contato Financeiro */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
        <h3 className="font-semibold text-slate-800">Contato Financeiro</h3>
        
        <FormField
          label="Nome Completo"
          value={formData.financeiroNome}
          onChange={(value) => handleChange('financeiroNome', value)}
          placeholder="Nome do responsável financeiro"
        />
        
        <FormField
          label="E-mail"
          type="email"
          value={formData.financeiroEmail}
          onChange={(value) => handleChange('financeiroEmail', value)}
          placeholder="emailfinanceiro@empresa.com"
        />
      </div>
    </FormSection>
  );
}