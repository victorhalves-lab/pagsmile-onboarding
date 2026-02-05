import React from 'react';
import { UserCircle, Phone } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';

export default function Step7aResponsaveis({ formData, handleChange }) {
  return (
    <FormSection
      title="Responsáveis"
      subtitle="Quem são os responsáveis pela contabilidade e atendimento?"
      icon={UserCircle}
    >
      <div className="space-y-6">
        {/* 1. Responsável Contábil */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
           <h3 className="font-bold text-[var(--pagsmile-blue)] mb-4 flex items-center gap-2">
             <span className="bg-[var(--pagsmile-blue)] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
             Responsável Contábil
           </h3>
           <FormField 
            label="Nome Completo" 
            required 
            value={formData.contabilNome} 
            onChange={(v) => handleChange('contabilNome', v)} 
            placeholder="Nome"
            className="text-[var(--pagsmile-blue)] bg-white"
           />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField 
                label="Email" 
                required 
                type="email" 
                value={formData.contabilEmail} 
                onChange={(v) => handleChange('contabilEmail', v)} 
                placeholder="email@..."
                className="text-[var(--pagsmile-blue)] bg-white"
              />
              <FormField 
                label="Telefone" 
                required 
                value={formData.contabilTelefone} 
                onChange={(v) => handleChange('contabilTelefone', v)} 
                placeholder="(00) 00000-0000"
                className="text-[var(--pagsmile-blue)] bg-white"
              />
           </div>
           <FormField 
            label="CRC (Registro Conselho Contabilidade)" 
            value={formData.contabilCRC} 
            onChange={(v) => handleChange('contabilCRC', v)} 
            placeholder="Opcional"
            className="text-[var(--pagsmile-blue)] bg-white mt-4"
           />
        </div>

        {/* 2. Responsável SAC */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
           <h3 className="font-bold text-[var(--pagsmile-blue)] mb-4 flex items-center gap-2">
             <span className="bg-[var(--pagsmile-blue)] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
             Responsável pelo SAC
           </h3>
           <FormField 
            label="Nome Completo" 
            required 
            value={formData.sacNome} 
            onChange={(v) => handleChange('sacNome', v)} 
            placeholder="Nome"
            className="text-[var(--pagsmile-blue)] bg-white"
           />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField 
                label="Email" 
                required 
                type="email" 
                value={formData.sacEmail} 
                onChange={(v) => handleChange('sacEmail', v)} 
                placeholder="email@..."
                className="text-[var(--pagsmile-blue)] bg-white"
              />
              <FormField 
                label="Telefone Celular" 
                required 
                value={formData.sacCelular} 
                onChange={(v) => handleChange('sacCelular', v)} 
                placeholder="(00) 00000-0000"
                className="text-[var(--pagsmile-blue)] bg-white"
              />
           </div>
        </div>
      </div>
    </FormSection>
  );
}