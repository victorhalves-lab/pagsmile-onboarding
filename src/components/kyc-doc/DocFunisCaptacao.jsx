import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, Table, InfoBox } from './DocHelpers';

/**
 * Seção 19 — Funis de Captação de Leads (Pré-KYC)
 * Documenta MICROSCOPICAMENTE os dois questionários públicos que alimentam
 * a entidade Lead antes do KYC/KYB acontecer:
 *  - Lead Pin Bank V5 (cartão, 12 etapas)
 *  - Lead PIX V4 (PIX, 7 etapas)
 *  - Fechamento Landing (consolidação rápida)
 *
 * Fontes (todas lidas linha-a-linha — nada aqui é especulação):
 *   pages/QuestionarioLeadsPagsmile.jsx
 *   pages/LeadPixV4.jsx
 *   pages/FechamentoLandingPage.jsx
 *   components/lead-pagsmile/* (Steps + leadV5Validators + pagsmileQuestionnaireData)
 *   components/lead-pix-v4/*
 *   functions/publicLeadSubmit.js
 *   functions/onLeadCreatedEnrich.js
 *   functions/bdcEnrichLead.js
 *   functions/analyzeLeadQualifier.js
 *   functions/analyzeLeadRiskAdvanced.js
 */
export default function DocFunisCaptacao() {
  return (
    <S>
      <H1>19. Funis de Captação de Leads — Pré-KYC Microscópico</H1>

      <P>Antes de qualquer caso entrar no pipeline KYC/KYB descrito nas Seções 1–18, ele passa por um <Bold>funil de captação</Bold>: um questionário público que produz a entidade <code>Lead</code>. Este capítulo documenta passo-a-passo cada funil ativo, cada etapa, cada validação, cada flag silenciosa e cada enriquecimento automático que roda em background.</P>

      <InfoBox title="Por que documentar o funil de captação no manual KYC?">
        <p>O Lead é a fonte primária de dados declarados que serão posteriormente <strong>cross-validados</strong> pela BDC e CAF na Etapa 4 do pipeline (Seção 8). Cada divergência entre declarado e confirmado vira finding do SENTINEL. Documentar o funil em nível microscópico torna explícito <em>qual campo declarado tem qual fonte de verdade</em> — base para auditorias regulatórias e para o time de compliance saber exatamente o que pedir em revisão manual.</p>
      </InfoBox>

      <H2>19.1. Mapa dos 3 Funis Ativos</H2>
      <Table headers={['Funil', 'Rota pública', 'Etapas', 'Quando usar', 'Resultado']} rows={[
        ['Lead Pin Bank V5', '/QuestionarioLeadsPagsmile?ref=:code', '12', 'Cliente que processa CARTÃO. Pode ser introducer, link direto ou orgânico.', 'Lead com businessSubCategory ∈ {gateway, marketplace, plataformas_verticais, ecommerce, dropshipping, infoprodutos, saas, educacao, link_pagamento, mpe}'],
        ['Lead PIX V4', '/LeadPixV4?ref=:code', '7', 'Cliente que processa apenas PIX. Fluxo enxuto sem perguntas de cartão.', 'Lead com businessSubCategory ∈ {pix_merchant, pix_intermediario}'],
        ['Fechamento Landing', '/FechamentoLandingPage?token=:t', '3', 'Cliente vindo de landing page de proposta padrão — preencheu mínimo, agora consolida.', 'Lead + Proposal acoplado, segue direto para KYC.'],
      ]} />

      <H2>19.2. Lead Pin Bank V5 — As 12 Etapas Microscópicas</H2>
      <P>Hospedado em <code>pages/QuestionarioLeadsPagsmile.jsx</code>. Cada etapa é um componente focado em <code>components/lead-pagsmile/Step*.jsx</code>. A ordem abaixo é a ordem real renderizada no <code>switch</code> de <code>step</code> (índices 0..11), e é também a ordem dos blocos <code>if (step === N)</code> em <code>leadV5Validators.js</code>. Mudanças nessa ordem requerem atualização sincronizada nos dois arquivos.</P>

      <Table headers={['#', 'Etapa', 'Componente', 'Campos coletados', 'Validações de bloqueio (não passa sem)']} rows={[
        ['1', 'Tipo de Negócio', 'StepSegmento', '`segmento` (1 dos 10)', 'segmento obrigatório.'],
        ['2', 'Dados da Empresa', 'StepDadosEmpresa', '`cnpj`, `razaoSocial`, `nomeFantasia`, `presencaDigital` (URL ou @ ou "Não possuo")', 'CNPJ com dígito verificador válido (isValidCnpj). Razão Social ≥2 chars. Nome Fantasia ≥2 chars. Presença digital ≥2 chars. Autocomplete dispara brasilApiCnpj + bdcEnrichLead em background.'],
        ['3', 'Endereço', 'StepEndereco', '`cep`, `rua`, `numero`, `bairro`, `cidade`, `estado`, `_enderecoConfirmado`', 'Apenas a flag `_enderecoConfirmado`. Os campos vêm pré-preenchidos pela BDC/Receita; cliente confirma.'],
        ['4', 'Contato', 'StepContato', '`email`, `phone`, `contactName`, `cargo`, `cargoOutro`', 'E-mail RFC 5322 válido. Telefone BR 10/11 dígitos com DDD ∈ [11..99]. contactName ≥2 chars. cargo obrigatório; se "Outro", cargoOutro ≥2 chars.'],
        ['5', 'Modelo de Negócio', 'StepModeloNegocio', '`modeloCobranca`, `descricaoNegocio` (mín 10 chars), `antifraude` (cond.), `plataforma` (cond.) + campos condicionais por segmento', 'modeloCobranca obrigatório. descricaoNegocio ≥10 chars. Se segmento ∈ ANTIFRAUDE_SEGMENTS → antifraude obrigatório. Campos condicionais SEGMENT_REQUIRED_FIELDS validados (ex: gateway exige licencaBCB+splitPagamento; saas exige churn+pricingSaas; etc).'],
        ['6', 'Composição da Operação', 'StepMixOperacao', '`mixOperacao` = { ecommerce, dropshipping, infoproduto, saas, educacao, outros: [{nome, percentual}] }', 'Soma TOTAL deve ser exatamente 100%. Cada "Outros" exige nome ≥2 chars E percentual >0. Implementado pelo MixOperacaoSlider.'],
        ['7', 'Volumetria', 'StepVolumetria', '`tpvMensal`, `ticketMedio`, `transacoesMes`, `faturamentoAnual` (range), `funcionarios`', 'tpvMensal > 0 E ≥ R$ 50.000 (filtro de qualificação). ticketMedio > 0. faturamentoAnual obrigatório. funcionarios obrigatório.'],
        ['8', 'Distribuição', 'StepDistribuicao', '`jaProcessa`, `distribuicao` { credito, debito, pix, boleto } (se já processa) OU `distribuicaoDesejada` (se está começando), `distribuicaoParcelamento` { avista, de2a6x, de7a12x, de13a21x }', 'jaProcessa obrigatório. Se "Sim, já processo": distribuicao soma 100% E distribuicaoParcelamento soma 100%. Se "Não, estou começando": distribuicaoDesejada soma 100%.'],
        ['9', 'Taxas Atuais (PULA se NÃO processa)', 'StepTaxasAtuais', '`mdrAvista`, `mdr2a6x`, `mdr7a12x`, `mdrDebito`, `taxaPix`, `taxaBoleto`, `taxaAntecipacao`, `feeTransacao`, `custoAntifraude`, `taxa3ds`', 'Se distribuição tem cartão: 4 taxas MDR obrigatórias. Se tem PIX: taxaPix. Se tem boleto: taxaBoleto. taxaAntecipacao + feeTransacao + custoAntifraude + taxa3ds sempre obrigatórias quando "Sim, já processo".'],
        ['10', 'Processador (PULA se NÃO processa)', 'StepProcessadorAtual', '`processadorAtual` (1 dos 14), `satisfacao`, `dorAtual` (multi)', 'Sem validações bloqueantes — pesquisa qualitativa.'],
        ['11', 'Compliance', 'StepComplianceRisco', '`encerrado` (Nunca/1x/+1x), `chargeback` (cond.), `medPix` (cond.)', 'encerrado obrigatório. Se já processa cartão E `distribuicao.credito > 0`: chargeback obrigatório. Se distribuicao tem pix: medPix obrigatório.'],
        ['12', 'Fechamento', 'StepFechamento', '`urgencia`, `crescimento`, `comoConheceu` (informativo)', 'urgencia obrigatório. crescimento obrigatório.'],
      ]} />

      <InfoBox title="Skip lógico de Etapas 9 e 10">
        <p>Quando <code>jaProcessa = "Não, estou começando"</code>, o cliente NÃO tem taxas atuais nem processador atual para informar. A função <code>nextStep()</code> em <code>QuestionarioLeadsPagsmile.jsx</code> aplica: <em>se proximo === 8 (Taxas) ou 9 (Processador) e NÃO processa, pula para 10 (Compliance)</em>. <code>prevStep()</code> faz o mesmo no inverso. O total de etapas <strong>renderizadas</strong> nesses casos é 10, não 12.</p>
      </InfoBox>

      <H2>19.3. Estado Persistente — Autosave & Draft Recovery</H2>
      <P>O hook <code>useLeadV5Autosave</code> persiste o <code>form</code> e o <code>step</code> atual em <code>localStorage</code> a cada mudança (debounced 600ms). Chave: <code>lead_v5_draft_{`{linkCode}`}</code>. Se o cliente fecha a aba e retorna no mesmo navegador:</P>
      <ul className="list-disc ml-6 space-y-1 mb-3">
        <Li>Componente <code>DraftRecoveryBanner</code> aparece no topo com data do último save e botões "Restaurar" / "Descartar".</Li>
        <Li>Restaurar: <code>setForm(recoverable.form)</code> + <code>setStep(recoverable.step)</code>. Toast "Rascunho restaurado!".</Li>
        <Li>Descartar: limpa <code>localStorage</code> e começa fresh.</Li>
        <Li>Submit bem-sucedido limpa o draft via <code>clearDraft()</code>.</Li>
      </ul>

      <H2>19.4. Cálculo de Score Cliente-Side</H2>
      <P>No submit, o frontend calcula 3 valores antes de enviar ao backend:</P>

      <H3>19.4.1. Score Declarativo (calculateLeadScore)</H3>
      <P>Base 40 pontos. Bônus aditivos:</P>
      <Table headers={['Condição', 'Bônus']} rows={[
        ['E-mail corporativo (não está em FREE_EMAIL_DOMAINS)', '+10'],
        ['Cargo ∈ { Sócio/Proprietário, CEO/Diretor }', '+10'],
        ['TPV mensal ≥ R$ 200.000', '+10'],
        ['Subsellers ∈ { 1k-5k, >5k }', '+5'],
        ['Urgência = "Imediato (<1 semana)"', '+15'],
        ['Crescimento = "Mais que dobrar (>100%)"', '+5'],
        ['Satisfação ∈ { Insatisfeito, Muito insatisfeito }', '+5'],
      ]} />
      <P>Penalidades:</P>
      <Table headers={['Flag', 'Penalidade']} rows={[
        ['TERMINATED_BEFORE (já foi encerrado por adquirente)', '−15'],
        ['HIGH_CHARGEBACK (>2% crítico)', '−10'],
        ['HIGH_MED_PIX (>1%)', '−10'],
        ['HIGH_REFUND_POLICY (30 dias ou condicional)', '−5'],
        ['JUST_QUOTING (apenas cotando)', '−5'],
      ]} />
      <P>Score final clamp [0, 100]. Mapeado para label: ≥80 Muito Quente | ≥60 Quente | ≥40 Morno | &lt;40 Frio.</P>

      <H3>19.4.2. Flags Silenciosas (calculateSilentFlags) — 16 flags</H3>
      <P>Flags são booleanos calculados ao submeter. Não bloqueiam o envio — alimentam o relatório SENTINEL e o ranking comercial:</P>
      <Table headers={['#', 'Flag', 'Disparada quando']} rows={[
        ['1', 'PERSONAL_EMAIL', 'Domínio do e-mail está em FREE_EMAIL_DOMAINS (gmail, hotmail, etc).'],
        ['2', 'NO_WEBSITE', 'presencaDigital é "Não possuo" ou vazio.'],
        ['3', 'NO_ANTIFRAUDE', 'antifraude="Não possuo" E segmento ∈ {ecommerce, dropshipping} E TPV > R$100k.'],
        ['4', 'HIGH_CHARGEBACK', 'chargeback = ">2% (crítico)".'],
        ['5', 'HIGH_MED_PIX', 'medPix = ">1%".'],
        ['6', 'TERMINATED_BEFORE', 'encerrado ≠ "Nunca".'],
        ['7', 'TPV_EXCEEDS_REVENUE', 'TPV mensal × 12 > faturamentoAnual declarado (range mapeado para teto).'],
        ['8', 'NEW_MERCHANT', 'jaProcessa = "Não, estou começando".'],
        ['9', 'CNPJ_SITUACAO_IRREGULAR', 'cnpjData.situacao_cadastral ≠ "ATIVA" (vinda do brasilApiCnpj).'],
        ['10', 'EMPRESA_NOVA', 'cnpjData.data_abertura: meses < 6.'],
        ['11', 'SETOR_REGULADO', 'CNAE divisão ∈ {64, 65, 66} (financeiro/seguros).'],
        ['12', 'CNAE_MISMATCH', 'Setado pelo componente CnaeCoherenceAlert (futuro).'],
        ['13', 'VOLUME_INCOMPATIVEL', 'Reservada (porte vs volume mapping — não implementado ainda).'],
        ['14', 'JUST_QUOTING', 'urgencia = "Estou apenas cotando".'],
        ['15', 'LOW_TICKET', 'ticketMedio > 0 E < R$10.'],
        ['16', 'HIGH_REFUND_POLICY', 'garantia ∈ { 30 dias, Garantia condicional }.'],
      ]} />

      <H3>19.4.3. Score Enriquecido pela BDC (calculateBDCEnrichedScore)</H3>
      <P>Quando o cliente digita o CNPJ na Etapa 2, o componente <code>StepDadosEmpresa</code> dispara via hook <code>useBdcCnpjEnrichment</code> uma chamada não-bloqueante a <code>bdcEnrichLead</code> que retorna um payload reduzido (basic_data + activity_indicators). Esse payload alimenta o cálculo do <code>bdcLeadScore</code> aplicando ajustes ao score declarativo:</P>
      <ul className="list-disc ml-6 space-y-1 mb-3">
        <Li>+ Empresa ATIVA com idade &gt; 2 anos: bônus.</Li>
        <Li>+ RAIS positivo (empregados &gt; 0): bônus.</Li>
        <Li>+ Domínio com SSL ativo: bônus.</Li>
        <Li>− Shell Company Score &gt; 50%: penalidade.</Li>
        <Li>− Atividade &lt; 30%: penalidade.</Li>
        <Li>− CNPJ INAPTA/SUSPENSA/BAIXADA: penalidade severa.</Li>
      </ul>
      <P>Saída: <code>{`{ finalScore, bdcScore, activeFlags, crossValidation }`}</code>. Persistido em <code>Lead.bdcLeadScore</code>, <code>Lead.bdcFlags</code>, <code>Lead.bdcCrossValidation</code>.</P>

      <H2>19.5. Submit — Função Pública publicLeadSubmit</H2>
      <P>O frontend chama <code>callPublicFunction('publicLeadSubmit', payload)</code> — fluxo SDK-free para evitar problemas de auth em rotas públicas. Payload tem campo <code>kind</code>:</P>
      <Table headers={['kind', 'Quando', 'Comportamento backend']} rows={[
        ['lead', 'Sem introducer (orgânico ou link direto Pin Bank).', 'Cria Lead. Dispara onLeadCreatedEnrich.'],
        ['introducer_lead', 'onboardingLink.introducerId presente.', 'Cria IntroducerLead + Lead vinculado via introducerId/introducerReferralCode/introducerName. Notifica introducer.'],
      ]} />

      <H3>19.5.1. Campos persistidos em Lead</H3>
      <Table headers={['Grupo', 'Campos']} rows={[
        ['Identificação', 'email, fullName, cpfCnpj, phone, companyName, contactName, contactRole, website'],
        ['Status & origem', 'status="questionario_preenchido", origemLead, onboardingLinkCode, businessSubCategory'],
        ['Volumetria', 'tpvMensal, ticketMedio, transacoesMes, expectativaCrescimento'],
        ['Score Pin Bank', 'leadQualifierScore (final), leadQualifierLevel ∈ {EXCELENTE, BOM, REGULAR, FRACO}'],
        ['Score BDC', 'bdcLeadScore, bdcScoreLevel, bdcFlags, bdcCrossValidation, bdcEnrichmentDate'],
        ['Snapshot', 'questionnaireData (JSON com TODAS as respostas + _silentFlags + _declarativeScore + _bdcScore + _leadScore + _cnpjEnrichment)'],
        ['Expectativa', 'expectedRates { mdr1x, mdr2a6x, mdr7a12x, antecipacao, feeTransacao, antifraude, taxa3ds, pix }'],
        ['Protocolo', 'protocolo (PSM-YYYY-NNNNN), lastInteractionDate'],
      ]} />

      <H2>19.6. Pipeline de Enriquecimento Automático do Lead</H2>
      <P>Após o submit, o orquestrador <code>onLeadCreatedEnrich</code> roda <strong>antes</strong> de qualquer ação humana ou caso KYC ser criado. Ele segue um pipeline próprio de 4 etapas, paralelo ao pipeline KYC da Seção 8:</P>

      <Table headers={['Step', 'Função', 'O que faz', 'Tempo']} rows={[
        ['1', 'bdcEnrichLead', 'Consulta BDC com datasets agressivos (basic_data, kyc, owners_kyc, processes, activity_indicators, domains, addresses, financial_market). Persiste em Lead.bdcEnrichmentData.', '3-6 seg'],
        ['2', 'bdcDeepDueLead', 'Quando o lead é "alto valor" (TPV > R$500k OU segmento ∈ {gateway, marketplace, plataforma_vertical}), faz deep due diligence (processes detail, sanctions, news, reputation). Persiste em Lead.bdcDueReport.', '5-12 seg'],
        ['3', 'analyzeLeadQualifier', 'IA (Lead Qualifier Agent) analisa o lead com TODOS os dados (declarado + BDC) e classifica maturidade comercial. Persiste em Lead.leadQualifierLevel + Lead.leadQualifierReport.', '8-15 seg'],
        ['4', 'analyzeLeadRiskAdvanced', 'Análise PRELIMINAR de risco usando IA — gera Lead.iaRiskScore (0-100) + Lead.iaDecision ∈ {AUTO_APROVAR, REVISAO_MANUAL, REJEITAR, PENDENTE} + Lead.iaPriority. Persiste em Lead.iaAnalysisReport.', '10-20 seg'],
      ]} />

      <InfoBox title="Diferença CRÍTICA entre análise de Lead e análise de OnboardingCase">
        <p>O <strong>Lead</strong> é uma análise <em>preliminar e comercial</em> — usa IA livremente para informar o vendedor. É consultivo, não tem poder regulatório. Já o <strong>OnboardingCase</strong> é a análise KYC oficial — Data-First, decisão determinística (Seções 1-18). Quando o lead converte em OnboardingCase, todos os dados BDC já coletados na Etapa 1 do pipeline do Lead são <em>reutilizados</em> pela função <code>bdcEnrichCase</code> (cache hit) — não pagamos a BDC duas vezes pelo mesmo CNPJ.</p>
      </InfoBox>

      <H2>19.7. Lead PIX V4 — As 7 Etapas</H2>
      <P>Hospedado em <code>pages/LeadPixV4.jsx</code>. Componentes em <code>components/lead-pix-v4/Step*.jsx</code>. É o funil enxuto para clientes que processam apenas PIX:</P>

      <Table headers={['#', 'Etapa', 'Componente', 'Conteúdo']} rows={[
        ['1', 'Tipo de Negócio PIX', 'StepTipoNegocio', 'Escolha entre "PIX Merchant" (recebe PIX direto) ou "PIX Intermediário" (intermedia PIX para terceiros).'],
        ['2', 'Dados da Empresa', 'StepDadosEmpresa', 'CNPJ + Razão Social + Nome Fantasia + presença digital. Mesmo autocomplete CNPJ + bdcEnrichLead.'],
        ['3', 'Modelo de Negócio', 'StepModeloNegocio', 'Descrição do negócio + modelo de cobrança PIX (QR estático, QR dinâmico, Pix Cobrança via API, link de pagamento PIX).'],
        ['4', 'Volume PIX', 'StepVolumePix', 'tpvPixMensal, ticketMedioPix, transacoesPixMes.'],
        ['5', 'Situação Atual', 'StepSituacaoAtual', 'Já processa PIX? Se sim: processador PIX atual (Mercado Pago, Asaas, BCB direto, etc.) + taxa atual.'],
        ['6', 'Serviços Complementares', 'StepServicosComplementar', 'Se vai querer: split de pagamento, conciliação automática, antifraude PIX, MED API.'],
        ['7', 'Contato', 'StepContato', 'E-mail + telefone + nome + cargo. Mesma validação de RFC 5322 e telefone BR.'],
      ]} />

      <P>Submit: mesma função <code>publicLeadSubmit</code> com <code>questionnaireData.origem = 'lead_pix_v4'</code>. <code>businessSubCategory</code> mapeada para <code>pix_merchant</code> ou <code>pix_intermediario</code>. Pipeline de enriquecimento idêntico.</P>

      <H2>19.8. Fechamento Landing — Funil Acoplado a Proposta Padrão</H2>
      <P>Hospedado em <code>pages/FechamentoLandingPage.jsx</code>. Usado quando o cliente vem de uma <em>landing page de proposta padrão</em> (URL <code>/pp/:slug</code>) e quer fechar imediatamente. Em vez de preencher 12 etapas, ele preenche apenas 3 blocos consolidados:</P>
      <Table headers={['Bloco', 'Componente', 'Conteúdo']} rows={[
        ['1. Empresa', 'FechamentoStep1CompanyForm', 'CNPJ (autocomplete) + Razão Social + Nome Fantasia + e-mail + telefone + contato.'],
        ['2. Volumetria', 'FechamentoStep2Volumetria', 'TPV + ticket médio + transações/mês + faturamento anual.'],
        ['3. Modelo de Negócio', 'FechamentoStep3ModeloNegocio', 'Modelo de cobrança + descrição + plataforma (se aplicável).'],
      ]} />
      <P>Submit via <code>publicFechamentoSubmit</code> — cria <code>Lead</code> + <code>Proposal</code> acoplada (já com taxas pré-aprovadas da landing) + <code>OnboardingCase</code> rascunho com status "Pendente" pronto para o cliente ir direto ao Compliance V4. Reduz fricção de conversão para clientes que já vieram convencidos.</P>

      <H2>19.9. Tabela de Conversão Lead → OnboardingCase</H2>
      <P>Quando um lead é qualificado como "EXCELENTE" ou "BOM" e o cliente clica no link de proposta aceita, o sistema converte automaticamente <code>Lead</code> em <code>OnboardingCase</code>:</P>
      <ul className="list-disc ml-6 space-y-1 mb-3">
        <Li>Cria <code>Merchant</code> com dados do Lead (cpfCnpj, razaoSocial, email, phone).</Li>
        <Li>Cria <code>OnboardingCase</code> com <code>merchantId</code>, <code>questionnaireTemplateId</code> resolvido pelo segmento (via complianceModelRegistry), <code>status="Pendente"</code>.</Li>
        <Li>Atualiza <code>Lead.status="kyc_iniciado"</code> e <code>Lead.onboardingCaseId</code>.</Li>
        <Li>Pré-popula <code>QuestionnaireResponse</code> com respostas que casam com perguntas do template (CNPJ, razão social, endereço, e-mail, telefone, etc.) — reduz retrabalho do cliente.</Li>
      </ul>

      <H2>19.10. Telas Internas que Operacionalizam os Funis</H2>
      <Table headers={['Tela', 'Rota', 'Função']} rows={[
        ['Links de Questionários (Leads)', '/LinksQuestionariosLeads', 'Admin gera links Lead V5/PIX V4 com tracking (UTM + introducerId). Cada link gera um OnboardingLink com uniqueCode.'],
        ['Questionários Recebidos (Leads)', '/QuestionariosLeads', 'Lista de Leads recebidos com KPIs por origem, segmento, leadQualifierLevel.'],
        ['Pipeline Comercial', '/PipelineComercial', 'Kanban Lead → Em Contato → Proposta Enviada → Aceita/Recusada → KYC. Drag-and-drop entre colunas atualiza Lead.status.'],
        ['Lead Details', '/LeadDetails?id=...', 'Dossiê completo do Lead: respostas, BDC enrichment, lead qualifier report, IA risk advanced, propostas associadas, atividade.'],
        ['Lead Management', '/LeadManagement', 'CRUD avançado de leads para casos especiais (atribuir vendedor, marcar como perdido, mesclar duplicatas).'],
        ['Process Meeting Notes', '/ProcessMeetingNotes', 'Robô de questionário: cole transcrição de reunião → IA extrai respostas e cria Lead automaticamente.'],
      ]} />

      <H2>19.11. Auditoria & Compliance dos Funis</H2>
      <ul className="list-disc ml-6 space-y-1 mb-3">
        <Li><Bold>LGPD:</Bold> O cliente declara consentimento ao iniciar o questionário. <code>questionnaireData</code> contém timestamp do consentimento (campo <code>_consentimentoDateTime</code> quando usado).</Li>
        <Li><Bold>Tracking:</Bold> <code>OnboardingLink.clickCount</code> e <code>OnboardingLink.submissionCount</code> são incrementados via <code>trackLandingPageEvent</code>.</Li>
        <Li><Bold>Erro logging:</Bold> Falhas de submit invocam <code>logPublicClientError</code> que persiste em <code>IntegrationLog</code> com stack trace + URL + userAgent — facilita pós-mortem.</Li>
        <Li><Bold>Anti-spam:</Bold> Backend <code>publicLeadSubmit</code> faz dedupe por (email, cpfCnpj) nos últimos 30 dias. Submissão duplicada atualiza Lead existente em vez de criar duplicata.</Li>
      </ul>

      <InfoBox title="Manutenção da paridade Funil ↔ Validator ↔ Renderer">
        <p>A ordem das etapas no array <code>STEPS</code> em <code>QuestionarioLeadsPagsmile.jsx</code> deve <strong>sempre</strong> casar com:<br/>
        (a) os índices do <code>switch</code> de renderização <code>{`{step === N && <StepX />}`}</code>;<br/>
        (b) os blocos <code>{`if (step === N)`}</code> em <code>leadV5Validators.js</code>;<br/>
        (c) os números na lógica de skip de <code>nextStep()</code> e <code>prevStep()</code> (atualmente: índices 8 e 9 são skipados quando <code>jaProcessa = "Não, estou começando"</code>).<br/>
        Qualquer reorganização de etapas exige alterar os 3 lugares simultaneamente. A última reorganização movida foi <em>Composição da Operação</em> da posição 2 para 6 (logo após Modelo de Negócio).</p>
      </InfoBox>
    </S>
  );
}