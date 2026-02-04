import React from 'react';
import { Building2 } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';

export default function Step1Identificacao({ formData, handleChange }) {
  return (
    <FormSection
      title="Identificação da Empresa"
      subtitle="Dados básicos de registro da sua empresa."
      icon={Building2}
    >
      <FormField
        label="CNPJ"
        required
        value={formData.cnpj}
        onChange={(value) => handleChange('cnpj', value)}
        placeholder="00.000.000/0000-00"
      />
      
      <FormField
        label="Data de Início da Atividade"
        required
        type="date"
        value={formData.dataInicioAtividade}
        onChange={(value) => handleChange('dataInicioAtividade', value)}
      />
      
      <FormField
        label="Razão Social"
        required
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