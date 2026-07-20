import React from 'react';
import {
  FlowchartContainer, TerminalNode, ProcessNode, DecisionNode, DataNode,
  SubProcessNode, ArrowDown, BranchSplit, MicroStep
} from './FlowchartPrimitives';
import { Stamp } from 'lucide-react';

export default function FlowContrato() {
  return (
    <FlowchartContainer
      title="Fluxo 6 — Geração e Assinatura de Contrato"
      description="Pré-geração por IA, revisão pelo time e assinatura digital pelo cliente"
      actor="IA → Time Comercial → Cliente"
      icon={Stamp}
      color="border-orange-200"
    >
      <div className="space-y-1">
        <TerminalNode label="INÍCIO — Proposta aceita + Compliance aprovado" />
        <ArrowDown />

        <ProcessNode label="Comercial acessa 'Criar Contrato'" sublabel="Seleciona Lead + Proposta vinculada" actor="Comercial" />
        <ArrowDown />

        <SubProcessNode label="IA Pré-Gera Contrato (preGenerateContract)" sublabel="Analisa Lead + Proposal + Merchant → preenche campos automaticamente" />
        <MicroStep steps={['Busca Lead', 'Busca Proposal', 'Busca Merchant', 'Busca OnboardingCase', 'Extrai dados cliente', 'Extrai taxas', 'Extrai módulos', 'Mapeia campos', 'Gera contrato']} />
        <ArrowDown />

        <DataNode label="Contract criado com status: pre_generated" sublabel="Campos preenchidos + lista de missingFields + preFilledFields" />
        <ArrowDown />

        <ProcessNode label="Revisar dados do contratante" sublabel="Razão Social, CNPJ, Endereço, Cidade, UF, CEP, Representante Legal, CPF" actor="Comercial" highlight />
        <ArrowDown />

        <ProcessNode label="Revisar módulos contratados" sublabel="Conta Pagamento, Subadquirência Cartão, PIX Recebimentos, PIX Pagamentos, Boleto, Gateway" actor="Comercial" />
        <ArrowDown />

        <ProcessNode label="Revisar taxas comerciais" sublabel="Tabela completa de taxas (espelho da proposta)" actor="Comercial" />
        <ArrowDown />

        <ProcessNode label="Configurar SLAs" sublabel="Uptime, tempo resposta, SLA por severidade (Crítico, Alto, Médio, Baixo)" actor="Comercial" />
        <ArrowDown />

        <ProcessNode label="Configurar reserva de risco" sublabel="PIX: % + dias retenção | Cartão: % + dias + liberação parcial" actor="Comercial" />
        <ArrowDown />

        <ProcessNode label="Preencher dados bancários" sublabel="Instituição, agência, conta, tarifas (manutenção, saque, TED, cartão)" actor="Comercial" />
        <ArrowDown />

        <ProcessNode label="Cláusulas customizadas (opcional)" sublabel="Texto livre + sugestões internas do time" actor="Comercial" />
        <ArrowDown />

        <ProcessNode label="Preencher assinaturas" sublabel="Representante Pin Bank + Cliente + 2 testemunhas (nomes + CPFs)" actor="Comercial" />
        <ArrowDown />

        <DecisionNode label="Contrato completo?" />
        <BranchSplit leftLabel="Sim" rightLabel="Campos faltantes" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <ProcessNode label="Alterar status → ready" sublabel="Contrato pronto para envio" actor="Comercial" />
            <ArrowDown />
            <ProcessNode label="Enviar contrato" sublabel="Status → sent, gera link público /ContratoPublico?code=xxx" actor="Comercial" />
          </div>
          <ProcessNode label="Salvar e completar depois" sublabel="Status permanece under_review" actor="Comercial" />
        </div>
        <ArrowDown />

        <ProcessNode label="Cliente acessa link público" sublabel="Visualiza contrato completo: 27 cláusulas + anexos + taxas" actor="Cliente" />
        <MicroStep steps={['Cláusulas 1-4: Objeto e Definições', 'Cláusulas 5-9: Obrigações', 'Cláusulas 10-14: Pagamentos', 'Cláusulas 15-27: Gerais', 'Anexo I: Taxas', 'Anexo II: SLAs']} />
        <ArrowDown />

        <DecisionNode label="Cliente assina?" />
        <BranchSplit leftLabel="Sim" rightLabel="Não" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <ProcessNode label="Assinatura digital" sublabel="Status → signed, signedDate registrado" actor="Cliente" />
            <ArrowDown />
            <DataNode label="AuditLog + Merchant atualizado" sublabel="Fluxo completo de credenciamento concluído" />
          </div>
          <ProcessNode label="Contrato não assinado" sublabel="Segue como 'sent' até ação" actor="—" />
        </div>
        <ArrowDown />

        <TerminalNode label="FIM — Contrato assinado" type="end" />
      </div>
    </FlowchartContainer>
  );
}