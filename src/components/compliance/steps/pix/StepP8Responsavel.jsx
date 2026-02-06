import React from 'react';
import { UserCircle } from 'lucide-react';
import FormSection from '../../FormSection';
import FormField from '../../FormField';

export default function StepP8Responsavel({ formData, handleChange }) {
  return (
    <FormSection
      title="Responsável pela Empresa"
      subtitle="Dados do responsável principal."
      icon={UserCircle}
    >
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
        <h3 className="font-bold text-slate-800">Responsável pela Contabilidade</h3>
        <FormField 
          label="Nome Completo" 
          value={formData.contabilNome} 
          onChange={(v) => handleChange('contabilNome', v)} 
          placeholder="Nome" 
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField 
            label="Email" 
            type="email" 
            value={formData.contabilEmail} 
            onChange={(v) => handleChange('contabilEmail', v)} 
            placeholder="email@..." 
          />
          <FormField 
            label="Telefone" 
            value={formData.contabilTelefone} 
            onChange={(v) => handleChange('contabilTelefone', v)} 
            placeholder="(00) 00000-0000" 
          />
        </div>
      </div>
    </FormSection>
  );
}