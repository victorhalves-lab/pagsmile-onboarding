import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ══════════════════════════════════════════════════════════════════
// SEED ACCESS PROFILES — popula/atualiza perfis padrão
// ══════════════════════════════════════════════════════════════════
// Só admins podem executar. Cria perfis que não existem, atualiza
// os isSystem (admin + introducer) para manter consistência.
// Não sobrescreve perfis customizados (não-isSystem) já existentes.
// ══════════════════════════════════════════════════════════════════

// Importar seria ideal mas functions NÃO podem importar arquivos locais.
// Por isso inlinamos o DEFAULT_PROFILES (cópia fiel de lib/defaultProfiles.js).
// Quando atualizar lib/defaultProfiles.js, atualizar aqui também.

const DEFAULT_PROFILES = [
  {
    slug: "admin", name: "Administrador",
    description: "Acesso total ao sistema. Único perfil que pode editar perfis e atribuir roles.",
    color: "#ef4444", icon: "Crown", isSystem: true, isActive: true, requiresAdminCode: true,
    homePage: "Home", pagePermissions: []
  },
  {
    slug: "ceo", name: "CEO",
    description: "Visão executiva read-only sobre KPIs, funis, equipe e compliance.",
    color: "#8b5cf6", icon: "Briefcase", isSystem: false, isActive: true, requiresAdminCode: true,
    homePage: "DashboardCEO",
    pagePermissions: [
      { pageId: "Home", canView: true },
      { pageId: "DashboardCEO", canView: true,
        tabs: { kpis: { canView: true }, funnel: { canView: true }, team: { canView: true, subTabs: { productivity: { canView: true }, performance: { canView: true } } }, trends: { canView: true }, compliance_overview: { canView: true } },
        actions: { export_data: true, drill_down: true } },
      { pageId: "DashboardComercial", canView: true, actions: { export_data: true } },
      { pageId: "DadosInsights", canView: true,
        tabs: {
          funnel: { canView: true },
          leads: { canView: true, subTabs: { profile: { canView: true }, origin: { canView: true }, qualifier: { canView: true } } },
          compliance: { canView: true, subTabs: { journey: { canView: true }, risk_portfolio: { canView: true }, risk_operational: { canView: true } } },
          tpv_mix: { canView: true }, profitability: { canView: true }, commercial: { canView: true },
          introducer: { canView: true }, market: { canView: true }, data_health: { canView: true }
        },
        actions: { export_csv: true, view_raw_data: false } },
      { pageId: "RiskScoringV4", canView: true, tabs: { cases: { canView: true }, decisions: { canView: true }, clients: { canView: true } } }
    ]
  },
  {
    slug: "commercial", name: "Comercial",
    description: "Vendedor / Comercial. Gerencia leads, propostas e pipeline.",
    color: "#2bc196", icon: "Users", isSystem: false, isActive: true, requiresAdminCode: false,
    homePage: "DashboardComercial",
    pagePermissions: [
      { pageId: "Home", canView: true },
      { pageId: "DashboardComercial", canView: true, actions: { export_data: true } },
      { pageId: "LinksQuestionariosLeads", canView: true, actions: { create: true, delete: false, regenerate: true } },
      { pageId: "QuestionariosLeads", canView: true, actions: { view_detail: true, assign_seller: true, export_csv: true } },
      { pageId: "PipelineComercial", canView: true, actions: { update_status: true, follow_up: true } },
      { pageId: "GestaoPropostas", canView: true, actions: { create: true, edit: true, send: true, delete: false } },
      { pageId: "CriarProposta", canView: true },
      { pageId: "GestaoPropostasPadrao", canView: true, actions: { create: true, edit: true, delete: false } },
      { pageId: "GestaoPropostasPix", canView: true, actions: { create: true, edit: true, delete: false } },
      { pageId: "GestaoIntroducers", canView: true, actions: { create: false, edit: false, invite: false } },
      { pageId: "GestaoLandingPages", canView: true },
      { pageId: "QuestionarioReuniao", canView: true },
      { pageId: "ProcessMeetingNotes", canView: true },
      { pageId: "GerarKickOff", canView: true },
      { pageId: "Cadastro", canView: true, tabs: { dashboard: { canView: true }, list: { canView: true } }, actions: { export_csv: true, bulk_select: false } },
      { pageId: "CadastroDetalhe", canView: true,
        tabs: {
          overview: { canView: true, canEdit: false },
          dados: { canView: true, canEdit: false, subTabs: { merchant: { canView: true }, partners: { canView: true }, address: { canView: true } } },
          proposta: { canView: true, canEdit: true }, contrato: { canView: true, canEdit: false },
          subsellers: { canView: true, canEdit: false }, documentos: { canView: true, canEdit: false },
          compliance: { canView: false }, enrichment: { canView: false }, historico: { canView: true }
        },
        actions: { export_pdf: true, send_message: true, approve: false, reject: false } }
    ]
  },
  {
    slug: "compliance", name: "Compliance",
    description: "Analista de Compliance (interno). Acesso a casos, questionários e análise básica.",
    color: "#2bc196", icon: "Shield", isSystem: false, isActive: true, requiresAdminCode: true,
    homePage: "QuestionariosRecebidos",
    pagePermissions: [
      { pageId: "Home", canView: true },
      { pageId: "AdminDashboard", canView: true, actions: { export: false } },
      { pageId: "LinksCompliance", canView: true, actions: { create: false, delete: false, regenerate: true } },
      { pageId: "QuestionariosRecebidos", canView: true,
        tabs: { list: { canView: true }, drafts: { canView: true }, subsellers: { canView: false } },
        actions: { view_detail: true, bulk_approve: false, bulk_reject: false, assign_analyst: false, regenerate_link: true, export_csv: false } },
      { pageId: "CadastroDetalhe", canView: true,
        tabs: {
          overview: { canView: true, canEdit: false },
          dados: { canView: true, canEdit: false, subTabs: { merchant: { canView: true }, partners: { canView: true }, address: { canView: true } } },
          proposta: { canView: false }, contrato: { canView: false },
          subsellers: { canView: true, canEdit: false }, documentos: { canView: true, canEdit: false },
          compliance: { canView: true, canEdit: false, subTabs: {
            score_breakdown: { canView: true }, findings: { canView: true, canEdit: false },
            cross_validation: { canView: true }, variables: { canView: false },
            monitoring: { canView: true }, decision_matrix: { canView: false }, regulatory: { canView: true }
          }},
          enrichment: { canView: true, canEdit: false, subTabs: {
            score_bdc: { canView: true }, datasets_raw: { canView: false },
            lawsuits: { canView: true }, sanctions: { canView: true },
            reputation: { canView: true }, credit: { canView: false }, timeline: { canView: true }
          }},
          historico: { canView: true }
        },
        actions: { approve: false, reject: false, reopen: false, escalate: true, export_pdf: true, send_message: true, recompute_score: false, override_score: false, reassign: false, delete: false } }
    ]
  },
  {
    slug: "compliance_partner", name: "Compliance Parceiro",
    description: "Time de Compliance de Parceiros externos. Acesso restrito e auditado.",
    color: "#f59e0b", icon: "Handshake", isSystem: false, isActive: true, requiresAdminCode: true,
    homePage: "QuestionariosRecebidos",
    pagePermissions: [
      { pageId: "Home", canView: true },
      { pageId: "AdminDashboard", canView: true, actions: { export: false } },
      { pageId: "QuestionariosRecebidos", canView: true,
        tabs: { list: { canView: true }, drafts: { canView: false }, subsellers: { canView: false } },
        actions: { view_detail: true, bulk_approve: false, bulk_reject: false, assign_analyst: false, regenerate_link: false, export_csv: false } },
      { pageId: "CadastroDetalhe", canView: true,
        tabs: {
          overview: { canView: true, canEdit: false },
          dados: { canView: true, canEdit: false, subTabs: { merchant: { canView: true }, partners: { canView: true }, address: { canView: false } } },
          proposta: { canView: false }, contrato: { canView: false }, subsellers: { canView: false },
          documentos: { canView: true, canEdit: false },
          compliance: { canView: true, canEdit: false, subTabs: {
            score_breakdown: { canView: true }, findings: { canView: true, canEdit: false },
            cross_validation: { canView: false }, variables: { canView: false },
            monitoring: { canView: false }, decision_matrix: { canView: false }, regulatory: { canView: true }
          }},
          enrichment: { canView: true, canEdit: false, subTabs: {
            score_bdc: { canView: true }, datasets_raw: { canView: false },
            lawsuits: { canView: true }, sanctions: { canView: true },
            reputation: { canView: false }, credit: { canView: false }, timeline: { canView: false }
          }},
          historico: { canView: true }
        },
        actions: { approve: false, reject: false, reopen: false, escalate: false, export_pdf: true, send_message: false, recompute_score: false, override_score: false, reassign: false, delete: false } }
    ]
  },
  {
    slug: "compliance_senior", name: "Compliance Sênior",
    description: "Compliance com permissões avançadas: aprovação, override, bulk, regras.",
    color: "#14b8a6", icon: "ShieldCheck", isSystem: false, isActive: true, requiresAdminCode: true,
    homePage: "AdminDashboard",
    pagePermissions: [
      { pageId: "Home", canView: true },
      { pageId: "AdminDashboard", canView: true, actions: { export: true } },
      { pageId: "LinksCompliance", canView: true, actions: { create: true, delete: true, regenerate: true } },
      { pageId: "QuestionariosRecebidos", canView: true,
        tabs: { list: { canView: true }, drafts: { canView: true }, subsellers: { canView: true } },
        actions: { view_detail: true, bulk_approve: true, bulk_reject: true, assign_analyst: true, regenerate_link: true, export_csv: true } },
      { pageId: "AnaliseDeCasos", canView: true },
      { pageId: "CadastroDetalhe", canView: true,
        tabs: {
          overview: { canView: true, canEdit: true },
          dados: { canView: true, canEdit: true, subTabs: { merchant: { canView: true, canEdit: true }, partners: { canView: true, canEdit: true }, address: { canView: true, canEdit: true } } },
          proposta: { canView: true, canEdit: false }, contrato: { canView: true, canEdit: false },
          subsellers: { canView: true, canEdit: true }, documentos: { canView: true, canEdit: true },
          compliance: { canView: true, canEdit: true, subTabs: {
            score_breakdown: { canView: true, canEdit: true }, findings: { canView: true, canEdit: true },
            cross_validation: { canView: true, canEdit: true }, variables: { canView: true, canEdit: true },
            monitoring: { canView: true, canEdit: true }, decision_matrix: { canView: true, canEdit: true }, regulatory: { canView: true, canEdit: true }
          }},
          enrichment: { canView: true, canEdit: true, subTabs: {
            score_bdc: { canView: true, canEdit: true }, datasets_raw: { canView: true, canEdit: false },
            lawsuits: { canView: true, canEdit: false }, sanctions: { canView: true, canEdit: false },
            reputation: { canView: true, canEdit: false }, credit: { canView: true, canEdit: false }, timeline: { canView: true, canEdit: false }
          }},
          historico: { canView: true }
        },
        actions: { approve: true, reject: true, reopen: true, escalate: true, export_pdf: true, send_message: true, recompute_score: true, override_score: true, reassign: true, delete: false } },
      { pageId: "AnaliseCompleta", canView: true,
        tabs: {
          resumo: { canView: true },
          bdc: { canView: true, subTabs: { identidade: { canView: true }, kyc: { canView: true }, legal: { canView: true }, societario: { canView: true }, digital: { canView: true } } },
          caf: { canView: true, subTabs: { liveness: { canView: true }, face_match: { canView: true }, documentoscopia: { canView: true }, ocr: { canView: true }, credit_screen: { canView: true } } },
          cruzada: { canView: true }, timeline: { canView: true }
        },
        actions: { reprocess_bdc: true, reprocess_caf: true, export_report: true } },
      { pageId: "GestaoDocumentos", canView: true },
      { pageId: "GestaoRevalidacao", canView: true },
      { pageId: "GerenciarSubsellerLinks", canView: true },
      { pageId: "RiskScoringV4", canView: true, tabs: { cases: { canView: true }, decisions: { canView: true }, clients: { canView: true } }, actions: { override_score: true, reassign_risk: true } },
      { pageId: "RiskScoringSubcontas", canView: true },
      { pageId: "EscalationsReview", canView: true, actions: { approve_escalation: true, reject_escalation: true } },
      { pageId: "BulkReprocess", canView: true, tabs: { selection: { canView: true }, queue: { canView: true } }, actions: { execute_bulk: true, cancel_job: true } },
      { pageId: "DocumentoKYCKYB", canView: true },
      { pageId: "RegrasDeCompliance", canView: true, actions: { create: true, edit: true, delete: false } },
      { pageId: "Cadastro", canView: true, tabs: { dashboard: { canView: true }, list: { canView: true } }, actions: { export_csv: true, bulk_select: true } },
      { pageId: "BDCHealthDashboard", canView: true }
    ]
  },
  {
    slug: "financial", name: "Financeiro",
    description: "Gestão de contratos, pagamentos e taxas.",
    color: "#3b82f6", icon: "DollarSign", isSystem: false, isActive: true, requiresAdminCode: true,
    homePage: "GestaoContratos",
    pagePermissions: [
      { pageId: "Home", canView: true },
      { pageId: "GestaoContratos", canView: true, actions: { create: true, edit: true, send: true, approve: true, delete: false } },
      { pageId: "CriarContrato", canView: true },
      { pageId: "EditorContrato", canView: true },
      { pageId: "PreviewContrato", canView: true },
      { pageId: "GerenciarTaxasPadrao", canView: true },
      { pageId: "ConfiguracaoParceiros", canView: true,
        tabs: { partners: { canView: true, canEdit: false }, mccs: { canView: true, canEdit: false }, costs: { canView: true, canEdit: true } },
        actions: { add_partner: false, edit_rates: true, delete_partner: false } },
      { pageId: "Cadastro", canView: true, tabs: { dashboard: { canView: true }, list: { canView: true } } },
      { pageId: "CadastroDetalhe", canView: true,
        tabs: {
          overview: { canView: true, canEdit: false }, dados: { canView: true, canEdit: false },
          proposta: { canView: true, canEdit: false }, contrato: { canView: true, canEdit: true },
          subsellers: { canView: false }, documentos: { canView: true, canEdit: false },
          compliance: { canView: false }, enrichment: { canView: false }, historico: { canView: true }
        } }
    ]
  },
  {
    slug: "auditor", name: "Auditor",
    description: "Acesso read-only a todas as páginas e dados para auditoria.",
    color: "#64748b", icon: "Eye", isSystem: false, isActive: true, requiresAdminCode: true,
    homePage: "Home",
    pagePermissions: "AUDITOR_READONLY_ALL"
  },
  {
    slug: "introducer", name: "Introducer",
    description: "Parceiro externo. Vê apenas o Dashboard do Introducer.",
    color: "#ec4899", icon: "Handshake", isSystem: true, isActive: true, requiresAdminCode: false,
    homePage: "IntroducerDashboard",
    pagePermissions: [ { pageId: "IntroducerDashboard", canView: true } ]
  }
];

