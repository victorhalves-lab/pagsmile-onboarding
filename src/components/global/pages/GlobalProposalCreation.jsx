import React from 'react';
import { FileText } from 'lucide-react';
import StubSection from './StubSection';

export default function GlobalProposalCreation() {
  return (
    <StubSection
      title="Criar Proposta Global"
      subtitle="Editor completo: MCCs, mercados, seletor de interchange (Visa/Mastercard low/avg/high/custom), markup, fees, rolling reserve."
      phase={2}
      icon={FileText}
    />
  );
}