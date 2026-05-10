import React from 'react';
import { Sec, H1, H2, H3, P, B, C, CodeBlock, Table, Note, Pipeline, Endpoint, Source } from '../DocPrimitives';

/**
 * Capítulo 8 — Funis de Captação Microscópicos
 */
export default function Ch08_FunisCaptacao() {
  return (
    <Sec id="ch-08">
      <H1 num="08">Funis de Captação — V5 (12 steps), PIX V4 (7 steps), Landing Pages, Fechamento</H1>

      <P>A plataforma tem <B>5 funis de captação distintos</B>, cada um com público-alvo, formulário e pipeline pós-submit únicos. Todos persistem em <C>Lead</C> (com sourceFlow distinto) e disparam <C>onLeadCreatedEnrich</C> para enriquecimento BDC pré-KYC.</P>

      <H2 num="8.1">Funil 1 — Lead V5 (Pagsmile Questionnaire)</H2>

      <P>Funil principal de leads. Questionário completo de 12 steps. Persistido em <C>Lead</C> com <C>sourceFlow: "pagsmile_lead_v5_questionnaire"</C>.</P>

      <H3 num="8.1.1">12 Steps Sequenciais</H3>
      <Pipeline steps={[
        { id: '01', name: 'StepContato', desc: 'Nome, e-mail, WhatsApp, cargo. Validação: e-mail formato + WhatsApp 11 dígitos. CPF do contato (opcional).', source: 'components/lead-pagsmile/StepContato' },
        { id: '02', name: 'StepDadosEmpresa', desc: 'CNPJ (validação algoritmo + autocomplete BrasilAPI). Razão social, nome fantasia, MCC sugerido. Hook useBdcCnpjEnrichment dispara enriquecimento background.', source: 'components/lead-pagsmile/StepDadosEmpresa + hooks/useBdcCnpjEnrichment.js' },
        { id: '03', name: 'StepEndereco', desc: 'CEP autocomplete via BrasilAPI. Cross-check com endereço Receita Federal. Detecta divergências.', source: 'components/lead-pagsmile/StepEndereco' },
        { id: '04', name: 'StepSegmento', desc: 'Seleção entre 10 segmentos: educacao, infoprodutos, ecommerce, saas, gateway, marketplace, mpe, dropshipping, plataformas_verticais, link_pagamento. Determina perguntas dos próximos steps.', source: 'components/lead-pagsmile/StepSegmento + SegmentCards' },
        { id: '05', name: 'StepModeloNegocio', desc: 'Sub-perguntas dependentes do segmento. Ex: marketplace → take rate; dropshipping → tempo entrega + fornecedor internacional; SaaS → churn + recorrência; infoprodutos → afiliados; etc.', source: 'components/lead-pagsmile/StepModeloNegocio' },
        { id: '06', name: 'StepVolumetria', desc: 'TPV mensal atual. Ticket médio. Crescimento 12m. CurrencyNumberInput força máscara R$.', source: 'components/lead-pagsmile/StepVolumetria + CurrencyNumberInput' },
        { id: '07', name: 'StepDistribuicao', desc: 'Slider 100% entre crédito/débito/PIX/boleto. Validador força soma=100. SliderDistribution + SliderDistributionParcelamento.', source: 'components/lead-pagsmile/StepDistribuicao' },
        { id: '08', name: 'StepMixOperacao', desc: 'Quando aplicável: % por categoria operacional (ex: e-commerce próprio vs marketplace vs dropshipping vs infoprodutos vs SaaS). MixOperacaoSlider valida soma=100.', source: 'components/lead-pagsmile/StepMixOperacao + MixOperacaoSlider' },
        { id: '09', name: 'StepProcessadorAtual', desc: 'Stone, Cielo, GetNet, Pagseguro, Mercado Pago, etc. Tempo com processador atual. Motivo de troca.', source: 'components/lead-pagsmile/StepProcessadorAtual' },
        { id: '10', name: 'StepTaxasAtuais', desc: 'MDR à vista, 2-6x, 7-12x, antifraude, fee transação, antecipação. Persistido em Lead.expectedRates. Usado como baseline pelo Lead Qualifier IA para comparar com proposta.', source: 'components/lead-pagsmile/StepTaxasAtuais' },
        { id: '11', name: 'StepComplianceRisco', desc: 'PEP, sanções, processos, restrições legais. Operação internacional. Cobertura geográfica. Nível compliance maturity.', source: 'components/lead-pagsmile/StepComplianceRisco' },
        { id: '12', name: 'StepFechamento', desc: 'Termos LGPD + opt-in marketing. Submit final dispara publicLeadSubmit.', source: 'components/lead-pagsmile/StepFechamento' },
      ]} />

      <H3 num="8.1.2">Auto-save (Draft Recovery)</H3>
      <P>Hook <C>useLeadV5Autosave</C>: persiste no <C>localStorage</C> a cada step. Chave: <C>lead_v5_draft_{`{linkCode}`}</C>. Ao retomar, banner DraftRecoveryBanner pergunta se quer continuar. Cleanup automático após submit bem-sucedido.</P>

      <H3 num="8.1.3">Validação Step-a-Step</H3>
      <P>Arquivo <C>components/lead-pagsmile/leadV5Validators.js</C>. Cada step tem função <C>validateStepN(formData)</C> retornando <C>{`{ ok: bool, errors: string[] }`}</C>. <B>Não permite avançar com erros.</B> CNPJ tem validação de algoritmo (dígitos verificadores).</P>

      <H3 num="8.1.4">Sanitização pré-submit</H3>
      <CodeBlock language="js">{`// pages/QuestionarioLeadsPagsmile.jsx — função sanitizeForSubmit
// Remove: bdcEnrichmentData (heavy blob), draft fields, debug fields
const sanitized = { ...formData };
delete sanitized._draftMeta;
delete sanitized._bdcRawCache;
delete sanitized._tempUploads;
return sanitized;`}</CodeBlock>

      <H3 num="8.1.5">Submit final</H3>
      <Endpoint
        method="POST" path="publicLeadSubmit (público)" auth="—"
        description="Cria Lead + dispara onLeadCreatedEnrich (entity automation)."
        params={[
          { name: 'questionnaireData', type: 'object', required: true, desc: 'Dados sanitizados do questionário' },
          { name: 'sourceFlow', type: 'enum', required: true, desc: '"pagsmile_lead_v5_questionnaire"' },
          { name: 'introducerReferralCode', type: 'string', required: false, desc: 'Vindo de landing page de Introducer' },
        ]}
        returns={`{ "success": true, "leadId": "...", "protocolo": "LEAD-2026-XXXXX" }`}
        source="functions/publicLeadSubmit.js"
      />

      <H2 num="8.2">Funil 2 — Lead PIX V4 (Especialização PIX)</H2>

      <P>Questionário simplificado focado em PIX-only. 7 steps. Persistido com <C>sourceFlow: "lead_pix_v4_form"</C>. Pipeline pós-submit é mais leve (sem dimensão crédito).</P>

      <H3 num="8.2.1">7 Steps</H3>
      <Pipeline steps={[
        { id: '01', name: 'StepTipoNegocio', desc: 'PJ vs intermediário PIX vs API enterprise. Determina template_model do compliance subsequente.', source: 'components/lead-pix-v4/StepTipoNegocio' },
        { id: '02', name: 'StepDadosEmpresa', desc: 'CNPJ + autocomplete + MCC.', source: 'components/lead-pix-v4/StepDadosEmpresa' },
        { id: '03', name: 'StepContato', desc: 'Nome, e-mail, WhatsApp, cargo.', source: 'components/lead-pix-v4/StepContato' },
        { id: '04', name: 'StepVolumePix', desc: 'TPV PIX mensal últimos 3 meses. Ticket médio PIX. Sazonalidade.', source: 'components/lead-pix-v4/StepVolumePix' },
        { id: '05', name: 'StepModeloNegocio', desc: 'Modelo operacional: e-commerce/SaaS/serviços recorrentes/marketplace.', source: 'components/lead-pix-v4/StepModeloNegocio' },
        { id: '06', name: 'StepSituacaoAtual', desc: 'Provedor PIX atual + taxa atual (% ou fixo). Motivo de troca.', source: 'components/lead-pix-v4/StepSituacaoAtual' },
        { id: '07', name: 'StepServicosComplementar', desc: 'Cartão futuro? Antifraude? Conciliação? Pré-confirmação de interesse em produtos extras.', source: 'components/lead-pix-v4/StepServicosComplementar' },
      ]} />

      <H2 num="8.3">Funil 3 — Landing Pages de Introducers</H2>
      <P>Rota <C>/parceiro/:uniqueLandingPageSlug</C>. Cada Introducer (parceiro de indicação) tem URL única. Captura mais leve (5 campos): nome, e-mail, CNPJ, telefone, segmento. Persiste em <C>Lead</C> com <C>introducerId</C>, <C>introducerReferralCode</C>, <C>sourceFlow: "introducer_landing_page"</C>.</P>

      <P>Componente principal: <C>pages/IntroducerLandingPage</C>. UTM tracking automático via <C>trackLandingPageEvent</C> (page_view, form_start, form_submit).</P>

      <H3 num="8.3.1">Personalização White-Label</H3>
      <P>OnboardingLink correspondente tem campos <C>brandName, brandLogoUrl, brandPrimaryColor, brandSecondaryColor</C>. Landing renderiza com a marca do parceiro — cliente final vê a landing como se fosse do introducer.</P>

      <H2 num="8.4">Funil 4 — Fechamento (Pós-aceite de Proposta Padrão)</H2>

      <P>Quando cliente aceita <C>StandardProposal</C> via link público, é redirecionado para <C>/FechamentoLandingPage?slug=...</C>. Mini-questionário de 3 steps captura dados que faltam para criar o <C>OnboardingCase</C> oficial.</P>

      <H3 num="8.4.1">3 Steps</H3>
      <Pipeline steps={[
        { id: '01', name: 'FechamentoStep1CompanyForm', desc: 'CNPJ + autocomplete BrasilAPI + endereço completo.', source: 'components/fechamento/FechamentoStep1CompanyForm' },
        { id: '02', name: 'FechamentoStep2Volumetria', desc: 'TPV + ticket + projeção 6m.', source: 'components/fechamento/FechamentoStep2Volumetria' },
        { id: '03', name: 'FechamentoStep3ModeloNegocio', desc: 'Pergunta-chave: gateway, marketplace, ecommerce próprio. Determina segmentComplianceMap → template_model do KYC.', source: 'components/fechamento/FechamentoStep3ModeloNegocio + segmentComplianceMap' },
      ]} />

      <H3 num="8.4.2">Submit dispara cascata</H3>
      <CodeBlock language="js">{`// publicFechamentoSubmit.js (resumo)
1. Cria Merchant (PJ) com dados consolidados.
2. Cria OnboardingCase com questionnaireTemplateId mapeado por segmentComplianceMap.
3. Gera tokenPublico para link de continuação compliance.
4. Envia e-mail (notifyStdProposalLead) com link /ComplianceDinamico?token=...
5. Trigger entity automation onCaseCreated → autoEnrichOnboarding`}</CodeBlock>

      <H2 num="8.5">Funil 5 — Subseller (Sub-merchant via marketplace/gateway)</H2>

      <P>Cliente principal (Merchant com <C>isSubseller: false</C>) gera link via <C>/GerenciarSubsellerLinks</C> e envia ao seu sub-merchant. Sub-merchant abre <C>/SubsellerQuestionnaire</C>, responde questionário compacto, e é criado como Merchant com <C>parentMerchantId</C> + <C>isSubseller: true</C>.</P>

      <H3 num="8.5.1">Tipos suportados (MerchantTypeSelector)</H3>
      <Table dense headers={['Tipo', 'Template', 'Profundidade KYC']} rows={[
        ['PJ MEI', 'subseller_v2', 'Reduzida — basic_data + kyc + collections'],
        ['PJ Simples', 'subseller_v2', 'Padrão — adiciona owners_kyc + processes'],
        ['PJ Lucro Real', 'subseller_v2', 'Completa — adiciona financial_market + credit_*'],
        ['PF (autônomo)', 'subseller_pf', 'PF — basic_data + kyc + first_level_family_kyc + collections'],
      ]} />

      <H2 num="8.6">Pós-Submit Universal — onLeadCreatedEnrich</H2>

      <P>Entity automation dispara em <B>todo</B> create de Lead, independente do funil de origem. Pipeline:</P>

      <Pipeline steps={[
        { id: 'A', name: 'bdcEnrichLead', desc: 'Consulta datasets BDC reduzidos (basic_data + kyc + activity_indicators + media_profile_and_exposure + reputations_and_reviews + financial_market). Persiste em Lead.bdcEnrichmentData (raw) + bdcLeadScore + bdcScoreLevel + bdcFlags[].', source: 'functions/bdcEnrichLead.js' },
        { id: 'B', name: 'analyzeLeadQualifier', desc: 'IA classifica maturidade do lead: EXCELENTE | BOM | REGULAR | FRACO | INSUFICIENTE. Score 0-100 + relatório. Persiste em leadQualifierScore + leadQualifierLevel + leadQualifierReport.', source: 'functions/analyzeLeadQualifier.js' },
        { id: 'C', name: 'analyzeLeadRiskAdvanced', desc: 'IA avalia risco preliminar combinando questionário + BDC. Output: iaRiskScore, iaDecision (AUTO_APROVAR | REVISAO_MANUAL | REJEITAR | PENDENTE), iaSuggestions[], iaPriority.', source: 'functions/analyzeLeadRiskAdvanced.js' },
        { id: 'D', name: 'bdcDeepDueLead (condicional)', desc: 'Apenas se bdcLeadScore < 60 OU iaRiskScore > 70. Consulta datasets adicionais para due diligence aprofundada (processes, government_debtors, esg_and_compliance).', source: 'functions/bdcDeepDueLead.js' },
        { id: 'E', name: 'notifyNewLead', desc: 'Slack #compliance com resumo: nome, segmento, score qualifier, score risco IA, link /LeadDetails.', source: 'functions/notifyNewLead.js' },
        { id: 'F', name: 'emailLeadWelcome', desc: 'E-mail de boas-vindas com próximos passos (vendedor entrará em contato em 24h).', source: 'functions/emailLeadWelcome.js' },
      ]} />

      <H2 num="8.7">Lead Qualifier IA — Critérios de Score</H2>
      <Table headers={['Faixa Score', 'Level', 'Significado']} rows={[
        ['85-100', 'EXCELENTE', 'Empresa madura, TPV alto, baixo risco, fit ideal. Prioridade comercial máxima.'],
        ['70-84', 'BOM', 'Bom fit, follow-up em 24h.'],
        ['50-69', 'REGULAR', 'Fit médio, qualificar mais antes de proposta.'],
        ['30-49', 'FRACO', 'Fit baixo, talvez segmento errado.'],
        ['0-29', 'INSUFICIENTE', 'Não qualificado — descartar ou nutrir.'],
        ['—', 'PENDENTE', 'Análise em curso.'],
      ]} />

      <Source files={[
        'pages/QuestionarioLeadsPagsmile.jsx',
        'pages/LeadPixV4.jsx',
        'pages/IntroducerLandingPage.jsx',
        'pages/FechamentoLandingPage.jsx',
        'pages/SubsellerQuestionnaire.jsx',
        'components/lead-pagsmile/leadV5Validators.js',
        'components/lead-pagsmile/pagsmileQuestionnaireData.js',
        'components/lead-pix-v4/pixQuestionnaireData.js',
        'components/fechamento/segmentComplianceMap.js',
        'functions/publicLeadSubmit.js',
        'functions/publicFechamentoSubmit.js',
        'functions/onLeadCreatedEnrich.js',
        'functions/bdcEnrichLead.js',
        'functions/analyzeLeadQualifier.js',
        'functions/analyzeLeadRiskAdvanced.js',
      ]} />
    </Sec>
  );
}