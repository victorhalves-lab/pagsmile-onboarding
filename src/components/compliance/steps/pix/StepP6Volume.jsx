import React from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import FormSection from '../../FormSection';
import FormField from '../../FormField';

export default function StepP6Volume({ formData, handleChange }) {
  return (
    <FormSection
      title="Volume de Transações"
      subtitle="Estimativas de volume financeiro."
      icon={TrendingUp}
    >
      <FormField
        label="Estimativa de Volume/Mês (R$)"
        type="number"
        value={formData.volumeMensalEstimado}
        onChange={(val) => handleChange('volumeMensalEstimado', val)}
        placeholder="Ex: 100000"
        icon={DollarSign}
      />

      <FormField
        label="Ticket Médio (R$)"
        type="number"
        value={formData.ticketMedio}
        onChange={(val) => handleChange('ticketMedio', val)}
        placeholder="Ex: 150"
        icon={DollarSign}
      />

      <FormField
        label="Site Corporativo"
        value={formData.siteCorporativo}
        onChange={(val) => handleChange('siteCorporativo', val)}
        placeholder="https://www.empresa.com.br"
      />

      <FormField
        label="URL do Produto/App (opcional)"
        value={formData.urlProduto}
        onChange={(val) => handleChange('urlProduto', val)}
        placeholder="https://..."
      />
    </FormSection>
  );
}