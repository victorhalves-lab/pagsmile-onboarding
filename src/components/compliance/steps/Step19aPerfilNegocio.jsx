import React from 'react';
import { TrendingUp } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';

export default function Step19aPerfilNegocio({ formData, handleChange }) {
  return (
    <FormSection
      title="Operação - Modelo de Negócio"
      subtitle="Descreva o modelo de negócio da operação."
      icon={TrendingUp}
    >
      <div className="space-y-6">
         <div className="space-y-2">
           <Label className="text-sm font-medium text-[var(--pagsmile-blue)]">Qual modelo de negócio melhor descreve sua operação? <span className="text-red-500">*</span></Label>
           <Select value={formData.modeloNegocio} onValueChange={(val) => handleChange('modeloNegocio', val)}>
             <SelectTrigger className="border-[var(--pagsmile-blue)]/20 text-[var(--pagsmile-blue)]"><SelectValue placeholder="Selecione" /></SelectTrigger>
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

         <YesNoQuestion
           question="Possui sub-vendedores/sub-merchants/subcontas?"
           value={formData.possuiSubVendedores}
           onChange={(val) => handleChange('possuiSubVendedores', val)}
           required
           helperText="Define visibilidade Seção Marketplace"
         />

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <YesNoQuestion question="Vende produto físico?" value={formData.vendeFisico} onChange={(val) => handleChange('vendeFisico', val)} required />
           <YesNoQuestion question="Vende produto digital ou presta serviço?" value={formData.vendeDigitalServico} onChange={(val) => handleChange('vendeDigitalServico', val)} required />
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <YesNoQuestion question="Prazo típico de entrega > 7 dias?" value={formData.prazoEntregaMaior7} onChange={(val) => handleChange('prazoEntregaMaior7', val)} required />
           <YesNoQuestion question="Opera com afiliados/revendedores/parceiros?" value={formData.operaAfiliados} onChange={(val) => handleChange('operaAfiliados', val)} required />
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <YesNoQuestion question="Categoria sensível/regulada (exige licença/RT)?" value={formData.categoriaSensivel} onChange={(val) => handleChange('categoriaSensivel', val)} required />
           <YesNoQuestion question="Armazena ou processa dados de cartão?" value={formData.armazenaCartao} onChange={(val) => handleChange('armazenaCartao', val)} required helperText="Define visibilidade Seção Segurança" />
         </div>
      </div>
    </FormSection>
  );
}