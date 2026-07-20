import React from 'react';
import { Lock, AlertTriangle } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';
import SelectionButton from '../SelectionButton';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Section8SegurancaCartao({ formData, handleChange }) {
  return (
    <FormSection
      title="Segurança de Dados de Cartão"
      subtitle="Como a empresa trata dados de cartão de pagamento."
      icon={Lock}
    >
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          Armazena dados de cartão? <span className="text-red-500">*</span>
        </Label>
        <SelectionButton
          options={[
            { value: true, label: 'Sim', description: 'Armazena dados' },
            { value: false, label: 'Não', description: 'Não armazena' }
          ]}
          value={formData.armazenaDadosCartao}
          onChange={(value) => handleChange('armazenaDadosCartao', value)}
          columns={2}
        />
      </div>

      {formData.armazenaDadosCartao === true && (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
          <h4 className="font-semibold text-slate-800">Detalhes do armazenamento:</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: 'armazena_pan', label: 'Armazena PAN completo?' },
              { key: 'armazena_ultimos4', label: 'Apenas últimos 4 dígitos?' },
              { key: 'armazena_token', label: 'Armazena token?' },
              { key: 'armazena_cvv', label: 'Armazena CVV?' }
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded bg-white border border-slate-100">
                <span className="text-sm text-slate-700">{item.label}</span>
                <SelectionButton
                  options={[
                    { value: true, label: 'Sim' },
                    { value: false, label: 'Não' }
                  ]}
                  value={formData[item.key]}
                  onChange={(value) => handleChange(item.key, value)}
                  columns={2}
                  className="!gap-1"
                />
              </div>
            ))}
          </div>

          {formData.armazena_cvv === true && (
            <Alert variant="destructive" className="bg-red-50 border-red-300">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-800 font-bold">ALERTA CRÍTICO</AlertTitle>
              <AlertDescription className="text-red-700">
                Armazenar CVV é uma violação grave do PCI DSS. Esta prática é estritamente proibida pelas bandeiras de cartão e pode resultar em penalidades severas, multas e revogação da capacidade de processar cartões.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          Utiliza checkout hospedado/tokenização via PSP? <span className="text-red-500">*</span>
        </Label>
        <SelectionButton
          options={[
            { value: true, label: 'Sim', description: 'Usa PSP externo' },
            { value: false, label: 'Não', description: 'Processa internamente' }
          ]}
          value={formData.usaCheckoutHospedado}
          onChange={(value) => handleChange('usaCheckoutHospedado', value)}
          columns={2}
        />
      </div>

      {formData.usaCheckoutHospedado === true && (
        <FormField
          label="Qual PSP/provedor?"
          value={formData.pspProvedor}
          onChange={(value) => handleChange('pspProvedor', value)}
          placeholder="Ex: Stripe, Adyen, Pin Bank..."
        />
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          Possui evidência de PCI DSS? <span className="text-red-500">*</span>
        </Label>
        <SelectionButton
          options={[
            { value: true, label: 'Sim', description: 'Possui certificação' },
            { value: false, label: 'Não', description: 'Não possui' }
          ]}
          value={formData.possuiPCIDSS}
          onChange={(value) => handleChange('possuiPCIDSS', value)}
          columns={2}
        />
      </div>
    </FormSection>
  );
}