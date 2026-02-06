import React from 'react';
import { ShieldCheck } from 'lucide-react';
import FormSection from '../../FormSection';
import FormField from '../../FormField';

export default function StepP10Compliance({ formData, handleChange }) {
  return (
    <FormSection
      title="Área de Compliance"
      subtitle="Responsável por Compliance."
      icon={ShieldCheck}
    >
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
        <h3 className="font-bold text-slate-800">Responsável pela Área de Compliance</h3>
        <p className="text-xs text-slate-500">Mesmo que não tenha área formal, informe um responsável.</p>
        <FormField 
          label="Nome Completo" 
          value={formData.complianceNome} 
          onChange={(v) => handleChange('complianceNome', v)} 
          placeholder="Nome" 
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField 
            label="CPF" 
            value={formData.complianceCPF} 
            onChange={(v) => handleChange('complianceCPF', v)} 
            placeholder="000.000.000-00" 
          />
          <FormField 
            label="Email" 
            type="email" 
            value={formData.complianceEmail} 
            onChange={(v) => handleChange('complianceEmail', v)} 
            placeholder="email@..." 
          />
          <FormField 
            label="Telefone" 
            value={formData.complianceCelular} 
            onChange={(v) => handleChange('complianceCelular', v)} 
            placeholder="(00) 00000-0000" 
          />
        </div>
      </div>
    </FormSection>
  );
}