import React from 'react';
import {
  FlowchartContainer, TerminalNode, ProcessNode, DecisionNode, DataNode,
  SubProcessNode, ArrowDown, BranchSplit, MicroStep, ParallelGroup
} from './FlowchartPrimitives';
import { Inbox } from 'lucide-react';

export default function FlowLeadCaptacao() {
  return (
    <FlowchartContainer
      title="Fluxo 1 — Captação e Qualificação de Lead"
      description="Da chegada do lead via questionário até qualificação pela IA e entrada no pipeline"
      actor="Time Comercial + IA"
      icon={Inbox}
      color="border-green-200"
    >
      <div className="space-y-1">
        <TerminalNode label="INÍCIO — Lead acessa questionário" />
        <ArrowDown />

        <DecisionNode label="Qual canal de entrada?" />
        <BranchSplit leftLabel="Orgânico" rightLabel="Introducer" />
        <div className="grid grid-cols-2 gap-3">
          <ProcessNode label="Questionário Direto" sublabel="Link compartilhado pelo time ou acesso direto via site" actor="Lead" />
          <ProcessNode label="Landing Page do Parceiro" sublabel="/parceiro/:slug — com logo co-branded e taxas do parceiro" actor="Lead" />
        </div>
        <ArrowDown />

        <DecisionNode label="Qual tipo de questionário?" />
        <div className="flex gap-2 justify-center flex-wrap mt-1">
          <ProcessNode label="Lead Completo v2.0" sublabel="Autocomplete CNPJ → 14 campos pré-preenchidos" actor="Lead" className="flex-1 min-w-[140px]" />
          <ProcessNode label="Lead PIX" sublabel="Formulário simplificado focado em PIX" actor="Lead" className="flex-1 min-w-[140px]" />
          <ProcessNode label="Lead Simplificado" sublabel="Preenchido pelo time pós-reunião" actor="Comercial" className="flex-1 min-w-[140px]" />
        </div>
        <ArrowDown />

        <ProcessNode label="Preenchimento multi-step do questionário" sublabel="Auto-save a cada etapa, validação em tempo real, analytics por step" actor="Lead" highlight />
        <MicroStep steps={['Dados Empresa', 'CNPJ (autocomplete)', 'Tipo Negócio', 'Volume/TPV', 'Taxas Atuais', 'Expectativas', 'Contato', 'Revisão', 'Envio']} />
        <ArrowDown />

        <DataNode label="Lead criado na base" sublabel="Entidade Lead + LeadActivity (tipo: questionario_preenchido)" />
        <ArrowDown />

        <ProcessNode label="Vinculação automática ao Introducer" sublabel="Se URL tem ref=CODE → set introducerId + introducerReferralCode" actor="Sistema" />
        <ArrowDown />

        <SubProcessNode label="IA PRISCILA — Qualificação" sublabel="Score 0-100, risco (BAIXO → CRÍTICO), decisão" />
        <MicroStep steps={['Recebe dados Lead', 'Analisa volume/TPV', 'Avalia tipo negócio', 'Verifica MCC', 'Calcula score', 'Define risco', 'Gera sugestões']} />
        <ArrowDown />

        <SubProcessNode label="IA Lead Qualifier — Maturidade" sublabel="EXCELENTE → INSUFICIENTE (5 níveis)" />
        <MicroStep steps={['Completude dados', 'Qualidade respostas', 'Volume declarado', 'Expectativa vs mercado', 'Classificação final']} />
        <ArrowDown />

        <SubProcessNode label="IA Risco Avançado" sublabel="iaRiskScore 0-100, iaDecision, iaPriority, sugestões" />
        <ArrowDown />

        <ProcessNode label="Notificação Slack" sublabel="Bot envia msg no canal com dados do lead + scores" actor="Sistema" />
        <ArrowDown />

        <ProcessNode label="Lead aparece no Pipeline Kanban" sublabel="Coluna 'Leads' — com badges de score, risco e maturidade" actor="Comercial" highlight />
        <ArrowDown />

        <TerminalNode label="FIM — Lead pronto para contato comercial" type="end" />
      </div>
    </FlowchartContainer>
  );
}