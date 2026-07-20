import React, { useState } from 'react';
import { UserCircle, Plus, Trash2, MessageSquare, Star } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';
import SelectionButton from '../SelectionButton';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Step7Responsaveis({ formData, handleChange, handleArrayChange, handleAddArrayItem, handleRemoveArrayItem }) {
  
  // Ensure arrays exist
  const canaisAtendimento = formData.canaisAtendimentoLista || [];

  const addCanal = () => {
    if (handleAddArrayItem) handleAddArrayItem('canaisAtendimentoLista', { tipo: '', contato: '' });
    else {
        const newC = [...canaisAtendimento, { tipo: '', contato: '' }];
        handleChange('canaisAtendimentoLista', newC);
    }
  };
  
  const removeCanal = (idx) => {
    if (handleRemoveArrayItem) handleRemoveArrayItem('canaisAtendimentoLista', idx);
    else {
        const newC = canaisAtendimento.filter((_, i) => i !== idx);
        handleChange('canaisAtendimentoLista', newC);
    }
  };

  const updateCanal = (idx, field, val) => {
    if (handleArrayChange) handleArrayChange('canaisAtendimentoLista', idx, field, val);
    else {
        const newC = [...canaisAtendimento];
        newC[idx] = { ...newC[idx], [field]: val };
        handleChange('canaisAtendimentoLista', newC);
    }
  };

  return (
    <div className="space-y-8">
      <FormSection
        title="Responsáveis e Canais de Atendimento"
        subtitle="Informe os responsáveis por cada área da empresa e os canais de atendimento."
        icon={UserCircle}
      >
        {/* 1. Responsável Contábil */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
           <h3 className="font-bold text-slate-800 mb-4">1. Responsável pela Contabilidade e Faturamento</h3>
           <FormField label="Nome Completo" required value={formData.contabilNome} onChange={(v) => handleChange('contabilNome', v)} placeholder="Nome" />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Email" required type="email" value={formData.contabilEmail} onChange={(v) => handleChange('contabilEmail', v)} placeholder="email@..." />
              <FormField label="Telefone" required value={formData.contabilTelefone} onChange={(v) => handleChange('contabilTelefone', v)} placeholder="(00) 00000-0000" />
           </div>
           <FormField label="CRC (Registro Conselho Contabilidade)" value={formData.contabilCRC} onChange={(v) => handleChange('contabilCRC', v)} placeholder="Opcional" />
        </div>

        {/* 2. Responsável SAC */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
           <h3 className="font-bold text-slate-800 mb-4">2. Responsável pelo Atendimento ao Cliente (SAC)</h3>
           <FormField label="Nome Completo" required value={formData.sacNome} onChange={(v) => handleChange('sacNome', v)} placeholder="Nome" />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Email" required type="email" value={formData.sacEmail} onChange={(v) => handleChange('sacEmail', v)} placeholder="email@..." />
              <FormField label="Telefone Celular" required value={formData.sacCelular} onChange={(v) => handleChange('sacCelular', v)} placeholder="(00) 00000-0000" />
           </div>
        </div>

        {/* 3. Responsável Compliance */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
           <h3 className="font-bold text-slate-800 mb-4">3. Responsável pela Área de Compliance</h3>
           <p className="text-xs text-slate-500 mb-4">Todos os campos são obrigatórios, mesmo que a empresa não tenha área de compliance formalizada.</p>
           <FormField label="Nome Completo" required value={formData.complianceNome} onChange={(v) => handleChange('complianceNome', v)} placeholder="Nome" />
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="CPF" required value={formData.complianceCPF} onChange={(v) => handleChange('complianceCPF', v)} placeholder="000.000.000-00" />
              <FormField label="Email" required type="email" value={formData.complianceEmail} onChange={(v) => handleChange('complianceEmail', v)} placeholder="email@..." />
              <FormField label="Telefone Celular" required value={formData.complianceCelular} onChange={(v) => handleChange('complianceCelular', v)} placeholder="(00) 00000-0000" />
           </div>
        </div>

        <Separator className="my-6" />

        {/* 4. Canais de Atendimento */}
        <div className="space-y-4">
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <MessageSquare className="w-5 h-5 text-[var(--pinbank-blue)]" />
                 <h3 className="font-bold text-slate-800">4. Canais de Atendimento</h3>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addCanal} className="text-[var(--pinbank-blue)] border-[var(--pinbank-blue)]">
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
           </div>
           
           {canaisAtendimento.map((canal, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                 <Select value={canal.tipo} onValueChange={(v) => updateCanal(idx, 'tipo', v)}>
                    <SelectTrigger className="w-[150px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="email">Email</SelectItem>
                       <SelectItem value="whatsapp">WhatsApp</SelectItem>
                       <SelectItem value="telefone">Telefone</SelectItem>
                       <SelectItem value="chat">Chat</SelectItem>
                    </SelectContent>
                 </Select>
                 <Input 
                    placeholder="Contato (email, número, link...)" 
                    value={canal.contato}
                    onChange={(e) => updateCanal(idx, 'contato', e.target.value)}
                    className="flex-1"
                 />
                 <Button type="button" variant="ghost" size="icon" onClick={() => removeCanal(idx)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                 </Button>
              </div>
           ))}
           {canaisAtendimento.length === 0 && <p className="text-xs text-red-500">Adicione pelo menos um canal de atendimento válido.</p>}
        </div>

        <Separator className="my-6" />

        {/* 5. Reputação Online */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <h3 className="font-bold text-slate-800">5. Reputação Online</h3>
           </div>
           
           <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">A empresa possui canal no Reclame Aqui? <span className="text-red-500">*</span></Label>
              <SelectionButton
                 options={[{ value: true, label: 'Sim' }, { value: false, label: 'Não' }]}
                 value={formData.possuiReclameAqui}
                 onChange={(v) => handleChange('possuiReclameAqui', v)}
                 columns={2}
              />
           </div>

           {formData.possuiReclameAqui === true && (
              <FormField 
                 label="Link do canal no Reclame Aqui" 
                 required 
                 value={formData.linkReclameAqui} 
                 onChange={(v) => handleChange('linkReclameAqui', v)} 
                 placeholder="https://www.reclameaqui.com.br/empresa/..." 
              />
           )}
        </div>

      </FormSection>
    </div>
  );
}