import React from 'react';
import {
  FlowchartContainer, TerminalNode, ProcessNode, DecisionNode, DataNode,
  SubProcessNode, ArrowDown, BranchSplit, MicroStep
} from './FlowchartPrimitives';
import { RefreshCw } from 'lucide-react';

export default function FlowRevalidacao() {
  return (
    <FlowchartContainer
      title="Fluxo 9 — Revalidação Periódica de Compliance"
      description="Ciclo de recertificação de merchants aprovados"
      actor="Sistema → Analista → Merchant"
      icon={RefreshCw}
      color="border-amber-200"
    >
      <div className="space-y-1">
        <TerminalNode label="INÍCIO — Trigger de revalidação" />
        <ArrowDown />

        <DecisionNode label="Qual tipo de trigger?" />
        <div className="grid grid-cols-4 gap-2 mt-1">
          <ProcessNode label="Periódica" sublabel="Agenda (6m, 12m, 24m)" actor="Sistema" />
          <ProcessNode label="Baseada em risco" sublabel="Score abaixo do threshold" actor="Sistema" />
          <ProcessNode label="Regulatória" sublabel="Mudança normativa BACEN" actor="Sistema" />
          <ProcessNode label="Manual" sublabel="Analista solicita" actor="Analista" />
        </div>
        <ArrowDown />

        <DataNode label="RevalidationSchedule criado/atualizado" sublabel="Status: pendente, merchantId, tipo, próxima data" />
        <ArrowDown />

        <ProcessNode label="Sistema envia notificação" sublabel="E-mail + alerta interno para o analista responsável" actor="Sistema" />
        <ArrowDown />

        <ProcessNode label="Merchant recebe link de atualização" sublabel="Novo questionário parcial (apenas perguntas que mudaram)" actor="Merchant" />
        <ArrowDown />

        <ProcessNode label="Merchant preenche atualizações" sublabel="Novos documentos, dados atualizados, novas declarações" actor="Merchant" />
        <ArrowDown />

        <SubProcessNode label="IA SENTINEL re-analisa" sublabel="3 fases aplicadas nos dados atualizados" />
        <MicroStep steps={['Re-score questionário', 'Re-query BigDataCorp', 'Re-check sanções', 'Consolidação', 'Novo ComplianceScore']} />
        <ArrowDown />

        <DecisionNode label="Resultado da revalidação?" />
        <div className="grid grid-cols-3 gap-2 mt-1">
          <ProcessNode label="✅ Renovado" sublabel="Score aceitável — merchant continua ativo" actor="Sistema" />
          <ProcessNode label="🔍 Revisão Manual" sublabel="Analista precisa revisar mudanças" actor="Analista" />
          <ProcessNode label="❌ Suspenso" sublabel="Score abaixo do mínimo — merchant suspenso" actor="Sistema" />
        </div>
        <ArrowDown />

        <DataNode label="RevalidationSchedule atualizado" sublabel="Status: completed + próximo agendamento calculado" />
        <ArrowDown />

        <ProcessNode label="AuditLog registrado" sublabel="Tipo: VALIDATION, detalhes do resultado" actor="Sistema" />
        <ArrowDown />

        <TerminalNode label="FIM — Ciclo de revalidação concluído" type="end" />
      </div>
    </FlowchartContainer>
  );
}