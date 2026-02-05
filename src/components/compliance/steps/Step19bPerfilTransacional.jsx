import React from 'react';
import { TrendingUp } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';
import FormField from '../FormField';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Step19bPerfilTransacional({ formData, handleChange }) {
  return (
    <FormSection
      title="Operação - Perfil Transacional"
      subtitle="Volume e ticket médio estimado."
      icon={TrendingUp}
    >
      <h3 className="font-semibold text-[var(--pagsmile-blue)] mb-4">B1. Perfil de Transações</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="space-y-2">
           <Label className="text-sm font-medium text-[var(--pagsmile-blue)]">Volume mensal estimado (R$) <span className="text-red-500">*</span></Label>
           <Select value={formData.rangeVolumeMensal} onValueChange={(val) => handleChange('rangeVolumeMensal', val)}>
             <SelectTrigger className="border-[var(--pagsmile-blue)]/20 text-[var(--pagsmile-blue)]"><SelectValue placeholder="Selecione" /></SelectTrigger>
             <SelectContent>
               <SelectItem value="ate_10k">Até R$ 10.000</SelectItem>
               <SelectItem value="10k_50k">R$ 10.001 a R$ 50.000</SelectItem>
               <SelectItem value="50k_100k">R$ 50.001 a R$ 100.000</SelectItem>
               <SelectItem value="100k_500k">R$ 100.001 a R$ 500.000</SelectItem>
               <SelectItem value="500k_1m">R$ 500.001 a R$ 1.000.000</SelectItem>
               <SelectItem value="1m_5m">R$ 1.000.001 a R$ 5.000.000</SelectItem>
               <SelectItem value="5m_10m">R$ 5.000.001 a R$ 10.000.000</SelectItem>
               <SelectItem value="mais_10m">Mais de R$ 10.000.000</SelectItem>
             </SelectContent>
           </Select>
         </div>
         
         <div className="space-y-2">
           <Label className="text-sm font-medium text-[var(--pagsmile-blue)]">Quantidade de transações/mês <span className="text-red-500">*</span></Label>
           <Select value={formData.rangeQtdTransacoes} onValueChange={(val) => handleChange('rangeQtdTransacoes', val)}>
             <SelectTrigger className="border-[var(--pagsmile-blue)]/20 text-[var(--pagsmile-blue)]"><SelectValue placeholder="Selecione" /></SelectTrigger>
             <SelectContent>
               <SelectItem value="ate_100">Até 100</SelectItem>
               <SelectItem value="101_500">101 a 500</SelectItem>
               <SelectItem value="501_1000">501 a 1.000</SelectItem>
               <SelectItem value="1001_5000">1.001 a 5.000</SelectItem>
               <SelectItem value="5001_10000">5.001 a 10.000</SelectItem>
               <SelectItem value="10001_50000">10.001 a 50.000</SelectItem>
               <SelectItem value="50001_100000">50.001 a 100.000</SelectItem>
               <SelectItem value="mais_100000">Mais de 100.000</SelectItem>
             </SelectContent>
           </Select>
         </div>

         <div className="space-y-2">
           <Label className="text-sm font-medium text-[var(--pagsmile-blue)]">Ticket médio (R$) <span className="text-red-500">*</span></Label>
           <Select value={formData.rangeTicketMedio} onValueChange={(val) => handleChange('rangeTicketMedio', val)}>
             <SelectTrigger className="border-[var(--pagsmile-blue)]/20 text-[var(--pagsmile-blue)]"><SelectValue placeholder="Selecione" /></SelectTrigger>
             <SelectContent>
               <SelectItem value="ate_50">Até R$ 50</SelectItem>
               <SelectItem value="51_100">R$ 51 a R$ 100</SelectItem>
               <SelectItem value="101_200">R$ 101 a R$ 200</SelectItem>
               <SelectItem value="201_500">R$ 201 a R$ 500</SelectItem>
               <SelectItem value="501_1000">R$ 501 a R$ 1.000</SelectItem>
               <SelectItem value="1001_2000">R$ 1.001 a R$ 2.000</SelectItem>
               <SelectItem value="2001_5000">R$ 2.001 a R$ 5.000</SelectItem>
               <SelectItem value="mais_5000">Mais de R$ 5.000</SelectItem>
             </SelectContent>
           </Select>
         </div>
      </div>

      <YesNoQuestion
        question="Existe sazonalidade/picos?"
        value={formData.existeSazonalidade}
        onChange={(val) => handleChange('existeSazonalidade', val)}
        required
      />
      {formData.existeSazonalidade === true && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
           <FormField label="Quando ocorrem os picos?" value={formData.picosQuando} onChange={(val) => handleChange('picosQuando', val)} placeholder="Ex: Black Friday" />
           <FormField label="Pico máximo esperado (R$ ou %)" value={formData.picosMaximo} onChange={(val) => handleChange('picosMaximo', val)} placeholder="Ex: 200%" />
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mt-4">
         <FormField label="% Físico" type="number" value={formData.pctFisico} onChange={(val) => handleChange('pctFisico', val)} placeholder="%" />
         <FormField label="% Serviço" type="number" value={formData.pctServico} onChange={(val) => handleChange('pctServico', val)} placeholder="%" />
         <FormField label="% Digital" type="number" value={formData.pctDigital} onChange={(val) => handleChange('pctDigital', val)} placeholder="%" />
      </div>
    </FormSection>
  );
}