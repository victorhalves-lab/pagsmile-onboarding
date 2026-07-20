import React from 'react';
import { ShieldCheck } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';
import SelectionButton from '../SelectionButton';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function Step10bPLDKYC({ formData, handleChange }) {
  
  const escopoKycOptions = [
    'Documento de identidade', 'Comprovante de endereço', 'Comprovante de renda',
    'CNPJ/Contrato Social', 'Referências comerciais', 'Consulta a bureau', 'Outro'
  ];

  const handleMultiSelect = (field, item, checked) => {
    const current = formData[field] || [];
    if (checked) handleChange(field, [...current, item]);
    else handleChange(field, current.filter(i => i !== item));
  };

  return (
    <FormSection
      title="PLD/FT - KYC"
      subtitle="Controles de Conheça Seu Cliente (KYC)."
      icon={ShieldCheck}
    >
      <h3 className="font-semibold text-[var(--pinbank-blue)] mb-2">8B. Controles KYC</h3>
      
      <YesNoQuestion
        question="A empresa realiza KYC/KYB de seus próprios clientes?"
        value={formData.pld_realiza_kyc}
        onChange={(v) => handleChange('pld_realiza_kyc', v)}
        required
      />
      {formData.pld_realiza_kyc === true && (
         <div className="p-3 bg-[var(--pinbank-blue)]/5 border border-[var(--pinbank-blue)]/10 rounded-lg mt-2">
            <Label className="text-sm font-medium text-[var(--pinbank-blue)] mb-2 block">Qual o escopo da verificação?</Label>
            <div className="grid grid-cols-2 gap-2">
               {escopoKycOptions.map(opt => (
                  <div key={opt} className="flex items-center space-x-2">
                     <Checkbox 
                        id={`kyc_${opt}`} 
                        checked={(formData.pld_kyc_escopo || []).includes(opt)}
                        onCheckedChange={(c) => handleMultiSelect('pld_kyc_escopo', opt, c)}
                        className="border-[var(--pinbank-blue)]/30 text-[var(--pinbank-blue)] data-[state=checked]:bg-[var(--pinbank-blue)] data-[state=checked]:border-[var(--pinbank-blue)]"
                     />
                     <Label htmlFor={`kyc_${opt}`} className="text-sm font-normal text-[var(--pinbank-blue)] cursor-pointer">{opt}</Label>
                  </div>
               ))}
            </div>
         </div>
      )}

      <YesNoQuestion
        question="Realiza verificação de listas de sanções?"
        value={formData.pld_verifica_sancoes}
        onChange={(v) => handleChange('pld_verifica_sancoes', v)}
        required
      />
      {formData.pld_verifica_sancoes === true && (
         <div className="mt-2 space-y-2">
            <Label className="text-sm font-medium text-[var(--pinbank-blue)]">Frequência de re-verificação</Label>
            <SelectionButton
               options={[
                  {value: 'continuo', label: 'Contínuo'},
                  {value: 'diario', label: 'Diário'},
                  {value: 'semanal', label: 'Semanal'},
                  {value: 'mensal', label: 'Mensal'},
                  {value: 'anual', label: 'Anual'},
                  {value: 'evento', label: 'Por evento'}
               ]}
               value={formData.pld_freq_sancoes}
               onChange={(v) => handleChange('pld_freq_sancoes', v)}
               columns={3}
            />
         </div>
      )}

      <YesNoQuestion
        question="Realiza verificação de PEP?"
        value={formData.pld_verifica_pep_clientes}
        onChange={(v) => handleChange('pld_verifica_pep_clientes', v)}
        required
      />
    </FormSection>
  );
}