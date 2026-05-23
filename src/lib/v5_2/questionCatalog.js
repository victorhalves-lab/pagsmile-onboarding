// ──────────────────────────────────────────────────────────────────────────────
// V5.2 — Catálogo Canônico de Perguntas (Fase 5.2)
// ──────────────────────────────────────────────────────────────────────────────
// Single source of truth das perguntas V5.2.
// Cada entrada produz UM registro Question na entidade Base44 (via seed function).
//
// Convenção de id_canonico:
//   q_<scope>_<topico>_<detalhe>
//   scope:    base (universal) | t1 | t2 | t3 | sub_pj | sub_pf | cap_<capability>
//   topico:   identidade | atividade | volume | societario | pld | crossborder | recurrence | splits
//
// As perguntas aqui são SEMENTE — devem ser ampliadas até cobrir os ~120-150 itens
// previstos no Bloco 4 do roadmap. Esta sprint introduz APENAS as perguntas
// críticas das modalidades A/B/C/E para validar o pipeline end-to-end.
// ──────────────────────────────────────────────────────────────────────────────

export const QUESTIONS_V5_2 = [
  // ════════════════════════════════════════════════════════════════════════
  // BASE — Identidade (universal, todos os tiers)
  // ════════════════════════════════════════════════════════════════════════
  {
    id_canonico: 'q_base_razao_social',
    order: 10,
    text: 'Confirme a Razão Social',
    type: 'TEXT',
    isRequired: true,
    categoria_funcional: 'identidade',
    modalidade_origem: 'modalidade_a_bdc_confirmacao',
    cross_check_bdc: { dataset: 'basic_data', campo_bdc: 'companyName', field_id_cv16: 'razao_social' },
    norma_regulatoria: 'Circ. BCB 3.978 Art. 19',
    framework_version_intro: 'v5.2',
    tiers_aplicaveis: ['tier_1', 'tier_2', 'tier_3'],
    segmentos_aplicaveis: ['all'],
  },
  {
    id_canonico: 'q_base_nome_fantasia',
    order: 20,
    text: 'Nome Fantasia',
    type: 'TEXT',
    isRequired: false,
    categoria_funcional: 'identidade',
    modalidade_origem: 'modalidade_b_bdc_input_hibrido',
    cross_check_bdc: { dataset: 'basic_data', campo_bdc: 'tradeName', field_id_cv16: 'nome_fantasia' },
    framework_version_intro: 'v5.2',
    tiers_aplicaveis: ['tier_1', 'tier_2', 'tier_3'],
    segmentos_aplicaveis: ['all'],
  },
  {
    id_canonico: 'q_base_cnpj_situacao',
    order: 30,
    text: 'Situação na Receita Federal',
    type: 'SELECT',
    options: ['ATIVA', 'INAPTA', 'SUSPENSA', 'BAIXADA', 'NULA'],
    isRequired: true,
    categoria_funcional: 'identidade',
    modalidade_origem: 'modalidade_a_bdc_confirmacao',
    cross_check_bdc: { dataset: 'basic_data', campo_bdc: 'taxIdStatus', field_id_cv16: 'cnpj_situacao' },
    b_series_disparados: ['B05'],
    norma_regulatoria: 'Circ. BCB 3.978 Art. 19',
    framework_version_intro: 'v5.2',
    tiers_aplicaveis: ['tier_1', 'tier_2', 'tier_3'],
    segmentos_aplicaveis: ['all'],
  },
  {
    id_canonico: 'q_base_capital_social',
    order: 40,
    text: 'Capital Social declarado (R$)',
    type: 'NUMBER',
    isRequired: true,
    categoria_funcional: 'identidade',
    modalidade_origem: 'modalidade_b_bdc_input_hibrido',
    cross_check_bdc: { dataset: 'basic_data', campo_bdc: 'capitalSocial', tolerancia_divergencia_pct: 0.1, field_id_cv16: 'capital_social' },
    variaveis_risk_score: ['v_capital_vs_tpv'],
    b_series_disparados: ['B-FIN-1'],
    framework_version_intro: 'v5.2',
    tiers_aplicaveis: ['tier_1', 'tier_2', 'tier_3'],
    segmentos_aplicaveis: ['all'],
  },
  {
    id_canonico: 'q_base_data_fundacao',
    order: 50,
    text: 'Data de Fundação',
    type: 'DATE',
    isRequired: true,
    categoria_funcional: 'identidade',
    modalidade_origem: 'modalidade_a_bdc_confirmacao',
    cross_check_bdc: { dataset: 'basic_data', campo_bdc: 'foundingDate', field_id_cv16: 'data_fundacao' },
    variaveis_risk_score: ['v_idade_cnpj'],
    framework_version_intro: 'v5.2',
    tiers_aplicaveis: ['tier_1', 'tier_2', 'tier_3'],
    segmentos_aplicaveis: ['all'],
  },

  // ════════════════════════════════════════════════════════════════════════
  // BASE — Volumetria (universal, dispara o tiering engine)
  // ════════════════════════════════════════════════════════════════════════
  {
    id_canonico: 'q_base_tpv_mensal_declarado',
    order: 100,
    text: 'TPV mensal médio esperado (R$)',
    type: 'NUMBER',
    isRequired: true,
    categoria_funcional: 'volumetria',
    modalidade_origem: 'modalidade_c_input_puro',
    variaveis_risk_score: ['v_tpv_declarado', 'v_capital_vs_tpv'],
    helpText: 'Esta resposta determina o tier do cadastro (T1/T2/T3).',
    framework_version_intro: 'v5.2',
    tiers_aplicaveis: ['tier_1', 'tier_2', 'tier_3'],
    segmentos_aplicaveis: ['all'],
  },
  {
    id_canonico: 'q_base_ticket_medio',
    order: 110,
    text: 'Ticket médio esperado (R$)',
    type: 'NUMBER',
    isRequired: true,
    categoria_funcional: 'volumetria',
    modalidade_origem: 'modalidade_c_input_puro',
    framework_version_intro: 'v5.2',
    tiers_aplicaveis: ['tier_1', 'tier_2', 'tier_3'],
    segmentos_aplicaveis: ['all'],
  },
  {
    id_canonico: 'q_base_mcc',
    order: 120,
    text: 'MCC principal de operação',
    type: 'TEXT',
    isRequired: true,
    categoria_funcional: 'atividade_economica',
    modalidade_origem: 'modalidade_c_input_puro',
    variaveis_risk_score: ['v_mcc_risco'],
    b_series_disparados: ['B-MCC-HIGH-RISK'],
    framework_version_intro: 'v5.2',
    tiers_aplicaveis: ['tier_1', 'tier_2', 'tier_3'],
    segmentos_aplicaveis: ['all'],
  },

  // ════════════════════════════════════════════════════════════════════════
  // TIER 2 — Comprovação Financeira (COMPOSITE: input + upload)
  // ════════════════════════════════════════════════════════════════════════
  {
    id_canonico: 'q_t2_revenue_proof',
    order: 200,
    text: 'Comprovação de Faturamento Anual',
    type: 'COMPOSITE',
    isRequired: true,
    categoria_funcional: 'volumetria',
    modalidade_origem: 'modalidade_e_documento_upload',
    documentos_relacionados: ['ecf', 'defis', 'balanco_simplificado', 'extrato_consolidado'],
    cross_check_bdc: { dataset: 'financial_market', campo_bdc: 'annualRevenue', tolerancia_divergencia_pct: 0.15, field_id_cv16: 'faturamento_anual' },
    variaveis_risk_score: ['v_faturamento_doc_vs_ecf', 'v_financial_coherence'],
    b_series_disparados: ['B-FIN-2'],
    norma_regulatoria: 'Circ. BCB 3.978 Art. 19 + Resol. BCB 403/2024',
    framework_version_intro: 'v5.2',
    tiers_aplicaveis: ['tier_2', 'tier_3'],
    segmentos_aplicaveis: ['all'],
    helpText: 'Anexe ECF, DEFIS, balanço simplificado ou extrato consolidado dos últimos 12 meses.',
  },

  // ════════════════════════════════════════════════════════════════════════
  // TIER 3 — Estrutura societária estendida
  // ════════════════════════════════════════════════════════════════════════
  {
    id_canonico: 'q_t3_estrutura_holding',
    order: 300,
    text: 'A empresa pertence a uma estrutura de holding?',
    type: 'BOOLEAN',
    isRequired: true,
    categoria_funcional: 'estrutura_societaria',
    modalidade_origem: 'modalidade_c_input_puro',
    framework_version_intro: 'v5.2',
    tiers_aplicaveis: ['tier_3'],
    segmentos_aplicaveis: ['all'],
  },

  // ════════════════════════════════════════════════════════════════════════
  // CAPABILITY: splits/subseller
  // ════════════════════════════════════════════════════════════════════════
  {
    id_canonico: 'q_cap_splits_kyc_completeness',
    order: 400,
    text: 'Quantos sub-sellers já cadastrados na sua plataforma?',
    type: 'NUMBER',
    isRequired: true,
    categoria_funcional: 'splits_marketplace',
    modalidade_origem: 'modalidade_c_input_puro',
    variaveis_risk_score: ['v_cap_splits_kyc_completeness'],
    capabilities_ativam: ['splits/subseller'],
    framework_version_intro: 'v5.2',
    tiers_aplicaveis: ['tier_2', 'tier_3'],
    segmentos_aplicaveis: ['marketplace', 'gateway'],
  },

  // ════════════════════════════════════════════════════════════════════════
  // CAPABILITY: crossborder
  // ════════════════════════════════════════════════════════════════════════
  {
    id_canonico: 'q_cap_crossborder_paises_destino',
    order: 410,
    text: 'Quais países de destino das operações?',
    type: 'MULTI_SELECT',
    options: ['US', 'GB', 'DE', 'FR', 'ES', 'PT', 'CA', 'AR', 'MX', 'CN', 'JP', 'AU', 'AE', 'SY', 'IR', 'KP'],
    isRequired: true,
    categoria_funcional: 'internacional_crossborder',
    modalidade_origem: 'modalidade_c_input_puro',
    variaveis_risk_score: ['v_cap_crossborder_country_risk'],
    b_series_disparados: ['B-CB-1', 'B-CB-PAIS-CRIT-1'],
    capabilities_ativam: ['crossborder'],
    norma_regulatoria: 'FATF Recommendation 19 + Lei 13.810/2019',
    framework_version_intro: 'v5.2',
    tiers_aplicaveis: ['tier_2', 'tier_3'],
    segmentos_aplicaveis: ['crossborder', 'dropshipping'],
  },

  // ════════════════════════════════════════════════════════════════════════
  // CAPABILITY: recurrence
  // ════════════════════════════════════════════════════════════════════════
  {
    id_canonico: 'q_cap_recurrence_cancel_friction',
    order: 420,
    text: 'O usuário consegue cancelar a assinatura pelo mesmo canal de contratação?',
    type: 'BOOLEAN',
    isRequired: true,
    categoria_funcional: 'recorrencia_assinaturas',
    modalidade_origem: 'modalidade_c_input_puro',
    variaveis_risk_score: ['v_cap_recurrence_cancel_friction'],
    capabilities_ativam: ['recurrence'],
    norma_regulatoria: 'CDC + SENACON Portaria 47/2024',
    framework_version_intro: 'v5.2',
    tiers_aplicaveis: ['tier_1', 'tier_2', 'tier_3'],
    segmentos_aplicaveis: ['saas'],
  },

  // ════════════════════════════════════════════════════════════════════════
  // SUBSELLER PJ — Grau A/B/C resolvido dinamicamente
  // ════════════════════════════════════════════════════════════════════════
  {
    id_canonico: 'q_sub_pj_tpv_esperado',
    order: 500,
    text: 'TPV mensal esperado nesta sub-conta (R$)',
    type: 'NUMBER',
    isRequired: true,
    categoria_funcional: 'subseller_pj',
    modalidade_origem: 'modalidade_c_input_puro',
    helpText: 'Determina o grau do sub-seller (A/B/C).',
    framework_version_intro: 'v5.2',
    tiers_aplicaveis: ['subseller_pj'],
    segmentos_aplicaveis: ['all'],
  },

  // ════════════════════════════════════════════════════════════════════════
  // SUBSELLER PF — renda + Grau A/B/C + DIRPF (apenas grau C)
  // ════════════════════════════════════════════════════════════════════════
  {
    id_canonico: 'q_sub_pf_renda_mensal',
    order: 600,
    text: 'Renda mensal líquida (R$)',
    type: 'NUMBER',
    isRequired: true,
    categoria_funcional: 'subseller_pf',
    modalidade_origem: 'modalidade_c_input_puro',
    helpText: 'Determina o grau do sub-seller PF (A/B/C).',
    framework_version_intro: 'v5.2',
    tiers_aplicaveis: ['subseller_pf'],
    segmentos_aplicaveis: ['all'],
  },
  {
    id_canonico: 'q_sub_pf_dirpf_upload',
    order: 610,
    text: 'Anexe sua DIRPF (Declaração de Imposto de Renda) mais recente',
    type: 'FILE_UPLOAD',
    isRequired: true,
    categoria_funcional: 'documental',
    modalidade_origem: 'modalidade_e_documento_upload',
    documentos_relacionados: ['dirpf'],
    conditionalLogic: { dependsOn: 'q_sub_pf_renda_mensal', operator: 'greater_than', value: '10000' },
    norma_regulatoria: 'Circ. BCB 3.978 Art. 19 (PF de alta renda)',
    framework_version_intro: 'v5.2',
    tiers_aplicaveis: ['subseller_pf'],
    segmentos_aplicaveis: ['all'],
  },

  // ════════════════════════════════════════════════════════════════════════
  // CAPABILITY: splits/subseller — Top 5 Maiores Clientes (sub-sellers)
  // ════════════════════════════════════════════════════════════════════════
  // Obrigatório para gateways e marketplaces — pedido em 23/Mai/2026.
  // Cada cliente tem 3 perguntas: CNPJ, Nome/Razão Social, Descrição do modelo.
  // Aparecem só quando a capability splits/subseller está ativa (= segmentos
  // gateway+marketplace+plataforma_vertical no V5.2).
  ...Array.from({ length: 5 }, (_, i) => {
    const n = i + 1;
    const ordinal = ['1º', '2º', '3º', '4º', '5º'][i];
    return [
      {
        id_canonico: `q_cap_splits_top5_${n}_cnpj`,
        order: 450 + (i * 10),
        text: `CNPJ do ${ordinal} maior cliente (Top 5)`,
        type: 'CPF_CNPJ',
        isRequired: true,
        categoria_funcional: 'splits_marketplace',
        modalidade_origem: 'modalidade_c_input_puro',
        capabilities_ativam: ['splits/subseller'],
        helpText: i === 0 ? 'Informe os 5 maiores clientes (em volume) que operam pela sua plataforma.' : undefined,
        framework_version_intro: 'v5.2',
        tiers_aplicaveis: ['tier_2', 'tier_3'],
        segmentos_aplicaveis: ['marketplace', 'gateway', 'plataforma_vertical'],
      },
      {
        id_canonico: `q_cap_splits_top5_${n}_nome`,
        order: 451 + (i * 10),
        text: `Nome / Razão Social do ${ordinal} maior cliente`,
        type: 'TEXT',
        isRequired: true,
        categoria_funcional: 'splits_marketplace',
        modalidade_origem: 'modalidade_c_input_puro',
        capabilities_ativam: ['splits/subseller'],
        framework_version_intro: 'v5.2',
        tiers_aplicaveis: ['tier_2', 'tier_3'],
        segmentos_aplicaveis: ['marketplace', 'gateway', 'plataforma_vertical'],
      },
      {
        id_canonico: `q_cap_splits_top5_${n}_modelo`,
        order: 452 + (i * 10),
        text: `Descrição do modelo de negócio do ${ordinal} maior cliente`,
        type: 'TEXT',
        isRequired: true,
        categoria_funcional: 'splits_marketplace',
        modalidade_origem: 'modalidade_c_input_puro',
        capabilities_ativam: ['splits/subseller'],
        helpText: i === 0 ? 'O que esse cliente vende/faz e como opera através da sua plataforma.' : undefined,
        framework_version_intro: 'v5.2',
        tiers_aplicaveis: ['tier_2', 'tier_3'],
        segmentos_aplicaveis: ['marketplace', 'gateway', 'plataforma_vertical'],
      },
    ];
  }).flat(),
];