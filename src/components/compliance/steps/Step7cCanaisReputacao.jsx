import React from 'react';
import { MessageSquare, Plus, Trash2, Star } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';
import SelectionButton from '../SelectionButton';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';

export default function Step7cCanaisReputacao({ formData, handleChange, handleArrayChange, handleAddArrayItem, handleRemoveArrayItem }) {
  const canaisAtendimento = formData.canaisAtendimentoLista || [];

  const addCanal = () => {
    if (handleAddArrayItem) handleAddArrayItem('canaisAtendimentoLista', { tipo: '', contato: '' });
  };
  
  const removeCanal = (idx) => {
    if (handleRemoveArrayItem) handleRemoveArrayItem('canaisAtendimentoLista', idx);
  };

  const updateCanal = (idx, field, val) => {
    if (handleArrayChange) handleArrayChange('canaisAtendimentoLista', idx, field, val);
  };

  return (
    <FormSection
      title="Canais e Reputação"
      subtitle="Atendimento ao cliente e presença no Reclame Aqui."
      icon={MessageSquare}
    >
      <div className="space-y-8">
        {/* 4. Canais de Atendimento */}
        <div className="space-y-4">
           <div className="flex justify-between items-center">
              <Label className="text-sm font-medium text-[var(--pagsmile-blue)]">Canais de Atendimento</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCanal} className="text-[var(--pagsmile-green)] border-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/10">
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
           </div>
           
           {canaisAtendimento.map((canal, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                 <Select value={canal.tipo} onValueChange={(v) => updateCanal(idx, 'tipo', v)}>
                    <SelectTrigger className="w-[150px] border-[var(--pagsmile-blue)]/20 text-[var(--pagsmile-blue)]"><SelectValue placeholder="Tipo" /></SelectTrigger>
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
                    className="flex-1 text-[var(--pagsmile-blue)] border-[var(--pagsmile-blue)]/20"
                 />
                 <Button type="button" variant="ghost" size="icon" onClick={() => removeCanal(idx)} className="text-red-500 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                 </Button>
              </div>
           ))}
           {canaisAtendimento.length === 0 && <p className="text-xs text-red-500 bg-red-50 p-2 rounded">Adicione pelo menos um canal de atendimento válido.</p>}
        </div>

        <Separator className="bg-slate-100" />

        {/* 5. Reputação Online */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <h3 className="font-bold text-[var(--pagsmile-blue)]">Reputação Online</h3>
           </div>
           
           <div className="space-y-3">
              <Label className="text-sm font-medium text-[var(--pagsmile-blue)]">A empresa possui canal no Reclame Aqui? <span className="text-red-500">*</span></Label>
              <SelectionButton
                 options={[{ value: true, label: 'Sim' }, { value: false, label: 'Não' }]}
                 value={formData.possuiReclameAqui}
                 onChange={(v) => handleChange('possuiReclameAqui', v)}
                 columns={2}
              />
           </div>

           {formData.possuiReclameAqui === true && (
              <div className="animate-in fade-in slide-in-from-top-2">
                  <FormField 
                     label="Link do canal no Reclame Aqui" 
                     required 
                     value={formData.linkReclameAqui} 
                     onChange={(v) => handleChange('linkReclameAqui', v)} 
                     placeholder="https://www.reclameaqui.com.br/empresa/..." 
                     className="text-[var(--pagsmile-blue)]"
                  />
              </div>
           )}
        </div>
      </div>
    </FormSection>
  );
}