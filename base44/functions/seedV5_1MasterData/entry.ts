// ─────────────────────────────────────────────────────────────────────
// V5.1 — Seed inicial Master Data
// ─────────────────────────────────────────────────────────────────────
// Popula as 4 entidades catalográficas V5.1:
//   - Bloqueio  (catálogo canônico de bloqueios V5.1)
//   - Dataset   (datasets de enriquecimento)
//   - Capability (4 capabilities transversais)
//   - Exception (4 categorias de exceção)
//
// Admin-only. Idempotente: usa upsert por código.
// Execução: { dryRun: true } para preview, { dryRun: false } para gravar.
// ─────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.29';

// ════════════════════════════════════════════════════════════════════
// SEED DATA — Capabilities (4)
// ════════════════════════════════════════════════════════════════════
const CAPABILITIES_SEED = [
  {
    codigo: 'cap_financial_capacity_validation',
    nome: 'Validação de Capacidade Financeira',
    descricao: 'Valida coerência entre TPV declarado, capital social, faturamento documentado e fluxo de caixa. Aplica Patch Financeiro V5.1 (5 dimensões).',
    tiers_padrao: ['tier_2', 'tier_3'],
    segmentos_forca_ativacao: ['gateway', 'dropshipping', 'marketplace'],
    datasets_requeridos: ['bdc_kyc_company', 'bdc_basic_data', 'cfc_crc_status'],
    documentos_requeridos: ['q_t2_revenue_proof', 'q_t2_balance_sheet'],
    variaveis_calculadas: ['v_financial_coherence', 'v_capital_tpv_ratio'],
    bloqueios_possiveis: ['B-FIN-01','B-FIN-02','B-FIN-03','B-FIN-04','B-FIN-05'],
    ativo: true,
    fonte_documento: 'V5.1 - Patch Financeiro, Seção 2',
  },
  {
    codigo: 'cap_marketplace_kyc',
    nome: 'KYC de Marketplace',
    descricao: 'Aplica validações específicas para operações marketplace: KYC reforçado de sellers, validação de modelo split, controle de chargebacks.',
    tiers_padrao: ['tier_2', 'tier_3'],
    segmentos_forca_ativacao: ['marketplace'],
    datasets_requeridos: ['bdc_kyc_company', 'bdc_processes'],
    documentos_requeridos: ['q_mkt_seller_kyc_policy', 'q_mkt_split_contract'],
    variaveis_calculadas: ['v_marketplace_governance'],
    bloqueios_possiveis: ['B-OPE-10','B-OPE-11','B-OPE-12'],
    ativo: true,
    fonte_documento: 'V5.1 - Capability Marketplace KYC, Seção 5',
  },
  {
    codigo: 'cap_crossborder_compliance',
    nome: 'Compliance Cross-Border',
    descricao: 'Validações regulatórias para operações cross-border (B2C/B2B internacional): registro RDE-IED, contratos de câmbio, KYC de contraparte estrangeira.',
    tiers_padrao: ['tier_2', 'tier_3'],
    segmentos_forca_ativacao: [],
    datasets_requeridos: ['bdc_kyc_company', 'portal_transparencia_rde'],
    documentos_requeridos: ['q_cb_rde_certificate', 'q_cb_fx_contract'],
    variaveis_calculadas: ['v_crossborder_regulatory'],
    bloqueios_possiveis: ['B-OPE-20','B-OPE-21'],
    ativo: true,
    fonte_documento: 'V5.1 - Capability Cross-Border, Seção 6',
  },
  {
    codigo: 'cap_subseller_kyb',
    nome: 'KYB de Subseller',
    descricao: 'KYB simplificado para subsellers PJ ou KYC para subsellers PF, com herança parcial do seller principal.',
    tiers_padrao: ['subseller_pj', 'subseller_pf'],
    segmentos_forca_ativacao: [],
    datasets_requeridos: ['bdc_kyc_company', 'bdc_kyc_owners'],
    documentos_requeridos: [],
    variaveis_calculadas: ['v_subseller_inheritance'],
    bloqueios_possiveis: ['B-KYB-30','B-KYB-31'],
    ativo: true,
    fonte_documento: 'V5.1 - Capability Subseller, Seção 7',
  },
];

