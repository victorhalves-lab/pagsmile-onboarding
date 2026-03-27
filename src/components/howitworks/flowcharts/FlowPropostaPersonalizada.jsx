import React from 'react';
import {
  FlowchartContainer, TerminalNode, ProcessNode, DecisionNode, DataNode,
  SubProcessNode, ArrowDown, BranchSplit, MicroStep, ParallelGroup
} from './FlowchartPrimitives';
import { FileText } from 'lucide-react';

export default function FlowPropostaPersonalizada() {
  return (
    <FlowchartContainer
      title="Fluxo 2 — Proposta Personalizada (Completa)"
      description="Criação, configuração de taxas, envio, aceite/recusa e versionamento"
      actor="Time Comercial → Cliente"
      icon={FileText}
      color="border-emerald-200"
    >
      <div className="space-y-1">
        <TerminalNode label="INÍCIO — Comercial abre 'Criar Proposta'" />
        <ArrowDown />

        <ProcessNode label="Selecionar Lead do pipeline" sublabel="Dados pré-preenchidos: nome, CNPJ, contato, MCC" actor="Comercial" />
        <ArrowDown />

        <ProcessNode label="Configurar tipo de negócio" sublabel="MERCHAN / GATEWAY / MARKETPLACE" actor="Comercial" />
        <ArrowDown />

        <ProcessNode label="Selecionar Parceiro Adquirente" sublabel="Lista de Partners ativos — define limites mínimos de taxa" actor="Comercial" />
        <ArrowDown />

        <ProcessNode label="Configurar Taxas de Cartão por Bandeira" sublabel="Visa, Mastercard, Elo, Amex, Outras × 4 faixas" actor="Comercial" highlight />
        <MicroStep steps={['À Vista (1x)', '2-6x', '7-12x', '13-21x']} />
        <ArrowDown />

        <ProcessNode label="Configurar Débito por Bandeira" sublabel="Visa, Mastercard, Elo, Outras" actor="Comercial" />
        <ArrowDown />

        <ParallelGroup>
          <ProcessNode label="PIX" sublabel="Tipo (% ou R$) + Valor" actor="Comercial" />
          <ProcessNode label="Boleto" sublabel="Valor por boleto (R$)" actor="Comercial" />
          <ProcessNode label="Fees" sublabel="Transação + Antifraude + 3DS" actor="Comercial" />
        </ParallelGroup>
        <ArrowDown />

        <ProcessNode label="Configurar Antecipação" sublabel="Taxa mensal (%) + prazo (D+N)" actor="Comercial" />
        <ArrowDown />

        <ProcessNode label="TPV Mínimo Garantido" sublabel="Mês 1, Mês 2, Mês 3+ + Setup (R$)" actor="Comercial" />
        <ArrowDown />

        <SubProcessNode label="Validação de Limites vs Custo Parceiro" sublabel="Alerta visual quando taxa < custo do parceiro por bandeira/faixa" />
        <ArrowDown />

        <SubProcessNode label="Cálculo de Rentabilidade (Drawer)" sublabel="Receita MDR + Antecipação + Fees vs Custo Parceiro → Margem" />
        <MicroStep steps={['Input TPV base', 'Calcula receita MDR', 'Calcula receita antecipação', 'Calcula receita fees', 'Subtrai custo parceiro', 'Margem % final']} />
        <ArrowDown />

        <ProcessNode label="Preview em tempo real" sublabel="Visualização lado a lado da proposta como o cliente verá" actor="Comercial" highlight />
        <ArrowDown />

        <DecisionNode label="Salvar como?" />
        <BranchSplit leftLabel="Rascunho" rightLabel="Gerar (Enviar)" />
        <div className="grid grid-cols-2 gap-3">
          <ProcessNode label="Salvar Rascunho" sublabel="Status: rascunho — editável depois" actor="Comercial" />
          <div className="space-y-1">
            <ProcessNode label="Gerar Proposta" sublabel="Status: enviada — gera token público + link" actor="Comercial" />
            <ArrowDown />
            <DataNode label="AuditLog + LeadActivity criados" sublabel="Lead atualizado para 'proposta_enviada'" />
          </div>
        </div>
        <ArrowDown />

        <ProcessNode label="Copiar link público e enviar ao cliente" sublabel="URL: /PropostaPublica?token=xxx" actor="Comercial" />
        <ArrowDown />

        <ProcessNode label="Cliente abre a proposta" sublabel="Sistema registra visualização + notifica Slack" actor="Cliente" />
        <ArrowDown />

        <DecisionNode label="Decisão do cliente?" />
        <div className="grid grid-cols-3 gap-2 mt-1">
          <div className="space-y-1">
            <ProcessNode label="✅ Aceitar" sublabel="Aceite digital com termos" actor="Cliente" />
            <ArrowDown />
            <DataNode label="Status → aceita" sublabel="Lead → proposta_aceita" />
          </div>
          <div className="space-y-1">
            <ProcessNode label="🔄 Contraproposta" sublabel="Cliente sugere alterações de taxas" actor="Cliente" />
            <ArrowDown />
            <DataNode label="Status → contraproposta" sublabel="Detalhes salvos em counterProposalDetails" />
          </div>
          <div className="space-y-1">
            <ProcessNode label="❌ Recusar" sublabel="Cliente informa motivo" actor="Cliente" />
            <ArrowDown />
            <DataNode label="Status → recusada" sublabel="rejectedReason registrado" />
          </div>
        </div>
        <ArrowDown />

        <DecisionNode label="Criar nova versão?" />
        <BranchSplit leftLabel="Sim" rightLabel="Não" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <ProcessNode label="Nova Versão (V2, V3...)" sublabel="Copia taxas → marca anterior como não-atual" actor="Comercial" />
            <MicroStep steps={['Copia dados', 'Novo código', 'Novo token', 'version++', 'previousVersionId = old.id', 'old.isCurrentVersion = false']} />
          </div>
          <ProcessNode label="Fluxo encerrado" sublabel="Proposta permanece no status final" actor="—" />
        </div>
        <ArrowDown />

        <TerminalNode label="FIM" type="end" />
      </div>
    </FlowchartContainer>
  );
}