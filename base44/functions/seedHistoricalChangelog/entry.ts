import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Reconstrói retroativamente o CodeChangelog agrupando entidades, functions e páginas
 * em "épicos" lógicos e gerando narrativa rica via IA.
 *
 * Idempotente: identifica épicos já registrados pela tag `historico-inferido` + título
 * e pula os existentes (a não ser que force=true).
 */

// ─── Definição manual dos épicos (factual, baseada na arquitetura real) ───
// Cada épico agrupa um conjunto de arquivos relacionados. A IA gera a narrativa.
const EPICS = [
  {
    key: 'foundation',
    title: 'Fundação — Modelo de Dados Base & Layout',
    category: 'DATA_MODEL',
    severity: 'HIGH',
    date: '2025-06-15',
    entities: ['Merchant', 'OnboardingCase', 'QuestionnaireTemplate', 'Question', 'QuestionnaireResponse', 'DocumentType', 'DocumentUpload', 'AuditLog'],
    pages: ['Home', 'AdminDashboard'],
    description: 'Modelo de dados central do portal: Merchants (PF/PJ), casos de onboarding, templates de questionário com perguntas dinâmicas, tipos e uploads de documentos, e log de auditoria.'
  },
  {
    key: 'questionnaires',
    title: 'Sistema de Questionários Dinâmicos & Templates',
    category: 'FEATURE',
    severity: 'HIGH',
    date: '2025-07-01',
    pages: ['TemplatesQuestionarios', 'EditorQuestionario', 'LeadQuestionnaire', 'QuestionarioSimplificadoPublico', 'LinksQuestionariosLeads', 'LinksCompliance', 'GerarLinkOnboarding'],
    functionPrefixes: ['suggestQuestionsAI', 'generateQuestionnairePdf'],
    description: 'Editor visual de questionários com perguntas condicionais, biblioteca de perguntas reutilizáveis, geração de links públicos por segmento e fluxo de submissão pelo cliente.'
  },
  {
    key: 'compliance-v4',
    title: 'Compliance V4 — Fluxo Dinâmico Multi-Segmento',
    category: 'COMPLIANCE',
    severity: 'CRITICAL',
    date: '2025-08-15',
    pages: ['ComplianceDinamico', 'ComplianceResume', 'OnboardingCompletion', 'LegacyComplianceRedirect', 'PublicOnboarding'],
    functionPrefixes: ['publicOnboarding', 'publicCompliance', 'loadComplianceProgress', 'saveComplianceProgress', 'emailComplianceFlow'],
    description: 'Fluxo unificado de onboarding compliance V4 cobrindo 12+ segmentos (Gateway, Marketplace, Ecommerce, SaaS, Pix, Lite, etc.), com persistência de rascunho, retomada por link público e step-by-step adaptativo ao perfil do merchant.'
  },
  {
    key: 'risk-v4',
    title: 'Risk Scoring V4 — Framework de 3 Camadas',
    category: 'COMPLIANCE',
    severity: 'CRITICAL',
    date: '2025-09-10',
    entities: ['ComplianceScore', 'ComplianceFinding', 'ComplianceRule'],
    pages: ['RiskScoringV4', 'RiskScoringSubcontas', 'RegrasDeCompliance'],
    functionPrefixes: ['bulkRecomputeDecisions', 'simulateComplianceRule'],
    description: 'Framework V4 de risk scoring com 3 camadas (score base por segmento + variáveis aplicadas + enriquecimento), 8 subfaixas de decisão (1A→5), 10 bloqueios automáticos B01-B10, 6 níveis de monitoramento e cálculo de Rolling Reserve.'
  },
  {
    key: 'sentinel',
    title: 'Agente SENTINEL — IA de Compliance',
    category: 'INTEGRATION',
    severity: 'HIGH',
    date: '2025-09-20',
    entities: ['HelenaAnalysis', 'QualityAssessment'],
    pages: ['HelenaIA'],
    functionPrefixes: ['analyzeOnboarding', 'analyzePriscila', 'analyzeLead', 'analyzeCnpj', 'autoEnrichOnboarding'],
    description: 'Agente IA SENTINEL que faz análise dimensional de 7 eixos (cadastral, financeiro, PLD, documentos, validações externas, consistência declarado-vs-confirmado, reputação digital), gera red flags qualitativos e pode escalar (nunca rebaixar) decisões do Risk V4.'
  },
  {
    key: 'caf',
    title: 'Integração CAF — KYC, Liveness, Documentoscopia',
    category: 'INTEGRATION',
    severity: 'CRITICAL',
    date: '2025-10-01',
    entities: ['IntegrationLog', 'IntegrationConfig', 'ExternalValidationResult'],
    pages: ['IntegracoesExternas', 'CafTestLab'],
    functionPrefixes: ['caf'],
    description: 'Integração completa com CAF (Combate à Fraude): KYC PF/PJ, liveness, facematch, documentoscopia, OCR, biometria oficial, screening internacional. Inclui webhook handler, recaptura automática para baixa qualidade, fallback links e laboratório de testes.'
  },
  {
    key: 'bdc',
    title: 'Integração BigDataCorp — Enriquecimento Profundo',
    category: 'INTEGRATION',
    severity: 'CRITICAL',
    date: '2025-10-15',
    entities: ['BdcRetryQueue'],
    pages: ['BDCHealthDashboard'],
    functionPrefixes: ['bdc', 'enrichLeadData', 'triggerEnrichment'],
    description: 'Pipeline BDC com batches em camadas (CRITICAL → IMPORTANT → COMPLEMENTARY) para PF e PJ, retry com jitter, fila de retry persistente, deep due diligence (KYC, processos, sanções), cross-validation declarado vs confirmado e dashboard de saúde da integração.'
  },
  {
    key: 'leads',
    title: 'Captação & Qualificação de Leads',
    category: 'FEATURE',
    severity: 'HIGH',
    date: '2025-11-01',
    entities: ['Lead', 'LeadActivity', 'SimplifiedLead', 'LandingPageLead', 'LandingPageEvent', 'StandardProposalLead', 'IntroducerLead'],
    pages: ['QuestionariosLeads', 'PipelineComercial', 'QuestionarioLeadsPagsmile', 'LeadPixV4', 'FechamentoLandingPage', 'LeadDetails', 'LeadManagement'],
    functionPrefixes: ['publicLeadSubmit', 'analyzeLeadQualifier', 'analyzeLeadRiskAdvanced', 'checkLeadSLA', 'notifyLead', 'emailLead'],
    agents: ['leadQualifier'],
    description: 'Captação por múltiplos canais (questionário Pagsmile V5, Pix V4, landing pages, propostas padrão, introducers), qualificação por agente IA Lead Qualifier, pipeline comercial Kanban, scoring BDC enriquecido e roteamento automático.'
  },
  {
    key: 'introducers',
    title: 'Sistema de Introducers & Landing Pages',
    category: 'FEATURE',
    severity: 'MEDIUM',
    date: '2025-11-15',
    entities: ['Introducer'],
    pages: ['GestaoIntroducers', 'IntroducerDashboard', 'IntroducerLandingPage', 'GestaoLandingPages'],
    functionPrefixes: ['notifyLandingPageLead', 'notifyStdProposalLead', 'trackLandingPageEvent'],
    description: 'Gestão completa de Introducers (parceiros indicadores) com landing pages personalizadas por slug, dashboard exclusivo do introducer, código de referência, comissionamento e tracking de eventos.'
  },
  {
    key: 'proposals',
    title: 'Sistema de Propostas Comerciais Multi-Tipo',
    category: 'FEATURE',
    severity: 'HIGH',
    date: '2025-12-01',
    entities: ['Proposal', 'StandardProposal', 'PixProposal', 'Partner', 'PartnerCost', 'SegmentDefaultRates'],
    pages: ['GestaoPropostas', 'CriarProposta', 'PropostaDetalhes', 'PropostaPublica', 'GestaoPropostasPadrao', 'CriarPropostaPadrao', 'PropostaPadraoDetalhes', 'PropostaPadraoPublica', 'GestaoPropostasPix', 'CriarPropostaPix', 'PropostaPixDetalhes', 'PropostaPixPublica', 'GerenciarTaxasPadrao', 'ConfiguracaoParceiros'],
    functionPrefixes: ['publicProposalAction', 'expireProposals', 'checkExpiringProposals', 'cascadeSegmentRatesUpdate', 'notifyProposal', 'emailProposal'],
    description: 'Três tipos de proposta (Personalizada, Padrão por segmento, PIX), seleção de parceiro com cálculo de rentabilidade, taxas por bandeira/parcela, antecipação, RAV, mínimo garantido, links públicos com slug amigável, fluxo de aceite/recusa/contraproposta e versionamento.'
  },
  {
    key: 'contracts',
    title: 'Geração & Gestão de Contratos',
    category: 'FEATURE',
    severity: 'HIGH',
    date: '2025-12-15',
    entities: ['Contract'],
    pages: ['GestaoContratos', 'CriarContrato', 'EditorContrato', 'PreviewContrato', 'ContratoPublico'],
    functionPrefixes: ['preGenerateContract', 'notifyContractUpdate'],
    description: 'Geração de contratos a partir de propostas aceitas com 27 cláusulas modulares, anexos personalizáveis, fluxo de assinatura digital com link público, e edição visual com preview em tempo real.'
  },
  {
    key: 'subsellers',
    title: 'Onboarding de Subsellers (Marketplace)',
    category: 'FEATURE',
    severity: 'MEDIUM',
    date: '2026-01-10',
    entities: ['SubsellerScore'],
    pages: ['SubsellerQuestionnaire', 'SubsellerDocUpload', 'GerenciarSubsellerLinks'],
    functionPrefixes: ['scoreSubseller', 'generateSubsellerLink', 'emailSubsellerNotify'],
    description: 'Fluxo completo para sellers principais cadastrarem seus subsellers via link próprio, com questionário simplificado, upload de documentos, scoring específico de subseller e notificações ao seller principal.'
  },
  {
    key: 'kickoff',
    title: 'Apresentação de Kick-Off & Processos Modelo',
    category: 'FEATURE',
    severity: 'MEDIUM',
    date: '2026-01-25',
    entities: ['KickOffPresentation'],
    pages: ['GerarKickOff', 'KickOffPublico', 'ProcessosModelo'],
    description: 'Geração de apresentação de kick-off personalizada por cliente após contrato assinado, com slides de serviços, taxas, SLAs, segurança, suporte, split payment, links de subseller, próximos passos e biblioteca de processos modelo (PDF).'
  },
  {
    key: 'commercial-dashboard',
    title: 'Dashboards Comercial, CEO & Insights',
    category: 'FEATURE',
    severity: 'HIGH',
    date: '2026-02-10',
    pages: ['DashboardComercial', 'DashboardCEO', 'DadosInsights'],
    description: 'Três dashboards executivos: Comercial (funil, pipeline, conversão por segmento, top introducers), CEO (visão consolidada, performance de vendedores, produtividade) e Dados & Insights (16+ seções analíticas: TPV, rentabilidade, risk portfolio, mix, benchmarks).'
  },
  {
    key: 'cadastro',
    title: 'Cadastro Centralizado & Análise Completa',
    category: 'FEATURE',
    severity: 'HIGH',
    date: '2026-02-20',
    pages: ['Cadastro', 'CadastroDetalhe', 'AnaliseCompleta', 'DocumentoKYCKYB', 'BulkReprocess', 'EscalationsReview'],
    functionPrefixes: ['exportCadastroReport', 'generateCadastroPdf', 'generateCompliancePdf', 'downloadCaseDocuments', 'getCaseDocumentUrls', 'bulkReprocess', 'bulkRevalidate'],
    description: 'Visão 360° do cadastro do cliente unificando merchant, compliance, enriquecimento BDC, CAF, propostas, contratos e histórico. Inclui análise cruzada V4+SENTINEL+CAF, geração de PDF KYC/KYB, reprocessamento em lote e revisão de escalações.'
  },
  {
    key: 'revalidation',
    title: 'Revalidação Periódica de Compliance',
    category: 'COMPLIANCE',
    severity: 'HIGH',
    date: '2026-03-05',
    entities: ['RevalidationSchedule'],
    pages: ['GestaoRevalidacao'],
    functionPrefixes: ['revalidateBdc', 'revalidateRiskScoring'],
    description: 'Sistema de revalidação periódica obrigatória (anual/semestral conforme risco), painel de gestão com filtros, ação em lote, comparação histórica e alertas de vencimento próximo.'
  },
  {
    key: 'partners-compliance',
    title: 'Portal de Parceiros de Compliance',
    category: 'FEATURE',
    severity: 'HIGH',
    date: '2026-03-20',
    entities: ['CompliancePartner', 'CompliancePartnerUser', 'PartnerAssignment', 'PartnerAssignmentActivity', 'AccessProfile', 'UserProfileAssignment'],
    pages: ['ComplianceParceiro', 'ComplianceParceiroDetalhe', 'AdminGestaoParceiros', 'DocCompParceiros', 'GestaoPerfis', 'EditorPerfil', 'GestaoUsuarios'],
    functionPrefixes: ['partner', 'admin', 'getMyPermissions'],
    description: 'Portal externo para parceiros de compliance terceirizados analisarem casos atribuídos, com mascaramento de PII, SLA monitorado, formulário estruturado de recomendação, RBAC granular por perfis de acesso e administração de usuários/parceiros.'
  },
  {
    key: 'security-2fa',
    title: 'Segurança & Autenticação 2FA Obrigatória',
    category: 'SECURITY',
    severity: 'CRITICAL',
    date: '2026-04-05',
    entities: ['TwoFactorAudit', 'AdminLoginAttempt', 'AccessAudit'],
    functionPrefixes: ['twoFactor', 'verifyAdmin', 'verifyUserAuth'],
    description: 'Camada de segurança em 2 fatores obrigatória para admins: TOTP + PIN individual, backup codes, JWT server-signed validado a cada mount, RBAC server-side imune a tampering via DevTools, auditoria de todos os eventos de autenticação e tentativas de login.'
  },
  {
    key: 'i18n',
    title: 'Internacionalização (PT/EN/ZH)',
    category: 'UI_UX',
    severity: 'MEDIUM',
    date: '2026-04-10',
    description: 'Sistema de traduções com LanguageContext, seletor de idioma no header, suporte para Português, Inglês e Chinês, translations modulares por feature.'
  },
  {
    key: 'caf-test-lab',
    title: 'CAF Test Lab — Diagnóstico & QA',
    category: 'INFRA',
    severity: 'MEDIUM',
    date: '2026-04-15',
    pages: ['CafTestLab'],
    functionPrefixes: ['cafTest', 'cafConnect', 'cafDiagnose', 'cafReconcile', 'cafHealthCheck', 'e2e'],
    description: 'Laboratório administrativo para testar todos os endpoints CAF (Connect, SDK, webhook, compliance submit), diagnóstico de gaps, reconciliação de transações órfãs e testes E2E do fluxo completo.'
  },
  {
    key: 'governance',
    title: 'Governança Centralizada & Changelog',
    category: 'GOVERNANCE',
    severity: 'HIGH',
    date: '2026-04-28',
    entities: ['CodeChangelog'],
    pages: ['Governanca', 'AuditoriaAcessos'],
    description: 'Página /Governanca unificando AuditLog, AccessAudit, TwoFactorAudit, AdminLoginAttempt, framework de 7 pilares e sistema de Changelog de código com timeline, filtros e narrativa rica de cada implementação.'
  }
];

