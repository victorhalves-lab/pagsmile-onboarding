import React from 'react';
import { FileText } from 'lucide-react';
import FormSection from '../../FormSection';
import FormField from '../../FormField';

export default function StepP2RazaoSocial({ formData, handleChange }) {
  return (
    <FormSection
      title="Razão Social"
      subtitle="Nome da empresa e tipo jurídico."
      icon={FileText}
    >
      <FormField
        label="Razão Social"
        value={formData.razaoSocial}
        onChange={(value) => handleChange('razaoSocial', value)}
        placeholder="Nome completo da sua empresa"
      />
      
      <FormField
        label="Nome Fantasia"
        value={formData.nomeFantasia}
        onChange={(value) => handleChange('nomeFantasia', value)}
        placeholder="Nome comercial pelo qual sua empresa é conhecida"
      />
    </FormSection>
  );
}