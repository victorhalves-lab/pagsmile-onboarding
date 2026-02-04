import React from 'react';
import { Scale } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';
import SelectionButton from '../SelectionButton';
import { Label } from '@/components/ui/label';

export default function Section6Licenciamento({ formData, handleChange }) {
  return (
    <FormSection
      title="Licenciamento"
      subtitle="Licenças e regulamentações pertinentes à sua atividade."
      icon={Scale}
    >
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          Necessita de licença para operar? <span className="text-red-500">*</span>
        </Label>
        <SelectionButton
          options={[
            { value: true, label: 'Sim', description: 'Atividade regulamentada' },
            { value: false, label: 'Não', description: 'Não requer licença' }
          ]}
          value={formData.necessitaLicenca}
          onChange={(value) => handleChange('necessitaLicenca', value)}
          columns={2}
        />
      </div>

      {formData.necessitaLicenca === true && (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
          <FormField
            label="Órgão Regulador"
            required
            value={formData.orgaoRegulador}
            onChange={(value) => handleChange('orgaoRegulador', value)}
            placeholder="Ex: CVM, BACEN"
          />

          <FormField
            label="Número de Registro"
            required
            value={formData.numeroRegistro}
            onChange={(value) => handleChange('numeroRegistro', value)}
            placeholder="Número"
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