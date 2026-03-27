import React from 'react';
import {
  FlowchartContainer, TerminalNode, ProcessNode, DecisionNode, DataNode,
  SubProcessNode, ArrowDown, BranchSplit, MicroStep, ParallelGroup
} from './FlowchartPrimitives';
import { Shield } from 'lucide-react';

export default function FlowComplianceOnboarding() {
  return (
    <FlowchartContainer
      title="Fluxo 5 — Compliance & KYC/KYB Onboarding (Merchant)"
      description="Jornada completa do merchant desde o link até aprovação — 9 variantes de compliance"
      actor="Merchant → IA SENTINEL → Analista"
      icon={Shield}
      color="border-purple-200"
    >
      <div className="space-y-1">
        <TerminalNode label="INÍCIO — Merchant recebe link de compliance" />
        <ArrowDown />

        <ProcessNode label="Acessa ComplianceOnboardingStart" sublabel="URL: /ComplianceOnboardingStart?ref=CODE" actor="Merchant" />
        <MicroStep steps={['Valida código', 'Identifica template', 'Carrega configuração']} />
        <ArrowDown />

        <DecisionNode label="Sessão anterior existe?" />
        <BranchSplit leftLabel="Sim → Retomar" rightLabel="Não → Nova sessão" />
        <div className="grid grid-cols-2 gap-3">
          <ProcessNode label="ComplianceResume" sublabel="Token da sessão → carrega formData + documentsData + step atual" actor="Merchant" />
          <ProcessNode label="Criar ComplianceSession" sublabel="sessionToken gerado, currentPhase=questionnaire, currentStep=1" actor="Sistema" />
        </div>
        <ArrowDown />

        <DecisionNode label="Qual tipo de compliance?" />
        <div className="flex gap-1.5 justify-center flex-wrap mt-1">
          {['PIX', 'Lite', 'SaaS', 'E-commerce', 'Full KYC', 'Merchant', 'Gateway', 'Marketplace', 'Dinâmico'].map(t => (
            <span key={t} className="text-[8px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">{t}</span>
          ))}
        </div>
        <ArrowDown />

        <ProcessNode label="FASE 1 — Questionário Dinâmico" sublabel="Multi-step, auto-save, validação, risk weights" actor="Merchant" highlight />
        <MicroStep steps={['Identificação', 'Razão Social', 'Tipo Empresa', 'Endereço', 'Atividade/MCC', 'Volumetria', 'Clientes', 'Responsáveis', 'Compliance/PLD', 'Sanções', 'Riscos', 'Confirmação']} />
        <ArrowDown />

        <ProcessNode label="Auto-save contínuo" sublabel="saveComplianceProgress → ComplianceSession.formData atualizado a cada step" actor="Sistema" />
        <ArrowDown />

        <ProcessNode label="FASE 2 — Upload de Documentos" sublabel="Documentos obrigatórios definidos no template (13-19 docs)" actor="Merchant" highlight />
        <MicroStep steps={['Contrato Social', 'Procuração', 'RG/CNH Sócios', 'Comprovante Endereço', 'CNPJ Atualizado', 'Balanço', 'DRE', 'Política PLD', 'Manual KYC', 'Licenças', '+específicos por tipo']} />
        <ArrowDown />

        <DecisionNode label="Template exige biometria?" />
        <BranchSplit leftLabel="Sim (Full, Gateway, Marketplace)" rightLabel="Não (PIX, Lite, SaaS)" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <ProcessNode label="FASE 3 — Liveness + Facematch" sublabel="7 estágios: Welcome → Instruções → Scanning → Selfie → Doc → Processing → Done" actor="Merchant" />
            <MicroStep steps={['CAF Liveness session', 'Prova de vida', 'Captura selfie', 'Captura documento', 'Facematch 1:1', 'Score similaridade', 'Resultado']} />
          </div>
          <ProcessNode label="Pular para submissão" sublabel="Sem verificação biométrica" actor="—" />
        </div>
        <ArrowDown />

        <ProcessNode label="OnboardingCompletion" sublabel="Tela de confirmação — protocolo gerado" actor="Merchant" />
        <ArrowDown />

        <DataNode label="OnboardingCase criado / atualizado" sublabel="Status: Pendente → Em Processamento" />
        <ArrowDown />

        <SubProcessNode label="IA SENTINEL — 3 Fases de Análise" sublabel="Execução automática ou manual pelo analista" />
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="space-y-1">
            <ProcessNode label="Fase 1: Questionário" sublabel="Analisa respostas, qualidade textual, padrões evasivos" actor="IA" />
            <MicroStep steps={['Parse respostas', 'Risk weights', 'Quality assessment', 'Findings', 'Score 0-1000']} />
          </div>
          <div className="space-y-1">
            <ProcessNode label="Fase 2: Validações Externas" sublabel="CAF + BigDataCorp: KYC, PEP, sanções" actor="IA" />
            <MicroStep steps={['Query BigDataCorp', 'Dados empresa', 'KYC sócios', 'PEP/Sanções', 'Cruzamento', 'Score 0-1000']} />
          </div>
          <div className="space-y-1">
            <ProcessNode label="Fase 3: Consolidação" sublabel="Score final, recomendação, parecer" actor="IA" />
            <MicroStep steps={['Combina F1+F2', 'Bônus consistência', 'Overrides', 'Decisão final', 'Relatório']} />
          </div>
        </div>
        <ArrowDown />

        <DataNode label="ComplianceScore + ComplianceFinding + QualityAssessment criados" />
        <ArrowDown />

        <DecisionNode label="Recomendação IA?" />
        <div className="grid grid-cols-4 gap-2 mt-1">
          <ProcessNode label="✅ Aprovado" sublabel="Auto → Aprovado" actor="Sistema" />
          <ProcessNode label="⚠️ Aprovado c/ Condições" sublabel="Condições específicas" actor="Sistema" />
          <ProcessNode label="🔍 Revisão Manual" sublabel="Fila do analista" actor="Analista" />
          <ProcessNode label="❌ Recusado" sublabel="Auto → Recusado" actor="Sistema" />
        </div>
        <ArrowDown />

        <DecisionNode label="Caso de revisão manual?" />
        <BranchSplit leftLabel="Sim" rightLabel="Não" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <ProcessNode label="Analista revisa caso completo" sublabel="AnaliseDeCasos: 6 abas — Resumo, Docs, Respostas, IA, Validações, Histórico" actor="Analista" highlight />
            <MicroStep steps={['Ver dados merchant', 'Analisar score IA', 'Verificar red flags', 'Revisar docs', 'Ler respostas', 'Checar validações', 'Decidir']} />
            <ArrowDown />
            <DecisionNode label="Decisão do analista?" />
            <div className="grid grid-cols-3 gap-1 mt-1">
              <ProcessNode label="Aprovar" sublabel="Com ou sem condições" actor="Analista" />
              <ProcessNode label="Solicitar Docs" sublabel="Pedir documentos adicionais" actor="Analista" />
              <ProcessNode label="Recusar" sublabel="Com justificativa" actor="Analista" />
            </div>
          </div>
          <ProcessNode label="Decisão automática aplicada" sublabel="Status final definido pela IA" actor="Sistema" />
        </div>
        <ArrowDown />

        <DataNode label="Merchant.onboardingStatus atualizado" sublabel="AuditLog registrado + notificação" />
        <ArrowDown />

        <TerminalNode label="FIM — Merchant aprovado/recusado" type="end" />
      </div>
    </FlowchartContainer>
  );
}