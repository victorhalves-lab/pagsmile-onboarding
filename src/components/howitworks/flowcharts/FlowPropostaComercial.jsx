import React from 'react';
import { StartEndNode, ProcessNode, DecisionNode, DataNode, IANode, Arrow, BranchLabel, ResponsibleBadge, SubprocessNode } from './FlowchartNode';

export default function FlowPropostaComercial() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="font-bold text-[#0A0A0A] text-sm">Fluxo 2: Criação e Gestão de Propostas Comerciais</h4>
          <p className="text-[10px] text-[#0A0A0A]/50">Da seleção do lead até o aceite/recusa pelo cliente</p>
        </div>
        <div className="flex gap-1.5">
          <ResponsibleBadge label="Time Comercial" color="bg-blue-600" />
          <ResponsibleBadge label="Cliente" color="bg-[#1356E2]" />
          <ResponsibleBadge label="Sistema" color="bg-slate-600" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-6 overflow-x-auto">
        <div className="flex flex-col items-center min-w-[400px]">
          <StartEndNode label="INÍCIO — Lead Qualificado" />
          <Arrow />

          <DecisionNode label="Tipo de Proposta?" />
          <div className="flex items-start gap-6 mt-2">
            {/* Personalizada */}
            <div className="flex flex-col items-center border-l-2 border-emerald-200 pl-4">
              <BranchLabel label="Personalizada" color="text-emerald-600" />
              <Arrow />
              <ProcessNode label="Selecionar Lead" sublabel="Pré-preenche dados do cliente" borderColor="border-emerald-200" />
              <Arrow />
              <SubprocessNode label="Configurar Taxas (CriarProposta)" items={[
                "Cartão: Visa/Master/Elo/Amex/Outras × 4 faixas",
                "Débito por bandeira",
                "PIX (% ou R$), Boleto, Fee Transação",
                "Antifraude, 3DS, Setup, Antecipação",
                "TPV Mínimo Garantido (3 meses)",
                "Alerta Pré-Chargeback"
              ]} />
              <Arrow />
              <ProcessNode label="Selecionar Parceiro Adquirente" sublabel="Validação limites: alerta se taxa < custo" borderColor="border-emerald-200" />
              <Arrow />
              <ProcessNode label="Simulador Rentabilidade" sublabel="Receita MDR + Antecipação + Fees vs Custo Parceiro" borderColor="border-emerald-200" />
              <Arrow />
              <ProcessNode label="Preview em Tempo Real" sublabel="Visualização como o cliente verá" borderColor="border-emerald-200" />
            </div>

            {/* Padrão */}
            <div className="flex flex-col items-center border-l-2 border-blue-200 pl-4">
              <BranchLabel label="Padrão Segmento" color="text-blue-600" />
              <Arrow />
              <DecisionNode label="Link Rápido?" sublabel="Existe proposta default?" />
              <div className="flex items-start gap-4 mt-1">
                <div className="flex flex-col items-center">
                  <BranchLabel label="Sim" color="text-green-600" />
                  <Arrow />
                  <ProcessNode label="Copiar Link Rápido" sublabel="SegmentQuickLinks: 1 clique" borderColor="border-green-200" color="bg-green-50" />
                  <Arrow label="Pular p/ envio" />
                </div>
                <div className="flex flex-col items-center">
                  <BranchLabel label="Não / Nova" color="text-amber-600" />
                  <Arrow />
                  <ProcessNode label="Selecionar Segmento" sublabel="6 segmentos disponíveis" borderColor="border-blue-200" />
                  <Arrow />
                  <ProcessNode label="Taxas Auto-preenchidas" sublabel="Valores padrão Pin Bank (readOnly)" borderColor="border-blue-200" />
                </div>
              </div>
            </div>

            {/* PIX */}
            <div className="flex flex-col items-center border-l-2 border-cyan-200 pl-4">
              <BranchLabel label="PIX" color="text-cyan-600" />
              <Arrow />
              <ProcessNode label="Dados do Cliente" sublabel="Nome, CNPJ, MCC, Contato" borderColor="border-cyan-200" />
              <Arrow />
              <ProcessNode label="Taxa PIX" sublabel="Tipo: % ou R$ fixo + Valor" borderColor="border-cyan-200" />
              <Arrow />
              <ProcessNode label="TPV Mínimo" sublabel="Mês 1, Mês 2, Mês 3+" borderColor="border-cyan-200" />
            </div>
          </div>

          <Arrow />
          <DecisionNode label="Salvar como?" />
          <div className="flex items-start gap-8 mt-1">
            <div className="flex flex-col items-center">
              <BranchLabel label="Rascunho" color="text-slate-500" />
              <Arrow />
              <DataNode label="Status: rascunho" sublabel="Pode editar depois" />
            </div>
            <div className="flex flex-col items-center">
              <BranchLabel label="Gerar" color="text-[#1356E2]" />
              <Arrow />
              <DataNode label="Status: enviada" sublabel="Gera código + token público" />
            </div>
          </div>

          <Arrow />
          <ProcessNode label="Copiar Link Público" sublabel="/PropostaPublica?token=xxx ou /PropostaPadraoPublica ou /PropostaPixPublica" />
          <Arrow />
          <ProcessNode label="Enviar ao Cliente" sublabel="WhatsApp, E-mail, SMS" borderColor="border-green-200" />
          <Arrow />

          <div className="flex items-center gap-2 mb-1">
            <div className="h-px bg-[#1356E2] w-16" />
            <span className="text-[9px] text-[#1356E2] font-bold">AÇÃO DO CLIENTE</span>
            <div className="h-px bg-[#1356E2] w-16" />
          </div>

          <ProcessNode label="Cliente Abre Link" sublabel="Status → visualizada (notifyProposalViewed)" borderColor="border-[#1356E2]" color="bg-emerald-50" />
          <Arrow />
          <DecisionNode label="Decisão do Cliente?" />
          <div className="flex items-start gap-8 mt-1">
            <div className="flex flex-col items-center">
              <BranchLabel label="Aceitar" color="text-green-600" />
              <Arrow />
              <DataNode label="Status: aceita" sublabel="acceptedDate registrada" />
              <Arrow />
              <ProcessNode label="notifyProposalAccepted" sublabel="Slack + Lead.status = proposta_aceita" borderColor="border-green-200" />
            </div>
            <div className="flex flex-col items-center">
              <BranchLabel label="Contraproposta" color="text-blue-600" />
              <Arrow />
              <DataNode label="Status: contraproposta" sublabel="counterProposalDetails salvo" />
            </div>
            <div className="flex flex-col items-center">
              <BranchLabel label="Recusar" color="text-red-600" />
              <Arrow />
              <DataNode label="Status: recusada" sublabel="rejectedReason registrado" />
            </div>
            <div className="flex flex-col items-center">
              <BranchLabel label="Expirar" color="text-slate-500" />
              <Arrow />
              <DataNode label="Status: expirada" sublabel="expireProposals (automação)" />
            </div>
          </div>

          <Arrow />
          <StartEndNode label="FIM — Pipeline Atualizado" color="bg-[#0A0A0A]" />
        </div>
      </div>
    </div>
  );
}