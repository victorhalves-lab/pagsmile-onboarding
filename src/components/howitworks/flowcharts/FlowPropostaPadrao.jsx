import React from 'react';
import {
  FlowchartContainer, TerminalNode, ProcessNode, DecisionNode, DataNode,
  SubProcessNode, ArrowDown, BranchSplit, MicroStep
} from './FlowchartPrimitives';
import { FileText } from 'lucide-react';

export default function FlowPropostaPadrao() {
  return (
    <FlowchartContainer
      title="Fluxo 3 — Proposta Padrão por Segmento + Links Rápidos"
      description="Criação de modelo com taxas fixas por segmento e compartilhamento via links rápidos"
      actor="Time Comercial"
      icon={FileText}
      color="border-blue-200"
    >
      <div className="space-y-1">
        <TerminalNode label="INÍCIO" />
        <ArrowDown />

        <DecisionNode label="Usar link rápido ou criar nova?" />
        <BranchSplit leftLabel="Link Rápido" rightLabel="Criar Nova" />

        <div className="grid grid-cols-2 gap-4">
          {/* Coluna esquerda: Link Rápido */}
          <div className="space-y-1 border-2 border-dashed border-blue-200 rounded-xl p-3 bg-blue-50/30">
            <p className="text-[9px] font-bold text-blue-600 uppercase text-center mb-2">Caminho Links Rápidos</p>
            <ProcessNode label="Acessar GestaoPropostasPadrao" sublabel="Seção 'Links Rápidos' no topo da página" actor="Comercial" highlight />
            <ArrowDown />
            <ProcessNode label="Localizar card do segmento" sublabel="6 cards: E-commerce, Educação, Infoprodutos, SaaS, Gateway, Marketplace" actor="Comercial" />
            <MicroStep steps={['Identifica proposta ativa', 'isDefaultForSegment = true', 'Status = ativa']} />
            <ArrowDown />
            <ProcessNode label="Clicar 'Copiar Link'" sublabel="URL copiada para clipboard instantaneamente" actor="Comercial" highlight />
            <ArrowDown />
            <ProcessNode label="Enviar link ao cliente" sublabel="/PropostaPadraoPublica?token=xxx" actor="Comercial" />
            <ArrowDown />
            <TerminalNode label="FIM — Link compartilhado" type="end" />
          </div>

          {/* Coluna direita: Criar Nova */}
          <div className="space-y-1 border-2 border-dashed border-emerald-200 rounded-xl p-3 bg-emerald-50/30">
            <p className="text-[9px] font-bold text-emerald-600 uppercase text-center mb-2">Caminho Criar Nova</p>
            <ProcessNode label="Abrir CriarPropostaPadrao" sublabel="Formulário de criação de proposta padrão" actor="Comercial" />
            <ArrowDown />
            <ProcessNode label="Selecionar Segmento" sublabel="Educação, Infoprodutos, E-commerce, SaaS, Gateway, Marketplace" actor="Comercial" />
            <ArrowDown />
            <ProcessNode label="Taxas auto-preenchidas" sublabel="DEFAULT_SEGMENT_RATES aplicadas — valores FIXOS por segmento" actor="Sistema" highlight />
            <MicroStep steps={['MDR Visa 1x', 'MDR 2-6x', 'MDR 7-12x', 'MDR 13-21x', 'Débito', 'PIX', 'Boleto', 'Fees', 'Antecipação']} />
            <ArrowDown />
            <ProcessNode label="Preencher dados empresa (opcional)" sublabel="Nome, CNPJ, Contato, Telefone, E-mail" actor="Comercial" />
            <ArrowDown />
            <ProcessNode label="Selecionar Parceiro (simulação)" sublabel="Apenas para rentabilidade — NÃO aparece na proposta pública" actor="Comercial" />
            <ArrowDown />
            <DecisionNode label="Salvar como?" />
            <BranchSplit leftLabel="Rascunho" rightLabel="Ativar" />
            <div className="grid grid-cols-2 gap-2">
              <ProcessNode label="Rascunho" sublabel="Editável depois" actor="—" />
              <ProcessNode label="Ativar" sublabel="Gera token + link público" actor="Sistema" />
            </div>
            <ArrowDown />
            <DecisionNode label="Marcar como padrão do segmento?" />
            <ArrowDown />
            <DataNode label="isDefaultForSegment = true" sublabel="Aparece nos Links Rápidos" />
            <ArrowDown />
            <TerminalNode label="FIM" type="end" />
          </div>
        </div>

        <ArrowDown />

        <div className="border-2 border-slate-200 rounded-xl p-4 bg-slate-50 mt-3">
          <p className="text-[9px] font-bold text-slate-500 uppercase text-center mb-2">Visão do Cliente (Página Pública)</p>
          <div className="space-y-1">
            <ProcessNode label="Cliente abre link da proposta" sublabel="/PropostaPadraoPublica?token=xxx" actor="Cliente" />
            <ArrowDown />
            <ProcessNode label="Visualiza proposta premium" sublabel="Hero + Segmento + Taxas por Bandeira + PIX/Boleto + Fees + Antecipação" actor="Cliente" highlight />
            <MicroStep steps={['Hero Header', 'Dados Empresa', 'Badge Segmento', 'Tabela MDR', 'Cards PIX/Boleto/Fees', 'Antecipação', 'Parcelas Simulador', 'TPV Mínimo']} />
            <ArrowDown />
            <DecisionNode label="Quer proposta personalizada?" />
            <BranchSplit leftLabel="Sim" rightLabel="Não" />
            <div className="grid grid-cols-2 gap-2">
              <ProcessNode label="CTA → Questionário de Lead" sublabel="Redireciona para formulário de captação" actor="Cliente" />
              <ProcessNode label="Sai da página" sublabel="Pode voltar depois pelo mesmo link" actor="Cliente" />
            </div>
          </div>
        </div>
      </div>
    </FlowchartContainer>
  );
}