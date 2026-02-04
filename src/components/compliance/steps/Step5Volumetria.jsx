import React from 'react';
import { TrendingUp } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';

export default function Step5Volumetria({ formData, handleChange }) {
  return (
    <FormSection
      title="Volumetria Financeira"
      subtitle="Estimativas de transações e movimentações."
      icon={TrendingUp}
    >
      <FormField
        label="Volume Mensal Estimado"
        required
        value={formData.volumeMensalEstimado}
        onChange={(value) => handleChange('volumeMensalEstimado', value)}
        placeholder="R$ 0,00"
        helpText="Valor total estimado das transações que sua empresa processará por mês."
      />
      
      <FormField
        label="Ticket Médio"
        required
        value={formData.ticketMedio}
        onChange={(value) => handleChange('ticketMedio', value)}
        placeholder="R$ 0,00"
        helpText="Valor médio de cada transação."
      />
      
      <FormField
        label="Quantidade de Transações Mensais"
        required
        type="number"
        value={formData.qtdTransacoesMensal}
        onChange={(value) => handleChange('qtdTransacoesMensal', value)}
        placeholder="Ex: 1000"
      />
      
      <FormField
        label="Faturamento Anual"
        value={formData.faturamentoAnual}
        onChange={(value) => handleChange('faturamentoAnual', value)}
        placeholder="R$ 0,00"
      />
    </FormSection>
  );
}