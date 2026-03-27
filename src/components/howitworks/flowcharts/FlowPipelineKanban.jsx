import React from 'react';
import { StartEndNode, ProcessNode, DecisionNode, DataNode, Arrow, BranchLabel, ResponsibleBadge, SubprocessNode } from './FlowchartNode';

export default function FlowPipelineKanban() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="font-bold text-[#002443] text-sm">Fluxo 7: Pipeline Comercial Kanban — Jornada Completa do Lead</h4>
          <p className="text-[10px] text-[#002443]/50">Da entrada no pipeline até a ativação ou perda do lead — 7 colunas</p>
        </div>
        <div className="flex gap-1.5">
          <ResponsibleBadge label="Time Comercial" color="bg-blue-600" />
          <ResponsibleBadge label="Sistema" color="bg-slate-600" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 overflow-x-auto">
        <div className="flex flex-col items-center min-w-[400px]">
          <StartEndNode label="Lead Entra no Pipeline" />
          <Arrow />

          {/* Column 1 */}
          <ProcessNode label="📥 Coluna: LEADS" sublabel="Status: questionario_preenchido / analisado_priscila" borderColor="border-yellow-300" color="bg-yellow-50" />
          <Arrow />
          <SubprocessNode label="Ações do Vendedor" items={[
            "Ver scores PRISCILA/Qualifier/Risco no card",
            "Ver dados do questionário completo",
            "Definir prioridade (IA sugere: URGENTE→BAIXA)",
            "Decidir se entra em contato ou descarta"
          ]} />
          <Arrow />

          {/* Column 2 */}
          <ProcessNode label="📞 Coluna: EM CONTATO" sublabel="Status: em_contato_comercial" borderColor="border-blue-300" color="bg-blue-50" />
          <Arrow />
          <SubprocessNode label="Ações do Vendedor" items={[
            "Drag-and-drop do card para esta coluna",
            "LeadActivity registrada: 'contato_iniciado'",
            "Preencher Questionário de Reunião (dados complementares)",
            "Usar ProcessMeetingNotes (IA transforma notas em dados)",
            "checkLeadSLA monitora tempo de resposta"
          ]} />
          <Arrow />

          {/* Column 3 */}
          <ProcessNode label="📄 Coluna: PROPOSTA ENVIADA" sublabel="Status: proposta_enviada" borderColor="border-purple-300" color="bg-purple-50" />
          <Arrow />
          <SubprocessNode label="Ações do Vendedor" items={[
            "Criar proposta (Personalizada, Padrão ou PIX)",
            "Copiar link público e enviar ao cliente",
            "Sistema notifica via Slack quando cliente visualiza",
            "checkExpiringProposals alerta propostas ≤3 dias",
            "Pode criar nova versão (V2, V3...)"
          ]} />
          <Arrow />

          <DecisionNode label="Cliente respondeu?" />
          <div className="flex items-start gap-6 mt-1">
            <div className="flex flex-col items-center">
              <BranchLabel label="Aceitou" color="text-green-600" />
              <Arrow />
              {/* Column 4 */}
              <ProcessNode label="✅ Coluna: PROPOSTA ACEITA" sublabel="Status: proposta_aceita" borderColor="border-green-300" color="bg-green-50" />
              <Arrow />
              <SubprocessNode label="Próximos Passos" items={[
                "Iniciar fluxo de Compliance KYC",
                "Enviar link de Compliance adequado",
                "Lead.status → kyc_iniciado"
              ]} />
            </div>
            <div className="flex flex-col items-center">
              <BranchLabel label="Recusou" color="text-red-600" />
              <Arrow />
              <ProcessNode label="Avaliar motivo" sublabel="rejectedReason do cliente" borderColor="border-red-200" />
              <Arrow />
              <DecisionNode label="Tenta de novo?" />
              <div className="flex items-start gap-4 mt-1">
                <div className="flex flex-col items-center">
                  <BranchLabel label="Sim" color="text-blue-600" />
                  <Arrow />
                  <ProcessNode label="Nova versão" sublabel="V2 da proposta" borderColor="border-blue-200" />
                </div>
                <div className="flex flex-col items-center">
                  <BranchLabel label="Não" color="text-red-600" />
                  <Arrow />
                  <ProcessNode label="Coluna: PERDIDO" sublabel="Status: perdido" borderColor="border-red-300" color="bg-red-50" />
                </div>
              </div>
            </div>
          </div>
          <Arrow />

          {/* Column 5 */}
          <ProcessNode label="🛡️ Coluna: COMPLIANCE" sublabel="Status: kyc_iniciado / kyc_aprovado / kyc_revisao_manual" borderColor="border-indigo-300" color="bg-indigo-50" />
          <Arrow />
          <SubprocessNode label="Fluxo de Compliance (ver Fluxo 3)" items={[
            "Merchant preenche questionário + documentos",
            "SENTINEL analisa em 3 fases",
            "Resultado: Aprovado, Manual, Recusado"
          ]} />
          <Arrow />

          <DecisionNode label="Compliance Aprovado?" />
          <div className="flex items-start gap-8 mt-1">
            <div className="flex flex-col items-center">
              <BranchLabel label="Sim" color="text-green-600" />
              <Arrow />
              {/* Column 6 */}
              <ProcessNode label="📝 Coluna: CONTRATO" sublabel="Status: ativado (em processo)" borderColor="border-emerald-300" color="bg-emerald-50" />
              <Arrow />
              <SubprocessNode label="Fluxo de Contrato (ver Fluxo 4)" items={[
                "preGenerateContract (IA pré-preenche)",
                "Time revisa e complementa",
                "Envia link público para assinatura",
                "Cliente assina → Merchant ativado"
              ]} />
            </div>
            <div className="flex flex-col items-center">
              <BranchLabel label="Não" color="text-red-600" />
              <Arrow />
              <ProcessNode label="Coluna: PERDIDO" sublabel="Compliance recusado" borderColor="border-red-300" color="bg-red-50" />
            </div>
          </div>

          <Arrow />
          <StartEndNode label="FIM — Merchant Ativado ou Lead Perdido" color="bg-[#002443]" />
        </div>
      </div>
    </div>
  );
}