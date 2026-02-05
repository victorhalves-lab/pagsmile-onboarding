import React from 'react';
import { ShieldAlert } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';

export default function Step9dCompliancePEP({ formData, handleChange }) {
  return (
    <FormSection
      title="Compliance - PEP & Offshore"
      subtitle="Exposição política e relacionamentos internacionais."
      icon={ShieldAlert}
    >
      <YesNoQuestion
        question="10. Algum beneficiário final (UBO) ou administrador é Pessoa Politicamente Exposta (PEP) ou possui relacionamento próximo com PEP?"
        value={formData.comp_q10}
        onChange={(v) => handleChange('comp_q10', v)}
        detailValue={formData.comp_q10_detalhe}
        onDetailChange={(v) => handleChange('comp_q10_detalhe', v)}
        detailLabel="Detalhes"
        required
      />

      <YesNoQuestion
        question="11. A empresa possui relacionamento comercial ou financeiro com terceiros localizados em jurisdições offshore ou consideradas paraísos fiscais?"
        value={formData.comp_q11}
        onChange={(v) => handleChange('comp_q11', v)}
        detailValue={formData.comp_q11_detalhe}
        onDetailChange={(v) => handleChange('comp_q11_detalhe', v)}
        detailLabel="Especifique"
        required
      />
    </FormSection>
  );
}