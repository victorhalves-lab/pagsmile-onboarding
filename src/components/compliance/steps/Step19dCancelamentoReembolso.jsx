import React from 'react';
import { TrendingUp } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Step19dCancelamentoReembolso({ formData, handleChange }) {
  return (
    <FormSection
      title="Operação - Cancelamentos"
      subtitle="Políticas e métricas de cancelamento e reembolso."
      icon={TrendingUp}
    >
      <h3 className="font-semibold text-[var(--pinbank-blue)] mb-4">B4. Cancelamentos e Reembolsos</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="space-y-2">
            <Label className="text-sm font-medium text-[var(--pinbank-blue)]">Taxa de reembolso/cancelamento (3 meses) <span className="text-red-500">*</span></Label>
            <Select value={formData.taxaReembolso} onValueChange={(val) => handleChange('taxaReembolso', val)}>
              <SelectTrigger className="border-[var(--pinbank-blue)]/20 text-[var(--pinbank-blue)]"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="menos_1">Menos de 1%</SelectItem>
                <SelectItem value="1_3">1% a 3%</SelectItem>
                <SelectItem value="3_5">3% a 5%</SelectItem>
                <SelectItem value="mais_5">Mais de 5%</SelectItem>
              </SelectContent>
            </Select>
         </div>
         
         <YesNoQuestion
            question="Reembolso pode ser parcial?"
            value={formData.reembolsoParcial}
            onChange={(val) => handleChange('reembolsoParcial', val)}
            required
         />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
         {['Motivo #1', 'Motivo #2', 'Motivo #3'].map((label, idx) => (
            <div key={idx} className="space-y-2">
               <Label className="text-sm font-medium text-[var(--pinbank-blue)]">{label} mais comum</Label>
               <Select value={formData[`motivoReembolso${idx+1}`]} onValueChange={(val) => handleChange(`motivoReembolso${idx+1}`, val)}>
                 <SelectTrigger className="border-[var(--pinbank-blue)]/20 text-[var(--pinbank-blue)]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="arrependimento">Arrependimento</SelectItem>
                   <SelectItem value="atraso">Atraso na entrega</SelectItem>
                   <SelectItem value="qualidade">Qualidade do produto</SelectItem>
                   <SelectItem value="duplicidade">Duplicidade</SelectItem>
                   <SelectItem value="nao_reconhece">Não reconhece</SelectItem>
                   <SelectItem value="desacordo">Desacordo comercial</SelectItem>
                   <SelectItem value="outro">Outro</SelectItem>
                 </SelectContent>
               </Select>
            </div>
         ))}
      </div>
    </FormSection>
  );
}