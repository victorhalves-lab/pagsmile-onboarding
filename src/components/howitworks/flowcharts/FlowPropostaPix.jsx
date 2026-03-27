import React from 'react';
import {
  FlowchartContainer, TerminalNode, ProcessNode, DecisionNode, DataNode,
  ArrowDown, BranchSplit, MicroStep, ParallelGroup
} from './FlowchartPrimitives';
import { Banknote } from 'lucide-react';

export default function FlowPropostaPix() {
  return (
    <FlowchartContainer
      title="Fluxo 4 — Proposta PIX"
      description="Criação de proposta exclusiva PIX com taxa, TPV mínimo, versionamento e aceite"
      actor="Time Comercial → Cliente"
      icon={Banknote}
      color="border-cyan-200"
    >
      <div className="space-y-1">
        <TerminalNode label="INÍCIO — Comercial abre 'Nova Proposta PIX'" />
        <ArrowDown />

        <DecisionNode label="Vincular a lead existente?" />
        <BranchSplit leftLabel="Sim" rightLabel="Não" />
        <div className="grid grid-cols-2 gap-3">
          <ProcessNode label="Selecionar lead (últimos 6)" sublabel="Dados pré-preenchidos: nome, CNPJ, MCC, contato" actor="Comercial" />
          <ProcessNode label="Preencher dados manualmente" sublabel="Nome empresa, CNPJ, MCC, contato" actor="Comercial" />
        </div>
        <ArrowDown />

        <ProcessNode label="Configurar Taxa PIX" sublabel="Escolher tipo (Percentual % ou Fixo R$) + valor" actor="Comercial" highlight />
        <MicroStep steps={['Select tipo', 'Input valor', 'Validação obrigatória']} />
        <ArrowDown />

        <ProcessNode label="Configurar TPV Mínimo Garantido" sublabel="3 campos: Mês 1 (R$), Mês 2 (R$), Mês 3+ (R$)" actor="Comercial" />
        <ArrowDown />

        <ProcessNode label="Card Resumo em tempo real" sublabel="Cliente, Taxa PIX, TPV Mín., CNPJ — preview visual" actor="Sistema" />
        <ArrowDown />

        <DecisionNode label="Salvar como?" />
        <BranchSplit leftLabel="Rascunho" rightLabel="Gerar Proposta" />
        <div className="grid grid-cols-2 gap-3">
          <ProcessNode label="Salvar Rascunho" sublabel="Status: rascunho — editável" actor="Comercial" />
          <div className="space-y-1">
            <ProcessNode label="Gerar Proposta" sublabel="Validação: nome + CNPJ (14 dígitos) + taxa PIX obrigatórios" actor="Sistema" />
            <ArrowDown />
            <DataNode label="PixProposal criada" sublabel="Status: enviada + token público + código PIX-YYYY-NNNNN" />
            <ArrowDown />
            <DataNode label="AuditLog + LeadActivity" sublabel="Lead.status → proposta_enviada" />
          </div>
        </div>
        <ArrowDown />

        <ProcessNode label="Copiar link → enviar ao cliente" sublabel="/PropostaPixPublica?token=xxx" actor="Comercial" />
        <ArrowDown />

        <ProcessNode label="Cliente visualiza proposta PIX" sublabel="Taxa PIX, TPV mínimo, dados da empresa, termos" actor="Cliente" />
        <ArrowDown />

        <DecisionNode label="Decisão do cliente?" />
        <div className="grid grid-cols-3 gap-2 mt-1">
          <ProcessNode label="✅ Aceitar" sublabel="Aceite digital" actor="Cliente" />
          <ProcessNode label="🔄 Contraproposta" sublabel="Sugere alteração" actor="Cliente" />
          <ProcessNode label="❌ Recusar" sublabel="Informa motivo" actor="Cliente" />
        </div>
        <ArrowDown />

        <DecisionNode label="Necessita nova versão?" />
        <BranchSplit leftLabel="Sim (V2, V3...)" rightLabel="Não" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <ProcessNode label="Criar Nova Versão" sublabel="Copia dados, novo código, marca anterior como não-atual" actor="Comercial" />
            <MicroStep steps={['Copia rates', 'Novo PIX-YYYY-NNNNN', 'Novo token', 'version++', 'old.isCurrentVersion=false']} />
          </div>
          <ProcessNode label="Ou duplicar independente" sublabel="Cópia sem lineage — proposta nova" actor="Comercial" />
        </div>
        <ArrowDown />

        <TerminalNode label="FIM" type="end" />
      </div>
    </FlowchartContainer>
  );
}