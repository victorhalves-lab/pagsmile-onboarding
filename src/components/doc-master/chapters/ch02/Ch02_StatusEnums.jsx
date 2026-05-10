import React from 'react';
import { H2, H3, B, C, Table, Note } from '../../DocPrimitives';

export default function Ch02_StatusEnums() {
  return (
    <>
      <H2 num="2.3">Enums de Status (Catálogo Exaustivo)</H2>

      <H3 num="2.3.1">OnboardingCase.status</H3>
      <Table headers={['Valor', 'Significado', 'Origem']} rows={[
        ['Pendente', 'Caso criado, ainda não submetido', 'Default ao criar via questionário'],
        ['Em Processamento', 'autoEnrichOnboarding rodando', 'Step 0-11 do pipeline ativo'],
        ['Aprovado', 'Decisão final = aprovação automática (V4 + CAF clean)', 'Subfaixas 1A/1B/2A/2B sem veto CAF'],
        ['Manual', 'Escalado para revisão humana', 'Subfaixa 4 OU CAF score 50-65 OU Safety Net'],
        ['Recusado', 'Reprovação automática (B01-B10 OU CAF FRAUD)', 'analyzeBlocks crítico OU CAF score &lt;50'],
        ['Docs Solicitados', 'Aguardando reupload de documentos', 'Manual: analista solicitou complemento'],
      ]} />

      <H3 num="2.3.2">OnboardingCase.escalationSource</H3>
      <Table dense headers={['Valor', 'Quando']} rows={[
        ['V4_BLOCK', 'Bloqueio B01-B10 disparou'],
        ['V4_SUBFAIXA_4', 'Score caiu na subfaixa 4 (escalação obrigatória)'],
        ['CAF_FRAUD', 'CAF detectou fraude biométrica/documental'],
        ['CAF_QUALITY', 'Qualidade baixa — recapture solicitado'],
        ['SAFETY_NET', 'Decisão ambígua — downgrade automático para Manual'],
        ['NONE', 'Sem escalação (aprovado direto)'],
      ]} />

      <H3 num="2.3.3">ComplianceScore.recomendacao_final</H3>
      <Table dense headers={['Valor', 'Significado']} rows={[
        ['Aprovado', 'Verde — habilitação automática'],
        ['Aprovado com Condições', 'Amarelo — habilitado com Rolling Reserve / monitoramento reforçado'],
        ['Revisão Manual', 'Azul — analista decide'],
        ['Recusado', 'Vermelho — bloqueio automático'],
      ]} />

      <H3 num="2.3.4">Lead.status (funil completo)</H3>
      <Table dense headers={['Valor', 'Etapa']} rows={[
        ['questionario_preenchido', 'Lead criado pelo formulário público'],
        ['analisado_priscila', 'IA PRISCILA processou'],
        ['em_contato_comercial', 'Vendedor está conversando'],
        ['proposta_enviada', 'Proposta criada e enviada'],
        ['proposta_aceita', 'Cliente aceitou'],
        ['proposta_recusada', 'Cliente recusou'],
        ['kyc_iniciado', 'Onboarding começou'],
        ['kyc_aprovado', 'Compliance aprovou'],
        ['kyc_revisao_manual', 'Em análise humana'],
        ['ativado', 'Cliente operacional'],
        ['perdido', 'Lead perdido'],
      ]} />

      <H3 num="2.3.5">Lead.leadQualifierLevel + Lead.priscilaDecisionPath</H3>
      <Table dense headers={['Campo', 'Valores']} rows={[
        ['leadQualifierLevel', 'EXCELENTE | BOM | REGULAR | FRACO | INSUFICIENTE | PENDENTE'],
        ['priscilaRiskLevel', 'BAIXO | MEDIO | ALTO | CRITICO | EM_ANALISE'],
        ['priscilaDecisionPath', 'AUTO_APROVAR | AUTO_COM_FLAG | REVISAO_MANUAL | REJEITAR'],
        ['iaDecision', 'AUTO_APROVAR | REVISAO_MANUAL | REJEITAR | PENDENTE'],
        ['iaPriority', 'URGENTE | ALTA | MEDIA | BAIXA'],
        ['bdcScoreLevel', 'EXCELENTE | BOM | REGULAR | FRACO | INSUFICIENTE'],
      ]} />

      <H3 num="2.3.6">Proposal.status</H3>
      <Table dense headers={['Valor', 'Significado']} rows={[
        ['rascunho', 'Sendo editada — não enviada'],
        ['enviada', 'Link público criado, cliente notificado'],
        ['visualizada', 'Cliente abriu o link'],
        ['aceita', 'Cliente clicou aceitar'],
        ['recusada', 'Cliente clicou recusar'],
        ['contraproposta', 'Cliente solicitou ajuste de taxas'],
        ['expirada', 'validUntil passou (cron expireProposals)'],
        ['cancelada', 'Cancelada manualmente'],
      ]} />

      <H3 num="2.3.7">IntegrationLog.status</H3>
      <Table dense headers={['Valor', 'Significado']} rows={[
        ['pending', 'Criado, ainda não enviado'],
        ['processing', 'Request em andamento'],
        ['success', 'Sucesso — response_payload populado'],
        ['failed', 'Erro irrecuperável — error_message + error_code'],
        ['timeout', 'Provider não respondeu no SLA'],
        ['cancelled', 'Cancelado pelo orquestrador'],
      ]} />

      <H3 num="2.3.8">AccessAudit.action + TwoFactorAudit.event</H3>
      <Table dense headers={['Entidade', 'Enum']} rows={[
        ['AccessAudit.action', 'page_view | tab_view | subtab_view | action_executed | access_denied | profile_changed | profile_created | profile_deleted | user_assigned | login | logout'],
        ['TwoFactorAudit.event', 'enroll_start | enroll_complete | totp_success | totp_fail | pin_success | pin_fail | backup_code_used | admin_reset | pin_changed | locked_out'],
      ]} />

      <Note title="Imutabilidade dos enums" kind="warn">
        <B>NUNCA</B> remova valores de enums existentes — apenas adicione novos. Remoção quebra registros históricos. Se um valor está obsoleto, marque-o como deprecated em comentário e pare de criar novos registros com ele.
      </Note>
    </>
  );
}