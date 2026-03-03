import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CnpjInput from './CnpjInput';

export default function CardDadosCliente({ form, errors, onUpdate }) {
  const { data: leads } = useQuery({
    queryKey: ['leads-list'],
    queryFn: () => base44.entities.Lead.list('-created_date', 100),
  });

  const { data: mccs } = useQuery({
    queryKey: ['mccs-list'],
    queryFn: () => base44.entities.MerchantCategoryCode?.list() || [], // Fallback if entity doesn't exist yet
  });

  // Handle lead selection
  const handleLeadSelect = (leadId) => {
    const selected = leads?.find(l => l.id === leadId);
    if (selected) {
      onUpdate('clienteNome', selected.companyName || selected.fullName || '');
      onUpdate('clienteCnpj', (selected.cpfCnpj || '').replace(/\D/g, ''));
      onUpdate('clienteMcc', selected.mcc || '');
      onUpdate('clienteContato', selected.contactName || '');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-6 space-y-4">
      <h2 className="text-base font-bold text-[#002443]">Dados do Cliente</h2>
      
      {/* Optional Lead Selector */}
      {leads && leads.length > 0 && (
         <div className="space-y-1.5">
           <Label className="text-xs text-[#282828]/50 font-medium">Selecionar Lead (Opcional)</Label>
           <Select onValueChange={handleLeadSelect}>
             <SelectTrigger className="bg-[#f4f4f4] border-[#002443]/10 text-[#002443] h-10 rounded-lg">
               <SelectValue placeholder="Selecione um lead para preencher..." />
             </SelectTrigger>
             <SelectContent>
               {leads.map(lead => (
                 <SelectItem key={lead.id} value={lead.id} className="cursor-pointer">
                   {lead.companyName || lead.fullName}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs text-[#282828]/50 font-medium">Nome da Empresa <span className="text-red-500">*</span></Label>
        <Input
          value={form.clienteNome || ''}
          onChange={(e) => onUpdate('clienteNome', e.target.value)}
          placeholder="Razão social ou nome fantasia"
          className={`bg-[#f4f4f4] border-[#002443]/10 text-[#002443] h-10 rounded-lg ${errors?.clienteNome ? 'border-red-500' : ''}`}
        />
        {errors?.clienteNome && <p className="text-xs text-red-500">{errors.clienteNome}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-[#282828]/50 font-medium">CNPJ <span className="text-red-500">*</span></Label>
          <CnpjInput
            value={form.clienteCnpj || ''}
            onChange={(val) => onUpdate('clienteCnpj', val)}
            error={errors?.clienteCnpj}
            className="bg-[#f4f4f4] border-[#002443]/10 text-[#002443] h-10 rounded-lg"
          />
          {errors?.clienteCnpj && <p className="text-xs text-red-500">{errors.clienteCnpj}</p>}
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-xs text-[#282828]/50 font-medium">MCC <span className="text-red-500">*</span></Label>
          <Input
            value={form.clienteMcc || ''}
            onChange={(e) => onUpdate('clienteMcc', e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Ex: 5812"
            className={`bg-[#f4f4f4] border-[#002443]/10 text-[#002443] h-10 rounded-lg ${errors?.clienteMcc ? 'border-red-500' : ''}`}
            required
          />
          {errors?.clienteMcc && <p className="text-xs text-red-500">{errors.clienteMcc}</p>}
          <p className="text-[10px] text-[#282828]/40 leading-tight">
            O MCC deve ser o código vinculado ao seu CNAE principal.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-[#282828]/50 font-medium">Contato <span className="text-red-500">*</span></Label>
        <Input
          value={form.clienteContato || ''}
          onChange={(e) => onUpdate('clienteContato', e.target.value)}
          placeholder="Nome do contato principal"
          className={`bg-[#f4f4f4] border-[#002443]/10 text-[#002443] h-10 rounded-lg ${errors?.clienteContato ? 'border-red-500' : ''}`}
        />
        {errors?.clienteContato && <p className="text-xs text-red-500">{errors.clienteContato}</p>}
      </div>
    </div>
  );
}