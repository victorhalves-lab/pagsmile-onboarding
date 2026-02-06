import React from 'react';
import { MessageSquare } from 'lucide-react';
import FormSection from '../../FormSection';
import FormField from '../../FormField';

export default function StepP9SAC({ formData, handleChange }) {
  return (
    <FormSection
      title="Atendimento ao Cliente"
      subtitle="Responsável pelo SAC."
      icon={MessageSquare}
    >
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
        <h3 className="font-bold text-slate-800">Responsável pelo SAC</h3>
        <FormField 
          label="Nome Completo" 
          value={formData.sacNome} 
          onChange={(v) => handleChange('sacNome', v)} 
          placeholder="Nome" 
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField 
            label="Email" 
            type="email" 
            value={formData.sacEmail} 
            onChange={(v) => handleChange('sacEmail', v)} 
            placeholder="email@..." 
          />
          <FormField 
            label="Telefone Celular" 
            value={formData.sacCelular} 
            onChange={(v) => handleChange('sacCelular', v)} 
            placeholder="(00) 00000-0000" 
          />
        </div>
      </div>
    </FormSection>
  );
}