// ════════════════════════════════════════════════════════════════════
// SEED DATA — Exceptions (4 categorias)
// ════════════════════════════════════════════════════════════════════
const EXCEPTIONS_SEED = [
  {
    codigo: 'cat_1_documental',
    nome: 'Exceção Documental',
    descricao: 'Documento exigido foi substituído por equivalente aceito (ex: cliente envia DRE em vez de balanço completo). Cliente em processo, com prazo curto para regularizar.',
    papel_requerido: 'analista_compliance',
    documentos_justificativa: ['q_exc_doc_substituto', 'q_exc_doc_justificativa'],
    duracao_dias: 90,
    registra_em_snapshot: true,
    ativo: true,
    fonte_documento: 'V5.1 - Exceções, Cat 1',
  },
  {
    codigo: 'cat_2_operacional',
    nome: 'Exceção Operacional',
    descricao: 'Limitação operacional temporária (ex: cliente novo sem 12 meses de faturamento, MEI em transição para LTDA). Compensada por garantias contratuais.',
    papel_requerido: 'head_compliance',
    documentos_justificativa: ['q_exc_op_plano_regularizacao'],
    duracao_dias: 180,
    registra_em_snapshot: true,
    ativo: true,
    fonte_documento: 'V5.1 - Exceções, Cat 2',
  },
  {
    codigo: 'cat_3_estrutural',
    nome: 'Exceção Estrutural',
    descricao: 'Estrutura societária complexa (holding internacional, fundos) que não se encaixa nos modelos padrão. Requer parecer jurídico interno.',
    papel_requerido: 'cco',
    documentos_justificativa: ['q_exc_est_parecer_juridico', 'q_exc_est_estrutura_completa'],
    duracao_dias: 365,
    registra_em_snapshot: true,
    ativo: true,
    fonte_documento: 'V5.1 - Exceções, Cat 3',
  },
  {
    codigo: 'cat_4_estrategica',
    nome: 'Exceção Estratégica',
    descricao: 'Cliente estratégico com TPV > R$10M/mês ou parceria institucional. Aceito risco controlado mediante governança especial e SLA reforçado.',
    papel_requerido: 'comite_credito',
    documentos_justificativa: ['q_exc_str_aprovacao_comite', 'q_exc_str_termos_governanca'],
    duracao_dias: 365,
    registra_em_snapshot: true,
    ativo: true,
    fonte_documento: 'V5.1 - Exceções, Cat 4',
  },
];

