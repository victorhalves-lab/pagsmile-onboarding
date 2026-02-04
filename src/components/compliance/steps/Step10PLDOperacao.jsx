import React from 'react';
import { ShieldCheck } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';

export default function Step10PLDOperacao({ formData, handleChange }) {
  return (
    <FormSection
      title="PLD - Operação e Controles Internos"
      subtitle="Procedimentos da empresa para compliance e prevenção."
      icon={ShieldCheck}
    >
      <YesNoQuestion
        question="A empresa possui uma política formal e documentada de Prevenção à Lavagem de Dinheiro (PLD/FT)?"
        value={formData.pld_politica}
        onChange={(value) => handleChange('pld_politica', value)}
        detailValue={formData.pld_politica_detalhe}
        onDetailChange={(value) => handleChange('pld_politica_detalhe', value)}
        detailLabel="Descreva a política de PLD"
        detailPlaceholder="Descreva brevemente sua política de PLD/FT..."
        showDetailOn={true}
        required
      />

      <YesNoQuestion
        question="A empresa oferece treinamentos regulares sobre PLD/FT para seus colaboradores?"
        value={formData.pld_treinamento}
        onChange={(value) => handleChange('pld_treinamento', value)}
        detailValue={formData.pld_treinamento_detalhe}
        onDetailChange={(value) => handleChange('pld_treinamento_detalhe', value)}
        detailLabel="Descreva os treinamentos realizados"
        detailPlaceholder="Informe a frequência e tipo de treinamento oferecido..."
        showDetailOn={true}
        required
      />

      <YesNoQuestion
        question="A empresa possui procedimentos robustos de KYC (Know Your Customer) e KYB (Know Your Business) para seus próprios clientes?"
        value={formData.pld_kyc}
        onChange={(value) => handleChange('pld_kyc', value)}
        detailValue={formData.pld_kyc_detalhe}
        onDetailChange={(value) => handleChange('pld_kyc_detalhe', value)}
        detailLabel="Descreva os procedimentos de KYC/KYB"
        detailPlaceholder="Descreva os procedimentos utilizados para verificação de clientes..."
        showDetailOn={true}
        required
      />
    </FormSection>
  );
}