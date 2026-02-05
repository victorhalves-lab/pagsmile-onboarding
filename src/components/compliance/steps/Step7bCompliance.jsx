import React from 'react';
import { ShieldCheck } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';

export default function Step7bCompliance({ formData, handleChange }) {
  return (
    <FormSection
      title="Compliance"
      subtitle="Responsável pela área de Compliance."
      icon={ShieldCheck}
    >
      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
         <h3 className="font-bold text-[var(--pagsmile-blue)] mb-2">Responsável pela Área de Compliance</h3>
         <p className="text-sm text-slate-500 mb-6">Todos os campos são obrigatórios, mesmo que a empresa não tenha área de compliance formalizada.</p>
         
         <FormField 
            label="Nome Completo" 
            required 
            value={formData.complianceNome} 
            onChange={(v) => handleChange('complianceNome', v)} 
            placeholder="Nome"
            className="text-[var(--pagsmile-blue)] bg-white"
         />
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <FormField 
                label="CPF" 
                required 
                value={formData.complianceCPF} 
                onChange={(v) => handleChange('complianceCPF', v)} 
                placeholder="000.000.000-00"
                className="text-[var(--pagsmile-blue)] bg-white"
            />
            <FormField 
                label="Email" 
                required 
                type="email" 
                value={formData.complianceEmail} 
                onChange={(v) => handleChange('complianceEmail', v)} 
                placeholder="email@..."
                className="text-[var(--pagsmile-blue)] bg-white"
            />
            <FormField 
                label="Telefone Celular" 
                required 
                value={formData.complianceCelular} 
                onChange={(v) => handleChange('complianceCelular', v)} 
                placeholder="(00) 00000-0000"
                className="text-[var(--pagsmile-blue)] bg-white"
            />
         </div>
      </div>
    </FormSection>
  );
}