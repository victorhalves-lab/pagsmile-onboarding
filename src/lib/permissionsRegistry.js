// ══════════════════════════════════════════════════════════════════
// PERMISSIONS REGISTRY — Fonte única da verdade
// ══════════════════════════════════════════════════════════════════
// Este arquivo declara TODAS as páginas, abas, sub-abas e ações do app.
// Serve como catálogo para:
//   1) O editor de perfis (renderiza a árvore de permissões)
//   2) O sidebar dinâmico (saber a qual seção cada página pertence)
//   3) Os componentes <ProtectedPage> / <ProtectedTab> / <Can>
//   4) A auditoria (validar que action/tab existe)
// ══════════════════════════════════════════════════════════════════

export const PAGES_REGISTRY = [
  // ════════ LEADS & PROPOSTAS ════════
  {
    section: "leads",
    sectionLabel: "Leads & Propostas",
    sectionIcon: "Inbox",
    pages: [
      { id: "DashboardCEO", name: "Dashboard CEO", path: "/DashboardCEO",
        tabs: [
          { id: "kpis", name: "KPIs" },
          { id: "funnel", name: "Funil" },
          { id: "team", name: "Equipe", subTabs: [
            { id: "productivity", name: "Produtividade" },
            { id: "performance",  name: "Performance por Seller" }
          ]},
          { id: "trends", name: "Tendências" },
          { id: "compliance_overview", name: "Compliance Overview" }
        ],
        actions: [
          { id: "export_data", label: "Exportar dados" },
          { id: "drill_down",  label: "Drill-down" }
        ]
      },
      { id: "DashboardComercial", name: "Dashboard Comercial", path: "/DashboardComercial",
        actions: [ { id: "export_data", label: "Exportar dados" } ]
      },
      { id: "LinksQuestionariosLeads", name: "Links de Questionários", path: "/LinksQuestionariosLeads",
        actions: [
          { id: "create",     label: "Criar link" },
          { id: "delete",     label: "Deletar link" },
          { id: "regenerate", label: "Regenerar link" }
        ]
      },
      { id: "QuestionariosLeads", name: "Questionários Recebidos (Leads)", path: "/QuestionariosLeads",
        actions: [
          { id: "view_detail",    label: "Ver detalhes" },
          { id: "assign_seller",  label: "Atribuir vendedor" },
          { id: "export_csv",     label: "Exportar CSV" }
        ]
      },
      { id: "PipelineComercial", name: "Pipeline Comercial", path: "/PipelineComercial",
        actions: [
          { id: "update_status", label: "Atualizar status" },
          { id: "follow_up",     label: "Follow-up" }
        ]
      },
      { id: "GestaoPropostas", name: "Gestão de Propostas", path: "/GestaoPropostas",
        actions: [
          { id: "create", label: "Criar" }, { id: "edit", label: "Editar" },
          { id: "send",   label: "Enviar" }, { id: "delete", label: "Deletar" }
        ]
      },
      { id: "CriarProposta", name: "Criar Proposta", path: "/CriarProposta" },
      { id: "GestaoPropostasPadrao", name: "Propostas Padrão", path: "/GestaoPropostasPadrao",
        actions: [
          { id: "create", label: "Criar" }, { id: "edit", label: "Editar" },
          { id: "delete", label: "Deletar" }
        ]
      },
      { id: "GestaoPropostasPix", name: "Propostas PIX", path: "/GestaoPropostasPix",
        actions: [
          { id: "create", label: "Criar" }, { id: "edit", label: "Editar" },
          { id: "delete", label: "Deletar" }
        ]
      },
      { id: "GestaoIntroducers", name: "Introducers", path: "/GestaoIntroducers",
        actions: [
          { id: "create", label: "Criar" }, { id: "edit", label: "Editar" },
          { id: "delete", label: "Deletar" }, { id: "invite", label: "Convidar" }
        ]
      },
      { id: "GestaoLandingPages", name: "Landing Pages", path: "/GestaoLandingPages",
        actions: [ { id: "create", label: "Criar" }, { id: "edit", label: "Editar" } ]
      },
      { id: "QuestionarioReuniao", name: "Questionário de Reunião", path: "/QuestionarioReuniao" },
      { id: "ProcessMeetingNotes", name: "Processar Notas (IA)", path: "/ProcessMeetingNotes" }
    ]
  },

  // ════════ COMPLIANCE ════════
  {
    section: "compliance",
    sectionLabel: "Compliance",
    sectionIcon: "Shield",
    pages: [
      { id: "AdminDashboard", name: "Dashboard Compliance", path: "/AdminDashboard",
        actions: [ { id: "export", label: "Exportar" } ]
      },
      { id: "LinksCompliance", name: "Links de Compliance", path: "/LinksCompliance",
        actions: [
          { id: "create",     label: "Criar link" },
          { id: "delete",     label: "Deletar link" },
          { id: "regenerate", label: "Regenerar link" }
        ]
      },
      { id: "QuestionariosRecebidos", name: "Questionários Recebidos", path: "/QuestionariosRecebidos",
        tabs: [
          { id: "list",       name: "Lista de Casos" },
          { id: "drafts",     name: "Rascunhos" },
          { id: "subsellers", name: "Subsellers" }
        ],
        actions: [
          { id: "view_detail",    label: "Ver detalhes" },
          { id: "bulk_approve",   label: "Aprovar em lote" },
          { id: "bulk_reject",    label: "Rejeitar em lote" },
          { id: "assign_analyst", label: "Atribuir analista" },
          { id: "regenerate_link",label: "Regenerar link" },
          { id: "export_csv",     label: "Exportar CSV" }
        ]
      },
      { id: "AnaliseDeCasos", name: "Análise de Casos", path: "/AnaliseDeCasos" },
      { id: "CadastroDetalhe", name: "Detalhes do Cadastro", path: "/CadastroDetalhe",
        tabs: [
          { id: "overview", name: "Overview" },
          { id: "dados", name: "Dados", subTabs: [
            { id: "merchant", name: "Dados do Merchant" },
            { id: "partners", name: "Sócios / QSA" },
            { id: "address",  name: "Endereços" }
          ]},
          { id: "proposta", name: "Proposta" },
          { id: "contrato", name: "Contrato" },
          { id: "subsellers", name: "Subsellers" },
          { id: "documentos", name: "Documentos" },
          { id: "compliance", name: "Compliance", subTabs: [
            { id: "score_breakdown",  name: "Score Breakdown" },
            { id: "findings",         name: "Findings" },
            { id: "cross_validation", name: "Cross Validation" },
            { id: "variables",        name: "Variáveis" },
            { id: "monitoring",       name: "Monitoramento" },
            { id: "decision_matrix",  name: "Decision Matrix" },
            { id: "regulatory",       name: "Regulatory Panel" }
          ]},
          { id: "enrichment", name: "Enrichment (BDC)", subTabs: [
            { id: "score_bdc",    name: "Score BDC" },
            { id: "datasets_raw", name: "Datasets Raw" },
            { id: "lawsuits",     name: "Processos" },
            { id: "sanctions",    name: "Sanções / PEP" },
            { id: "reputation",   name: "Reputação Digital" },
            { id: "credit",       name: "Crédito" },
            { id: "timeline",     name: "Timeline" }
          ]},
          { id: "historico", name: "Histórico" }
        ],
        actions: [
          { id: "approve",         label: "Aprovar caso" },
          { id: "reject",          label: "Rejeitar caso" },
          { id: "reopen",          label: "Reabrir caso" },
          { id: "escalate",        label: "Escalar" },
          { id: "recompute_score", label: "Recalcular score" },
          { id: "override_score",  label: "Override de score" },
          { id: "export_pdf",      label: "Exportar PDF" },
          { id: "send_message",    label: "Enviar mensagem" },
          { id: "reassign",        label: "Reatribuir analista" },
          { id: "delete",          label: "Deletar caso" }
        ]
      },
      { id: "AnaliseCompleta", name: "Análise Completa", path: "/AnaliseCompleta",
        tabs: [
          { id: "resumo", name: "Resumo Executivo" },
          { id: "bdc", name: "BDC Completa", subTabs: [
            { id: "identidade", name: "Identidade" },
            { id: "kyc",        name: "KYC" },
            { id: "legal",      name: "Legal" },
            { id: "societario", name: "Societário" },
            { id: "digital",    name: "Digital/Reputação" }
          ]},
          { id: "caf", name: "CAF Completa", subTabs: [
            { id: "liveness",     name: "Liveness" },
            { id: "face_match",   name: "Face Match" },
            { id: "documentoscopia", name: "Documentoscopia" },
            { id: "ocr",          name: "OCR" },
            { id: "credit_screen",name: "Crédito/Screening" }
          ]},
          { id: "cruzada", name: "Análise Cruzada" },
          { id: "timeline", name: "Timeline" }
        ],
        actions: [
          { id: "reprocess_bdc",  label: "Reprocessar BDC" },
          { id: "reprocess_caf",  label: "Reprocessar CAF" },
          { id: "export_report",  label: "Exportar Relatório" }
        ]
      },
      { id: "GestaoDocumentos", name: "Gestão de Documentos", path: "/GestaoDocumentos" },
      { id: "GestaoRevalidacao", name: "Revalidação", path: "/GestaoRevalidacao" },
      { id: "GerenciarSubsellerLinks", name: "Links de Subseller", path: "/GerenciarSubsellerLinks" },
      { id: "RiskScoringV4", name: "Risk Scoring V4", path: "/RiskScoringV4",
        tabs: [
          { id: "cases",     name: "Casos" },
          { id: "decisions", name: "Decisões" },
          { id: "clients",   name: "Clientes" }
        ],
        actions: [
          { id: "override_score", label: "Override Score" },
          { id: "reassign_risk",  label: "Reatribuir Risco" }
        ]
      },
      { id: "RiskScoringSubcontas", name: "Risk Scoring Subcontas", path: "/RiskScoringSubcontas" },
      { id: "EscalationsReview", name: "Escalações Questionáveis", path: "/EscalationsReview",
        actions: [
          { id: "approve_escalation", label: "Aprovar escalação" },
          { id: "reject_escalation",  label: "Rejeitar escalação" }
        ]
      },
      { id: "BulkReprocess", name: "Reprocessar Compliance", path: "/BulkReprocess",
        tabs: [
          { id: "selection", name: "Seleção" },
          { id: "queue",     name: "Fila" }
        ],
        actions: [
          { id: "execute_bulk", label: "Executar em lote" },
          { id: "cancel_job",   label: "Cancelar job" }
        ]
      },
      { id: "DocumentoKYCKYB", name: "Documento KYC/KYB", path: "/DocumentoKYCKYB" }
    ]
  },

  // ════════ CONTRATOS ════════
  {
    section: "contratos",
    sectionLabel: "Contratos",
    sectionIcon: "Stamp",
    pages: [
      { id: "GestaoContratos", name: "Gestão de Contratos", path: "/GestaoContratos",
        actions: [
          { id: "create", label: "Criar" }, { id: "edit", label: "Editar" },
          { id: "send",   label: "Enviar" }, { id: "approve", label: "Aprovar" },
          { id: "delete", label: "Deletar" }
        ]
      },
      { id: "CriarContrato", name: "Criar Contrato", path: "/CriarContrato" },
      { id: "EditorContrato", name: "Editor de Contrato", path: "/EditorContrato" },
      { id: "PreviewContrato", name: "Preview de Contrato", path: "/PreviewContrato" }
    ]
  },

  // ════════ CADASTRO ════════
  {
    section: "cadastro",
    sectionLabel: "Cadastro",
    sectionIcon: "Database",
    pages: [
      { id: "Cadastro", name: "Cadastro (Lista)", path: "/Cadastro",
        tabs: [
          { id: "dashboard", name: "Dashboard" },
          { id: "list",      name: "Lista" }
        ],
        actions: [
          { id: "export_csv",  label: "Exportar CSV" },
          { id: "bulk_select", label: "Seleção em lote" }
        ]
      }
    ]
  },

  // ════════ DADOS & INSIGHTS ════════
  {
    section: "insights",
    sectionLabel: "Dados & Insights",
    sectionIcon: "BarChart3",
    pages: [
      { id: "DadosInsights", name: "Dados & Insights", path: "/DadosInsights",
        tabs: [
          { id: "funnel", name: "Funil" },
          { id: "leads", name: "Leads", subTabs: [
            { id: "profile",   name: "Profile" },
            { id: "origin",    name: "Origin" },
            { id: "qualifier", name: "Qualifier" }
          ]},
          { id: "compliance", name: "Compliance", subTabs: [
            { id: "journey",           name: "Journey" },
            { id: "risk_portfolio",    name: "Risk Portfolio" },
            { id: "risk_operational",  name: "Risk Operational" }
          ]},
          { id: "tpv_mix",       name: "TPV & Mix" },
          { id: "profitability", name: "Rentabilidade" },
          { id: "commercial",    name: "Comercial" },
          { id: "introducer",    name: "Introducer" },
          { id: "market",        name: "Mercado" },
          { id: "data_health",   name: "Data Health" }
        ],
        actions: [
          { id: "export_csv",    label: "Exportar CSV" },
          { id: "view_raw_data", label: "Ver dados brutos" }
        ]
      },
      { id: "BDCHealthDashboard", name: "BDC Health", path: "/BDCHealthDashboard" }
    ]
  },

  // ════════ FERRAMENTAS ════════
  {
    section: "tools",
    sectionLabel: "Ferramentas",
    sectionIcon: "Wrench",
    pages: [
      { id: "GerarLinkOnboarding", name: "Gerar Link", path: "/GerarLinkOnboarding" },
      { id: "TemplatesQuestionarios", name: "Templates", path: "/TemplatesQuestionarios",
        actions: [
          { id: "create", label: "Criar" }, { id: "edit", label: "Editar" },
          { id: "delete", label: "Deletar" }
        ]
      },
      { id: "MessageTemplates", name: "Templates de Mensagem", path: "/MessageTemplates" },
      { id: "GerenciarTaxasPadrao", name: "Taxas Padrão Segmento", path: "/GerenciarTaxasPadrao" },
      { id: "RegrasDeCompliance", name: "Regras & Workflows", path: "/RegrasDeCompliance",
        actions: [
          { id: "create", label: "Criar regra" },
          { id: "edit",   label: "Editar regra" },
          { id: "delete", label: "Deletar regra" }
        ]
      },
      { id: "ConfiguracaoParceiros", name: "Configuração de Parceiros", path: "/ConfiguracaoParceiros",
        tabs: [
          { id: "partners", name: "Parceiros" },
          { id: "mccs",     name: "MCCs" },
          { id: "costs",    name: "Custos" }
        ],
        actions: [
          { id: "add_partner",    label: "Adicionar parceiro" },
          { id: "edit_rates",     label: "Editar taxas" },
          { id: "delete_partner", label: "Deletar parceiro" }
        ]
      }
    ]
  },

  // ════════ INTEGRAÇÕES ════════
  {
    section: "integrations",
    sectionLabel: "Integrações",
    sectionIcon: "Plug",
    pages: [
      { id: "IntegracoesExternas", name: "CAF / BigDataCorp", path: "/IntegracoesExternas" },
      { id: "HelenaIA", name: "Helena IA", path: "/HelenaIA" }
    ]
  },

  // ════════ ADMINISTRAÇÃO ════════
  {
    section: "admin",
    sectionLabel: "Administração",
    sectionIcon: "Settings",
    pages: [
      { id: "Configuracoes", name: "Configurações", path: "/Configuracoes" },
      { id: "Auditoria", name: "Auditoria Geral", path: "/Auditoria" },
      { id: "GestaoPerfis", name: "Gestão de Perfis", path: "/GestaoPerfis",
        actions: [
          { id: "create", label: "Criar perfil" },
          { id: "edit",   label: "Editar perfil" },
          { id: "delete", label: "Deletar perfil" }
        ]
      },
      { id: "EditorPerfil", name: "Editor de Perfil", path: "/EditorPerfil" },
      { id: "GestaoUsuarios", name: "Gestão de Usuários", path: "/GestaoUsuarios",
        actions: [
          { id: "assign_profile", label: "Atribuir perfil" },
          { id: "invite",         label: "Convidar usuário" }
        ]
      },
      { id: "AuditoriaAcessos", name: "Auditoria de Acessos", path: "/AuditoriaAcessos",
        actions: [ { id: "export_csv", label: "Exportar CSV" } ]
      }
    ]
  },

  // ════════ OUTROS (standalone) ════════
  {
    section: "other",
    sectionLabel: "Outros",
    sectionIcon: "BookOpen",
    pages: [
      { id: "Home", name: "Home", path: "/" },
      { id: "HowItWorks", name: "How It Works", path: "/HowItWorks" },
      { id: "ProcessosModelo", name: "Processos Modelo", path: "/ProcessosModelo" },
      { id: "GerarKickOff", name: "Gerar Kick-Off", path: "/GerarKickOff" },
      { id: "IntroducerDashboard", name: "Dashboard do Introducer", path: "/IntroducerDashboard" }
    ]
  }
];

// ─── Helpers ───

/** Retorna descritor da página pelo id, ou null */
export function getPageDescriptor(pageId) {
  for (const section of PAGES_REGISTRY) {
    const page = section.pages.find(p => p.id === pageId);
    if (page) return { ...page, section: section.section, sectionLabel: section.sectionLabel };
  }
  return null;
}

/** Retorna todos os pageIds conhecidos */
export function getAllPageIds() {
  return PAGES_REGISTRY.flatMap(s => s.pages.map(p => p.id));
}

/** Retorna descritor de aba */
export function getTabDescriptor(pageId, tabId) {
  const page = getPageDescriptor(pageId);
  if (!page || !page.tabs) return null;
  return page.tabs.find(t => t.id === tabId) || null;
}

/** Retorna descritor de sub-aba */
export function getSubTabDescriptor(pageId, tabId, subTabId) {
  const tab = getTabDescriptor(pageId, tabId);
  if (!tab || !tab.subTabs) return null;
  return tab.subTabs.find(st => st.id === subTabId) || null;
}

/** Retorna descritor de ação */
export function getActionDescriptor(pageId, actionId) {
  const page = getPageDescriptor(pageId);
  if (!page || !page.actions) return null;
  return page.actions.find(a => a.id === actionId) || null;
}