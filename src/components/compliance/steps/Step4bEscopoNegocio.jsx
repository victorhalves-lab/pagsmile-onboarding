import React from 'react';
import { Search } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';

export default function Step4bEscopoNegocio({ formData, handleChange }) {
  return (
    <FormSection
      title="Escopo do Negócio"
      subtitle="Detalhamento da operação."
      icon={Search}
    >
      <FormField
        label="Escopo do Negócio"
        required
        type="textarea"
        value={formData.escopoNegocio}
        onChange={(val) => handleChange('escopoNegocio', val)}
        placeholder="Descreva detalhadamente o que a empresa faz, seus produtos/serviços, público-alvo, etc. (mínimo 50 caracteres)"
        minLength={50}
        rows={8}
        className="text-[var(--pinbank-blue)]"
      />
    </FormSection>
  );
}