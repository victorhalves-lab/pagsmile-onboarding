import React from 'react';
import { TrendingUp } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Step19aPerfilNegocio({ formData, handleChange }) {
  // Versão compacta para caber em uma tela
  return (
    <FormSection
      title="Operação - Modelo de Negócio"
      subtitle="Descreva o modelo de negócio da operação."
      icon={TrendingUp}
    >
      <div className="space-y-4">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[var(--pinbank-blue)]">Modelo de negócio <span className="text-red-500">*</span></Label>
              <Select value={formData.modeloNegocio} onValueChange={(val) => handleChange('modeloNegocio', val)}>
                <SelectTrigger className="h-9 text-xs border-[var(--pinbank-blue)]/20 text-[var(--pinbank-blue)] bg-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gateway">Gateway</SelectItem>
                  <SelectItem value="infoprodutos">Infoprodutos</SelectItem>
                  <SelectItem value="educacao">Educação</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                  <SelectItem value="saas">SaaS</SelectItem>
                  <SelectItem value="foodservice">Foodservice</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                  <SelectItem value="petshop">Petshop</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
               <Label className="text-xs font-semibold text-[var(--pinbank-blue)]">Possui sub-vendedores? <span className="text-red-500">*</span></Label>
               <Select value={formData.possuiSubVendedores === true ? "sim" : formData.possuiSubVendedores === false ? "nao" : ""} onValueChange={(val) => handleChange('possuiSubVendedores', val === 'sim')}>
                  <SelectTrigger className="h-9 text-xs border-[var(--pinbank-blue)]/20 text-[var(--pinbank-blue)] bg-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                     <SelectItem value="sim">Sim</SelectItem>
                     <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
               </Select>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-3 rounded-lg border border-[var(--pinbank-blue)]/10 bg-white shadow-sm">
                <Label className="text-xs font-semibold text-[var(--pinbank-blue)] mb-2 block">Tipo de Produto/Serviço <span className="text-red-500">*</span></Label>
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--pinbank-blue)]/80">Vende produto físico?</span>
                      <div className="flex gap-2">
                         <button 
                           onClick={() => handleChange('vendeFisico', true)}
                           className={`px-3 py-1 rounded text-xs font-medium transition-colors ${formData.vendeFisico === true ? 'bg-[var(--pinbank-blue)] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                         >Sim</button>
                         <button 
                           onClick={() => handleChange('vendeFisico', false)}
                           className={`px-3 py-1 rounded text-xs font-medium transition-colors ${formData.vendeFisico === false ? 'bg-[var(--pinbank-blue)] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                         >Não</button>
                      </div>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--pinbank-blue)]/80">Vende digital/serviço?</span>
                      <div className="flex gap-2">
                         <button 
                           onClick={() => handleChange('vendeDigitalServico', true)}
                           className={`px-3 py-1 rounded text-xs font-medium transition-colors ${formData.vendeDigitalServico === true ? 'bg-[var(--pinbank-blue)] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                         >Sim</button>
                         <button 
                           onClick={() => handleChange('vendeDigitalServico', false)}
                           className={`px-3 py-1 rounded text-xs font-medium transition-colors ${formData.vendeDigitalServico === false ? 'bg-[var(--pinbank-blue)] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                         >Não</button>
                      </div>
                   </div>
                </div>
             </div>

             <div className="p-3 rounded-lg border border-[var(--pinbank-blue)]/10 bg-white shadow-sm">
                <Label className="text-xs font-semibold text-[var(--pinbank-blue)] mb-2 block">Características da Operação <span className="text-red-500">*</span></Label>
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--pinbank-blue)]/80">Prazo entrega &gt; 7 dias?</span>
                      <div className="flex gap-2">
                         <button 
                           onClick={() => handleChange('prazoEntregaMaior7', true)}
                           className={`px-3 py-1 rounded text-xs font-medium transition-colors ${formData.prazoEntregaMaior7 === true ? 'bg-[var(--pinbank-blue)] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                         >Sim</button>
                         <button 
                           onClick={() => handleChange('prazoEntregaMaior7', false)}
                           className={`px-3 py-1 rounded text-xs font-medium transition-colors ${formData.prazoEntregaMaior7 === false ? 'bg-[var(--pinbank-blue)] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                         >Não</button>
                      </div>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--pinbank-blue)]/80">Opera com afiliados?</span>
                      <div className="flex gap-2">
                         <button 
                           onClick={() => handleChange('operaAfiliados', true)}
                           className={`px-3 py-1 rounded text-xs font-medium transition-colors ${formData.operaAfiliados === true ? 'bg-[var(--pinbank-blue)] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                         >Sim</button>
                         <button 
                           onClick={() => handleChange('operaAfiliados', false)}
                           className={`px-3 py-1 rounded text-xs font-medium transition-colors ${formData.operaAfiliados === false ? 'bg-[var(--pinbank-blue)] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                         >Não</button>
                      </div>
                   </div>
                </div>
             </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-3 rounded-lg border border-[var(--pinbank-blue)]/10 bg-white shadow-sm">
                <Label className="text-xs font-semibold text-[var(--pinbank-blue)] mb-2 block">Riscos e Regulação <span className="text-red-500">*</span></Label>
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--pinbank-blue)]/80">Categoria sensível/regulada?</span>
                      <div className="flex gap-2">
                         <button 
                           onClick={() => handleChange('categoriaSensivel', true)}
                           className={`px-3 py-1 rounded text-xs font-medium transition-colors ${formData.categoriaSensivel === true ? 'bg-[var(--pinbank-blue)] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                         >Sim</button>
                         <button 
                           onClick={() => handleChange('categoriaSensivel', false)}
                           className={`px-3 py-1 rounded text-xs font-medium transition-colors ${formData.categoriaSensivel === false ? 'bg-[var(--pinbank-blue)] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                         >Não</button>
                      </div>
                   </div>
                </div>
             </div>

             <div className="p-3 rounded-lg border border-[var(--pinbank-blue)]/10 bg-white shadow-sm">
                <Label className="text-xs font-semibold text-[var(--pinbank-blue)] mb-2 block">Segurança de Dados <span className="text-red-500">*</span></Label>
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--pinbank-blue)]/80">Armazena dados de cartão?</span>
                      <div className="flex gap-2">
                         <button 
                           onClick={() => handleChange('armazenaCartao', true)}
                           className={`px-3 py-1 rounded text-xs font-medium transition-colors ${formData.armazenaCartao === true ? 'bg-[var(--pinbank-blue)] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                         >Sim</button>
                         <button 
                           onClick={() => handleChange('armazenaCartao', false)}
                           className={`px-3 py-1 rounded text-xs font-medium transition-colors ${formData.armazenaCartao === false ? 'bg-[var(--pinbank-blue)] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                         >Não</button>
                      </div>
                   </div>
                </div>
             </div>
         </div>
      </div>
    </FormSection>
  );
}