import React from 'react';
import { AlertTriangle } from 'lucide-react';
import FormSection from '../../FormSection';
import YesNoQuestion from '../../YesNoQuestion';

export default function StepP12PLDRiscos({ formData, handleChange }) {
  return (
    <FormSection
      title="PLD - Riscos"
      subtitle="Avaliação de riscos de PLD/FT."
      icon={AlertTriangle}
    >
      <YesNoQuestion
        question="Algum sócio ou UBO é Pessoa Politicamente Exposta (PEP)?"
        value={formData.riscos_pep}
        onChange={(value) => handleChange('riscos_pep', value)}
        detailValue={formData.riscos_pep_detalhe}
        onDetailChange={(value) => handleChange('riscos_pep_detalhe', value)}
        detailLabel="Detalhes sobre a exposição política"
        detailPlaceholder="Informe o cargo, período..."
      />

      <YesNoQuestion
        question="Já foram investigados por lavagem de dinheiro ou FT?"
        value={formData.riscos_lavagem}
        onChange={(value) => handleChange('riscos_lavagem', value)}
        detailValue={formData.riscos_lavagem_detalhe}
        onDetailChange={(value) => handleChange('riscos_lavagem_detalhe', value)}
        detailLabel="Detalhes"
        detailPlaceholder="Descreva o histórico..."
      />
    </FormSection>
  );
}