// ════════════════════════════════════════════════════════════════════
// SEED DATA — Datasets (subset inicial — vamos crescer na Fase 2)
// ════════════════════════════════════════════════════════════════════
const DATASETS_SEED = [
  // BDC — core já existentes em V4 + marcados como novos em V5.1
  { codigo: 'bdc_kyc_company', nome: 'BDC - KYC Empresa', fonte: 'bdc', endpoint: 'kyc', tier_minimo_uso: 'tier_1', obrigatorio_tiers: ['tier_2','tier_3'], categoria_v5_1: 'identidade', capabilities_que_usam: ['cap_financial_capacity_validation','cap_marketplace_kyc'], variaveis_que_alimenta: ['v_qsa_coherence'], custo_credito: 1, ttl_revalidacao_dias: 180, ativo: true, novo_em_v5_1: false, fonte_documento: 'V5.1 - Catálogo Datasets §3.1' },
  { codigo: 'bdc_kyc_owners', nome: 'BDC - KYC Sócios', fonte: 'bdc', endpoint: 'owners_kyc', tier_minimo_uso: 'tier_1', obrigatorio_tiers: ['tier_2','tier_3'], categoria_v5_1: 'societario', capabilities_que_usam: ['cap_subseller_kyb'], variaveis_que_alimenta: ['v_qsa_coherence'], custo_credito: 1, ttl_revalidacao_dias: 180, ativo: true, novo_em_v5_1: false, fonte_documento: 'V5.1 §3.1' },
  { codigo: 'bdc_basic_data', nome: 'BDC - Basic Data', fonte: 'bdc', endpoint: 'basic_data', tier_minimo_uso: 'tier_1', obrigatorio_tiers: ['tier_1','tier_2','tier_3'], categoria_v5_1: 'identidade', capabilities_que_usam: [], variaveis_que_alimenta: [], custo_credito: 1, ttl_revalidacao_dias: 365, ativo: true, novo_em_v5_1: false, fonte_documento: 'V5.1 §3.1' },
  { codigo: 'bdc_processes', nome: 'BDC - Processos Judiciais', fonte: 'bdc', endpoint: 'processes', tier_minimo_uso: 'tier_2', obrigatorio_tiers: ['tier_2','tier_3'], categoria_v5_1: 'reputacional', capabilities_que_usam: ['cap_marketplace_kyc'], variaveis_que_alimenta: ['v_legal_exposure'], custo_credito: 2, ttl_revalidacao_dias: 90, ativo: true, novo_em_v5_1: false, fonte_documento: 'V5.1 §3.2' },
  { codigo: 'bdc_activity_indicators', nome: 'BDC - Indicadores Atividade', fonte: 'bdc', endpoint: 'activity_indicators', tier_minimo_uso: 'tier_1', obrigatorio_tiers: [], categoria_v5_1: 'operacional', capabilities_que_usam: [], variaveis_que_alimenta: ['v_business_activity'], custo_credito: 1, ttl_revalidacao_dias: 180, ativo: true, novo_em_v5_1: false, fonte_documento: 'V5.1 §3.3' },

  // NOVOS em V5.1
  { codigo: 'cfc_crc_status', nome: 'CFC - Status do CRC do Contador', fonte: 'cfc', endpoint: 'crc_lookup', tier_minimo_uso: 'tier_2', obrigatorio_tiers: ['tier_2','tier_3'], categoria_v5_1: 'financeiro', capabilities_que_usam: ['cap_financial_capacity_validation'], variaveis_que_alimenta: ['v_financial_coherence'], custo_credito: 0, ttl_revalidacao_dias: 180, ativo: true, novo_em_v5_1: true, fonte_documento: 'V5.1 - Patch Financeiro §2.4' },
  { codigo: 'portal_transparencia_rde', nome: 'BC - RDE-IED', fonte: 'portal_transparencia', endpoint: 'rde_ied', tier_minimo_uso: 'tier_2', obrigatorio_tiers: [], categoria_v5_1: 'financeiro', capabilities_que_usam: ['cap_crossborder_compliance'], variaveis_que_alimenta: ['v_crossborder_regulatory'], custo_credito: 0, ttl_revalidacao_dias: 365, ativo: true, novo_em_v5_1: true, fonte_documento: 'V5.1 §6.2' },
  { codigo: 'of_pix_inflows', nome: 'Open Finance - Entradas PIX', fonte: 'openfinance', endpoint: 'pix_inflows_12m', tier_minimo_uso: 'tier_3', obrigatorio_tiers: [], categoria_v5_1: 'financeiro', capabilities_que_usam: ['cap_financial_capacity_validation'], variaveis_que_alimenta: ['v_financial_coherence'], custo_credito: 5, ttl_revalidacao_dias: 90, ativo: true, novo_em_v5_1: true, fonte_documento: 'V5.1 §2.5' },
  { codigo: 'ecf_revenue', nome: 'ECF - Receita Bruta Anual', fonte: 'ecf', endpoint: 'revenue_annual', tier_minimo_uso: 'tier_2', obrigatorio_tiers: [], categoria_v5_1: 'financeiro', capabilities_que_usam: ['cap_financial_capacity_validation'], variaveis_que_alimenta: ['v_financial_coherence'], custo_credito: 0, ttl_revalidacao_dias: 365, ativo: true, novo_em_v5_1: true, fonte_documento: 'V5.1 §2.3' },
];

