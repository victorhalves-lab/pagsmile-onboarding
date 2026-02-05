import React from 'react';
import { ShieldCheck } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';
import SelectionButton from '../SelectionButton';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

export default function Step10PLDOperacao({ formData, handleChange }) {
  
  const escopoKycOptions = [
    'Documento de identidade', 'Comprovante de endereço', 'Comprovante de renda',
    'CNPJ/Contrato Social', 'Referências comerciais', 'Consulta a bureau', 'Outro'
  ];

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
      title="Prevenção à Lavagem de Dinheiro (PLD/FT)"
      subtitle="Informe sobre as políticas e controles de PLD/FT da empresa."
      icon={ShieldCheck}
    >
      {/* 8A. Políticas e Procedimentos */}
      <h3 className="font-semibold text-slate-800 mb-2">8A. Políticas e Procedimentos</h3>
      
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
            <Label className="text-sm font-medium text-slate-700">Frequência do treinamento</Label>
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

      <Separator className="my-6" />

      {/* 8B. Controles KYC */}
      <h3 className="font-semibold text-slate-800 mb-2">8B. Controles KYC</h3>
      
      <YesNoQuestion
        question="A empresa realiza KYC/KYB de seus próprios clientes?"
        value={formData.pld_realiza_kyc}
        onChange={(v) => handleChange('pld_realiza_kyc', v)}
        required
      />
      {formData.pld_realiza_kyc === true && (
         <div className="p-3 bg-slate-50 border rounded-lg mt-2">
            <Label className="text-sm font-medium text-slate-700 mb-2 block">Qual o escopo da verificação?</Label>
            <div className="grid grid-cols-2 gap-2">
               {escopoKycOptions.map(opt => (
                  <div key={opt} className="flex items-center space-x-2">
                     <Checkbox 
                        id={`kyc_${opt}`} 
                        checked={(formData.pld_kyc_escopo || []).includes(opt)}
                        onCheckedChange={(c) => handleMultiSelect('pld_kyc_escopo', opt, c)}
                     />
                     <Label htmlFor={`kyc_${opt}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
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
            <Label className="text-sm font-medium text-slate-700">Frequência de re-verificação</Label>
            <SelectionButton
               options={[
                  {value: 'continuo', label: 'Contínuo/tempo real'},
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

      <Separator className="my-6" />

      {/* 8C. Monitoramento de Transações */}
      <h3 className="font-semibold text-slate-800 mb-2">8C. Monitoramento de Transações</h3>
      
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
            
            <div className="p-3 bg-slate-50 border rounded-lg">
               <Label className="text-sm font-medium text-slate-700 mb-2 block">Quais alertas são monitorados?</Label>
               <div className="grid grid-cols-2 gap-2">
                  {alertasMonitoradosOptions.map(opt => (
                     <div key={opt} className="flex items-center space-x-2">
                        <Checkbox 
                           id={`mon_${opt}`} 
                           checked={(formData.pld_mon_alertas || []).includes(opt)}
                           onCheckedChange={(c) => handleMultiSelect('pld_mon_alertas', opt, c)}
                        />
                        <Label htmlFor={`mon_${opt}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
                     </div>
                  ))}
               </div>
            </div>

            <div className="space-y-2">
               <Label className="text-sm font-medium text-slate-700">Prazo médio para análise de alertas</Label>
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

      <Separator className="my-6" />

      {/* 8D. Governança */}
      <h3 className="font-semibold text-slate-800 mb-2">8D. Governança</h3>
      
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
            <Label className="text-sm font-medium text-slate-700">Frequência das auditorias</Label>
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