// Gera a permissão "tudo read-only" expandindo do registry
function buildAuditorReadOnlyFromRegistry() {
  // Como não podemos importar, vamos fazer simples: lista de pageIds principais com canView:true e canEdit:false.
  // O frontend enforça o default-deny pra qualquer coisa não listada. Então basta listar as 50+ páginas principais.
  const pageIds = [
    "Home","DashboardCEO","DashboardComercial","LinksQuestionariosLeads","QuestionariosLeads",
    "PipelineComercial","GestaoPropostas","CriarProposta","GestaoPropostasPadrao","GestaoPropostasPix",
    "GestaoIntroducers","GestaoLandingPages","QuestionarioReuniao","ProcessMeetingNotes",
    "AdminDashboard","LinksCompliance","QuestionariosRecebidos","AnaliseDeCasos","CadastroDetalhe",
    "AnaliseCompleta","GestaoDocumentos","GestaoRevalidacao","GerenciarSubsellerLinks",
    "RiskScoringV4","RiskScoringSubcontas","EscalationsReview","BulkReprocess","DocumentoKYCKYB",
    "GestaoContratos","CriarContrato","EditorContrato","PreviewContrato",
    "Cadastro","DadosInsights","BDCHealthDashboard",
    "GerarLinkOnboarding","TemplatesQuestionarios","MessageTemplates","GerenciarTaxasPadrao",
    "RegrasDeCompliance","ConfiguracaoParceiros","IntegracoesExternas","HelenaIA",
    "Configuracoes","Auditoria","AuditoriaAcessos",
    "HowItWorks","ProcessosModelo","GerarKickOff"
  ];
  return pageIds.map(pageId => ({ pageId, canView: true }));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const existing = await base44.asServiceRole.entities.AccessProfile.list();
    const existingSlugs = new Set(existing.map(p => p.slug));

    let created = 0;
    let updated = 0;
    const results = [];

    for (const profile of DEFAULT_PROFILES) {
      let pagePermissions = profile.pagePermissions;
      if (pagePermissions === "AUDITOR_READONLY_ALL") {
        pagePermissions = buildAuditorReadOnlyFromRegistry();
      }

      const payload = { ...profile, pagePermissions };

      const existingMatch = existing.find(p => p.slug === profile.slug);
      if (!existingMatch) {
        await base44.asServiceRole.entities.AccessProfile.create(payload);
        created++;
        results.push({ slug: profile.slug, action: 'created' });
      } else if (profile.isSystem) {
        // Força atualização de perfis do sistema (admin / introducer)
        await base44.asServiceRole.entities.AccessProfile.update(existingMatch.id, payload);
        updated++;
        results.push({ slug: profile.slug, action: 'updated_system' });
      } else {
        results.push({ slug: profile.slug, action: 'skipped_custom' });
      }
    }

    return Response.json({ success: true, created, updated, total: existing.length + created, results });
  } catch (error) {
    console.error('[seedAccessProfiles] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});