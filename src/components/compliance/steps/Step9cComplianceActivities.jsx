import React from 'react';
import { ShieldAlert } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';

export default function Step9cComplianceActivities({ formData, handleChange }) {
  return (
    <FormSection
      title="Compliance - Atividades"
      subtitle="Natureza das atividades da empresa."
      icon={ShieldAlert}
    >
      <YesNoQuestion
        question="6. A empresa opera com criptomoedas, criptoativos, tokens ou assimilados?"
        value={formData.comp_q6}
        onChange={(v) => handleChange('comp_q6', v)}
        detailValue={formData.comp_q6_detalhe}
        onDetailChange={(v) => handleChange('comp_q6_detalhe', v)}
        detailLabel="Detalhe a operação"
        required
      />

      <YesNoQuestion
        question="7. A empresa opera com jogos, apostas, cassino ou atividades similares?"
        value={formData.comp_q7}
        onChange={(v) => handleChange('comp_q7', v)}
        detailValue={formData.comp_q7_detalhe}
        onDetailChange={(v) => handleChange('comp_q7_detalhe', v)}
        detailLabel="Nº da Licença"
        required
      />

      <YesNoQuestion
        question="8. A empresa atua em alguma atividade que possa ser considerada proibida ou ilegal?"
        value={formData.comp_q8}
        onChange={(v) => handleChange('comp_q8', v)}
        required
      />

      <YesNoQuestion
        question="9. A empresa atua em alguma atividade considerada de alto risco ou que requer aprovação especial (ex: nutra, viagens, leilões, etc.)?"
        value={formData.comp_q9}
        onChange={(v) => handleChange('comp_q9', v)}
        detailValue={formData.comp_q9_detalhe}
        onDetailChange={(v) => handleChange('comp_q9_detalhe', v)}
        detailLabel="Qual atividade?"
        required
      />
    </FormSection>
  );
}