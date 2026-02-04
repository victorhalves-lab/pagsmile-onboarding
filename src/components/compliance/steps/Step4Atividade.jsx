import React from 'react';
import { Briefcase } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';

export default function Step4Atividade({ formData, handleChange }) {
  return (
    <FormSection
      title="Atividade Econômica"
      subtitle="Detalhes sobre o CNAE e descrição de seus produtos/serviços."
      icon={Briefcase}
    >
      <FormField
        label="CNAE Principal"
        required
        value={formData.cnaePrincipal}
        onChange={(value) => handleChange('cnaePrincipal', value)}
        placeholder="Ex: 6613-4/00 (Atividades de Intermediação e Administração de Cartões)"
      />
      
      <FormField
        label="CNAEs Secundários"
        type="textarea"
        value={formData.cnaesSecundarios}
        onChange={(value) => handleChange('cnaesSecundarios', value)}
        placeholder="Liste outros códigos CNAE secundários se aplicável."
        rows={2}
      />
      
      <FormField
        label="Descrição Detalhada da Atividade"
        required
        type="textarea"
        value={formData.descricaoAtividade}
        onChange={(value) => handleChange('descricaoAtividade', value)}
        placeholder="Descreva em detalhes os produtos e serviços que sua empresa oferece e como eles são comercializados."
        rows={4}
      />
    </FormSection>
  );
}