import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, Table, InfoBox } from './DocHelpers';

export default function DocParceirosCompliance() {
  return (
    <S>
      <H1>16. Módulo de Parceiros de Compliance — Colaboração Externa</H1>

      <P>O módulo de Parceiros de Compliance permite que a Pin Bank compartilhe casos de onboarding com empresas parceiras externas (escritórios de auditoria, outras processadoras, bureaus de compliance) para análise colaborativa. O parceiro recebe acesso controlado a casos específicos, analisa o dossiê completo (ou mascarado), e devolve uma recomendação de decisão. A Pin Bank mantém sempre o poder final de decisão — a recomendação do parceiro é um insumo, não uma ordem.</P>

      <InfoBox title="Por que existe este módulo?">
        <p>Em operações complexas (gateways de alto volume, marketplaces internacionais, subsellers regulados), parceiros externos podem precisar validar o cliente antes que ele opere com eles — um segundo par de olhos especializados reduz risco para todas as partes envolvidas. Este módulo transforma esse processo (tradicionalmente feito via e-mail e planilhas) em um fluxo auditado, rastreável e com SLAs medidos.</p>
      </InfoBox>

      <H2>16.1. Arquitetura de Entidades</H2>
      <Table headers={['Entidade', 'O que armazena', 'Campos-chave']} rows={[
        ['CompliancePartner', 'Cadastro de cada empresa parceira que pode receber casos para análise.', 'name, legalName, cnpj, logoUrl, contactEmail, isActive, slaHours, notificationChannels (Slack channelId), allowedOnboardingCaseModels (lista dos modelos de questionário que o parceiro pode ver — ex: ComplianceEcommerceV4), defaultVisibilityLevel (full/redacted/summary_only).'],
        ['CompliancePartnerUser', 'Vincula usuários específicos (da tabela User) a um parceiro.', 'userId, userEmail, userFullName, partnerId, partnerRole (viewer/analyst/manager), isActive, assignedBy, assignedAt, revokedAt, revokeReason.'],
        ['PartnerAssignment', 'Registra cada vez que um admin atribui um caso a um parceiro.', 'onboardingCaseId, merchantId, merchantName, merchantCpfCnpj, caseModel, caseStatus, caseRiskScoreV4, caseSubfaixa, partnerId, partnerName, assignedBy, assignedByName, assignedAt, assignmentReason, partnerVisibilityLevel, status (pending/viewed/in_review/completed/expired/revoked), dueDate, partnerRecommendation (approve/reject/request_docs/escalate), partnerComments, partnerReviewerId, partnerReviewedAt.'],
        ['PartnerAssignmentActivity', 'Log de atividades de cada atribuição — toda interação vira um evento auditável.', 'assignmentId, activityType (assigned/viewed/commented/documents_downloaded/recommendation_submitted/recommendation_changed/revoked/sla_warning_sent/sla_breached/status_changed), performedBy, performedByRole (admin/partner/system), description, details.'],
      ]} />

      <H2>16.2. Níveis de Visibilidade (Mascaramento de Dados)</H2>
      <P>O admin escolhe o nível de visibilidade para cada atribuição. Isso define o que o parceiro pode ver:</P>
      <Table headers={['Nível', 'O que o parceiro vê', 'O que fica oculto', 'Quando usar']} rows={[
        ['full', 'Dossiê completo — questionário, BDC, CAF, documentos, análise SENTINEL, score V4, decisão atual.', 'Nada.', 'Parceiros de confiança total que precisam de todo o contexto (escritórios jurídicos internos, bureaus homologados).'],
        ['redacted', 'Campos sensíveis mascarados: CPF parcial (123.XXX.XXX-45), e-mail parcial (jo***@email.com), telefone parcial. Nomes, CNPJ e dados de compliance visíveis.', 'CPF, e-mail, telefone completos.', 'Parceiros operacionais que só precisam avaliar risco, não contatar o cliente diretamente.'],
        ['summary_only', 'Apenas: nome, CNPJ, modelo, subfaixa V4, score V4, status atual, red flags principais.', 'Questionário completo, documentos, análise detalhada, dados pessoais.', 'Parceiros que apenas precisam confirmar que podem operar com aquele perfil, sem ver o dossiê.'],
      ]} />

      <H2>16.3. Regras de Autorização por Modelo de Questionário</H2>
      <P>Cada parceiro tem o campo <code>allowedOnboardingCaseModels</code> — uma lista explícita de modelos que ele pode ver (ex: <code>["ComplianceEcommerceV4", "ComplianceSaaSV4"]</code>). A função <code>adminAssignCaseToPartner</code> valida rigorosamente:</P>
      <ul className="list-disc ml-6 space-y-1 mb-4">
        <Li>Busca o <code>QuestionnaireTemplate</code> do caso para resolver o <code>caseModel</code>.</Li>
        <Li>Se <code>caseModel</code> não está em <code>allowedOnboardingCaseModels</code>, retorna HTTP 400 com mensagem explicativa — atribuição é bloqueada.</Li>
        <Li>Se já existe uma <code>PartnerAssignment</code> ativa (pending/viewed/in_review) do mesmo caso no mesmo parceiro, retorna HTTP 409 — evita duplicata.</Li>
        <Li>Se o parceiro está com <code>isActive = false</code>, retorna HTTP 400 — parceiros desativados não recebem casos.</Li>
      </ul>

      <H2>16.4. Fluxo Ponta-a-Ponta</H2>

      <H3>Etapa 1 — Cadastro do Parceiro (uma vez)</H3>
      <P>Admin acessa <code>/AdminGestaoParceiros</code> → "Novo Parceiro" → preenche: Nome, Razão Social, CNPJ, e-mail de contato, SLA (horas), modelos permitidos (multi-select com os modelos V4 cadastrados no sistema), nível padrão de visibilidade, canal Slack para notificações. Admin então adiciona usuários do parceiro em "Usuários" — cada usuário vira uma linha em <code>CompliancePartnerUser</code> com um papel (<code>viewer</code>, <code>analyst</code> ou <code>manager</code>).</P>

      <H3>Etapa 2 — Atribuição de Caso pelo Admin</H3>
      <P>No dossiê de compliance de qualquer caso (<code>/CadastroDetalhe</code>), na seção "Compliance Partners", o admin clica em "Atribuir a Parceiro". Modal abre com:</P>
      <ul className="list-disc ml-6 space-y-1 mb-4">
        <Li>Seletor de parceiro (apenas parceiros ativos cujo <code>allowedOnboardingCaseModels</code> contém o modelo do caso atual).</Li>
        <Li>Nível de visibilidade (padrão = <code>defaultVisibilityLevel</code> do parceiro).</Li>
        <Li>Motivo da atribuição (texto livre).</Li>
        <Li>Prazo (calculado automaticamente como <code>agora + slaHours</code>, editável).</Li>
      </ul>
      <P>Ao confirmar, a função <code>adminAssignCaseToPartner</code> cria <code>PartnerAssignment</code> (status <code>pending</code>), registra evento <code>assigned</code> em <code>PartnerAssignmentActivity</code>, e dispara notificação ao canal Slack do parceiro (se configurado) com link direto para o caso.</P>

      <H3>Etapa 3 — Atribuição em Massa</H3>
      <P>O admin também pode atribuir MÚLTIPLOS casos de uma vez via função <code>adminBulkAssignPartner</code>. A tela de casos em <code>/QuestionariosRecebidos</code> permite seleção múltipla e botão "Atribuir Selecionados ao Parceiro X". A função valida cada caso individualmente e retorna um relatório de sucessos e falhas por caso.</P>

      <H3>Etapa 4 — Análise pelo Parceiro</H3>
      <P>O usuário do parceiro (vinculado via <code>CompliancePartnerUser</code>) acessa <code>/ComplianceParceiro</code> — tela isolada que lista APENAS casos atribuídos aos parceiros dos quais ele é usuário. Tela contém:</P>
      <ul className="list-disc ml-6 space-y-1 mb-4">
        <Li><Bold>KPIs (PartnerDashboardKPIs):</Bold> total de casos ativos, pendentes, em atraso (SLA vencido), concluídos no mês.</Li>
        <Li><Bold>Filtros:</Bold> status (pending/viewed/in_review/completed/expired/revoked), busca por nome ou CPF/CNPJ.</Li>
        <Li><Bold>Tabela:</Bold> cada linha mostra cliente, modelo, score V4, subfaixa, prazo SLA com indicador visual de urgência (<code>PartnerSlaIndicator</code>), status atual, ação "Abrir".</Li>
      </ul>

      <H3>Etapa 5 — Dossiê do Caso (visão parceiro)</H3>
      <P>Ao abrir um caso, o parceiro vai para <code>/ComplianceParceiroDetalhe?id=...</code>. A função <code>partnerGetCaseDetail</code> carrega o caso aplicando o nível de visibilidade configurado. Campos sensíveis são processados pelo componente <code>MaskedField</code> antes de renderizar no frontend. Se <code>visibilityLevel = summary_only</code>, a maioria dos painéis (BDC detalhado, SENTINEL completo, documentos) é substituída por um resumo estruturado.</P>

      <H3>Etapa 6 — Download de Documentos</H3>
      <P>Documentos são baixados via <code>partnerDownloadDocument</code>, que: (a) verifica se o usuário tem permissão para o caso, (b) gera uma URL assinada temporária (5min) para o arquivo no storage privado, (c) registra evento <code>documents_downloaded</code> em <code>PartnerAssignmentActivity</code>. O parceiro NUNCA recebe o link direto do arquivo — só URLs assinadas.</P>

      <H3>Etapa 7 — Recomendação do Parceiro</H3>
      <P>O parceiro usa o componente <code>PartnerRecommendationForm</code> para submeter sua decisão. A função <code>partnerSubmitRecommendation</code> aceita 4 tipos:</P>
      <Table headers={['Recomendação', 'Significado', 'Ação subsequente da Pin Bank']} rows={[
        ['approve', 'Parceiro aprova a operação com o cliente.', 'A Pin Bank considera como insumo. Se Pin Bank também está inclinado a aprovar, decisão final = aprovado.'],
        ['reject', 'Parceiro não quer operar com o cliente.', 'Pin Bank avalia: pode ainda aprovar internamente (registrando divergência) ou pode usar como reforço para recusa.'],
        ['request_docs', 'Parceiro pede documentos adicionais antes de decidir.', 'Pin Bank escala para analista humano que solicita os docs ao cliente.'],
        ['escalate', 'Parceiro identificou algo crítico e quer escalação urgente.', 'Alerta Slack de alta prioridade disparado. Caso entra em Revisão Manual imediata.'],
      ]} />
      <P>Comentários obrigatórios em todos os casos. O <code>assignment.status</code> muda para <code>completed</code>, <code>partnerReviewedAt</code> é gravado, e evento <code>recommendation_submitted</code> é logado. Se o parceiro alterar uma recomendação já submetida (caso raro), é <code>recommendation_changed</code>.</P>

      <H2>16.5. Monitoramento de SLA</H2>
      <P>A função <code>partnerSlaMonitor</code> roda como automation a cada hora e:</P>
      <ul className="list-disc ml-6 space-y-1 mb-4">
        <Li>Identifica <code>PartnerAssignment</code> com <code>status ∈ {`{pending, viewed, in_review}`}</code> cuja <code>dueDate</code> está a ≤ 25% do tempo restante (ex: SLA de 48h e faltam &lt; 12h).</Li>
        <Li>Envia 1 alerta de aviso ao parceiro (evento <code>sla_warning_sent</code>) via Slack se ainda não enviou.</Li>
        <Li>Quando <code>dueDate &lt; agora</code> e status ≠ completed, muda status para <code>expired</code> e grava evento <code>sla_breached</code>.</Li>
        <Li>Alerta ao admin Pin Bank para reassignar o caso a outro parceiro ou retomar a análise internamente.</Li>
      </ul>

      <H2>16.6. Revogação de Atribuição</H2>
      <P>Admin pode revogar uma atribuição ativa via <code>adminRevokeAssignment</code>. A função:</P>
      <ul className="list-disc ml-6 space-y-1 mb-4">
        <Li>Muda status do <code>PartnerAssignment</code> para <code>revoked</code>.</Li>
        <Li>Grava <code>revokedAt</code>, <code>revokedBy</code>, <code>revokeReason</code>.</Li>
        <Li>Notifica o parceiro via Slack que o caso foi removido.</Li>
        <Li>Evento <code>revoked</code> em <code>PartnerAssignmentActivity</code>.</Li>
        <Li>Uso típico: admin identificou conflito de interesse, parceiro errado foi selecionado, ou caso foi resolvido internamente.</Li>
      </ul>

      <H2>16.7. Telas do Módulo</H2>
      <Table headers={['Tela', 'Rota', 'Acesso', 'Função']} rows={[
        ['Admin — Gestão de Parceiros', '/AdminGestaoParceiros', 'Admin Pin Bank', 'CRUD de parceiros + gestão de usuários do parceiro.'],
        ['Admin — Atribuir Caso', 'Modal dentro de /CadastroDetalhe', 'Admin Pin Bank', 'Componente AssignCaseToPartnerModal + CasePartnerAssignments para ver histórico de atribuições.'],
        ['Parceiro — Dashboard', '/ComplianceParceiro', 'Usuário do parceiro', 'Lista todos os casos atribuídos com filtros, KPIs e SLA.'],
        ['Parceiro — Detalhe do Caso', '/ComplianceParceiroDetalhe', 'Usuário do parceiro', 'Dossiê aplicado com nível de visibilidade + formulário de recomendação.'],
      ]} />

      <InfoBox title="Auditoria Regulatória — Trilha Completa">
        <p>Toda interação do parceiro com um caso (abrir, ver documento, baixar, comentar, recomendar, alterar recomendação) gera um evento em <code>PartnerAssignmentActivity</code> com timestamp UTC, IP, usuário e detalhes. Em auditorias do regulador, a Pin Bank consegue reconstruir segundo-a-segundo quem viu o quê de cada cliente externo. Retenção: 5 anos conforme Lei 9.613/1998.</p>
      </InfoBox>
    </S>
  );
}