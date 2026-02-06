import React from 'react';
import { ShieldAlert } from 'lucide-react';
import FormSection from '../../FormSection';
import YesNoQuestion from '../../YesNoQuestion';

export default function StepP11PLDSancoes({ formData, handleChange }) {
  return (
    <FormSection
      title="PLD - Sanções"
      subtitle="Verificação de envolvimento em listas de sanções."
      icon={ShieldAlert}
    >
      <YesNoQuestion
        question="A empresa ou sócios estão em listas de sanções (OFAC, ONU, COAF, etc.)?"
        value={formData.sancoes_listas}
        onChange={(value) => handleChange('sancoes_listas', value)}
        detailValue={formData.sancoes_listas_detalhe}
        onDetailChange={(value) => handleChange('sancoes_listas_detalhe', value)}
        detailLabel="Detalhes"
        detailPlaceholder="Forneça mais detalhes..."
      />

      <YesNoQuestion
        question="Possui operações com países de alto risco ou sancionados?"
        value={formData.sancoes_paises}
        onChange={(value) => handleChange('sancoes_paises', value)}
        detailValue={formData.sancoes_paises_detalhe}
        onDetailChange={(value) => handleChange('sancoes_paises_detalhe', value)}
        detailLabel="Quais países e tipo de operação"
        detailPlaceholder="Informe os países..."
      />
    </FormSection>
  );
}