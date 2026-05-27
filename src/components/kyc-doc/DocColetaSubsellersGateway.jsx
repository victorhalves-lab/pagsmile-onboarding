import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, Table, InfoBox } from './DocHelpers';

/**
 * Seção 22 — Coleta de Subsellers via Gateway (Pré-KYC em Massa)
 *
 * Versão operacional do Cap. 18 da Documentação Master.
 * Foco: como o analista compliance/comercial opera a inbox no dia-a-dia.
 */
export default function DocColetaSubsellersGateway() {
  return (
    <S>
      <H1>22. Coleta de Subsellers via Gateway — Fluxo Pré-KYC em Massa</H1>

      <P>Quando um cliente Gateway/PSP chega à Pagsmile com <Bold>dezenas ou centenas de subsellers</Bold> para onboardar, não faz sentido pedir que cada um responda o KYC completo (Seção 10) imediatamente. Este fluxo introduz uma <Bold>etapa de pré-cadastro em massa</Bold>: geramos um link único para o Gateway, ele preenche a lista de subsellers (informações iniciais — modelo de negócio, oferta, volumetria, dados bancários), e SÓ DEPOIS de a Pagsmile triar essa lista é que disparamos os links de KYC individuais.</P>

      <InfoBox title="Isso NÃO é o KYC do subseller" color="amber">
        <p>Não substitui o questionário V4/V5.2 do Cap. 10. Não atribui score. Não cria OnboardingCase. É <Bold>apenas o pré-cadastro</Bold> que alimenta a triagem inicial do analista. O KYC propriamente dito (BDC + CAF + SENTINEL + Risk Scoring) só é disparado depois, via links individuais SUBSELLER_COMPLIANCE (Cap. 10).</p>
      </InfoBox>

      <H2>22.1. Arquitetura — 2 Entidades + 1 Função + 3 Páginas</H2>
      <Table headers={['Artefato', 'Função']} rows={[
        ['Entidade SubsellerInfoCollection', 'Um link gerado pela Pagsmile para um Gateway. Tem unique_token, contadores (submissions_count + total_subsellers_count), is_active e expires_at opcional'],
        ['Entidade SubsellerInfoSubmission', 'Cada vez que o Gateway envia uma lista — guarda subsellers[] + status (pending/in_review/processed/archived) + review_notes/reviewed_by/reviewed_at'],
        ['Função publicSubsellerInfoSubmit', 'Endpoint público que recebe o POST do formulário, valida link, sanitiza campos, cria SubsellerInfoSubmission, atualiza contadores'],
        ['/GestaoSubsellerInfoLinks', 'Admin gera links: nome do Gateway, contato, slug opcional, expiração opcional. Mostra KPIs e lista todos os links com toggle ativo/desativado'],
        ['/SubsellerInfoRecebidos', 'Inbox: filtra por Gateway/status, busca, vê detalhes da lista, muda status, exporta XLSX individual/consolidado/geral'],
        ['/SubsellerInfoForm (público)', 'Formulário que o Gateway preenche — cards repetíveis com 14 campos por subseller; default 10 cards, expansível em +5/+10'],
      ]} />

      <H2>22.2. O Que é Coletado por Subseller (14 Campos)</H2>
      <Table headers={['Grupo', 'Campos']} rows={[
        ['Dados básicos', 'company_name (Razão Social/Fantasia), cnpj, business_model (ecommerce/marketplace/saas/link_pagamento/infoprodutos/dropshipping/servicos/outro), what_they_sell, offer_url, offer_explanation'],
        ['Volumetria estimada', 'monthly_tpv (BRL), average_ticket (BRL)'],
        ['Conta bancária liquidação', 'bank_name, bank_agency, bank_account, bank_account_type (corrente/poupanca/pagamento), bank_holder_name, bank_holder_document (CPF/CNPJ do titular — pode diferir do CNPJ do subseller)'],
      ]} />

      <H2>22.3. Defesa do Endpoint Público</H2>
      <P>O <code>publicSubsellerInfoSubmit</code> aplica 4 camadas de defesa:</P>
      <ol className="list-decimal ml-6 space-y-1 mb-3">
        <Li><Bold>Validação de método:</Bold> só POST (rejeita GET/PUT/DELETE com 405)</Li>
        <Li><Bold>Validação do token:</Bold> precisa existir SubsellerInfoCollection com aquele unique_token (404 se não)</Li>
        <Li><Bold>Status do link:</Bold> rejeita se <code>is_active === false</code> (403) ou <code>expires_at &lt; now</code> (403)</Li>
        <Li><Bold>Whitelist de campos:</Bold> só aceita 14 chaves canônicas — qualquer campo extra (tentativa de injection tipo <code>isAdmin: true</code>) é descartado silenciosamente</Li>
      </ol>

      <H2>22.4. Ciclo Operacional Completo</H2>
      <Table headers={['Fase', 'Onde acontece', 'Quem age']} rows={[
        ['1. Comercial fecha Gateway', '— (offline)', 'Comercial Pagsmile'],
        ['2. Gera link de coleta', '/GestaoSubsellerInfoLinks', 'Admin'],
        ['3. Envia URL por e-mail', '— (manual ou template)', 'Admin'],
        ['4. Gateway preenche em massa', '/SubsellerInfoForm?token=...', 'Pessoa do Gateway (1 pessoa por todos)'],
        ['5. Submit cria SubsellerInfoSubmission', 'publicSubsellerInfoSubmit', 'Sistema'],
        ['6. Compliance/comercial revisa', '/SubsellerInfoRecebidos', 'Analista'],
        ['7. Decide quais entram no pipeline KYC', '— (decisão analítica)', 'Analista'],
        ['8. Gera links KYC individuais SUBSELLER_COMPLIANCE', '/GerenciarSubsellerLinks (Cap. 10)', 'Admin'],
        ['9. Subseller faz KYC completo (V4 ou V5.2)', '/SubsellerQuestionnaire', 'Subseller'],
        ['10. Marca submissão como processed', '/SubsellerInfoRecebidos', 'Analista'],
      ]} />

      <H2>22.5. Status da Submissão</H2>
      <Table headers={['Status', 'Significado', 'Próxima ação esperada']} rows={[
        ['pending', 'Recém-recebida, ainda não revisada', 'Abrir e revisar'],
        ['in_review', 'Em análise — analista marcou que está trabalhando', 'Decidir aprovação ou solicitar mais info'],
        ['processed', 'Revisada e links KYC já foram gerados/enviados', 'Acompanhar conclusão dos KYC individuais'],
        ['archived', 'Antiga, fora da inbox padrão', '—'],
      ]} />

      <H2>22.6. Inbox /SubsellerInfoRecebidos — Funcionalidades</H2>
      <ul className="list-disc ml-6 space-y-1 mb-3">
        <Li><Bold>Agrupamento por Gateway:</Bold> cada Gateway é uma seção expansível, com submissões ordenadas por data desc</Li>
        <Li><Bold>Filtros:</Bold> busca livre (nome Gateway/subseller/CNPJ), status (pending/in_review/processed/archived/all), range de data</Li>
        <Li><Bold>Modal de detalhes:</Bold> mostra todos os 14 campos de cada subseller</Li>
        <Li><Bold>Mudar status + notas:</Bold> dropdown + textarea — grava reviewed_by/reviewed_at automaticamente</Li>
        <Li><Bold>Exportar XLSX:</Bold> 3 modos — individual (uma submissão), consolidado por Gateway (todas as submissões de 1 Gateway), geral (tudo)</Li>
      </ul>

      <H3>22.6.1. Colunas do XLSX</H3>
      <P>Cada linha do XLSX é um subseller. Colunas exportadas:</P>
      <P><code>Gateway · Data Submissão · Quem Preencheu · Email Preenchedor · Razão Social · CNPJ · Modelo Negócio · O Que Vende · Site · Explicação · TPV Mensal · Ticket Médio · Banco · Agência · Conta · Tipo Conta · Titular · CPF/CNPJ Titular · Status · Notas Revisão</code></P>

      <H2>22.7. Diferenças vs Links SUBSELLER_COMPLIANCE (Cap. 10)</H2>
      <Table headers={['Aspecto', 'Coleta (Seção 22)', 'KYC (Seção 10)']} rows={[
        ['Quem preenche', 'Pessoa do Gateway (1 preenche todos)', 'Cada subseller preenche o seu'],
        ['Volume típico', '10-200 subsellers num envio', '1 subseller'],
        ['Campos', '14 (básicos + bancário)', '40-150+ (V4 completo)'],
        ['Validação BDC/CAF', 'Não', 'Pipeline completo'],
        ['Cria OnboardingCase?', 'Não', 'Sim'],
        ['Score de risco?', 'Não', 'Sim (V4 ou V5.2)'],
        ['Branding white-label', 'Não — Pagsmile fixo', 'Sim — opcional logo/cor do Gateway'],
        ['Tipo de OnboardingLink', '— (usa entidade própria)', 'SUBSELLER_COMPLIANCE'],
      ]} />

      <H2>22.8. Boas Práticas para o Analista</H2>
      <ul className="list-disc ml-6 space-y-1 mb-3">
        <Li><Bold>Triagem rápida primeiro:</Bold> marcar como <code>in_review</code> ao abrir, evita 2 analistas trabalharem o mesmo Gateway em paralelo</Li>
        <Li><Bold>Modelos de negócio vetados:</Bold> rejeitar imediatamente subsellers com modelo incompatível (ex: "casino" sem licença, "forex" não regulado) — não vale a pena gastar BDC/CAF nele</Li>
        <Li><Bold>CNPJs inválidos:</Bold> conferir 1-2 CNPJs aleatórios no BdcLookup antes de aprovar uma lista grande — se vários estiverem inativos, recusar a lista inteira</Li>
        <Li><Bold>TPV declarado vs realidade:</Bold> Gateway tende a inflar TPV nas listas. Use isso como sinal — se um subseller declara R$ 500k/mês mas o CNPJ tem 2 meses, é red flag para o KYC posterior</Li>
        <Li><Bold>Exporta XLSX antes de processar em massa:</Bold> consolidado por Gateway permite análise externa (Excel/Sheets) — ordenar por TPV desc para priorizar quais geram link KYC primeiro</Li>
        <Li><Bold>Notas de revisão:</Bold> sempre preencher review_notes com a decisão tomada — fica como auditoria</Li>
      </ul>

      <InfoBox title="Onde acessar no menu" color="blue">
        <p>No menu lateral (Brasil) → seção <Bold>Compliance</Bold>: "Coleta Subsellers (Gateway)" abre <code>/GestaoSubsellerInfoLinks</code> (gerar links) e "Inbox Subsellers (Gateway)" abre <code>/SubsellerInfoRecebidos</code> (revisar submissões). Ambos exigem role admin.</p>
      </InfoBox>
    </S>
  );
}