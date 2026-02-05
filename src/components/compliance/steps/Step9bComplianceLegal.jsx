import React from 'react';
import { ShieldAlert } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';

export default function Step9bComplianceLegal({ formData, handleChange }) {
  return (
    <FormSection
      title="Compliance - Jurídico"
      subtitle="Questões legais e financeiras recentes."
      icon={ShieldAlert}
    >
      <YesNoQuestion
        question="4. Nos últimos 12 meses, a empresa ou algum de seus diretores, conselheiros, acionistas (diretos ou indiretos) ou beneficiários finais esteve sob investigação criminal por qualquer motivo?"
        value={formData.comp_q4}
        onChange={(v) => handleChange('comp_q4', v)}
        detailValue={formData.comp_q4_detalhe}
        onDetailChange={(v) => handleChange('comp_q4_detalhe', v)}
        detailLabel="Especifique"
        required
      />

      <YesNoQuestion
        question="5. Nos últimos 12 meses, a empresa ou algum de seus diretores, conselheiros, acionistas (diretos ou indiretos) ou beneficiários finais teve contas bancárias ou de pagamento encerradas por motivos de compliance?"
        value={formData.comp_q5}
        onChange={(v) => handleChange('comp_q5', v)}
        detailValue={formData.comp_q5_detalhe}
        onDetailChange={(v) => handleChange('comp_q5_detalhe', v)}
        detailLabel="Especifique"
        required
      />
    </FormSection>
  );
}