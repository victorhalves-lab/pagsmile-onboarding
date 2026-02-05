import React from 'react';
import { ShieldCheck } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';
import SelectionButton from '../SelectionButton';
import { Label } from '@/components/ui/label';

export default function Step10dPLDGovernanca({ formData, handleChange }) {
  return (
    <FormSection
      title="PLD/FT - Governança"
      subtitle="Estrutura de governança e auditoria."
      icon={ShieldCheck}
    >
      <h3 className="font-semibold text-[var(--pagsmile-blue)] mb-2">8D. Governança</h3>
      
      <YesNoQuestion
        question="Existe área/pessoa dedicada a Compliance?"
        value={formData.pld_gov_area}
        onChange={(v) => handleChange('pld_gov_area', v)}
        required
      />
      {formData.pld_gov_area === true && (
         <YesNoQuestion
            question="Compliance reporta à alta administração?"
            value={formData.pld_gov_reporta}
            onChange={(v) => handleChange('pld_gov_reporta', v)}
         />
      )}

      <YesNoQuestion
        question="Realiza auditorias internas de PLD?"
        value={formData.pld_gov_auditoria}
        onChange={(v) => handleChange('pld_gov_auditoria', v)}
        required
      />
      {formData.pld_gov_auditoria === true && (
         <div className="mt-2 space-y-2">
            <Label className="text-sm font-medium text-[var(--pagsmile-blue)]">Frequência das auditorias</Label>
            <SelectionButton
               options={[
                  {value: 'anual', label: 'Anual'},
                  {value: 'semestral', label: 'Semestral'},
                  {value: 'trimestral', label: 'Trimestral'},
                  {value: 'demanda', label: 'Sob demanda'}
               ]}
               value={formData.pld_gov_auditoria_freq}
               onChange={(v) => handleChange('pld_gov_auditoria_freq', v)}
               columns={2}
            />
         </div>
      )}
    </FormSection>
  );
}