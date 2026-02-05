import React from 'react';
import { Truck, RotateCcw, Users, AlertCircle, Package, Clock } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';
import SelectionButton from '../SelectionButton';
import YesNoQuestion from '../YesNoQuestion';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function Step5PerfilOperacional({ formData, handleChange }) {
  return (
    <div className="space-y-8">
      <FormSection
        title="Perfil Operacional e Logístico"
        subtitle="Detalhes sobre a entrega do produto/serviço e políticas de operação."
        icon={Truck}
      >
        {/* Tipo de Entrega */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">Qual o modelo de entrega do seu produto/serviço? <span className="text-red-500">*</span></Label>
          <SelectionButton
            options={[
              { value: 'fisico', label: 'Produto Físico', icon: <Package className="w-5 h-5" /> },
              { value: 'digital', label: 'Produto Digital / Info', icon: <AlertCircle className="w-5 h-5" /> },
              { value: 'servico', label: 'Serviço', icon: <Users className="w-5 h-5" /> },
              { value: 'hibrido', label: 'Híbrido (Físico + Digital)' }
            ]}
            value={formData.modeloEntrega}
            onChange={(value) => handleChange('modeloEntrega', value)}
            columns={2}
          />
        </div>

        {/* Logística (apenas para físico/híbrido) */}
        {(formData.modeloEntrega === 'fisico' || formData.modeloEntrega === 'hibrido') && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
             <Label className="text-sm font-medium text-slate-700">Como funciona sua logística? <span className="text-red-500">*</span></Label>
             <SelectionButton
              options={[
                { value: 'estoque_proprio', label: 'Estoque Próprio' },
                { value: 'dropshipping_nacional', label: 'Dropshipping Nacional' },
                { value: 'dropshipping_internacional', label: 'Dropshipping Internacional' },
                { value: 'fulfillment', label: 'Fulfillment Terceirizado' }
              ]}
              value={formData.tipoLogistica}
              onChange={(value) => handleChange('tipoLogistica', value)}
              columns={2}
            />
          </div>
        )}

        {/* Prazo de Entrega */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Prazo médio de entrega (em dias)"
            type="number"
            value={formData.prazoEntrega}
            onChange={(value) => handleChange('prazoEntrega', value)}
            placeholder="Ex: 5"
            icon={Clock}
            required
          />
          <FormField
            label="Prazo máximo de entrega (em dias)"
            type="number"
            value={formData.prazoMaximoEntrega}
            onChange={(value) => handleChange('prazoMaximoEntrega', value)}
            placeholder="Ex: 15"
            icon={Clock}
            required
          />
        </div>

        <Separator className="my-2" />

        {/* Políticas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <RotateCcw className="w-5 h-5 text-[var(--pagsmile-blue)]" />
            <h3 className="font-bold text-slate-800">Políticas e Cancelamento</h3>
          </div>

          <FormField
            label="URL da Política de Reembolso e Cancelamento"
            value={formData.urlPoliticaReembolso}
            onChange={(value) => handleChange('urlPoliticaReembolso', value)}
            placeholder="https://seu-site.com/termos-reembolso"
            required
          />
          
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
             É obrigatório que o site possua uma política de reembolso clara e visível para o consumidor final.
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Afiliados e Parcerias"
        subtitle="Informações sobre modelos de comissionamento."
        icon={Users}
      >
        <YesNoQuestion
          question="Sua empresa trabalha com Afiliados?"
          value={formData.trabalhaAfiliados}
          onChange={(value) => handleChange('trabalhaAfiliados', value)}
          detailValue={formData.porcentagemAfiliados}
          onDetailChange={(value) => handleChange('porcentagemAfiliados', value)}
          detailLabel="Qual a % média de comissão paga aos afiliados?"
          detailPlaceholder="Ex: 30%"
          showDetailOn={true}
          required
        />
        
        {formData.trabalhaAfiliados === true && (
          <FormField
            label="Plataforma de gestão de afiliados utilizada"
            value={formData.plataformaAfiliados}
            onChange={(value) => handleChange('plataformaAfiliados', value)}
            placeholder="Ex: Própria, Hotmart, PerfectPay..."
          />
        )}
      </FormSection>
    </div>
  );
}