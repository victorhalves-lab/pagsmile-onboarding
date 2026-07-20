import React from 'react';
import { Truck, AlertCircle } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';
import FormField from '../FormField';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function Step19cEntregaLogistica({ formData, handleChange }) {
  // Se nada foi selecionado nas etapas anteriores
  if (formData.vendeFisico !== true && formData.vendeDigitalServico !== true) {
      return (
        <FormSection
          title="Operação - Entrega e Logística"
          subtitle="Detalhes sobre a entrega de produtos e serviços."
          icon={Truck}
        >
            <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                <AlertCircle className="h-4 w-4 text-yellow-800" />
                <AlertTitle className="text-yellow-800">Atenção</AlertTitle>
                <AlertDescription className="text-yellow-700">
                    Você não selecionou nenhum tipo de venda (Físico ou Digital) na etapa anterior. 
                    Por favor, retorne e indique se vende produtos físicos, digitais ou serviços.
                </AlertDescription>
            </Alert>
            
            <div className="mt-6 p-4 border border-[var(--pinbank-blue)]/10 rounded-lg bg-white">
                <Label className="text-sm font-medium text-[var(--pinbank-blue)] mb-3 block">Deseja corrigir agora?</Label>
                <div className="flex flex-col gap-3">
                   <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-sm">Vende produto físico?</span>
                      <div className="flex gap-2">
                         <button onClick={() => handleChange('vendeFisico', true)} className="px-3 py-1 text-xs bg-white border rounded hover:bg-slate-50">Sim</button>
                         <button onClick={() => handleChange('vendeFisico', false)} className="px-3 py-1 text-xs bg-white border rounded hover:bg-slate-50">Não</button>
                      </div>
                   </div>
                   <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-sm">Vende digital/serviço?</span>
                      <div className="flex gap-2">
                         <button onClick={() => handleChange('vendeDigitalServico', true)} className="px-3 py-1 text-xs bg-white border rounded hover:bg-slate-50">Sim</button>
                         <button onClick={() => handleChange('vendeDigitalServico', false)} className="px-3 py-1 text-xs bg-white border rounded hover:bg-slate-50">Não</button>
                      </div>
                   </div>
                </div>
            </div>
        </FormSection>
      );
  }

  return (
    <FormSection
      title="Operação - Entrega e Logística"
      subtitle="Detalhes sobre a entrega de produtos e serviços."
      icon={Truck}
    >
      {/* Entrega Física */}
      {formData.vendeFisico === true && (
        <div className="space-y-4 p-4 bg-[var(--pinbank-blue)]/5 rounded-xl border border-[var(--pinbank-blue)]/10">
           <h3 className="font-semibold text-[var(--pinbank-blue)] text-sm uppercase tracking-wide">Entrega Física</h3>
           
           <div className="space-y-1.5">
             <Label className="text-xs font-medium text-[var(--pinbank-blue)]">Quem realiza a entrega? <span className="text-red-500">*</span></Label>
             <Select value={formData.quemEntrega} onValueChange={(val) => handleChange('quemEntrega', val)}>
               <SelectTrigger className="h-9 text-xs border-[var(--pinbank-blue)]/20 text-[var(--pinbank-blue)] bg-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
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
              <FormField 
                label="Como comprova?" 
                value={formData.comoComprovaEntregaFisica} 
                onChange={(val) => handleChange('comoComprovaEntregaFisica', val)} 
                placeholder="Ex: Rastreamento, AR..."
                className="h-9 text-xs" 
              />
           )}
        </div>
      )}

      {/* Entrega Digital/Serviço */}
      {formData.vendeDigitalServico === true && (
        <div className="space-y-4 p-4 bg-[var(--pinbank-blue)]/5 rounded-xl border border-[var(--pinbank-blue)]/10 mt-4">
           <h3 className="font-semibold text-[var(--pinbank-blue)] text-sm uppercase tracking-wide">Entrega Digital/Serviço</h3>
           
           <YesNoQuestion
             question="Consegue comprovar entrega/prestação?"
             value={formData.comprovaEntregaDigital}
             onChange={(val) => handleChange('comprovaEntregaDigital', val)}
             required
           />
           {formData.comprovaEntregaDigital === true && (
             <FormField 
                label="Como comprova?" 
                value={formData.comoComprovaEntregaDigital} 
                onChange={(val) => handleChange('comoComprovaEntregaDigital', val)} 
                placeholder="Ex: Logs, Certificado..." 
                className="h-9 text-xs"
             />
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
         <div className="space-y-4 p-4 bg-[var(--pinbank-blue)]/5 rounded-xl border border-[var(--pinbank-blue)]/10 mt-4">
           <h3 className="font-semibold text-[var(--pinbank-blue)] text-sm uppercase tracking-wide">Prazos</h3>
           
           <div className="space-y-1.5">
             <Label className="text-xs font-medium text-[var(--pinbank-blue)]">Prazo típico de entrega <span className="text-red-500">*</span></Label>
             <Select value={formData.prazoTipicoEntrega} onValueChange={(val) => handleChange('prazoTipicoEntrega', val)}>
               <SelectTrigger className="h-9 text-xs border-[var(--pinbank-blue)]/20 text-[var(--pinbank-blue)] bg-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                <FormField label="Prazo máximo prometido" value={formData.prazoMaximoPreVenda} onChange={(val) => handleChange('prazoMaximoPreVenda', val)} placeholder="Ex: Até 60 dias" className="h-9 text-xs" />
                <FormField label="Como é comunicado?" value={formData.comunicacaoPreVenda} onChange={(val) => handleChange('comunicacaoPreVenda', val)} placeholder="Ex: No checkout" className="h-9 text-xs" />
              </div>
           )}
         </div>
      )}
    </FormSection>
  );
}