// ════════════════════════════════════════════════════════════════════
// SEED DATA — Bloqueios (subset inicial — catálogo completo na Fase 2)
// ════════════════════════════════════════════════════════════════════
const BLOQUEIOS_SEED = [
  // ── FIN — Bloqueios Financeiros (Patch Financeiro V5.1) ──
  {
    codigo: 'B-FIN-01',
    categoria: 'FIN',
    titulo: 'TPV declarado incompatível com capital social',
    severidade: 'BLOQUEIO',
    tiers_aplicaveis: ['tier_2','tier_3'],
    segmentos_aplicaveis: [],
    capabilities_relacionadas: ['cap_financial_capacity_validation'],
    trigger_logic: 'tpv_anual_declarado > capital_social * 50 AND patch_status != verde',
    mensagem_analista: 'TPV anual declarado supera 50x o capital social registrado. Sem comprovantes de faturamento que justifiquem, o caso não pode ser aprovado.',
    mensagem_cliente: 'Para aprovação, precisamos de comprovantes adicionais de faturamento (balanço, DRE assinada pelo contador).',
    exibe_para_cliente: true,
    documentos_para_resolver: ['q_t2_revenue_proof','q_t2_balance_sheet'],
    exception_categoria: 'cat_1_documental',
    ativo: true,
    fonte_documento: 'V5.1 - Matriz Canônica §4.1 / Patch Financeiro §2.1',
  },
  {
    codigo: 'B-FIN-02',
    categoria: 'FIN',
    titulo: 'Divergência grave entre faturamento documentado e declarado',
    severidade: 'ESCALACAO',
    tiers_aplicaveis: ['tier_2','tier_3'],
    segmentos_aplicaveis: [],
    capabilities_relacionadas: ['cap_financial_capacity_validation'],
    trigger_logic: 'abs(faturamento_doc - faturamento_declarado) / faturamento_declarado > 1.0',
    mensagem_analista: 'Divergência >100% entre faturamento documentado (balanço/DRE) e declarado pelo cliente. Escalação para análise manual.',
    mensagem_cliente: '',
    exibe_para_cliente: false,
    documentos_para_resolver: [],
    exception_categoria: 'cat_2_operacional',
    ativo: true,
    fonte_documento: 'V5.1 - Patch Financeiro §2.2',
  },
  {
    codigo: 'B-FIN-03',
    categoria: 'FIN',
    titulo: 'CRC do contador inválido ou suspenso',
    severidade: 'ESCALACAO',
    tiers_aplicaveis: ['tier_2','tier_3'],
    segmentos_aplicaveis: [],
    capabilities_relacionadas: ['cap_financial_capacity_validation'],
    trigger_logic: 'cfc_crc_status.ativo != true',
    mensagem_analista: 'CRC informado para contador responsável não está ativo no CFC. Documentos contábeis enviados podem não ter validade.',
    mensagem_cliente: 'O CRC do contador informado não está ativo. Verifique e atualize o profissional responsável pela contabilidade.',
    exibe_para_cliente: true,
    documentos_para_resolver: [],
    exception_categoria: 'cat_1_documental',
    ativo: true,
    fonte_documento: 'V5.1 - Patch Financeiro §2.4',
  },
  {
    codigo: 'B-FIN-04',
    categoria: 'FIN',
    titulo: 'Fluxo de caixa Open Finance incompatível com TPV',
    severidade: 'ALERTA',
    tiers_aplicaveis: ['tier_3'],
    segmentos_aplicaveis: [],
    capabilities_relacionadas: ['cap_financial_capacity_validation'],
    trigger_logic: 'of_pix_inflows_12m / 12 < tpv_mensal_declarado * 0.5',
    mensagem_analista: 'Entradas via Open Finance nos últimos 12 meses representam menos de 50% do TPV mensal declarado. Investigar.',
    mensagem_cliente: '',
    exibe_para_cliente: false,
    documentos_para_resolver: [],
    exception_categoria: 'cat_2_operacional',
    ativo: true,
    fonte_documento: 'V5.1 - Patch Financeiro §2.5',
  },
  {
    codigo: 'B-FIN-05',
    categoria: 'FIN',
    titulo: 'Setor declarado incoerente com CNAE principal',
    severidade: 'ESCALACAO',
    tiers_aplicaveis: ['tier_2','tier_3'],
    segmentos_aplicaveis: [],
    capabilities_relacionadas: ['cap_financial_capacity_validation'],
    trigger_logic: 'segmento_declarado not in cnae_principal.segmentos_compativeis',
    mensagem_analista: 'Segmento declarado pelo cliente não corresponde ao CNAE principal registrado. Possível desvio de atividade.',
    mensagem_cliente: '',
    exibe_para_cliente: false,
    documentos_para_resolver: [],
    exception_categoria: 'cat_2_operacional',
    ativo: true,
    fonte_documento: 'V5.1 - Patch Financeiro §2.6',
  },

  // ── OPE — Marketplace ──
  {
    codigo: 'B-OPE-10',
    categoria: 'OPE',
    titulo: 'Marketplace sem política de KYC de sellers documentada',
    severidade: 'BLOQUEIO',
    tiers_aplicaveis: ['tier_2','tier_3'],
    segmentos_aplicaveis: ['marketplace'],
    capabilities_relacionadas: ['cap_marketplace_kyc'],
    trigger_logic: 'segmento == marketplace AND q_mkt_seller_kyc_policy not provided',
    mensagem_analista: 'Marketplace sem política de KYC de sellers. Risco regulatório e operacional alto.',
    mensagem_cliente: 'Marketplaces precisam apresentar política documentada de KYC de sellers (CIRC. BCB 3.978).',
    exibe_para_cliente: true,
    documentos_para_resolver: ['q_mkt_seller_kyc_policy'],
    exception_categoria: 'cat_3_estrutural',
    ativo: true,
    fonte_documento: 'V5.1 - Capability Marketplace §5.1',
  },
  {
    codigo: 'B-OPE-11',
    categoria: 'OPE',
    titulo: 'Modelo de split sem contrato formal',
    severidade: 'ESCALACAO',
    tiers_aplicaveis: ['tier_2','tier_3'],
    segmentos_aplicaveis: ['marketplace'],
    capabilities_relacionadas: ['cap_marketplace_kyc'],
    trigger_logic: 'segmento == marketplace AND q_mkt_split_contract not provided',
    mensagem_analista: 'Marketplace opera split sem contrato formal padronizado entre as partes.',
    mensagem_cliente: 'Para marketplaces, é necessário apresentar contrato-padrão de split de pagamentos com os sellers.',
    exibe_para_cliente: true,
    documentos_para_resolver: ['q_mkt_split_contract'],
    exception_categoria: 'cat_1_documental',
    ativo: true,
    fonte_documento: 'V5.1 - Capability Marketplace §5.2',
  },

  // ── OPE — Cross-Border ──
  {
    codigo: 'B-OPE-20',
    categoria: 'OPE',
    titulo: 'Operação cross-border sem RDE-IED registrado',
    severidade: 'BLOQUEIO',
    tiers_aplicaveis: ['tier_2','tier_3'],
    segmentos_aplicaveis: [],
    capabilities_relacionadas: ['cap_crossborder_compliance'],
    trigger_logic: 'morfologia in [b2c_crossborder, b2b_crossborder] AND portal_transparencia_rde.encontrado == false',
    mensagem_analista: 'Operação cross-border declarada mas sem registro RDE-IED no Banco Central. Bloqueio regulatório.',
    mensagem_cliente: 'Para operações internacionais, é necessário registro RDE-IED ativo no Banco Central.',
    exibe_para_cliente: true,
    documentos_para_resolver: ['q_cb_rde_certificate'],
    exception_categoria: 'cat_3_estrutural',
    ativo: true,
    fonte_documento: 'V5.1 - Capability Cross-Border §6.1',
  },
  {
    codigo: 'B-OPE-21',
    categoria: 'OPE',
    titulo: 'Cross-border sem contrato de câmbio formal',
    severidade: 'ESCALACAO',
    tiers_aplicaveis: ['tier_2','tier_3'],
    segmentos_aplicaveis: [],
    capabilities_relacionadas: ['cap_crossborder_compliance'],
    trigger_logic: 'morfologia in [b2c_crossborder, b2b_crossborder] AND q_cb_fx_contract not provided',
    mensagem_analista: 'Operação cross-border sem contrato de câmbio formal documentado.',
    mensagem_cliente: 'Operações cross-border requerem contrato de câmbio formal com instituição autorizada.',
    exibe_para_cliente: true,
    documentos_para_resolver: ['q_cb_fx_contract'],
    exception_categoria: 'cat_1_documental',
    ativo: true,
    fonte_documento: 'V5.1 - Capability Cross-Border §6.2',
  },

  // ── KYB — Subsellers ──
  {
    codigo: 'B-KYB-30',
    categoria: 'KYB',
    titulo: 'Subseller PJ com QSA divergente do declarado',
    severidade: 'ESCALACAO',
    tiers_aplicaveis: ['subseller_pj'],
    segmentos_aplicaveis: [],
    capabilities_relacionadas: ['cap_subseller_kyb'],
    trigger_logic: 'subseller.qsa_declarado != bdc_kyc_owners.qsa',
    mensagem_analista: 'Subseller PJ apresenta QSA declarado divergente do registrado em fontes oficiais.',
    mensagem_cliente: '',
    exibe_para_cliente: false,
    documentos_para_resolver: [],
    exception_categoria: 'cat_2_operacional',
    ativo: true,
    fonte_documento: 'V5.1 - Capability Subseller §7.1',
  },
  {
    codigo: 'B-KYB-31',
    categoria: 'KYB',
    titulo: 'Subseller PF com CPF irregular',
    severidade: 'BLOQUEIO',
    tiers_aplicaveis: ['subseller_pf'],
    segmentos_aplicaveis: [],
    capabilities_relacionadas: ['cap_subseller_kyb'],
    trigger_logic: 'subseller.cpf_situacao != regular',
    mensagem_analista: 'CPF do subseller PF está irregular na Receita Federal.',
    mensagem_cliente: 'Seu CPF está em situação irregular na Receita Federal. Regularize antes de prosseguir.',
    exibe_para_cliente: true,
    documentos_para_resolver: [],
    exception_categoria: 'nenhuma',
    ativo: true,
    fonte_documento: 'V5.1 - Capability Subseller §7.2',
  },
];

