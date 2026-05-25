import React from 'react';
import { FileText } from 'lucide-react';
import StubSection from './StubSection';

export default function GlobalProposalCenter() {
  return (
    <StubSection
      title="Propostas Globais"
      subtitle="Listagem com filtros, ações: editar, duplicar, histórico de versões, copiar link público, download PDF/PNG."
      phase={2}
      icon={FileText}
    />
  );
}