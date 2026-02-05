import React from 'react';
import { Truck } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';
import FormField from '../FormField';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Step19cEntregaLogistica({ formData, handleChange }) {
  return (
    <FormSection
      title="Operação - Entrega e Logística"
      subtitle="Detalhes sobre a entrega de produtos e serviços."
      icon={Truck}
    >
      {/* Entrega Física */}
      {formData.vendeFisico === true && (
        <div className="space-y-4 p-4 bg-[var(--pagsmile-blue)]/5 rounded-xl border border-[var(--pagsmile-blue)]/10">
           <h3 className="font-semibold text-[var(--pagsmile-blue)]">B2F. Entrega Física</h3>
           
           <div className="space-y-2">
             <Label className="text-sm font-medium text-[var(--pagsmile-blue)]">Quem realiza a entrega? <span className="text-red-500">*</span></Label>
             <Select value={formData.quemEntrega} onValueChange={(val) => handleChange('quemEntrega', val)}>
               <SelectTrigger className="border-[var(--pagsmile-blue)]/20 text-[var(--pagsmile-blue)]"><SelectValue placeholder="Selecione" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="proprio">Próprio</SelectItem>
                 <SelectItem value="transportadora">Transportadora</SelectItem>
                 <SelectItem value="marketplace">Marketplace</SelectItem>
                 <SelectItem value="dropship">Dropship/Terceiro</SelectItem>
                 <SelectItem value="outro">Outro</SelectItem>
               </SelectContent>
             </Select>
           </div>

           <YesNoQuestion
             question="Possui política pública de troca/devolução?"
             value={formData.politicaTrocaPublica}
             onChange={(val) => handleChange('politicaTrocaPublica', val)}
             detailValue={formData.politicaTrocaUrl}
             onDetailChange={(val) => handleChange('politicaTrocaUrl', val)}
             detailLabel="Link da política"
             detailPlaceholder="https://..."
             required
           />

           <YesNoQuestion
             question="Consegue comprovar entrega?"
             value={formData.comprovaEntregaFisica}
             onChange={(val) => handleChange('comprovaEntregaFisica', val)}
             required
           />
           {formData.comprovaEntregaFisica === true && (
              <FormField label="Como comprova?" value={formData.comoComprovaEntregaFisica} onChange={(val) => handleChange('comoComprovaEntregaFisica', val)} placeholder="Ex: Rastreamento, AR..." />
           )}
        </div>
      )}

      {/* Entrega Digital/Serviço */}
      {formData.vendeDigitalServico === true && (
        <div className="space-y-4 p-4 bg-[var(--pagsmile-blue)]/5 rounded-xl border border-[var(--pagsmile-blue)]/10 mt-4">
           <h3 className="font-semibold text-[var(--pagsmile-blue)]">B2D. Entrega Digital/Serviço</h3>
           
           <YesNoQuestion
             question="Consegue comprovar entrega/prestação?"
             value={formData.comprovaEntregaDigital}
             onChange={(val) => handleChange('comprovaEntregaDigital', val)}
             required
           />
           {formData.comprovaEntregaDigital === true && (
             <FormField label="Como comprova?" value={formData.comoComprovaEntregaDigital} onChange={(val) => handleChange('comoComprovaEntregaDigital', val)} placeholder="Ex: Logs, Certificado..." />
           )}

           <YesNoQuestion
             question="Existe política pública de reembolso?"
             value={formData.politicaReembolsoPublica}
             onChange={(val) => handleChange('politicaReembolsoPublica', val)}
             detailValue={formData.politicaReembolsoUrl}
             onDetailChange={(val) => handleChange('politicaReembolsoUrl', val)}
             detailLabel="Link da política"
             detailPlaceholder="https://..."
             required
           />
        </div>
      )}

      {/* Prazos */}
      {formData.prazoEntregaMaior7 === true && (
         <div className="space-y-4 p-4 bg-[var(--pagsmile-blue)]/5 rounded-xl border border-[var(--pagsmile-blue)]/10 mt-4">
           <h3 className="font-semibold text-[var(--pagsmile-blue)]">B3. Prazos</h3>
           
           <div className="space-y-2">
             <Label className="text-sm font-medium text-[var(--pagsmile-blue)]">Prazo típico de entrega <span className="text-red-500">*</span></Label>
             <Select value={formData.prazoTipicoEntrega} onValueChange={(val) => handleChange('prazoTipicoEntrega', val)}>
               <SelectTrigger className="border-[var(--pagsmile-blue)]/20 text-[var(--pagsmile-blue)]"><SelectValue placeholder="Selecione" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="imediato">Imediato</SelectItem>
                 <SelectItem value="d1">D+1</SelectItem>
                 <SelectItem value="d2_d7">D+2 a D+7</SelectItem>
                 <SelectItem value="d8_d30">D+8 a D+30</SelectItem>
                 <SelectItem value="mais_30">Mais de 30 dias</SelectItem>
               </SelectContent>
             </Select>
           </div>

           <YesNoQuestion
             question="Existe pré-venda/entrega futura?"
             value={formData.existePreVenda}
             onChange={(val) => handleChange('existePreVenda', val)}
             required
           />
           {formData.existePreVenda === true && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Prazo máximo prometido" value={formData.prazoMaximoPreVenda} onChange={(val) => handleChange('prazoMaximoPreVenda', val)} placeholder="Ex: Até 60 dias" />
                <FormField label="Como é comunicado?" value={formData.comunicacaoPreVenda} onChange={(val) => handleChange('comunicacaoPreVenda', val)} placeholder="Ex: No checkout" />
              </div>
           )}
         </div>
      )}
    </FormSection>
  );
}