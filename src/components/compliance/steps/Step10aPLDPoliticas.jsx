import React from 'react';
import { ShieldCheck } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';
import SelectionButton from '../SelectionButton';
import { Label } from '@/components/ui/label';

export default function Step10aPLDPoliticas({ formData, handleChange }) {
  return (
    <FormSection
      title="PLD/FT - Políticas"
      subtitle="Políticas e treinamentos de prevenção à lavagem de dinheiro."
      icon={ShieldCheck}
    >
      <h3 className="font-semibold text-[var(--pagsmile-blue)] mb-2">8A. Políticas e Procedimentos</h3>
      
      <YesNoQuestion
        question="A empresa possui Política de PLD/FT documentada?"
        value={formData.pld_politica_doc}
        onChange={(v) => handleChange('pld_politica_doc', v)}
        required
      />
      {formData.pld_politica_doc === true && (
         <YesNoQuestion
            question="A política foi revisada/atualizada nos últimos 12 meses?"
            value={formData.pld_politica_revisada}
            onChange={(v) => handleChange('pld_politica_revisada', v)}
            required
         />
      )}

      <YesNoQuestion
        question="Existe programa formal de treinamento em PLD/FT?"
        value={formData.pld_treinamento_formal}
        onChange={(v) => handleChange('pld_treinamento_formal', v)}
        required
      />
      {formData.pld_treinamento_formal === true && (
         <div className="mt-2 space-y-2">
            <Label className="text-sm font-medium text-[var(--pagsmile-blue)]">Frequência do treinamento</Label>
            <SelectionButton
               options={[
                  {value: 'anual', label: 'Anual'},
                  {value: 'semestral', label: 'Semestral'},
                  {value: 'trimestral', label: 'Trimestral'},
                  {value: 'admissao', label: 'Apenas na admissão'},
                  {value: 'demanda', label: 'Sob demanda'}
               ]}
               value={formData.pld_freq_treinamento}
               onChange={(v) => handleChange('pld_freq_treinamento', v)}
               columns={2}
            />
         </div>
      )}
    </FormSection>
  );
}