import React from 'react';
import {
  FlowchartContainer, TerminalNode, ProcessNode, DecisionNode, DataNode,
  SubProcessNode, ArrowDown, BranchSplit, MicroStep
} from './FlowchartPrimitives';
import { BarChart3 } from 'lucide-react';

export default function FlowPipelineComercial() {
  return (
    <FlowchartContainer
      title="Fluxo 8 — Pipeline Comercial (Kanban)"
      description="Gestão do lead no pipeline desde entrada até ativação ou perda"
      actor="Time Comercial"
      icon={BarChart3}
      color="border-green-200"
    >
      <div className="space-y-1">
        <TerminalNode label="INÍCIO — Lead entra no pipeline (questionário_preenchido)" />
        <ArrowDown />

        <div className="bg-green-50/50 border border-green-200 rounded-xl p-4">
          <p className="text-[9px] font-bold text-green-600 uppercase text-center mb-3">7 COLUNAS DO KANBAN</p>
          <div className="grid grid-cols-7 gap-1.5">
            {[
              { col: '1. Leads', desc: 'Novos questionários recebidos', color: 'bg-slate-100' },
              { col: '2. Em Contato', desc: 'Primeiro contato comercial feito', color: 'bg-blue-100' },
              { col: '3. Proposta Enviada', desc: 'Proposta enviada ao cliente', color: 'bg-yellow-100' },
              { col: '4. Proposta Aceita', desc: 'Cliente aceitou proposta', color: 'bg-green-100' },
              { col: '5. Compliance', desc: 'Em processo de KYC/KYB', color: 'bg-purple-100' },
              { col: '6. Contrato', desc: 'Contrato em geração/assinatura', color: 'bg-orange-100' },
              { col: '7. Perdido', desc: 'Lead descartado', color: 'bg-red-100' },
            ].map((c, i) => (
              <div key={i} className={`${c.color} rounded-lg p-1.5 text-center`}>
                <p className="text-[8px] font-bold text-[#002443]">{c.col}</p>
                <p className="text-[7px] text-[#002443]/50">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <ArrowDown />

        <ProcessNode label="Comercial visualiza card do lead" sublabel="Badges: Score PRISCILA, Risco, Maturidade, TPV, Introducer" actor="Comercial" />
        <ArrowDown />

        <ProcessNode label="Drag-and-drop entre colunas" sublabel="Cada mudança de coluna → LeadActivity + Lead.status atualizado" actor="Comercial" highlight />
        <ArrowDown />

        <DecisionNode label="Precisa de ação?" />
        <div className="grid grid-cols-3 gap-2 mt-1">
          <div className="space-y-1">
            <ProcessNode label="Enviar follow-up" sublabel="E-mail ou WhatsApp via template" actor="Comercial" />
            <MicroStep steps={['Selecionar template', 'Personalizar msg', 'Enviar', 'Registrar atividade']} />
          </div>
          <div className="space-y-1">
            <ProcessNode label="Criar proposta" sublabel="3 tipos disponíveis" actor="Comercial" />
            <MicroStep steps={['Personalizada', 'Padrão segmento', 'PIX']} />
          </div>
          <div className="space-y-1">
            <ProcessNode label="Agendar reunião" sublabel="Registrar via questionário reunião" actor="Comercial" />
            <MicroStep steps={['QuestionarioReuniao', 'Ou QuestionarioReuniaoPix', 'Ou ProcessMeetingNotes (IA)']} />
          </div>
        </div>
        <ArrowDown />

        <SubProcessNode label="Alertas Automáticos" sublabel="Sistema monitora SLAs e tempos" />
        <div className="grid grid-cols-3 gap-2 mt-1">
          <ProcessNode label="Aging Alert" sublabel="Leads parados > X dias na mesma coluna" actor="Sistema" />
          <ProcessNode label="SLA Alert" sublabel="checkLeadSLA: tempo de resposta excedido" actor="Sistema" />
          <ProcessNode label="Expiring Alert" sublabel="Propostas ≤3 dias para expirar" actor="Sistema" />
        </div>
        <ArrowDown />

        <ProcessNode label="Métricas do Pipeline" sublabel="TPV por coluna, receita estimada, taxa conversão, aging médio" actor="Comercial" />
        <ArrowDown />

        <TerminalNode label="FIM — Lead progride até Contrato ou é marcado como Perdido" type="end" />
      </div>
    </FlowchartContainer>
  );
}