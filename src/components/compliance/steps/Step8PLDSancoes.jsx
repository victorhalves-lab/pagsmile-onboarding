import React from 'react';
import { ShieldAlert } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';

export default function Step8PLDSancoes({ formData, handleChange }) {
  return (
    <FormSection
      title="PLD - Sanções e Listas Restritivas"
      subtitle="Verificação de envolvimento em listas de sanções."
      icon={ShieldAlert}
    >
      <YesNoQuestion
        question="A empresa ou seus sócios/administradores estão ou estiveram envolvidos em listas de sanções nacionais ou internacionais (OFAC, ONU, COAF, etc.)?"
        value={formData.sancoes_listas}
        onChange={(value) => handleChange('sancoes_listas', value)}
        detailValue={formData.sancoes_listas_detalhe}
        onDetailChange={(value) => handleChange('sancoes_listas_detalhe', value)}
        detailLabel="Detalhes sobre o envolvimento"
        detailPlaceholder="Por favor, forneça mais detalhes sobre o envolvimento em listas de sanções..."
        required
      />

      <YesNoQuestion
        question="A empresa possui operações ou relacionamentos comerciais com países ou jurisdições considerados de alto risco ou sancionados?"
        value={formData.sancoes_paises}
        onChange={(value) => handleChange('sancoes_paises', value)}
        detailValue={formData.sancoes_paises_detalhe}
        onDetailChange={(value) => handleChange('sancoes_paises_detalhe', value)}
        detailLabel="Quais países e tipo de operação"
        detailPlaceholder="Informe os países e o tipo de operação ou relacionamento..."
        required
      />

      <YesNoQuestion
        question="A empresa possui controles internos para identificar e prevenir transações com entidades ou indivíduos sob sanções?"
        value={formData.sancoes_controle}
        onChange={(value) => handleChange('sancoes_controle', value)}
        detailValue={formData.sancoes_controle_detalhe}
        onDetailChange={(value) => handleChange('sancoes_controle_detalhe', value)}
        detailLabel="Descreva os controles implementados"
        detailPlaceholder="Descreva os controles internos de prevenção..."
        showDetailOn={true}
        required
      />
    </FormSection>
  );
}