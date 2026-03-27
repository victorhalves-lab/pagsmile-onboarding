import React from 'react';
import {
  FlowchartContainer, TerminalNode, ProcessNode, DecisionNode, DataNode,
  SubProcessNode, ArrowDown, BranchSplit, MicroStep
} from './FlowchartPrimitives';
import { Users } from 'lucide-react';

export default function FlowSubseller() {
  return (
    <FlowchartContainer
      title="Fluxo 10 — Onboarding de Subseller / Subconta"
      description="Seller principal gera links para seus sub-merchants preencherem compliance"
      actor="Comercial → Seller → Subseller → IA"
      icon={Users}
      color="border-pink-200"
    >
      <div className="space-y-1">
        <TerminalNode label="INÍCIO — Seller aprovado precisa cadastrar subcontas" />
        <ArrowDown />

        <ProcessNode label="Admin acessa GerenciarSubsellerLinks" sublabel="Seleciona Merchant principal (seller)" actor="Comercial" />
        <ArrowDown />

        <ProcessNode label="Gerar link para subseller" sublabel="generateSubsellerLink: cria OnboardingLink com parentMerchantId" actor="Sistema" />
        <MicroStep steps={['Seleciona seller', 'Define template', 'Gera código único', 'Link pronto']} />
        <ArrowDown />

        <ProcessNode label="Seller envia link para subconta" sublabel="Cada subseller recebe link único de compliance" actor="Seller" />
        <ArrowDown />

        <ProcessNode label="Subseller acessa SubsellerQuestionnaire" sublabel="Formulário público vinculado ao seller via URL params" actor="Subseller" />
        <ArrowDown />

        <ProcessNode label="Preenchimento do questionário" sublabel="Dados da subconta: CNPJ, nome, atividade, volume, responsáveis" actor="Subseller" highlight />
        <MicroStep steps={['Identificação', 'Dados empresa', 'Atividade', 'Volume', 'Responsáveis', 'Confirmação']} />
        <ArrowDown />

        <DataNode label="Merchant criado (isSubseller=true)" sublabel="parentMerchantId = ID do seller principal" />
        <ArrowDown />

        <DataNode label="OnboardingCase criado (isSubsellerCase=true)" sublabel="Vinculado ao parentMerchantId" />
        <ArrowDown />

        <SubProcessNode label="IA SENTINEL analisa subconta" sublabel="Mesmo fluxo 3 fases do merchant principal" />
        <ArrowDown />

        <DecisionNode label="Resultado?" />
        <div className="grid grid-cols-3 gap-2 mt-1">
          <ProcessNode label="✅ Aprovado" sublabel="Subconta ativa sob o seller" actor="Sistema" />
          <ProcessNode label="🔍 Revisão Manual" sublabel="Analista verifica aba 'Subcontas' do caso" actor="Analista" />
          <ProcessNode label="❌ Recusado" sublabel="Subconta rejeitada" actor="Sistema" />
        </div>
        <ArrowDown />

        <ProcessNode label="Admin visualiza subcontas" sublabel="AnaliseDeCasos → Aba 'Subcontas': lista de subsellers + status" actor="Admin" />
        <ArrowDown />

        <TerminalNode label="FIM" type="end" />
      </div>
    </FlowchartContainer>
  );
}