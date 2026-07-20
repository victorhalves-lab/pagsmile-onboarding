import React from 'react';
import { Sec, H1, H2, H3, P, B, C, CodeBlock, Table, Note, Pipeline, Endpoint, Source } from '../DocPrimitives';

/**
 * Capítulo 12 — Propostas, Contratos, Kick-Off
 */
export default function Ch12_PropostasContratos() {
  return (
    <Sec id="ch-12">
      <H1 num="12">Propostas, Contratos e Kick-Off — Ciclo Comercial Pós-Lead</H1>

      <P>Após qualificação do Lead, inicia o ciclo comercial: Proposta → Contrato → Kick-Off. Cada etapa tem entidades, cálculos de rentabilidade, links públicos com tokens e versionamento. Este capítulo descreve cada peça.</P>

      <H2 num="12.1">Tipos de Proposta — 3 Variantes</H2>
      <Table headers={['Entidade', 'Uso', 'Diferenças']} rows={[
        ['Proposal', 'Proposta personalizada (custom)', 'Taxas customizadas. Versionamento (version, previousVersionId, rootProposalId, isCurrentVersion). Rentabilidade calculada explicitamente.'],
        ['StandardProposal', 'Proposta padrão por segmento', 'Não tem leadId obrigatório (tem ao convidar). isDefaultForSegment marca a proposta canônica do segmento. Compartilhada via link público no formato /pp/{slug}.'],
        ['PixProposal', 'Proposta PIX-only', 'Apenas taxa PIX (% ou fixo). Sem cartão/débito/boleto. TPV mínimo declarado. Versionamento.'],
      ]} />

      <H2 num="12.2">Schema da Proposta Personalizada (Proposal)</H2>

      <P>Schema completo já no entity. Campos chave da estrutura de taxas:</P>
      <CodeBlock language="json">{`// rates é object aninhado com todas as bandeiras
"rates": {
  "cartao": {
    "visa":       { "avista": 2.99, "de2a6x": 3.49, "de7a12x": 3.99, "de13a21x": 4.49 },
    "mastercard": { "avista": 2.99, "de2a6x": 3.49, "de7a12x": 3.99, "de13a21x": 4.49 },
    "elo":        { "avista": 3.49, "de2a6x": 3.99, "de7a12x": 4.49, "de13a21x": 4.99 },
    "amex":       { "avista": 3.99, "de2a6x": 4.49, "de7a12x": 4.99, "de13a21x": 5.49 },
    "outras":     { "avista": 3.49, "de2a6x": 3.99, "de7a12x": 4.49, "de13a21x": 4.99 }
  },
  "debito": { "visa": 1.49, "mastercard": 1.49, "elo": 1.79, "outras": 1.79 },
  "pix": { "tipo": "percentual", "valor": 0.99 },
  "boleto": 2.99,
  "antifraude": 0.59,
  "feeTransacao": 0.49,
  "taxa3ds": 0.10,                      // R$ por transação 3DS
  "setup": 0,                           // R$ único
  "forex": 1.99,                        // % para transações em moeda estrangeira
  "rav": { "taxa": 1.99, "prazo": "D+30" },
  "minimoGarantido": { "mes1": 0, "mes2": 0, "mes3": 1000 },
  "alertaPreChargeback": 0.10,
  "percentualAntecipacao": 1.99
},
"taxaFinalOverrides": { ... },          // override explícito de cells da matriz
"hideCalculationColumns": false,
"hideRange13a21": false`}</CodeBlock>

      <H3 num="12.2.1">Campo profitabilityDetails (rentabilidade)</H3>
      <Table dense headers={['Campo', 'Cálculo']} rows={[
        ['tpvBase', 'TPV mensal declarado pelo lead'],
        ['transacoesMes', 'tpvBase / ticketMedio'],
        ['receitaMDR', 'Σ por bandeira: tpv × distribuição × MDR'],
        ['receitaAntecipacao', 'tpv × % com antecipação × percentualAntecipacao'],
        ['receitaFees', 'transacoesMes × (feeTransacao + antifraude + taxa3ds)'],
        ['custoMDRParceiro', 'Σ PartnerCost por MCC/bandeira × distribuição'],
        ['custoAntecipacaoParceiro', 'similar com taxa parceiro'],
        ['custoFeesParceiro', 'fees parceiro'],
        ['margemPercentual', '((Σ receitas - Σ custos) / Σ receitas) × 100'],
      ]} />

      <H3 num="12.2.2">Versionamento</H3>
      <Table dense headers={['Campo', 'Significado']} rows={[
        ['version', 'Número da versão. 1 inicial, incrementa a cada nova versão'],
        ['previousVersionId', 'FK para versão anterior'],
        ['rootProposalId', 'FK para versão 1 (raiz da árvore de versões)'],
        ['isCurrentVersion', 'true apenas na versão mais recente'],
      ]} />

      <H3 num="12.2.3">Status da Proposta</H3>
      <Table dense headers={['Status', 'Trigger']} rows={[
        ['rascunho', 'Criação inicial, antes de envio'],
        ['enviada', 'Admin clicou "Enviar" — gera tokenPublico e link'],
        ['visualizada', 'Cliente abriu o link público (publicProposalAction)'],
        ['aceita', 'Cliente clicou "Aceitar" no link público'],
        ['recusada', 'Cliente clicou "Recusar" + opcional rejectedReason'],
        ['contraproposta', 'Cliente clicou "Contraproposta" + counterProposalDetails'],
        ['expirada', 'expireProposalsScheduled (job diário) seta após validUntil'],
        ['cancelada', 'Admin cancelou manualmente'],
      ]} />

      <H2 num="12.3">Links Públicos e Tokens</H2>

      <H3 num="12.3.1">Tipos de Link</H3>
      <Table dense headers={['Formato', 'Entidade', 'Uso']} rows={[
        ['/PropostaPublica?token=...', 'Proposal', 'Proposta personalizada via tokenPublico (32 hex chars)'],
        ['/PropostaPadraoPublica?token=...', 'StandardProposal', 'Proposta padrão via tokenPublico'],
        ['/PropostaPixPublica?token=...', 'PixProposal', 'Proposta PIX via tokenPublico'],
        ['/p/{slug}', 'Proposal', 'URL amigável que redireciona via PublicSlugRedirect (busca por publicSlug)'],
        ['/pp/{slug}', 'StandardProposal', '—'],
        ['/pix/{slug}', 'PixProposal', '—'],
        ['/c/{slug}', 'Contract', '—'],
      ]} />

      <H3 num="12.3.2">Slug Auto-Gerado</H3>
      <P>Função <C>autoGeneratePublicSlug</C> gera slug amigável: <C>{`{cnpj-curto}-{aleatorio-4chars}`}</C>. Ex: "abc-tech-a7f3". Backfill via <C>backfillPublicSlugs</C> para propostas antigas sem slug.</P>

      <H3 num="12.3.3">publicProposalAction</H3>
      <Endpoint
        method="POST" path="publicProposalAction (público)" auth="token validation"
        description="Endpoint que cliente usa para visualizar/aceitar/recusar/contrapropor."
        params={[
          { name: 'token', type: 'string', required: true, desc: 'tokenPublico da proposta' },
          { name: 'action', type: 'enum', required: true, desc: 'view | accept | reject | counter' },
          { name: 'rejectedReason', type: 'string', required: false, desc: 'Apenas em reject' },
          { name: 'counterDetails', type: 'object', required: false, desc: 'Apenas em counter — detalhes da contraproposta' },
        ]}
        returns={`{ "success": true, "proposalStatus": "aceita", "nextStepUrl": "/FechamentoLandingPage?slug=..." }`}
        source="functions/publicProposalAction.js"
      />

      <H3 num="12.3.4">Cadeia ao aceitar</H3>
      <Pipeline steps={[
        { id: '1', name: 'publicProposalAction(action: accept)', desc: 'Atualiza Proposal: status = aceita, acceptedDate. Retorna nextStepUrl' },
        { id: '2', name: 'Lead atualizado (status proposta_aceita)', desc: 'Side-effect — sincronização' },
        { id: '3', name: 'notifyProposalAccepted', desc: 'Slack + e-mail vendedor responsavel' },
        { id: '4', name: 'emailProposalAccepted (cliente)', desc: 'Confirmação + próximos passos' },
        { id: '5', name: 'Cliente redireciona para /FechamentoLandingPage', desc: 'Inicia funil 4 (Cap. 8.4) → cria OnboardingCase → dispara pipeline KYC' },
      ]} />

      <H2 num="12.4">Cascata SegmentDefaultRates</H2>

      <P>Mudanças em <C>SegmentDefaultRates</C> propagam automaticamente. Função <C>cascadeSegmentRatesUpdate</C> dispara quando admin edita taxas padrão de um segmento:</P>
      <Pipeline steps={[
        { id: '1', name: 'Admin edita SegmentDefaultRates do segmento "ecommerce"', desc: 'Página /GerenciarTaxasPadrao salva' },
        { id: '2', name: 'Trigger entity automation', desc: 'cascadeSegmentRatesUpdate disparada' },
        { id: '3', name: 'Update StandardProposal.isDefaultForSegment=true do mesmo segmento', desc: 'Propaga rates'},
        { id: '4', name: 'Update Introducer.standardRates[]', desc: 'Cada introducer que tem o segmento na sua lista de taxas padrão recebe atualização' },
        { id: '5', name: 'NÃO afeta StandardProposal customizadas (isDefaultForSegment=false)', desc: 'Apenas o template default' },
      ]} />

      <H2 num="12.5">Contract — Geração e Pré-Geração</H2>

      <H3 num="12.5.1">Schema essencial</H3>
      <Table dense headers={['Campo', 'Tipo', 'Descrição']} rows={[
        ['leadId', 'string (FK)', 'FK Lead'],
        ['proposalId', 'string (FK)', 'FK Proposal aceita'],
        ['merchantId', 'string (FK)', 'Cliente'],
        ['codigo', 'string (UQ)', 'Ex: CONT-2026-XXXXX'],
        ['module flags', 'object', '{ cartao: bool, pix: bool, boleto: bool, antifraude: bool, ... }'],
        ['rates', 'object', 'Mesma estrutura da proposta'],
        ['slas', 'object', 'SLA processamento, conciliação, suporte, repasse'],
        ['clausulas', 'array<object>', 'Cláusulas customizadas'],
        ['anexos', 'array', 'Documentos anexos'],
        ['status', 'enum', 'pre_generated | ready | sent | signed | cancelled'],
        ['publicLinkCode', 'string', 'tokenPublico para acesso'],
        ['publicSlug', 'string', 'Slug amigável /c/{slug}'],
        ['signedDate', 'datetime', '—'],
        ['signedDocumentUrl', 'string', 'URL do contrato assinado uploaded'],
      ]} />

      <H3 num="12.5.2">Pré-Geração via IA</H3>
      <Endpoint
        method="POST" path="preGenerateContract (admin only)" auth="admin role"
        description="Gera contrato a partir de Lead + Proposal aceita. Usa IA (gemini_3_1_pro) para preencher cláusulas customizadas baseadas em segmento."
        params={[
          { name: 'leadId', type: 'string', required: true },
          { name: 'proposalId', type: 'string', required: true },
        ]}
        returns={`{ "success": true, "contractId": "...", "codigo": "CONT-2026-XXXXX", "status": "pre_generated" }`}
        source="functions/preGenerateContract.js"
      />

      <H3 num="12.5.3">Editor de Contrato</H3>
      <P>Página <C>/EditorContrato?id={`{contractId}`}</C>. Tabs: Cliente, Módulos, Preços (importa rates da proposta), SLA, Cláusulas, Assinatura, Preview. Cada tab tem componente próprio (ClienteForm, ModulosForm, PrecosForm, SLAsForm, AssinaturaForm). Side panel renderiza preview ao vivo via <C>ConteudoContrato</C>.</P>

      <H3 num="12.5.4">Export PDF + DOCX</H3>
      <P>Componente <C>DownloadContractPdfButton</C> usa html2canvas + jspdf com smart paging (data-pdf-block atomic). <C>DownloadContractDocxButton</C> usa lib docx para gerar DOCX editável. Lib <C>contratoToDocx.js</C> faz parsing do conteúdo estruturado para paragraphs/tables docx.</P>

      <H2 num="12.6">Kick-Off — Onboarding Comercial</H2>

      <P>Após contrato assinado, gera-se uma apresentação Kick-Off para alinhamento operacional. Entidade <C>KickOffPresentation</C>.</P>

      <H3 num="12.6.1">Schema</H3>
      <Table dense headers={['Campo', 'Descrição']} rows={[
        ['clientName', 'Nome cliente'],
        ['clientCnpj', '—'],
        ['proposalId / contractId / contractCodigo', 'FKs cruzadas'],
        ['segment', 'Determina slides exibidos'],
        ['publicToken', 'Token público — acesso via /KickOffPublico?token=...'],
        ['proposalData / contractData', 'Snapshots para evitar drift se proposta/contrato forem editados'],
        ['responsavelId / Nome', 'CSM responsável'],
        ['status', 'ativa | arquivada'],
      ]} />

      <H3 num="12.6.2">Slides Estruturados (componentes)</H3>
      <Table dense headers={['Slide', 'Componente']} rows={[
        ['SlideCover', 'Capa com logo cliente'],
        ['SlideAbout', 'Sobre Pin Bank'],
        ['SlideServices', 'Serviços contratados'],
        ['SlideRatesCard / SlideRatesOther', 'Taxas dos módulos cartão e outros'],
        ['SlideSplitPayment', 'Split de pagamentos (se aplicável)'],
        ['SlideSecurity', 'Segurança e compliance'],
        ['SlideRoadmap', 'Roadmap de implementação'],
        ['SlideSLA', 'SLAs operacionais'],
        ['SlideSubsellerLinks', 'Para gateways: como gerar subsellers'],
        ['SlideCommercial / SlideSupport / SlideFollowUp', 'Contatos comerciais e suporte'],
        ['SlideProhibitedActivities', 'Atividades vedadas'],
        ['SlideNextSteps', 'Próximas ações'],
        ['SlideSummary', 'Resumo final'],
      ]} />

      <H3 num="12.6.3">Geração e Distribuição</H3>
      <P>Página <C>/GerarKickOff</C> (admin). Seleciona cliente → escolhe slides → gera publicToken → envia link <C>/KickOffPublico?token=...</C> ao cliente. Cliente vê apresentação web responsiva (sem login).</P>

      <H2 num="12.7">Funções Auxiliares e Notificações</H2>
      <Table dense headers={['Função', 'Quando dispara', 'Output']} rows={[
        ['notifyNewProposal', 'create Proposal status=enviada', 'Slack + e-mail interno'],
        ['notifyProposalViewed', 'publicProposalAction action=view (1ª vez)', 'Slack vendedor: "cliente abriu proposta"'],
        ['notifyProposalAccepted', 'action=accept', 'Slack + email vendedor + email cliente'],
        ['emailProposalSent', 'create proposal enviada', 'Email para cliente com link'],
        ['emailProposalAccepted', 'action=accept', 'Email confirmação cliente + próximos passos'],
        ['expireProposalsScheduled', 'Cron diário 03:00 UTC', 'Marca proposals com validUntil < now como expiradas'],
        ['checkExpiringProposals', 'Cron diário 09:00 UTC', 'Notifica vendedor de propostas que expiram em 3 dias'],
        ['cascadeSegmentRatesUpdate', 'Update SegmentDefaultRates', 'Propaga em cascata'],
        ['notifyContractUpdate', 'Update Contract', 'Slack interno + e-mail cliente quando status muda'],
        ['generateProposalPdf', 'Botão "Baixar PDF" admin', 'Gera PDF server-side via puppeteer-like'],
      ]} />

      <Source files={[
        'entities/Proposal.json',
        'entities/StandardProposal.json',
        'entities/PixProposal.json',
        'entities/Contract.json',
        'entities/KickOffPresentation.json',
        'entities/SegmentDefaultRates.json',
        'pages/CriarProposta.jsx',
        'pages/CriarPropostaPadrao.jsx',
        'pages/CriarPropostaPix.jsx',
        'pages/PropostaPublica.jsx',
        'pages/PropostaPadraoPublica.jsx',
        'pages/PropostaPixPublica.jsx',
        'pages/EditorContrato.jsx',
        'pages/PreviewContrato.jsx',
        'pages/ContratoPublico.jsx',
        'pages/GerarKickOff.jsx',
        'pages/KickOffPublico.jsx',
        'pages/PublicSlugRedirect.jsx',
        'pages/SlugRedirect.jsx',
        'pages/GerenciarTaxasPadrao.jsx',
        'functions/preGenerateContract.js',
        'functions/publicProposalAction.js',
        'functions/cascadeSegmentRatesUpdate.js',
        'functions/expireProposals.js',
        'functions/expireProposalsScheduled.js',
        'functions/checkExpiringProposals.js',
        'functions/autoGeneratePublicSlug.js',
        'functions/backfillPublicSlugs.js',
        'functions/generateProposalPdf.js',
        'functions/notifyNewProposal.js',
        'functions/notifyProposalAccepted.js',
        'functions/notifyProposalViewed.js',
        'functions/emailProposalSent.js',
        'functions/emailProposalAccepted.js',
        'functions/notifyContractUpdate.js',
        'components/contrato/* (toda subpasta)',
        'components/kickoff/* (toda subpasta)',
        'components/proposals/* (toda subpasta)',
      ]} />
    </Sec>
  );
}