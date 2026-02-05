import React from 'react';
import { ShieldCheck } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';
import SelectionButton from '../SelectionButton';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function Step10cPLDMonitoramento({ formData, handleChange }) {

  const alertasMonitoradosOptions = [
    'Volume alto', 'Frequência anormal', 'Horários atípicos', 'Padrões geográficos',
    'Fracionamento', 'Comportamento cliente novo', 'Outro'
  ];

  const handleMultiSelect = (field, item, checked) => {
    const current = formData[field] || [];
    if (checked) handleChange(field, [...current, item]);
    else handleChange(field, current.filter(i => i !== item));
  };

  return (
    <FormSection
      title="PLD/FT - Monitoramento"
      subtitle="Monitoramento de transações e alertas."
      icon={ShieldCheck}
    >
      <h3 className="font-semibold text-[var(--pagsmile-blue)] mb-2">8C. Monitoramento de Transações</h3>
      
      <YesNoQuestion
        question="Possui sistema de monitoramento de transações?"
        value={formData.pld_mon_transacoes}
        onChange={(v) => handleChange('pld_mon_transacoes', v)}
        required
      />
      {formData.pld_mon_transacoes === true && (
         <div className="space-y-4 mt-2">
            <YesNoQuestion
               question="O monitoramento é automatizado?"
               value={formData.pld_mon_auto}
               onChange={(v) => handleChange('pld_mon_auto', v)}
            />
            
            <div className="p-3 bg-[var(--pagsmile-blue)]/5 border border-[var(--pagsmile-blue)]/10 rounded-lg">
               <Label className="text-sm font-medium text-[var(--pagsmile-blue)] mb-2 block">Quais alertas são monitorados?</Label>
               <div className="grid grid-cols-2 gap-2">
                  {alertasMonitoradosOptions.map(opt => (
                     <div key={opt} className="flex items-center space-x-2">
                        <Checkbox 
                           id={`mon_${opt}`} 
                           checked={(formData.pld_mon_alertas || []).includes(opt)}
                           onCheckedChange={(c) => handleMultiSelect('pld_mon_alertas', opt, c)}
                           className="border-[var(--pagsmile-blue)]/30 text-[var(--pagsmile-green)] data-[state=checked]:bg-[var(--pagsmile-green)] data-[state=checked]:border-[var(--pagsmile-green)]"
                        />
                        <Label htmlFor={`mon_${opt}`} className="text-sm font-normal text-[var(--pagsmile-blue)] cursor-pointer">{opt}</Label>
                     </div>
                  ))}
               </div>
            </div>

            <div className="space-y-2">
               <Label className="text-sm font-medium text-[var(--pagsmile-blue)]">Prazo médio para análise de alertas</Label>
               <SelectionButton
                  options={[
                     {value: 'real', label: 'Tempo real'},
                     {value: '24h', label: 'Até 24h'},
                     {value: '48h', label: 'Até 48h'},
                     {value: '72h', label: 'Até 72h'},
                     {value: '1sem', label: 'Até 1 semana'}
                  ]}
                  value={formData.pld_prazo_analise}
                  onChange={(v) => handleChange('pld_prazo_analise', v)}
                  columns={3}
               />
            </div>
         </div>
      )}
    </FormSection>
  );
}