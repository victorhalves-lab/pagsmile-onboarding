import React from 'react';
import { ClipboardList } from 'lucide-react';
import StubSection from './StubSection';

export default function GlobalQuestionnaireCenter() {
  return (
    <StubSection
      title="Questionários Recebidos (Global)"
      subtitle="Lista filtrável de questionários, modal de detalhes, ações: gerar proposta, exportar CSV, excluir."
      phase={2}
      icon={ClipboardList}
    />
  );
}