import React from 'react';
import { Building2 } from 'lucide-react';
import FormSection from '../../FormSection';
import FormField from '../../FormField';

export default function StepP1Identificacao({ formData, handleChange }) {
  return (
    <FormSection
      title="Identificação da Empresa"
      subtitle="Dados básicos de registro da sua empresa."
      icon={Building2}
    >
      <FormField
        label="CNPJ"
        value={formData.cnpj}
        onChange={(value) => handleChange('cnpj', value)}
        placeholder="00.000.000/0000-00"
      />
      
      <FormField
        label="Data de Constituição"
        type="date"
        value={formData.dataConstituicao}
        onChange={(value) => handleChange('dataConstituicao', value)}
      />
      
      <FormField
        label="Data Início da Atividade"
        type="date"
        value={formData.dataInicioAtividade}
        onChange={(value) => handleChange('dataInicioAtividade', value)}
      />
    </FormSection>
  );
}