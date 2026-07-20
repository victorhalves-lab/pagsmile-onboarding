import React from 'react';
import { Sec, H1, H2, H3, P, B, C, CodeBlock, Table, Note, Source } from '../DocPrimitives';

/**
 * Capítulo 18 — Coleta de Informações de Subsellers via Gateway
 *
 * Fluxo PRÉ-KYC: Pin Bank envia um link para o cliente Gateway preencher uma
 * lista de subsellers (informações iniciais). O Gateway preenche em massa.
 * NÃO é o questionário KYC completo — é o "pré-cadastro" que alimenta a
 * análise comercial e dispara depois os links de compliance individuais.
 *
 * Distinção importante:
 *   - Ch10 (DocSubsellers) cobre o questionário INDIVIDUAL do subseller
 *     (subseller_pf ou ComplianceEcommerceV4/Gateway/etc por segmento).
 *   - Este capítulo cobre o passo ANTERIOR: a coleta em massa pelo Gateway
 *     de informações iniciais de TODOS os subsellers que ele quer trazer.
 *
 * Fonte real:
 *   entities/SubsellerInfoCollection.json
 *   entities/SubsellerInfoSubmission.json
 *   functions/publicSubsellerInfoSubmit.js
 *   pages/SubsellerInfoForm.jsx (formulário público)
 *   pages/GestaoSubsellerInfoLinks.jsx (admin — gerar links)
 *   pages/SubsellerInfoRecebidos.jsx (admin — inbox)
 */
