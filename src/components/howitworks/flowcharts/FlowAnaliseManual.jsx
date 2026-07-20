import React from 'react';
import { StartEndNode, ProcessNode, DecisionNode, DataNode, IANode, Arrow, BranchLabel, ResponsibleBadge, SubprocessNode } from './FlowchartNode';

export default function FlowAnaliseManual() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="font-bold text-[#0A0A0A] text-sm">Fluxo 6: Análise Manual de Compliance</h4>
          <p className="text-[10px] text-[#0A0A0A]/50">Quando SENTINEL recomenda revisão manual — jornada completa do analista</p>
        </div>
        <div className="flex gap-1.5">
          <ResponsibleBadge label="Analista Compliance" color="bg-[#0A0A0A]" />
          <ResponsibleBadge label="Sistema" color="bg-blue-600" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-6 overflow-x-auto">
        <div className="flex flex-col items-center min-w-[400px]">
          <StartEndNode label="INÍCIO — Case com Recomendação 'Revisão Manual'" />
          <Arrow />

          <ProcessNode label="Dashboard Compliance" sublabel="AdminDashboard: case aparece nos KPIs de 'Manual'" />
          <Arrow />

          <ProcessNode label="Abrir Caso (AnaliseDeCasos)" sublabel="7 abas de análise detalhada" />
          <Arrow />

          <SubprocessNode label="Aba 1: Resumo do Caso (CaseSummaryCards)" items={[
            "Score geral SENTINEL (0-1000) com classificação",
            "Score por fase: Questionário / Validações / Consolidação",
            "Recomendação da IA + nível de confiança (0-100)",
            "Pontos positivos, pontos de atenção, red flags",
            "Perguntas sugeridas pela IA para investigação"
          ]} />
          <Arrow />

          <SubprocessNode label="Aba 2: Dados do Merchant (CaseMerchantTab)" items={[
            "Dados cadastrais: nome, CNPJ, tipo, e-mail, telefone",
            "Status do onboarding, serviços solicitados",
            "Parentesco (se subseller): seller principal vinculado"
          ]} />
          <Arrow />

          <SubprocessNode label="Aba 3: Respostas (ComplianceResponsesPanel)" items={[
            "Todas as respostas do questionário organizadas por seção",
            "Navegação lateral por seção (ResponsesSectionNav)",
            "Cada resposta com ResponseCard detalhado",
            "Risk weight e score de cada resposta visível"
          ]} />
          <Arrow />

          <SubprocessNode label="Aba 4: Documentos (CaseDocumentsTab)" items={[
            "Lista de todos documentos enviados",
            "Status: Pendente, Validado, Rejeitado, Erro",
            "Viewer modal com zoom (DocumentViewerModal)",
            "Download individual ou todos (ZIP)",
            "URLs assinadas temporárias (getCaseDocumentUrls)"
          ]} />
          <Arrow />

          <SubprocessNode label="Aba 5: Validações Externas (CaseValidationsTab)" items={[
            "Resultados CAF: Liveness (is_alive), Facematch (similarity)",
            "Resultados BigDataCorp: KYC empresa, sócios, PEP, sanções",
            "Status de cada validação + duração + red flags",
            "Cruzamento: declarado vs encontrado (divergências >50%)"
          ]} />
          <Arrow />

          <SubprocessNode label="Aba 6: IA SENTINEL (IAAnalysisPanel)" items={[
            "Relatório completo da análise em 3 fases",
            "Sumário executivo + análise detalhada",
            "Findings por severidade (INFO→BLOQUEANTE)",
            "Quality Assessment (4 dimensões 1-5)",
            "Documentos adicionais sugeridos pela IA"
          ]} />
          <Arrow />

          <SubprocessNode label="Aba 7: Histórico (CaseHistoryTab)" items={[
            "Timeline completa de ações no caso",
            "AuditLog: CREATE, UPDATE, VIEW, APPROVAL, REJECTION, VALIDATION",
            "Quem fez, quando, detalhes da mudança"
          ]} />
          <Arrow />

          <DecisionNode label="Decisão do Analista?" />
          <div className="flex items-start gap-6 mt-1">
            <div className="flex flex-col items-center">
              <BranchLabel label="Aprovar" color="text-green-600" />
              <Arrow />
              <ProcessNode label="Case → Aprovado" sublabel="CaseReviewDialogs: comentário obrigatório" borderColor="border-green-200" color="bg-green-50" />
              <Arrow />
              <DataNode label="Merchant.onboardingStatus → Aprovado" />
            </div>
            <div className="flex flex-col items-center">
              <BranchLabel label="Solicitar Docs" color="text-amber-600" />
              <Arrow />
              <ProcessNode label="Case → Docs Solicitados" sublabel="Lista de docs adicionais necessários" borderColor="border-amber-200" color="bg-amber-50" />
              <Arrow />
              <DataNode label="Merchant notificado" sublabel="Novo link de upload enviado" />
            </div>
            <div className="flex flex-col items-center">
              <BranchLabel label="Recusar" color="text-red-600" />
              <Arrow />
              <ProcessNode label="Case → Recusado" sublabel="Motivo obrigatório (RejectReasonsDialog)" borderColor="border-red-200" color="bg-red-50" />
              <Arrow />
              <DataNode label="Merchant.onboardingStatus → Recusado" />
            </div>
          </div>
          <Arrow />

          <ProcessNode label="AuditLog Registrado" sublabel="APPROVAL, REJECTION ou VALIDATION" />
          <Arrow />

          <StartEndNode label="FIM — Decisão Final Registrada" color="bg-[#0A0A0A]" />
        </div>
      </div>
    </div>
  );
}