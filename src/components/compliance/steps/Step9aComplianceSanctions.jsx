import React from 'react';
import { ShieldAlert } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';

export default function Step9aComplianceSanctions({ formData, handleChange }) {
  return (
    <FormSection
      title="Compliance - Sanções"
      subtitle="Verifique se a empresa ou sócios estão em listas de sanções."
      icon={ShieldAlert}
    >
      <YesNoQuestion
        question="1. Algum sócio, acionista (direto ou indireto), administrador, diretor ou beneficiário final da empresa está incluído em listas de sanções nacionais ou internacionais?"
        value={formData.comp_q1}
        onChange={(v) => handleChange('comp_q1', v)}
        detailValue={formData.comp_q1_detalhe}
        onDetailChange={(v) => handleChange('comp_q1_detalhe', v)}
        detailLabel="Especifique"
        required
      />

      <YesNoQuestion
        question="2. A empresa, ou qualquer um de seus diretores, acionistas (diretos ou indiretos) ou beneficiários finais, mantém vínculos com países, regiões ou territórios sujeitos a sanções internacionais abrangentes?"
        value={formData.comp_q2}
        onChange={(v) => handleChange('comp_q2', v)}
        detailValue={formData.comp_q2_detalhe}
        onDetailChange={(v) => handleChange('comp_q2_detalhe', v)}
        detailLabel="Especifique"
        required
      />

      <YesNoQuestion
        question="3. A empresa é de propriedade ou está, direta ou indiretamente, sob controle de pessoa ou entidade incluída em listas de sanções, atuando em nome próprio ou representando interesses de terceiros sancionados?"
        value={formData.comp_q3}
        onChange={(v) => handleChange('comp_q3', v)}
        detailValue={formData.comp_q3_detalhe}
        onDetailChange={(v) => handleChange('comp_q3_detalhe', v)}
        detailLabel="Especifique"
        required
      />
    </FormSection>
  );
}