const FORCE_MODEL = 'gemini_3_flash';

async function generateEpicNarrative(base44, epic) {
  const prompt = `Você é um historiador técnico documentando retroativamente a evolução de uma plataforma de compliance/onboarding/payments brasileira (Pagsmile DocComp Parceiros).

Gere uma entrada de changelog rica e profissional para o épico abaixo.

ÉPICO: ${epic.title}
CATEGORIA: ${epic.category}
DESCRIÇÃO BASE: ${epic.description}
${epic.entities ? `ENTIDADES: ${epic.entities.join(', ')}` : ''}
${epic.pages ? `PÁGINAS: ${epic.pages.join(', ')}` : ''}
${epic.functionPrefixes ? `FUNCTIONS (prefixos): ${epic.functionPrefixes.join(', ')}` : ''}
${epic.agents ? `AGENTES IA: ${epic.agents.join(', ')}` : ''}

Retorne JSON com:
- summary: resumo executivo (1-2 parágrafos, ~100 palavras)
- businessImpact: impacto de negócio claro, mencionando regulação BCB/LGPD quando relevante (~80 palavras)
- technicalDetails: detalhes técnicos em markdown com seções ## Arquitetura, ## Componentes Chave, ## Decisões de Design (~250 palavras, use bullets)
- testingNotes: como validar (~40 palavras)
- tags: array de 3-6 tags lowercase relevantes`;

  try {
    const out = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: FORCE_MODEL,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          businessImpact: { type: 'string' },
          technicalDetails: { type: 'string' },
          testingNotes: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } }
        },
        required: ['summary', 'businessImpact', 'technicalDetails']
      }
    });
    return out;
  } catch (e) {
    return {
      summary: epic.description,
      businessImpact: 'Componente fundamental da plataforma.',
      technicalDetails: `## Visão Geral\n\n${epic.description}`,
      testingNotes: 'Validar funcionamento via fluxo end-to-end na aplicação.',
      tags: ['historico-inferido', epic.key]
    };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const force = !!body.force;

    // Carrega changelogs existentes para evitar duplicar
    const existing = await base44.asServiceRole.entities.CodeChangelog.list('-implementedAt', 1000);
    const existingTitles = new Set(existing.map(e => e.title));

    const created = [];
    const skipped = [];
    const errors = [];

    for (const epic of EPICS) {
      const reconstructedTitle = `[reconstruído] ${epic.title}`;
      if (!force && existingTitles.has(reconstructedTitle)) {
        skipped.push(epic.key);
        continue;
      }

      try {
        const narrative = await generateEpicNarrative(base44, epic);

        const filesChanged = [
          ...(epic.entities || []).map(e => ({ path: `entities/${e}.json`, action: 'created', description: 'Schema da entidade' })),
          ...(epic.pages || []).map(p => ({ path: `pages/${p}`, action: 'created', description: 'Página' })),
          ...(epic.functionPrefixes || []).map(f => ({ path: `functions/${f}*`, action: 'created', description: 'Backend function(s)' })),
          ...(epic.agents || []).map(a => ({ path: `agents/${a}.json`, action: 'created', description: 'Agente IA' }))
        ];

        const record = {
          title: reconstructedTitle,
          category: epic.category,
          severity: epic.severity,
          userRequest: '[Reconstruído retroativamente — pedido original do chat não preservado]',
          summary: narrative.summary,
          businessImpact: narrative.businessImpact,
          technicalDetails: narrative.technicalDetails,
          testingNotes: narrative.testingNotes || '',
          filesChanged,
          entitiesAffected: epic.entities || [],
          pagesAffected: epic.pages || [],
          functionsAffected: epic.functionPrefixes || [],
          tags: ['historico-inferido', epic.key, ...(narrative.tags || []).slice(0, 5)],
          breakingChanges: false,
          implementedBy: 'system-reconstruction',
          implementedAt: `${epic.date}T12:00:00.000Z`
        };

        await base44.asServiceRole.entities.CodeChangelog.create(record);
        created.push(epic.key);
      } catch (err) {
        errors.push({ key: epic.key, error: err.message });
      }
    }

    return Response.json({
      success: true,
      total_epics: EPICS.length,
      created: created.length,
      skipped: skipped.length,
      errors: errors.length,
      created_keys: created,
      skipped_keys: skipped,
      error_details: errors
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});