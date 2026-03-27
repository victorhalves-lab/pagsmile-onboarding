import React from 'react';
import { StartEndNode, ProcessNode, DecisionNode, DataNode, Arrow, BranchLabel, ResponsibleBadge, SubprocessNode } from './FlowchartNode';

export default function FlowIntroducerLanding() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="font-bold text-[#002443] text-sm">Fluxo 5: Introducer & Landing Page</h4>
          <p className="text-[10px] text-[#002443]/50">Do cadastro do parceiro até a captação de leads via landing page co-branded</p>
        </div>
        <div className="flex gap-1.5">
          <ResponsibleBadge label="Admin" color="bg-[#002443]" />
          <ResponsibleBadge label="Introducer" color="bg-purple-600" />
          <ResponsibleBadge label="Prospect" color="bg-[#2bc196]" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 overflow-x-auto">
        <div className="flex flex-col items-center min-w-[400px]">
          <StartEndNode label="INÍCIO — Cadastro do Introducer" />
          <Arrow />

          <DecisionNode label="Tipo de Introducer?" />
          <div className="flex items-start gap-8 mt-1">
            <div className="flex flex-col items-center">
              <BranchLabel label="Individual" color="text-blue-600" />
              <Arrow />
              <ProcessNode label="Cadastrar PF" sublabel="Nome, CPF, e-mail, telefone, código UTM, comissão %" borderColor="border-blue-200" />
            </div>
            <div className="flex flex-col items-center">
              <BranchLabel label="Empresa" color="text-purple-600" />
              <Arrow />
              <ProcessNode label="Cadastrar PJ" sublabel="Nome Fantasia, CNPJ, Logo, E-mail, Telefone" borderColor="border-purple-200" />
              <Arrow />
              <SubprocessNode label="Configurar Landing Page" items={[
                "Slug personalizado (/parceiro/meu-parceiro)",
                "Upload de logo (PNG/SVG fundo branco)",
                "Taxas padrão por segmento (até 6 segmentos)",
                "Cada segmento: MDR × 4 faixas, antecipação, fees, PIX",
                "Ativar/Desativar landing page (landingPageActive)"
              ]} />
            </div>
          </div>
          <Arrow />

          <DataNode label="Introducer Criado" sublabel="referralCode gerado (ex: agenciax)" />
          <Arrow />

          <ProcessNode label="Gerenciar via GestaoLandingPages" sublabel="4 KPIs, tabela com toggle, copiar link, preview" />
          <Arrow />

          <ProcessNode label="Copiar Link da Landing Page" sublabel="URL: /parceiro/{slug}" />
          <Arrow />

          <div className="flex items-center gap-2 mb-1">
            <div className="h-px bg-[#2bc196] w-16" />
            <span className="text-[9px] text-[#2bc196] font-bold">PROSPECT ACESSA A LANDING PAGE</span>
            <div className="h-px bg-[#2bc196] w-16" />
          </div>

          <ProcessNode label="LandingHeader" sublabel="Logo Pagsmile + Logo Parceiro co-branded" borderColor="border-[#2bc196]" color="bg-emerald-50" />
          <Arrow />

          <SubprocessNode label="Conteúdo da Landing Page" items={[
            "Tabela de taxas por segmento (SegmentRatesTable)",
            "Tabs: E-commerce, Educação, Infoprodutos, SaaS, etc.",
            "Cada tab: MDR 1x, 2-6x, 7-12x, 13-21x, Antecipação, Fee, Antifraude, 3DS, PIX",
            "Calculadora de taxas (RateCalculator): simula custo real",
            "Disclaimer de compliance (ComplianceDisclaimer)"
          ]} />
          <Arrow />

          <ProcessNode label="Prospect Clica 'Solicitar Proposta'" sublabel="CTA → /LeadQuestionnaire?ref={referralCode}" borderColor="border-[#2bc196]" color="bg-emerald-50" />
          <Arrow />

          <ProcessNode label="Questionário Lead Preenchido" sublabel="Lead criado com introducerId + introducerReferralCode" />
          <Arrow />

          <DataNode label="Lead vinculado ao Introducer" sublabel="Aparece no IntroducerDashboard + KPIs" />
          <Arrow />

          <ProcessNode label="Introducer Acompanha" sublabel="IntroducerDashboard: KPIs, leads gerados, status, performance" borderColor="border-purple-200" />
          <Arrow />

          <StartEndNode label="FIM — Lead no Pipeline Vinculado" color="bg-[#002443]" />
        </div>
      </div>
    </div>
  );
}