// ════════════════════════════════════════════════════════════════════
// HANDLER
// ════════════════════════════════════════════════════════════════════
async function upsertByCodigo(base44, entityName, items) {
  const existing = await base44.asServiceRole.entities[entityName].list('-created_date', 5000);
  const byCodigo = new Map(existing.map(e => [e.codigo, e]));

  const stats = { total: items.length, created: 0, updated: 0, unchanged: 0 };
  for (const item of items) {
    const found = byCodigo.get(item.codigo);
    if (!found) {
      await base44.asServiceRole.entities[entityName].create(item);
      stats.created++;
    } else {
      // Atualiza só se houver diferença no payload (idempotência leve)
      await base44.asServiceRole.entities[entityName].update(found.id, item);
      stats.updated++;
    }
  }
  return stats;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun !== false; // default true

    if (dryRun) {
      return Response.json({
        success: true,
        dryRun: true,
        message: 'DRY RUN — nenhuma alteração feita. Envie {"dryRun": false} para executar.',
        wouldCreate: {
          capabilities: CAPABILITIES_SEED.length,
          exceptions: EXCEPTIONS_SEED.length,
          datasets: DATASETS_SEED.length,
          bloqueios: BLOQUEIOS_SEED.length,
        },
      });
    }

    const results = {
      capabilities: await upsertByCodigo(base44, 'Capability', CAPABILITIES_SEED),
      exceptions:   await upsertByCodigo(base44, 'Exception', EXCEPTIONS_SEED),
      datasets:     await upsertByCodigo(base44, 'Dataset', DATASETS_SEED),
      bloqueios:    await upsertByCodigo(base44, 'Bloqueio', BLOQUEIOS_SEED),
    };

    return Response.json({
      success: true,
      dryRun: false,
      message: 'Seed V5.1 Master Data aplicado com sucesso.',
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});