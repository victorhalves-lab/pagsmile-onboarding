import React from 'react';
import { Columns3 } from 'lucide-react';
import StubSection from './StubSection';

export default function GlobalPipelineKanban() {
  return (
    <StubSection
      title="Pipeline Kanban (Global)"
      subtitle="5 colunas (Leads, Proposta Enviada, Aceita, Contraproposta, Perdida) com drag-and-drop e KPIs por coluna."
      phase={2}
      icon={Columns3}
    />
  );
}