import React from 'react';
import {
  FlowchartContainer, TerminalNode, ProcessNode, DecisionNode, DataNode,
  ArrowDown, BranchSplit, MicroStep, SubProcessNode
} from './FlowchartPrimitives';
import { UserPlus } from 'lucide-react';

export default function FlowIntroducer() {
  return (
    <FlowchartContainer
      title="Fluxo 7 — Introducer & Landing Page"
      description="Cadastro de parceiro, configuração de landing page, captação de leads e acompanhamento"
      actor="Admin → Introducer → Lead"
      icon={UserPlus}
      color="border-violet-200"
    >
      <div className="space-y-1">
        <TerminalNode label="INÍCIO — Admin cadastra novo Introducer" />
        <ArrowDown />

        <DecisionNode label="Tipo de Introducer?" />
        <BranchSplit leftLabel="Individual (CPF)" rightLabel="Empresa (CNPJ)" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <ProcessNode label="Cadastro Individual" sublabel="Nome, CPF, e-mail, telefone, comissão %" actor="Admin" />
            <ArrowDown />
            <ProcessNode label="Gerar referralCode" sublabel="Código UTM único (ex: joaosilva)" actor="Sistema" />
          </div>
          <div className="space-y-1">
            <ProcessNode label="Cadastro Empresa" sublabel="Nome, CNPJ, Logo, Razão Social, e-mail, telefone" actor="Admin" />
            <ArrowDown />
            <ProcessNode label="Configurar Landing Page" sublabel="Slug único (/parceiro/slug), logo, ativar landing page" actor="Admin" highlight />
            <ArrowDown />
            <ProcessNode label="Configurar taxas por segmento" sublabel="StandardRatesEditor: MDR, PIX, fees, antecipação por segmento" actor="Admin" />
            <MicroStep steps={['Educação', 'Infoprodutos', 'E-commerce', 'SaaS', 'Gateway', 'Marketplace']} />
          </div>
        </div>
        <ArrowDown />

        <DataNode label="Introducer criado na base" sublabel="Entidade Introducer com referralCode, tipo, landing page config" />
        <ArrowDown />

        <ProcessNode label="Admin copia link da Landing Page" sublabel="GestaoLandingPages: copiar /parceiro/{slug}" actor="Admin" />
        <ArrowDown />

        <ProcessNode label="Introducer divulga o link" sublabel="Envia para sua rede de contatos e clientes" actor="Introducer" />
        <ArrowDown />

        <div className="border-2 border-dashed border-violet-200 rounded-xl p-4 bg-violet-50/30">
          <p className="text-[9px] font-bold text-violet-600 uppercase text-center mb-2">Jornada do Lead na Landing Page</p>
          <div className="space-y-1">
            <ProcessNode label="Lead acessa /parceiro/:slug" sublabel="Página co-branded: logo parceiro + logo Pagsmile" actor="Lead" />
            <ArrowDown />
            <ProcessNode label="Visualiza taxas por segmento" sublabel="SegmentRatesTable: MDR, PIX, fees por segmento" actor="Lead" />
            <ArrowDown />
            <ProcessNode label="Usa calculadora interativa" sublabel="RateCalculator: simula custo de transação cartão e PIX" actor="Lead" />
            <ArrowDown />
            <ProcessNode label="Clica CTA → Questionário" sublabel="Redireciona para LeadQuestionnaire com ref={referralCode}" actor="Lead" />
            <ArrowDown />
            <ProcessNode label="Lead preenche questionário" sublabel="Dados automaticamente vinculados ao Introducer (introducerId)" actor="Lead" />
            <ArrowDown />
            <DataNode label="Lead criado com introducerId + introducerReferralCode" sublabel="Vinculação automática via URL ref parameter" />
          </div>
        </div>
        <ArrowDown />

        <ProcessNode label="Admin monitora performance" sublabel="GestaoIntroducers: KPIs por parceiro, leads gerados, conversão" actor="Admin" />
        <ArrowDown />

        <ProcessNode label="Introducer acessa portal" sublabel="IntroducerDashboard: KPIs, leads indicados, status, performance" actor="Introducer" />
        <ArrowDown />

        <TerminalNode label="FIM — Ciclo contínuo de indicação" type="end" />
      </div>
    </FlowchartContainer>
  );
}