export default function Ch18_ColetaSubsellersGateway() {
  return (
    <Sec id="ch-18">
      <H1 num="18">Coleta de Subsellers via Gateway — Fluxo Pré-KYC em Massa</H1>

      <P>Este capítulo documenta um <B>fluxo pré-KYC</B> introduzido para resolver um gargalo comercial: clientes do tipo <B>Gateway/PSP</B> normalmente chegam à Pin Bank com <B>dezenas ou centenas de subsellers</B> para serem cadastrados ao mesmo tempo. Mandar cada um responder o questionário KYC completo (Cap. 10 do Doc KYC) levaria semanas. A solução: gerar um <B>link único</B> em que o Gateway preenche uma <B>lista em massa</B> com informações iniciais de todos os subsellers. Compliance recebe, valida modelo de negócio + volumetria + dados bancários, e SÓ DEPOIS dispara os links individuais de KYC para cada um.</P>

      <Note title="O que ESTE fluxo NÃO é" kind="warn">
        <p>NÃO é o questionário KYC. NÃO substitui o onboarding completo do subseller. NÃO atribui score de risco. É <B>apenas o pré-cadastro</B> que permite ao analista Pin Bank entender o portfólio do Gateway e priorizar quais subsellers entram no pipeline de KYC. O KYC propriamente dito é o fluxo do Cap. 10 (DocSubsellers) — disparado individualmente para cada subseller depois desta triagem inicial.</p>
      </Note>

      <H2 num="18.1">Arquitetura — 2 Entidades + 1 Função + 3 Páginas</H2>

      <Table headers={['Camada', 'Artefato', 'Função']} rows={[
        ['Entidade — link', <C key="1">SubsellerInfoCollection</C>, 'Um link gerado pela Pin Bank para um Gateway específico. Tem unique_token de 192 bits + opcional custom_slug. Contadores: submissions_count + total_subsellers_count + last_submission_at.'],
        ['Entidade — submissão', <C key="2">SubsellerInfoSubmission</C>, 'Cada submissão que o Gateway envia. Contém o array subsellers[] com nome/CNPJ/modelo/oferta/volumetria/dados bancários de cada um. Status pending → in_review → processed → archived.'],
        ['Função pública', <C key="3">publicSubsellerInfoSubmit</C>, 'Recebe o POST público com token + lista de subsellers. Valida link ativo/não-expirado, sanitiza campos, cria SubsellerInfoSubmission, atualiza contadores na collection.'],
        ['Página admin — gerar', <C key="4">/GestaoSubsellerInfoLinks</C>, 'Onde o admin cria links: escolhe Gateway (nome + CNPJ + contato), gera token + slug, copia link, ativa/desativa.'],
        ['Página admin — inbox', <C key="5">/SubsellerInfoRecebidos</C>, 'Onde compliance/comercial revisa submissões: filtra por Gateway, status, busca; vê detalhes de cada subseller; muda status; exporta XLSX (individual ou consolidado).'],
        ['Página pública — formulário', <C key="6">/SubsellerInfoForm</C>, 'Onde o Gateway preenche. Cards repetíveis (default 10, pode adicionar +5/+10). Cada card tem ~14 campos. Submit envia para publicSubsellerInfoSubmit.'],
      ]} />

      <H2 num="18.2">Entidade SubsellerInfoCollection (o "link")</H2>

      <CodeBlock language="js">{`{
  gateway_name: string,              // ex: "Gateway XYZ Pagamentos"
  gateway_cnpj: string,
  gateway_contact_email: string,     // a quem enviar o link
  gateway_contact_name: string,
  unique_token: string,              // 192-bit hex — usado em /SubsellerInfoForm?token=...
  custom_slug: string,               // opcional — para URLs curtas /s/:slug
  notes: string,                     // notas internas Pin Bank
  is_active: boolean (default true), // desligar = link bloqueia novas submissões
  expires_at: datetime,              // opcional — bloqueia após data
  submissions_count: number,         // quantas vezes o Gateway preencheu
  total_subsellers_count: number,    // total acumulado de subsellers
  last_submission_at: datetime,
}`}</CodeBlock>

      <Note title="Por que separar Collection × Submission?" kind="info">
        <p>Um mesmo link pode ser preenchido <B>várias vezes</B> pelo Gateway. Cada vez que ele acessa, preenche uma nova lista, e clica em "Enviar", gera uma <C>SubsellerInfoSubmission</C> nova (não sobrescreve a anterior). Isso permite: (a) Gateway voltar e preencher mais subsellers em lotes; (b) compliance ter histórico imutável de cada envio; (c) contadores na collection mostram volume total do Gateway sem precisar somar manualmente.</p>
      </Note>

      <H2 num="18.3">Entidade SubsellerInfoSubmission</H2>

      <CodeBlock language="js">{`{
  collection_id: string,             // FK para SubsellerInfoCollection
  gateway_name: string,              // snapshot — não muda mesmo se o link for renomeado depois
  submitter_name: string,            // opcional — nome de quem preencheu (pessoa do Gateway)
  submitter_email: string,           // opcional
  subsellers: [
    {
      company_name: string,          // Razão social / Nome fantasia
      cnpj: string,
      business_model: enum,          // ecommerce | marketplace | saas | link_pagamento |
                                     //   infoprodutos | dropshipping | servicos | outro
      what_they_sell: string,        // texto curto
      offer_url: string,             // site / link da oferta
      offer_explanation: string,     // explicação se não houver site
      monthly_tpv: number,           // BRL
      average_ticket: number,        // BRL
      bank_name: string,
      bank_agency: string,
      bank_account: string,
      bank_account_type: enum,       // corrente | poupanca | pagamento
      bank_holder_name: string,
      bank_holder_document: string,  // CPF/CNPJ do titular (pode diferir do CNPJ do subseller)
    }
    // ... N subsellers
  ],
  subsellers_count: number,          // length de subsellers — denormalizado para queries rápidas
  status: enum,                      // pending | in_review | processed | archived
  review_notes: string,              // texto livre do analista
  reviewed_by: string,               // email do analista
  reviewed_at: datetime,
}`}</CodeBlock>

      <H3 num="18.3.1">Status semantics</H3>
      <Table dense headers={['Status', 'Significado', 'Próxima ação']} rows={[
        ['pending', 'Submissão recém-recebida, ainda não revisada', 'Analista compliance/comercial abrir e revisar'],
        ['in_review', 'Em análise — analista marcou para indicar que está trabalhando', 'Decidir se aprova lista, se solicita mais info, se gera links KYC'],
        ['processed', 'Lista revisada e links de KYC individuais já foram gerados/enviados', 'Acompanhar conclusão dos KYC individuais (fluxo do Cap. 10)'],
        ['archived', 'Submissão antiga já tratada — sai da inbox padrão', '—'],
      ]} />

      <H2 num="18.4">Função publicSubsellerInfoSubmit — Linha-a-linha</H2>

      <P>Endpoint público (sem auth) chamado pelo formulário. Localizada em <C>functions/publicSubsellerInfoSubmit.js</C>.</P>

      <Table headers={['Etapa', 'O que faz', 'Erro retornado se falha']} rows={[
        ['1. Valida método HTTP', 'Aceita só POST', '405 Method not allowed'],
        ['2. Valida body', 'Exige token + array subsellers não-vazio', '400 Token obrigatório / Envie ao menos 1 subseller'],
        ['3. Localiza Collection', 'Filtra SubsellerInfoCollection por unique_token', '404 Link inválido ou expirado'],
        ['4. Valida link ativo', 'Bloqueia se is_active === false', '403 Este link foi desativado'],
        ['5. Valida expiração', 'Bloqueia se expires_at < now', '403 Este link expirou'],
        ['6. Sanitiza campos', 'Whitelist de 14 chaves permitidas (allowedKeys) — extras são descartados silenciosamente', '— (não falha, apenas remove campos desconhecidos)'],
        ['7. Exige pelo menos 1 subseller válido', 'Cada subseller precisa ter company_name OU cnpj', '400 Preencha ao menos Nome ou CNPJ em cada subseller'],
        ['8. Cria SubsellerInfoSubmission', 'status="pending" + denormaliza subsellers_count + gateway_name (snapshot)', '500 (sdk error)'],
        ['9. Atualiza contadores na Collection', 'submissions_count++, total_subsellers_count += novos, last_submission_at = now', '500 (sdk error)'],
        ['10. Retorna sucesso', '{ success: true, submission_id, subsellers_count }', '—'],
      ]} />

      <Note title="Whitelist de campos — defesa contra injection" kind="rule">
        <p>O sanitizador (linha 47-60 de publicSubsellerInfoSubmit) só aceita as <B>14 chaves canônicas</B> do schema. Se o Gateway (ou um atacante) tentar enviar campos extras como <C>{`{ "isAdmin": true, "company_name": "..." }`}</C>, o <C>isAdmin</C> é descartado silenciosamente. Também filtra valores <C>undefined</C> / <C>null</C> / <C>''</C> — só passa o que tem conteúdo real.</p>
      </Note>

      <H2 num="18.5">Formulário Público — SubsellerInfoForm.jsx</H2>

      <H3 num="18.5.1">UX — Por que cards repetíveis (não tabela)?</H3>
      <P>Decisão de design: o Gateway preenche <B>cards verticais</B> (default 10, expansível em +5/+10) em vez de tabela horizontal. Razões:</P>
      <ul className="list-disc ml-5 text-[12.5px] text-[#1a1a1a] leading-[1.7]">
        <li><B>14 campos por subseller</B> não cabem em tabela responsiva (impossível em mobile)</li>
        <li>Indicador visual de progresso por card: bordas verdes em cards preenchidos, contador "X de Y cards" no header sticky</li>
        <li>Permite deletar linha individualmente sem confusão</li>
        <li>Cards têm sub-seções visuais: dados básicos → volumetria → conta bancária (3 grupos)</li>
      </ul>

      <H3 num="18.5.2">Estado e validação client-side</H3>
      <Table dense headers={['Comportamento', 'Implementação']} rows={[
        ['Linha "preenchida" (conta no contador)', 'Exige company_name OU cnpj não-vazio'],
        ['Máscara CNPJ', 'Função formatCnpj — formata em XX.XXX.XXX/XXXX-XX em tempo real'],
        ['Validação no submit', 'Filtra rows com (company_name || cnpj) — se 0 resta, toast de erro'],
        ['Conversão para envio', 'monthly_tpv e average_ticket convertidos com Number(); strings vazias viram undefined'],
        ['Carregamento do contexto', 'Via base44.entities.SubsellerInfoCollection.filter({ unique_token }) — leitura pública controlada pelo RLS read: {} aberto'],
        ['Estados terminais', 'loading → carrega contexto · error → link inválido/desativado/expirado · done → tela de sucesso com botão "Enviar mais subsellers" (reset rows e volta ao form)'],
      ]} />

      <H3 num="18.5.3">Branding</H3>
      <P>O Hero do formulário exibe <C>{`Olá, {gateway_name}! 👋`}</C> com gradient azul/verde Pin Bank. <B>Não há suporte a white-label custom</B> (diferente dos links de SUBSELLER_COMPLIANCE do Cap. 10 que permitem logo/cores do Gateway). Justificativa: este é um fluxo pré-KYC interno entre Pin Bank e o Gateway — não é apresentado ao subseller final.</P>

      <H2 num="18.6">Tela Admin — /GestaoSubsellerInfoLinks</H2>

      <P>Onde o admin gera os links. Fluxo:</P>
      <ol className="list-decimal ml-5 space-y-1 text-[12.5px] text-[#1a1a1a] leading-[1.7]">
        <li>Admin clica "Criar novo link"</li>
        <li>Modal de 3 steps (ou seleção rápida se Gateway já existe como Merchant)</li>
        <li>Preenche: gateway_name, gateway_cnpj (com máscara), gateway_contact_name, gateway_contact_email, notes internas, expires_at opcional, custom_slug opcional</li>
        <li>Sistema gera <C>unique_token</C> via <C>crypto.getRandomValues(24)</C> + concatena para URL final</li>
        <li>Modal de sucesso exibe URL completa + botão "Copiar"</li>
        <li>Admin envia URL para o contato do Gateway por e-mail (manual — não há SendEmail automático aqui)</li>
      </ol>

      <P>A página também mostra <B>KPIs no header</B>: total de links, links ativos, total de subsellers já submetidos, # gateways únicos. Lista cada link com badge de status (ativo/desativado/expirado), contadores, last_submission_at, e ações: Copiar URL / Toggle ativo / Ver submissões.</P>

      <H2 num="18.7">Tela Admin — /SubsellerInfoRecebidos (Inbox)</H2>

      <P>Onde compliance/comercial revisa as submissões. Funcionalidades:</P>

      <H3 num="18.7.1">Agrupamento</H3>
      <P>Submissões são <B>agrupadas por Gateway</B>, com cada Gateway expansível. Dentro de cada Gateway, lista submissões ordenadas por data desc, com chips de status colorido.</P>

      <H3 num="18.7.2">Filtros</H3>
      <ul className="list-disc ml-5 text-[12.5px] text-[#1a1a1a]">
        <li>Busca livre (nome Gateway, nome de subseller, CNPJ)</li>
        <li>Filtro de status (pending / in_review / processed / archived / all)</li>
        <li>Range de data (opcional)</li>
      </ul>

      <H3 num="18.7.3">Ações por submissão</H3>
      <Table dense headers={['Ação', 'O que faz']} rows={[
        ['Ver detalhes', 'Abre modal com lista de subsellers e todos os campos'],
        ['Mudar status', 'Dropdown (pending → in_review → processed → archived) + grava reviewed_by/reviewed_at'],
        ['Adicionar review_notes', 'Textarea no modal — gravado para auditoria'],
        ['Exportar XLSX individual', 'Gera planilha apenas dessa submissão (com biblioteca xlsx)'],
        ['Exportar XLSX consolidado por Gateway', 'Junta todas as submissões do Gateway em uma planilha'],
        ['Exportar XLSX geral', 'Junta TODAS as submissões de todos os Gateways num arquivo único'],
      ]} />

      <H3 num="18.7.4">XLSX Schema</H3>
      <P>Colunas exportadas (1 linha = 1 subseller):</P>
      <CodeBlock language="text">{`Gateway | Data Submissão | Quem Preencheu | Email Preenchedor |
Razão Social | CNPJ | Modelo Negócio | O Que Vende | Site | Explicação |
TPV Mensal (BRL) | Ticket Médio (BRL) |
Banco | Agência | Conta | Tipo Conta | Titular | CPF/CNPJ Titular |
Status | Notas Revisão`}</CodeBlock>

      <H2 num="18.8">Ciclo Completo — Da Geração até o KYC</H2>

      <Table headers={['Fase', 'Quem age', 'O que acontece']} rows={[
        ['1. Comercial fecha Gateway', 'Pin Bank comercial', 'Gateway aceita proposta e quer onboardar X subsellers'],
        ['2. Gera link de coleta', 'Admin em /GestaoSubsellerInfoLinks', 'Cria SubsellerInfoCollection + envia URL por e-mail para gateway_contact_email'],
        ['3. Gateway preenche em massa', 'Pessoa do Gateway em /SubsellerInfoForm?token=...', 'Preenche cards com dados de 10/50/200 subsellers ao longo de dias'],
        ['4. Submit', 'Gateway clica "Enviar"', 'publicSubsellerInfoSubmit cria SubsellerInfoSubmission status="pending"'],
        ['5. Compliance/comercial revisa', '/SubsellerInfoRecebidos', 'Filtra modelos de negócio incompatíveis, valida CNPJs, prioriza por TPV'],
        ['6. Decisão por subseller', 'Analista', 'Para cada subseller aprovado, marca para gerar link KYC individual'],
        ['7. Gera links KYC individuais', 'Admin em /GerenciarSubsellerLinks (Cap. 10)', 'Cria OnboardingLink tipo SUBSELLER_COMPLIANCE com parentMerchantId = Gateway'],
        ['8. Subseller faz KYC completo', 'Subseller em /SubsellerQuestionnaire', 'Fluxo completo do Cap. 10 — escolhe PF/PJ, segmento, responde V4, faz docs+CAF'],
        ['9. Marca submissão como processed', 'Analista em /SubsellerInfoRecebidos', 'Status muda para processed quando todos os subsellers da lista entraram em KYC'],
      ]} />

      <H2 num="18.9">Diferenças vs Links SUBSELLER_COMPLIANCE (Cap. 10)</H2>

      <Table headers={['Aspecto', 'Coleta Subsellers (Cap. 18)', 'KYC Subseller (Cap. 10)']} rows={[
        ['Quem preenche', 'Pessoa do Gateway (1 pessoa preenche todos)', 'O próprio subseller (cada um preenche o seu)'],
        ['Volume típico por preenchimento', '10-200 subsellers de uma vez', '1 subseller'],
        ['Campos por subseller', '14 (dados básicos + bancário)', '40-150+ (V4 completo por segmento)'],
        ['Validação BDC/CAF', 'Nenhuma — é só coleta', 'Pipeline completo autoEnrichOnboarding (BDC + CAF + SENTINEL)'],
        ['Cria OnboardingCase?', 'NÃO', 'SIM'],
        ['Atribui score V4 ou V5.2?', 'NÃO', 'SIM'],
        ['Entidades criadas', 'SubsellerInfoSubmission', 'OnboardingCase + Merchant + QuestionnaireResponse + DocumentUpload + ComplianceScore'],
        ['Branding white-label', 'Não — branding Pin Bank fixo', 'Sim — logo/cor/slug do Gateway opcional'],
        ['Tipo de link no OnboardingLink', 'Não usa OnboardingLink', 'linkType = SUBSELLER_COMPLIANCE'],
        ['Próximo passo', 'Disparar KYC individual (Cap. 10)', 'Decisão de risco e ativação'],
      ]} />

      <Note title="Por que separar em dois fluxos?" kind="info">
        <p>Inverter responsabilidades. No Cap. 18, é o <B>Gateway que preenche em massa</B> por questão prática (não dá pra fazer 200 sellers responderem KYC ao mesmo tempo do zero). No Cap. 10, é <B>cada subseller que preenche o seu</B> com a profundidade necessária (BACEN-aderente). A coleta pré-KYC funciona como funil — Pin Bank valida modelos de negócio compatíveis ANTES de queimar créditos BDC/CAF em subsellers que não passariam.</p>
      </Note>

      <H2 num="18.10">Métricas Operacionais Sugeridas</H2>

      <P>Métricas que o time comercial/compliance deve acompanhar (não implementadas como dashboard ainda — sugestão para Fase 4):</P>
      <ul className="list-disc ml-5 text-[12.5px] text-[#1a1a1a] leading-[1.7]">
        <li><B>Conversion rate Coleta → KYC iniciado:</B> % de subsellers da Coleta que efetivamente recebem link SUBSELLER_COMPLIANCE</li>
        <li><B>Conversion rate Coleta → KYC aprovado:</B> % que chega até "Aprovado" no V4/V5.2</li>
        <li><B>Tempo médio Coleta → KYC iniciado:</B> dias entre submit da Coleta e geração do primeiro link KYC</li>
        <li><B>Taxa de rejeição na triagem:</B> % de subsellers da Coleta que o analista marca como "não vamos onboarda-los" (ex: modelo de negócio incompatível, CNPJ inválido na consulta)</li>
        <li><B>TPV total potencial × TPV onboardado:</B> soma do TPV declarado na Coleta vs soma do TPV dos subsellers que terminaram KYC</li>
      </ul>

      <Source files={[
        'entities/SubsellerInfoCollection.json',
        'entities/SubsellerInfoSubmission.json',
        'functions/publicSubsellerInfoSubmit.js',
        'pages/SubsellerInfoForm.jsx (formulário público)',
        'pages/GestaoSubsellerInfoLinks.jsx (admin gerar links)',
        'pages/SubsellerInfoRecebidos.jsx (admin inbox)',
        'lib/publicRoutes.js (rota /SubsellerInfoForm registrada como pública)',
        'App.jsx (Route /SubsellerInfoForm em PublicRoutes)',
        'layout.jsx (entradas "Coleta Subsellers (Gateway)" e "Inbox Subsellers (Gateway)" no menu Compliance)',
      ]} />
    </Sec>
  );
}