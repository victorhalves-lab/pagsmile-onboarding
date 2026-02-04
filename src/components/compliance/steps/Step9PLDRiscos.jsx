import React from 'react';
import { AlertTriangle } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';

export default function Step9PLDRiscos({ formData, handleChange }) {
  return (
    <FormSection
      title="PLD - Riscos e Vulnerabilidades"
      subtitle="Avaliação de riscos de lavagem de dinheiro e financiamento ao terrorismo."
      icon={AlertTriangle}
    >
      <YesNoQuestion
        question="Algum sócio, administrador ou UBO é, ou foi nos últimos 5 anos, uma Pessoa Politicamente Exposta (PEP)?"
        value={formData.riscos_pep}
        onChange={(value) => handleChange('riscos_pep', value)}
        detailValue={formData.riscos_pep_detalhe}
        onDetailChange={(value) => handleChange('riscos_pep_detalhe', value)}
        detailLabel="Detalhes sobre a exposição política"
        detailPlaceholder="Informe o cargo, período e relação com a empresa..."
        required
      />

      <YesNoQuestion
        question="A empresa ou seus sócios/administradores já foram investigados ou condenados por crimes de lavagem de dinheiro ou financiamento ao terrorismo?"
        value={formData.riscos_lavagem}
        onChange={(value) => handleChange('riscos_lavagem', value)}
        detailValue={formData.riscos_lavagem_detalhe}
        onDetailChange={(value) => handleChange('riscos_lavagem_detalhe', value)}
        detailLabel="Detalhes sobre as investigações ou condenações"
        detailPlaceholder="Descreva o histórico de investigações ou processos..."
        required
      />

      <YesNoQuestion
        question="A empresa possui histórico de operações financeiras atípicas ou que levantaram suspeitas de PLD/FT?"
        value={formData.riscos_operacoes}
        onChange={(value) => handleChange('riscos_operacoes', value)}
        detailValue={formData.riscos_operacoes_detalhe}
        onDetailChange={(value) => handleChange('riscos_operacoes_detalhe', value)}
        detailLabel="Detalhes sobre as operações atípicas"
        detailPlaceholder="Descreva as operações que levantaram suspeitas..."
        required
      />
    </FormSection>
  );
}