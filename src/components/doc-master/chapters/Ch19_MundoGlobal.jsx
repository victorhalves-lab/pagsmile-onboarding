import React from 'react';
import { Sec, H1, H2, H3, P, B, C, CodeBlock, Table, Note, Source } from '../DocPrimitives';

/**
 * Capítulo 19 — Mundo Global (USD / Multi-país)
 *
 * Documenta o trilho paralelo internacional da Pagsmile:
 * leads em USD, propostas multi-moeda, KYC trilíngue, catálogo
 * de canais por país, simulador de pricing.
 */
export default function Ch19_MundoGlobal() {
  return (
    <Sec id="ch-19">
      <H1 num="19">Mundo Global — USD / Multi-país / Trilíngue</H1>

      <P>O <B>Mundo Global</B> é um <B>trilho paralelo</B> ao fluxo Brasil. Ele atende clientes <B>internacionais</B> (LATAM, APAC, Africa, MEA, Turkey) que querem rodar pagamentos em múltiplos países através da Pagsmile. Toda a operação é em <B>USD</B>, com propostas e questionários disponíveis em <B>3 idiomas</B> (PT, EN, ZH), e o catálogo é organizado por <B>país × provider × método de pagamento</B>. NÃO compartilha entidades com o trilho Brasil — usa um conjunto próprio de Global*Entities e funções <C>publicGlobal*</C>.</P>

      <Note title="Como ativar o contexto Global" kind="info">
        <p>Na sidebar principal há um switch <B>Brasil ↔ Global ↔ Unificado</B> (componente <C>SidebarContextSwitch</C>). O estado fica em <C>localStorage</C> via <C>lib/global/globalContext.js</C>. Quando o usuário navega para qualquer página do conjunto <C>GLOBAL_PAGES</C>, o contexto é forçado automaticamente. A sidebar troca o menu inteiro — Brasil some, Global aparece.</p>
      </Note>

      <H2 num="19.1">Arquitetura — 5 Entidades + 4 Funções Públicas</H2>

      <Table headers={['Camada', 'Artefato', 'Função']} rows={[
        ['Entidade — lead', <C key="1">GlobalQuestionnaire</C>, 'O "lead" Global. Captura contato, business model, MCC, TPV em USD, ticket médio, mix Visa/MC/AMEX, parceiro atual, taxas concorrentes, target markets, settlement esperado. pipeline_status: leads → proposal_made → proposal_accepted/counter/lost'],
        ['Entidade — proposta', <C key="2">GlobalProposal</C>, 'Proposta comercial. Pricing models: cross_border_interchange (Interchange++ em USD) ou local_payments (taxa por país × canal × método). Inclui fees padrão: setup_fee, refund_fee, chargeback_fee, risk_control_fee (USD/trx), settlement_fee_usd (wire), fx_percentage (spread cambial), rolling_reserve'],
        ['Entidade — catálogo de canais', <C key="3">GlobalCountryChannel</C>, 'Catálogo mestre país × provider × método. Importado da planilha "GLOBAL PAYMENTS PUBLIC VERSION". Cada linha contém: provider (CONFIDENCIAL — não aparece em proposta pública), método, integration_type, limites, default rates, indústrias HR aceitas, requisitos regulatórios'],
        ['Entidade — taxas regulatórias', <C key="4">GlobalCountryFee</C>, 'VAT, IOF, GMF, Withholding por país. Renderizado automaticamente nas propostas locais com label em 3 idiomas'],
        ['Entidade — KYC', <C key="5">GlobalComplianceQuestionnaire</C>, 'Questionário KYC/KYB internacional. Capta legal_business_name, registered_country, ubos[], directors[], q_sanctions/q_pep (4 perguntas críticas), uploads de docs (corporate, bank statement, IDs dos UBOs, ownership chart). Tri-língue'],
        ['Função pública', <C key="6">publicGlobalProposal</C>, 'Endpoint do link público /GlobalPublicProposal. Ações: load · accept · reject · counter (cria contraproposta com counter_rate/fixed_fee/settlement/notes)'],
        ['Função pública', <C key="7">publicComplianceSubmit</C>, 'Endpoint trilíngue para submissão do KYC Global (mesma função usada pelo Brasil — distingue por payload)'],
        ['Função admin', <C key="8">importGlobalChannelsXlsx</C>, 'Importa a planilha completa de canais (~250 linhas) atualizando GlobalCountryChannel em massa'],
        ['Função admin', <C key="9">seedGlobalCountryFees</C>, 'Popula GlobalCountryFee com impostos conhecidos por país (VAT Argentina 21%, IOF Brasil, GMF Colombia 0.4%, etc.)'],
      ]} />

      <H2 num="19.2">Páginas — Sidebar Global</H2>

      <P>Quando o contexto é "global", a sidebar exibe estas páginas (em vez do menu Brasil):</P>

      <Table dense headers={['Grupo', 'Página', 'Rota', 'Função']} rows={[
        ['Leads & Propostas', 'Dashboard Global', '/GlobalDashboard', 'KPIs gerais — leads ativos, propostas enviadas/aceitas, TPV total USD'],
        ['Leads & Propostas', 'Link Questionário', '/GlobalLeadLinks', 'Gera links públicos do GlobalQuestionnaireForm (3 idiomas)'],
        ['Leads & Propostas', 'Questionários Recebidos', '/GlobalLeadsRecebidos', 'Inbox de GlobalQuestionnaire submetidos'],
        ['Leads & Propostas', 'Pipeline', '/GlobalPipeline', 'Kanban com 5 status (leads → proposal_made → ... → won/lost)'],
        ['Leads & Propostas', 'Propostas', '/GlobalPropostas', 'Listagem + filtros de GlobalProposal'],
        ['Leads & Propostas', 'Criar Proposta', '/GlobalCriarProposta', 'Builder de proposta — escolhe pricing_model, países, métodos'],
        ['Compliance', 'Link Compliance', '/GlobalLinksCompliance', 'Gera links do GlobalComplianceForm'],
        ['Compliance', 'KYC Recebidos', '/GlobalKYCRecebidos', 'Inbox dos GlobalComplianceQuestionnaire submetidos'],
        ['Catálogo & Análise', 'Canais por País', '/GlobalCanaisPaises', 'CRUD de GlobalCountryChannel + import XLSX'],
        ['Catálogo & Análise', 'Tabela Interchange', '/GlobalInterchange', 'Tabela de GlobalInterchangeRate (Visa/MC × low/avg/high) para pricing'],
        ['Catálogo & Análise', 'Simulador', '/GlobalSimulador', 'Calculadora pré-venda — entra MCC + TPV + mix → estima margem'],
        ['Ajuda', 'Como Funciona', '/GlobalComoFunciona', 'Documentação interna para o time comercial Global'],
      ]} />

      <H2 num="19.3">Pricing Models</H2>

      <P>A <C>GlobalProposal</C> suporta 3 modos via campo <C>pricing_model</C>:</P>

      <H3 num="19.3.1">cross_border_interchange (legado / default)</H3>
      <P>Modelo <B>Interchange++ em USD</B>. Estrutura:</P>
      <ul className="list-disc ml-5 text-[12.5px] text-[#1a1a1a] leading-[1.7]">
        <li><B>Base cost percentage</B> (default 0.5%)</li>
        <li><B>Selected interchange type</B>: visa_low/avg/high · master_low/avg/high · combined_low/avg/high · custom</li>
        <li><B>interchange_percentage + interchange_fixed</B>: valores da tabela <C>GlobalInterchangeRate</C></li>
        <li><B>markup_percentage</B>: a margem Pagsmile sobre interchange</li>
        <li><B>fixed_fee_per_transaction</B>: gateway fee em USD</li>
        <li><B>final_rate_percentage + final_fixed_fee</B>: cálculo consolidado exibido ao cliente</li>
      </ul>

      <H3 num="19.3.2">local_payments</H3>
      <P>Modelo <B>por país × método</B>. O builder permite adicionar países e dentro de cada país lista de métodos com:</P>
      <CodeBlock language="js">{`country_pricing: [
  {
    country: "MX",
    country_name: "Mexico",
    methods: [
      {
        channel_id: "<GlobalCountryChannel.id>",     // referência opcional
        method_category: "cards",                    // cards/bank_transfer/cash/qr/wallet
        method_label: "Debit and Credit Cards",      // visível na proposta
        description: "Visa, MC, AMEX",
        rate_pct: 3.2,
        fixed: 0.25,
        fixed_currency: "USD",
        min_per_trx: 1,
        min_per_trx_currency: "MXN",
        type: "payin",                                // payin | payout
        amount_range_label: "1 MXN - 200,000 MXN",
      },
      // ... outros métodos do México
    ],
    taxes: [                                          // de GlobalCountryFee
      { tax_type: "VAT", percentage: 16,
        label: "VAT: 16% on the processing fee" },
    ],
    restrictions: [                                   // avisos regulatórios
      "Sports Betting requires local SEGOB license",
    ],
    notes: "...",
  },
  // outros países
]`}</CodeBlock>

      <H3 num="19.3.3">hybrid</H3>
      <P>Combina os dois: interchange para cards globais + pricing local para métodos específicos (PIX, OXXO, SPEI, PSE, Webpay).</P>

      <H2 num="19.4">Fees Adicionais (Independentes do Pricing Model)</H2>

      <Table dense headers={['Campo', 'Default', 'Quando incide']} rows={[
        ['setup_fee', 'negociável', 'Setup inicial — one-shot'],
        ['refund_fee', 'negociável', 'Por estorno'],
        ['chargeback_fee', 'negociável', 'Por contestação'],
        ['risk_control_fee', '0.1 USD', 'Por trx APROVADA de cartão'],
        ['settlement_fee_usd', '50 USD', 'Por wire de settlement (frequência configurável)'],
        ['fx_percentage', '3%', 'Spread cambial aplicado em cada settlement'],
        ['settlement_frequency_days', '30', 'Mensal (default), semanal ou customizado'],
        ['settlement_currency', 'USD', 'USD ou EUR'],
        ['rolling_reserve_percentage', '—', '% de cada trx que fica retido'],
        ['rolling_reserve_days', '—', 'Dias até liberação'],
        ['valid_until', '—', 'Data de expiração da proposta'],
      ]} />

      <H2 num="19.5">Catálogo de Canais — GlobalCountryChannel</H2>

      <P>O catálogo é o <B>coração operacional</B> do mundo Global. Cada linha = <B>país × provider × método</B>. Importado da planilha "GLOBAL PAYMENTS PUBLIC VERSION" via <C>importGlobalChannelsXlsx</C>.</P>

      <Note title="Provider = informação CONFIDENCIAL" kind="warn">
        <p>O campo <C>provider</C> (ex: KUSHKI, KHIPU, MONNET, IZIPAY, ETPAY) <B>NUNCA</B> aparece em proposta pública para o cliente. É usado <B>apenas internamente</B> para roteamento operacional. Quando renderizamos <C>method_label</C> na proposta, mostramos algo como "Cash payments" ou "Local debit", sem citar o parceiro por trás.</p>
      </Note>

      <H3 num="19.5.1">Schema dos campos críticos</H3>
      <Table dense headers={['Campo', 'Valores / Exemplo']} rows={[
        ['country', 'ISO-2 (AR, MX, CO, CL, PE, EC, BO, CR, GT, PA, UY, PY, SV, NG, KE, GH, SA, AE, TR, KR, TH, ID, PH, VN, MY, JP, CN, SG, AU)'],
        ['region', 'LATAM | CENTRAL_AMERICA | APAC | AFRICA | MEA | TURKEY'],
        ['method_category', 'cards | bank_transfer | cash | qr_code | wallet | carrier_billing | other'],
        ['integration_type', 'Direct (Pagsmile direto com provider) | Via PSP (third-party) | Mixed'],
        ['payin_or_payout', 'PAYIN | PAYOUT | BOTH'],
        ['operational_status', 'ONLINE | OFFLINE | TESTING'],
        ['usage_status', 'PRIMARY (produção principal) | BACK UP (contingência) | DEPRECATED'],
        ['requires_onboarding', 'true se o canal exige onboarding adicional MID/API/HR'],
        ['onboarding_type', 'MID | API | HR Merchants | Both (LR/HR) | Both (LR/HR), API | N/A'],
        ['allowed_hr_industries', '[forex, crypto, sport_betting, casino, microcredit, adult_content] — quais HR esse canal aceita'],
        ['prohibited_industries', 'array de indústrias estritamente vetadas neste canal'],
        ['regulatory_requirements', 'texto livre (ex: "Casino requires COLJUEGOS license", "CNVB authorization for microcredit")'],
        ['default_payin_rate_pct + default_payin_fixed + default_payin_fixed_currency + default_payin_min', 'Defaults vindos da última proposta calibrada — pré-preenche o builder'],
        ['internal_responsible_team', 'Partnership | Tech | Compliance | Multiple (quem operacionaliza no Pagsmile)'],
        ['imported_from', 'Nome do XLSX + timestamp (auditoria de import)'],
      ]} />

      <H2 num="19.6">Impostos Regulatórios — GlobalCountryFee</H2>

      <P>Cada país tem 0..N impostos cadastrados em <C>GlobalCountryFee</C>. Quando uma <C>GlobalProposal</C> em modo <C>local_payments</C> inclui um país, o builder injeta automaticamente as taxas correspondentes no <C>country_pricing[].taxes[]</C>.</P>

      <Table dense headers={['Campo', 'Valores']} rows={[
        ['tax_type', 'VAT | IOF | GMF | Withholding | Other'],
        ['tax_code', 'Sigla curta exibida (ex: "VAT", "IOF")'],
        ['percentage', 'ex: 21 (Argentina VAT), 0.4 (Colombia GMF)'],
        ['applies_to', 'processing_fee | total_amount | settlement | payout_amount'],
        ['label_en / label_pt / label_zh', 'Texto multilíngue exibido na proposta'],
      ]} />

      <H2 num="19.7">Fluxo Comercial Global — Lead → Proposta → Aceite</H2>

      <Table headers={['Fase', 'Página/Função', 'Quem age']} rows={[
        ['1. Gera link de questionário', '/GlobalLeadLinks (admin)', 'Comercial Global'],
        ['2. Cliente preenche em PT/EN/ZH', '/GlobalQuestionnaireForm (público)', 'Lead'],
        ['3. Cria GlobalQuestionnaire status=leads', 'GlobalQuestionnaire.create', 'Sistema'],
        ['4. Comercial qualifica', '/GlobalLeadsRecebidos · /GlobalPipeline', 'Comercial'],
        ['5. Cria proposta', '/GlobalCriarProposta', 'Comercial'],
        ['6. Envia link público', '/GlobalPublicProposal?token=...', 'Comercial → Cliente'],
        ['7. Cliente vê (PT/EN/ZH)', 'publicGlobalProposal action=load', 'Cliente'],
        ['8a. Cliente aceita', 'publicGlobalProposal action=accept', 'Cliente'],
        ['8b. Cliente faz counter', 'publicGlobalProposal action=counter (cria contraproposta com counter_rate/fixed_fee/settlement/notes)', 'Cliente'],
        ['8c. Cliente rejeita', 'publicGlobalProposal action=reject', 'Cliente'],
        ['9. Compliance dispara KYC', '/GlobalLinksCompliance gera link', 'Compliance Global'],
        ['10. Cliente faz KYC tri-língue', '/GlobalComplianceForm', 'Cliente'],
        ['11. Inbox KYC', '/GlobalKYCRecebidos', 'Compliance'],
      ]} />

      <H2 num="19.8">KYC Internacional — GlobalComplianceQuestionnaire</H2>

      <P>Modelo simplificado vs V4 Brasil — adequado a clientes internacionais. <B>Não</B> roda BDC (BDC é Brasil-only) nem CAF SDK biométrico (alvo Brasil). Foco em <B>declaração + documentos + screening manual</B>.</P>

      <H3 num="19.8.1">Campos principais</H3>
      <Table dense headers={['Grupo', 'Campos']} rows={[
        ['Identidade da empresa', 'legal_business_name, trade_name_dba, registered_business_address, physical_office_address, registered_country, corporate_website, business_nature, regulatory_licenses, tax_registration_number, company_type, years_in_business'],
        ['Volumetria', 'estimated_monthly_volume_usd, estimated_avg_transaction_usd, countries_of_operation, payment_direction (Pay-in/Pay-out/Both)'],
        ['Aplicação', 'applying_for (Merchant | Master Merchant PSP | Introducer), application_regions, payment_methods'],
        ['UBOs', 'ubos[]: name, nationality, address, ownership_percentage (Beneficial Owners)'],
        ['Diretores', 'directors[]: job_title, first_name, last_name (+ flag "directors_same_as_ubos")'],
        ['Contatos operacionais', 'accounting_contact_* / support_contact_* / compliance_contact_*'],
        ['4 perguntas críticas PLD/Sanções', 'q_sanctions_list (+ detail) — alguém na empresa está em lista de sanções? q_pep (+ detail) — algum UBO/director é PEP? q_sanctioned_country (+ detail) — opera em país sancionado? q_sanctioned_ownership (+ detail) — controle de pessoa sancionada?'],
        ['2 perguntas extras', 'q_pagsmile_dealings — já teve relação com Pagsmile? · q_value_exchange — fornece serviços de exchange de valor?'],
        ['Documentos', 'doc_corp_documents_url (incorporation/MOA/AOA), doc_bank_statement_url, doc_ids[] (IDs dos UBOs), doc_address_proofs[], doc_company_address_proof_url, doc_pilot_llc_url (se aplicável), doc_license_url (se regulado), doc_ownership_chart_url'],
        ['Certificação', 'certifier_name, certifier_job_title, certifier_email, certification_date (assinatura digital do declarante)'],
      ]} />

      <H2 num="19.9">Simulador — /GlobalSimulador</H2>

      <P>Calculadora pré-venda usada pelo comercial. Entrada: MCC, TPV USD, ticket médio, mix de marcas. O simulador puxa <C>GlobalInterchangeRate</C> para cada marca/programa, calcula o interchange ponderado, aplica markup e mostra: revenue projetado, margem absoluta, margem %, comparação com taxa atual do parceiro concorrente do cliente (se preenchido em <C>GlobalQuestionnaire.current_rate_percentage</C>).</P>

      <H2 num="19.10">Tabela Interchange — GlobalInterchangeRate</H2>

      <P>Catálogo de taxas Visa/Mastercard usadas no modelo Interchange++. Cada linha:</P>
      <CodeBlock language="js">{`{
  brand: "visa" | "mastercard",
  program_name: "Visa Traditional", "Visa Premium", "MC Standard", etc.
  card_type: "credit" | "debit" | "prepaid" | ...,
  rate_percentage: number,
  rate_fixed: number,
  category: "card_not_present",  // Pagsmile só opera CNP em Global
  details: "...",                 // observações
  is_active: boolean,
}`}</CodeBlock>

      <P>Mantida pelo time financeiro. Quando atualiza, novas propostas usam taxas novas; propostas já enviadas permanecem com snapshot.</P>

      <H2 num="19.11">Idiomas — Sistema Tri-língue</H2>

      <P>Todo o trilho público (questionário, proposta, KYC) suporta PT/EN/ZH:</P>
      <ul className="list-disc ml-5 text-[12.5px] text-[#1a1a1a] leading-[1.7]">
        <li>Traduções centralizadas em <C>lib/i18n/translations/global.js</C> (en) + <C>pt.js</C> + <C>zh.js</C></li>
        <li>Hook <C>usePublicGlobalI18n</C> em componentes públicos para acessar strings traduzidas</li>
        <li><C>LanguageSelector</C> aparece no header de todas as páginas públicas</li>
        <li><C>GlobalProposal.language</C> e <C>GlobalComplianceQuestionnaire.language</C> persistem a escolha do cliente para auditoria</li>
        <li>Labels regulatórios em <C>GlobalCountryFee</C> têm os 3 idiomas em colunas separadas (<C>label_en / label_pt / label_zh</C>)</li>
      </ul>

      <H2 num="19.12">Isolamento vs Trilho Brasil</H2>

      <Table headers={['Componente', 'Brasil', 'Global']} rows={[
        ['Lead', 'Lead (entity)', 'GlobalQuestionnaire'],
        ['Proposta', 'Proposal · StandardProposal · PixProposal', 'GlobalProposal'],
        ['KYC', 'OnboardingCase + QuestionnaireResponse + V4/V5.2', 'GlobalComplianceQuestionnaire (simplificado)'],
        ['BDC', 'Usado no pipeline', 'NÃO usado (mercado Brasil-only)'],
        ['CAF SDK biométrico', 'Usado para identidade', 'NÃO usado (não fazemos biometria de UBO estrangeiro)'],
        ['Moeda', 'BRL', 'USD (settlement) + moedas locais (limites/fixos)'],
        ['Catálogo de meios', '— (cards/PIX/boleto)', 'GlobalCountryChannel (~250 linhas, país × provider × método)'],
        ['Impostos', '— (não há)', 'GlobalCountryFee (VAT/IOF/GMF/Withholding por país)'],
        ['Risk Scoring V4/V5.2', 'Aplicado', 'NÃO aplicado — análise manual + screening internacional'],
        ['Sidebar', 'Menu Brasil', 'Menu Global (totalmente separado)'],
        ['Idiomas públicos', 'PT', 'PT + EN + ZH'],
      ]} />

      <Source files={[
        'entities/GlobalQuestionnaire.json',
        'entities/GlobalProposal.json',
        'entities/GlobalCountryChannel.json',
        'entities/GlobalCountryFee.json',
        'entities/GlobalComplianceQuestionnaire.json',
        'entities/GlobalInterchangeRate.json',
        'functions/publicGlobalProposal.js',
        'functions/importGlobalChannelsXlsx.js',
        'functions/seedGlobalCountryFees.js',
        'functions/seedGlobalCatalogComplete.js',
        'lib/global/globalContext.js (switch Brasil/Global/Unified)',
        'lib/global/interchangeData.js (dados pré-carregados)',
        'lib/global/countryMap.js (mapa ISO-2 → nome traduzido)',
        'lib/global/paymentMethods.js (categorias normalizadas)',
        'lib/global/regulatoryAlerts.js (avisos auto-injetados)',
        'lib/i18n/translations/global.js (+ pt.js, zh.js)',
        'pages/GlobalDashboard, GlobalLeadLinks, GlobalLeadsRecebidos, GlobalPropostas, GlobalCriarProposta, GlobalPipeline, GlobalCanaisPaises, GlobalInterchange, GlobalSimulador, GlobalLinksCompliance, GlobalKYCRecebidos, GlobalComoFunciona',
        'pages/GlobalQuestionnaireForm.jsx (público)',
        'pages/GlobalPublicProposal.jsx (público)',
        'pages/GlobalComplianceForm.jsx (público)',
        'components/global/* (todo o conjunto de componentes Global)',
      ]} />
    </Sec>
  );
}