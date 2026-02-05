import React from 'react';
import { Scale } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';
import SelectionButton from '../SelectionButton';
import { Label } from '@/components/ui/label';

export default function Section6Licenciamento({ formData, handleChange }) {
  return (
    <FormSection
      title="Licenciamento e Regulação"
      subtitle="Informe sobre licenças e regulamentações aplicáveis."
      icon={Scale}
    >
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          A empresa necessita de licença para operar no Brasil em razão do seu ramo de atividade? <span className="text-red-500">*</span>
        </Label>
        <SelectionButton
          options={[
            { value: true, label: 'Sim' },
            { value: false, label: 'Não' }
          ]}
          value={formData.necessitaLicenca}
          onChange={(value) => handleChange('necessitaLicenca', value)}
          columns={2}
        />
      </div>

      {formData.necessitaLicenca === true && (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
          <FormField
            label="Nome do Órgão Regulador/Supervisor"
            required
            value={formData.orgaoRegulador}
            onChange={(value) => handleChange('orgaoRegulador', value)}
            placeholder="Ex: ANVISA, CVM, BACEN, etc."
          />

          <FormField
            label="Número de Registro/Licença"
            required
            value={formData.numeroRegistro}
            onChange={(value) => handleChange('numeroRegistro', value)}
            placeholder="Número do registro ou licença"
          />

          <FormField
            label="Data de Concessão"
            required
            type="date"
            value={formData.dataConcessao}
            onChange={(value) => handleChange('dataConcessao', value)}
          />
        </div>
      )}
    </FormSection>
  );
}