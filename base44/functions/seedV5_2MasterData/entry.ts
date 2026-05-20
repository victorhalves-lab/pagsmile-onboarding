/**
 * [V5.2] Seed master data V5.2 — ADITIVO E IDEMPOTENTE.
 *
 * NUNCA deleta dados existentes. NUNCA toca em V4/V5.1. Apenas:
 *   - INSERT de novos datasets V5.2 (que ainda não existem por código)
 *   - INSERT de novos bloqueios V5.2 (que ainda não existem por código)
 *   - INSERT de capabilities V5.2 canônicas (4 oficiais)
 *   - UPDATE de campos novos em datasets/bloqueios existentes (apenas se vazios)
 *
 * Payload: { mode: 'preview' | 'apply', sections?: ['datasets'|'bloqueios'|'capabilities'] }
 *
 * Retorna sumário detalhado: { inserted, updated, skipped }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─────────────────────────────────────────────────────────────────────────────
// CAPABILITIES CANÔNICAS V5.2 (4 oficiais)
// ─────────────────────────────────────────────────────────────────────────────
const CAPABILITIES_V5_2 = [
  {
    codigo: 'splits/subseller',
    nome: 'Splits / Sub-credenciamento',
    descricao: 'Atende Marketplace (obrigatório) e Gateway com sub-credenciamento. Implementa KYC dos sellers, monitoramento de split, anti-bolsão.',
    obrigatoria_para_segmentos: ['marketplace'],
    tiers_padrao: ['tier_2', 'tier_3'],
    segmentos_forca_ativacao: ['gateway'],
    variaveis_calculadas: ['v_cap_splits_kyc_completeness', 'v_cap_splits_concentracao_seller'],
    sentinel_prompts: ['sentinel_marketplace_tier3_splits_v5_1', 'sentinel_gateway_tier3_subcredenciamento_v5_1'],
    ativo: true,
    fonte_documento: 'V5.2 DELTA_SEGMENTOS Cap. 9'
  },
  {
    codigo: 'crossborder',
    nome: 'Operação Cross-border',
    descricao: 'Atende Crossborder (obrigatório) e Dropshipping (forçada). Implementa screening internacional (OFAC, UK HMT, EU), country_risk_index, validação de fluxo cambial.',
    obrigatoria_para_segmentos: ['crossborder'],
    tiers_padrao: ['tier_3'],
    segmentos_forca_ativacao: ['dropshipping'],
    variaveis_calculadas: ['v_cap_crossborder_country_risk', 'v_cap_crossborder_fluxo_cambial'],
    sentinel_prompts: ['sentinel_crossborder_tier3_v5_1', 'sentinel_dropshipping_tier3_internacional_v5_1'],
    ativo: true,
    fonte_documento: 'V5.2 DELTA_SEGMENTOS Cap. 10'
  },
  {
    codigo: 'recurrence',
    nome: 'Cobrança Recorrente',
    descricao: 'Atende SaaS (obrigatório) e segmentos com assinatura. Implementa testes automatizados de UX de cancelamento (SENACON), monitoramento de churn, validação LGPD para dados de assinantes.',
    obrigatoria_para_segmentos: ['saas'],
    tiers_padrao: ['tier_2', 'tier_3'],
    segmentos_forca_ativacao: [],
    variaveis_calculadas: ['v_cap_recurrence_cancel_friction', 'v_cap_recurrence_churn_signal'],
    sentinel_prompts: ['sentinel_saas_tier3_recurrence_v5_1'],
    ativo: true,
    fonte_documento: 'V5.2 DELTA_SEGMENTOS Cap. 11'
  },
  {
    codigo: 'cap_financial_capacity_validation',
    nome: 'Patch Financeiro V5.1 — Validação de Capacidade',
    descricao: 'Patch financeiro universal Tier 2+. Forçado em Tier 1 para segmentos críticos (gateway, marketplace, dropshipping, crossborder). 5 dimensões: TPV vs BDC, faturamento doc vs ECF, CRC status, fluxo Open Finance, coerência de setor.',
    obrigatoria_para_segmentos: [],
    tiers_padrao: ['tier_2', 'tier_3'],
    segmentos_forca_ativacao: ['gateway', 'marketplace', 'dropshipping', 'crossborder'],
    variaveis_calculadas: ['v_financial_coherence', 'v_tpv_declarado_vs_bdc', 'v_faturamento_doc_vs_ecf'],
    sentinel_prompts: ['sentinel_patch_financeiro_v5_1'],
    ativo: true,
    fonte_documento: 'V5.1 Patch Financeiro + V5.2 Cap. 7'
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 10 BLOQUEIOS ABSOLUTOS SEM EXCEÇÃO (núcleo duro regulatório)
// ─────────────────────────────────────────────────────────────────────────────
const BLOQUEIOS_ABSOLUTOS_V5_2 = [
  { codigo: 'B-CB-1', categoria: 'CB', titulo: 'País FATF blacklist', severidade: 'BLOQUEIO', decisao_padrao: 'recusa_direta', nucleo_duro_regulatorio: true, capabilities_relacionadas: ['crossborder'], exception_categoria: 'nenhuma', fundamentacao_regulatoria: 'FATF/GAFI Recommendation 19 + Circ. BCB 3.978 Art. 23', ativo: true, fonte_documento: 'V5.2 DELTA_SEGMENTOS Cap. 16.1' },
  { codigo: 'B-INT-1', categoria: 'INT', titulo: 'Interpol Red Notice ativo', severidade: 'BLOQUEIO', decisao_padrao: 'recusa_direta', nucleo_duro_regulatorio: true, exception_categoria: 'nenhuma', fundamentacao_regulatoria: 'Lei 13.810/2019 (sanções)', ativo: true, fonte_documento: 'V5.2 DELTA_SEGMENTOS Cap. 16.1' },
  { codigo: 'B-MKT-PROD-CRIT-1', categoria: 'MKT', titulo: 'Marketplace com categoria proibida (armas/drogas/pirataria)', severidade: 'BLOQUEIO', decisao_padrao: 'recusa_direta', nucleo_duro_regulatorio: true, segmentos_aplicaveis: ['marketplace'], exception_categoria: 'nenhuma', fundamentacao_regulatoria: 'CP Art. 18 + Lei 10.826/2003 + Lei 9.279/96', nome_canonico_anterior: 'B-MKT-PROD-1', ativo: true, fonte_documento: 'V5.2 DELTA_SEGMENTOS Cap. 4 + 16.2' },
  { codigo: 'B-PV-LGPD-1-CRIT', categoria: 'PV', titulo: 'Plataforma Vertical Saúde sem DPO especializado (LGPD Art. 11)', severidade: 'BLOQUEIO', decisao_padrao: 'recusa_direta', nucleo_duro_regulatorio: true, segmentos_aplicaveis: ['plataforma_vertical'], morfologias_aplicaveis: ['A'], exception_categoria: 'nenhuma', fundamentacao_regulatoria: 'LGPD Art. 11 + CFM Res. 1.821/2007', nome_canonico_anterior: 'B-PV-LGPD-1', ativo: true, fonte_documento: 'V5.2 DELTA_SEGMENTOS Cap. 4 + 16.2' },
  { codigo: 'B-GW-PCI-CRIT-1', categoria: 'GW', titulo: 'Gateway sem PCI-DSS quando obrigatório', severidade: 'BLOQUEIO', decisao_padrao: 'recusa_direta', nucleo_duro_regulatorio: true, segmentos_aplicaveis: ['gateway'], exception_categoria: 'nenhuma', fundamentacao_regulatoria: 'PCI-DSS v4.0 + Bandeiras (Visa/Mastercard)', nome_canonico_anterior: 'B-GW-PCI-1', ativo: true, fonte_documento: 'V5.2 DELTA_SEGMENTOS Cap. 4 + 16.2' },
  { codigo: 'B-LOC-SETOR-CRIT-1', categoria: 'LOC', titulo: 'Pousada/Restaurante/Bar sem AVCB (Auto de Vistoria do Corpo de Bombeiros)', severidade: 'BLOQUEIO', decisao_padrao: 'recusa_direta', nucleo_duro_regulatorio: true, segmentos_aplicaveis: ['servicos_locais'], exception_categoria: 'nenhuma', fundamentacao_regulatoria: 'Lei Estadual Bombeiros + IT 01 CBPMESP', nome_canonico_anterior: 'B-LOC-POUS-1', ativo: true, fonte_documento: 'V5.2 DELTA_SEGMENTOS Cap. 4 + 16.2' },
  { codigo: 'B-CB-PAIS-CRIT-1', categoria: 'CB', titulo: 'Crossborder operando em país FATF blacklist', severidade: 'BLOQUEIO', decisao_padrao: 'recusa_direta', nucleo_duro_regulatorio: true, segmentos_aplicaveis: ['crossborder'], capabilities_relacionadas: ['crossborder'], exception_categoria: 'nenhuma', fundamentacao_regulatoria: 'FATF + Circ. BCB 3.978', nome_canonico_anterior: 'B-CB-PAIS-1', ativo: true, fonte_documento: 'V5.2 DELTA_SEGMENTOS Cap. 4 + 16.2' },
  { codigo: 'B-DS-FORN-CRIT-1', categoria: 'DS', titulo: 'Dropshipping declarando fornecedor doméstico que na verdade é internacional ("ghost dropshipping")', severidade: 'BLOQUEIO', decisao_padrao: 'recusa_direta', nucleo_duro_regulatorio: true, segmentos_aplicaveis: ['dropshipping'], exception_categoria: 'nenhuma', fundamentacao_regulatoria: 'CDC + Programa Remessa Conforme RFB', nome_canonico_anterior: 'B-DS-FORN-1', ativo: true, fonte_documento: 'V5.2 DELTA_SEGMENTOS Cap. 4 + 16.2' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Datasets V5.2 — apenas os mais críticos novos (resto vem em seed posterior)
// Marcados contratado=false quando não temos contrato com BDC ainda
// ─────────────────────────────────────────────────────────────────────────────
const DATASETS_V5_2_PRIORITARIOS = [
  // Já existentes V5.1 — atualizar com novos campos V5.2
  { codigo: 'basic_data', nome: 'BDC - Cadastro Básico CNPJ', nome_amigavel: 'Cadastro PJ', fonte: 'bdc', dimensao_analitica: 'identidade_cadastro', tier_minimo_uso: 'tier_1', obrigatorio: true, contratado: true, ativo: true, segmentos_ativam: ['all'], glossario_tooltip: 'Dados cadastrais do CNPJ na Receita Federal — razão social, nome fantasia, situação cadastral, capital social, data de abertura.', fonte_documento: 'V5.2 Espec. Datasets §3.1' },
  { codigo: 'owners_kyc', nome: 'BDC - KYC dos Sócios (UBO)', nome_amigavel: 'KYC dos Sócios', fonte: 'bdc', dimensao_analitica: 'socios_beneficiarios', tier_minimo_uso: 'tier_1', obrigatorio: true, contratado: true, ativo: true, segmentos_ativam: ['all'], glossario_tooltip: 'KYC completo dos sócios listados no QSA, incluindo CPF, nome, % participação, status ativo/inativo. Base para análise UBO (Ultimate Beneficial Owner).', fonte_documento: 'V5.2 Espec. Datasets §3.1' },
  { codigo: 'sanctions_international', nome: 'BDC - Sanções Internacionais (OFAC, EU, UN)', nome_amigavel: 'Sanções Internacionais', fonte: 'bdc', dimensao_analitica: 'sancoes_internacionais_nacionais', tier_minimo_uso: 'tier_1', obrigatorio: true, contratado: true, ativo: true, segmentos_ativam: ['all'], glossario_tooltip: 'Cross-check contra listas OFAC (EUA), EU Consolidated, UN Security Council. Match positivo = bloqueio absoluto B-INT.', fonte_documento: 'V5.2 Espec. Datasets §3.1' },
  { codigo: 'mte_lista_suja', nome: 'BDC - Lista Suja MTE (Trabalho Escravo)', nome_amigavel: 'Lista Suja MTE', fonte: 'bdc', dimensao_analitica: 'trabalho_esg', tier_minimo_uso: 'tier_1', obrigatorio: true, contratado: true, ativo: true, segmentos_ativam: ['all'], glossario_tooltip: 'Cadastro de Empregadores Flagrados pelo MTE por trabalho análogo ao escravo. Match = bloqueio absoluto B10.', fonte_documento: 'V5.2 Espec. Datasets §3.1' },

  // Novos V5.2 — Risco País Internacional (capability crossborder)
  { codigo: 'country_risk_index', nome: 'BDC - Country Risk Index (FATF + Transparency Intl)', nome_amigavel: 'Índice de Risco-País', fonte: 'bdc', dimensao_analitica: 'risco_pais_internacional', tier_minimo_uso: 'tier_3', capabilities_ativam: ['crossborder'], contratado: false, ativo: false, novo_em_v5_1: true, glossario_tooltip: 'Índice composto de risco-país baseado em FATF blacklist/greylist, Transparency International CPI, World Bank Governance Indicators. Score 0-100.', fonte_documento: 'V5.2 Espec. Datasets §3.4' },
  { codigo: 'sanctions_uk_hmt', nome: 'BDC - Sanções UK HMT (Treasury)', nome_amigavel: 'Sanções UK HMT', fonte: 'bdc', dimensao_analitica: 'sancoes_internacionais_nacionais', tier_minimo_uso: 'tier_3', capabilities_ativam: ['crossborder'], contratado: false, ativo: false, novo_em_v5_1: true, glossario_tooltip: 'Cross-check contra HM Treasury Consolidated List (Reino Unido). Match = bloqueio.', fonte_documento: 'V5.2 Espec. Datasets §3.2' },

  // Novos V5.2 — PLD/FT
  { codigo: 'coaf_history', nome: 'COAF - Histórico de Comunicações', nome_amigavel: 'Histórico COAF', fonte: 'bdc', dimensao_analitica: 'pld_ft', tier_minimo_uso: 'tier_2', contratado: false, ativo: false, novo_em_v5_1: true, glossario_tooltip: 'Histórico de comunicações COAF (RIF) associadas ao CNPJ. Indicador forte de exposição PLD/FT.', fonte_documento: 'V5.2 Espec. Datasets §3.10' },

  // Compliance Setorial
  { codigo: 'cadastur_active', nome: 'Ministério do Turismo - Cadastur', nome_amigavel: 'Cadastur (Turismo)', fonte: 'interno', endpoint: 'mtur_cadastur', dimensao_analitica: 'compliance_setorial', tier_minimo_uso: 'tier_1', segmentos_ativam: ['turismo'], contratado: false, ativo: false, novo_em_v5_1: true, glossario_tooltip: 'Cadastro de Prestadores de Serviços Turísticos do Ministério do Turismo. Obrigatório para agências, operadoras, transportadoras.', fonte_documento: 'V5.2 DELTA_SEGMENTOS Cap. 5 (Turismo)' },
  { codigo: 'conselhos_profissionais', nome: 'Conselhos Profissionais (CFM, CRO, CRMV, OAB, CREA)', nome_amigavel: 'Conselhos Profissionais', fonte: 'bdc', dimensao_analitica: 'compliance_setorial', tier_minimo_uso: 'tier_2', segmentos_ativam: ['plataforma_vertical', 'servicos_b2b'], contratado: false, ativo: false, novo_em_v5_1: true, glossario_tooltip: 'Validação de registro profissional ativo nos conselhos (CFM-medicina, CRO-odonto, CRMV-veterinária, OAB-advocacia, CREA-engenharia).', fonte_documento: 'V5.2 DELTA_SEGMENTOS Cap. 5 (PV)' },
  { codigo: 'ecad_active', nome: 'ECAD - Cadastro de Licenciamento Musical', nome_amigavel: 'ECAD', fonte: 'interno', endpoint: 'ecad_consulta', dimensao_analitica: 'compliance_setorial', tier_minimo_uso: 'tier_2', segmentos_ativam: ['eventos'], contratado: false, ativo: false, novo_em_v5_1: true, glossario_tooltip: 'Cadastro do Escritório Central de Arrecadação e Distribuição (direitos autorais musicais). Obrigatório para eventos com música.', fonte_documento: 'V5.2 DELTA_SEGMENTOS Cap. 5 (Eventos)' },
  { codigo: 'avcb_status', nome: 'Bombeiros - AVCB (Auto de Vistoria)', nome_amigavel: 'AVCB Bombeiros', fonte: 'interno', endpoint: 'bombeiros_avcb', dimensao_analitica: 'compliance_setorial', tier_minimo_uso: 'tier_1', segmentos_ativam: ['eventos', 'servicos_locais'], contratado: false, ativo: false, novo_em_v5_1: true, glossario_tooltip: 'Auto de Vistoria do Corpo de Bombeiros. Obrigatório para estabelecimentos físicos (pousadas, restaurantes, bares) e eventos.', fonte_documento: 'V5.2 DELTA_SEGMENTOS Cap. 5' },

  // Reclame Aqui
  { codigo: 'reclame_aqui_metrics', nome: 'Reclame Aqui - Métricas Reputacionais', nome_amigavel: 'Reclame Aqui', fonte: 'interno', endpoint: 'reclame_aqui_scrape', dimensao_analitica: 'atividade_reputacao', tier_minimo_uso: 'tier_1', segmentos_ativam: ['ecommerce', 'marketplace', 'dropshipping', 'turismo', 'saas'], contratado: false, ativo: false, novo_em_v5_1: true, glossario_tooltip: 'Métricas públicas Reclame Aqui: nota, % de respostas, % de soluções, índice de recomendação. Indicador forte de risco operacional/reputacional.', fonte_documento: 'V5.2 DELTA_SEGMENTOS Cap. 5' },
];

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode === 'apply' ? 'apply' : 'preview';
    const sections = Array.isArray(body.sections) && body.sections.length > 0
      ? body.sections
      : ['datasets', 'bloqueios', 'capabilities'];

    const summary = {
      mode,
      sections,
      datasets: { inserted: 0, updated: 0, skipped: 0, details: [] },
      bloqueios: { inserted: 0, updated: 0, skipped: 0, details: [] },
      capabilities: { inserted: 0, updated: 0, skipped: 0, details: [] },
    };

    // ─── CAPABILITIES ───
    if (sections.includes('capabilities')) {
      const existing = await base44.asServiceRole.entities.Capability.list();
      const existingByCode = new Map(existing.map(c => [c.codigo, c]));

      for (const cap of CAPABILITIES_V5_2) {
        const found = existingByCode.get(cap.codigo);
        if (!found) {
          if (mode === 'apply') {
            await base44.asServiceRole.entities.Capability.create(cap);
          }
          summary.capabilities.inserted++;
          summary.capabilities.details.push({ codigo: cap.codigo, action: 'insert' });
        } else {
          // Atualiza só campos novos V5.2 se estiverem vazios
          const patch = {};
          if (!found.obrigatoria_para_segmentos?.length && cap.obrigatoria_para_segmentos?.length) {
            patch.obrigatoria_para_segmentos = cap.obrigatoria_para_segmentos;
          }
          if (!found.sentinel_prompts?.length && cap.sentinel_prompts?.length) {
            patch.sentinel_prompts = cap.sentinel_prompts;
          }
          if (Object.keys(patch).length > 0) {
            if (mode === 'apply') {
              await base44.asServiceRole.entities.Capability.update(found.id, patch);
            }
            summary.capabilities.updated++;
            summary.capabilities.details.push({ codigo: cap.codigo, action: 'update', fields: Object.keys(patch) });
          } else {
            summary.capabilities.skipped++;
          }
        }
      }
    }

    // ─── BLOQUEIOS ABSOLUTOS V5.2 ───
    if (sections.includes('bloqueios')) {
      const existing = await base44.asServiceRole.entities.Bloqueio.list();
      const existingByCode = new Map(existing.map(b => [b.codigo, b]));

      for (const blk of BLOQUEIOS_ABSOLUTOS_V5_2) {
        const found = existingByCode.get(blk.codigo);
        if (!found) {
          if (mode === 'apply') {
            await base44.asServiceRole.entities.Bloqueio.create(blk);
          }
          summary.bloqueios.inserted++;
          summary.bloqueios.details.push({ codigo: blk.codigo, action: 'insert', nucleo_duro: blk.nucleo_duro_regulatorio });
        } else {
          // Atualiza campos V5.2 se vazios
          const patch = {};
          if (found.nucleo_duro_regulatorio !== true && blk.nucleo_duro_regulatorio === true) patch.nucleo_duro_regulatorio = true;
          if (!found.decisao_padrao && blk.decisao_padrao) patch.decisao_padrao = blk.decisao_padrao;
          if (!found.fundamentacao_regulatoria && blk.fundamentacao_regulatoria) patch.fundamentacao_regulatoria = blk.fundamentacao_regulatoria;
          if (!found.nome_canonico_anterior && blk.nome_canonico_anterior) patch.nome_canonico_anterior = blk.nome_canonico_anterior;
          if (Object.keys(patch).length > 0) {
            if (mode === 'apply') {
              await base44.asServiceRole.entities.Bloqueio.update(found.id, patch);
            }
            summary.bloqueios.updated++;
            summary.bloqueios.details.push({ codigo: blk.codigo, action: 'update', fields: Object.keys(patch) });
          } else {
            summary.bloqueios.skipped++;
          }
        }
      }
    }

    // ─── DATASETS V5.2 PRIORITÁRIOS ───
    if (sections.includes('datasets')) {
      const existing = await base44.asServiceRole.entities.Dataset.list();
      const existingByCode = new Map(existing.map(d => [d.codigo, d]));

      for (const ds of DATASETS_V5_2_PRIORITARIOS) {
        const found = existingByCode.get(ds.codigo);
        if (!found) {
          if (mode === 'apply') {
            await base44.asServiceRole.entities.Dataset.create(ds);
          }
          summary.datasets.inserted++;
          summary.datasets.details.push({ codigo: ds.codigo, action: 'insert', contratado: ds.contratado, ativo: ds.ativo });
        } else {
          const patch = {};
          if (!found.nome_amigavel && ds.nome_amigavel) patch.nome_amigavel = ds.nome_amigavel;
          if (!found.dimensao_analitica && ds.dimensao_analitica) patch.dimensao_analitica = ds.dimensao_analitica;
          if (!found.glossario_tooltip && ds.glossario_tooltip) patch.glossario_tooltip = ds.glossario_tooltip;
          if (found.obrigatorio === undefined && ds.obrigatorio !== undefined) patch.obrigatorio = ds.obrigatorio;
          if (found.contratado === undefined && ds.contratado !== undefined) patch.contratado = ds.contratado;
          if (!found.segmentos_ativam?.length && ds.segmentos_ativam?.length) patch.segmentos_ativam = ds.segmentos_ativam;
          if (!found.capabilities_ativam?.length && ds.capabilities_ativam?.length) patch.capabilities_ativam = ds.capabilities_ativam;
          if (Object.keys(patch).length > 0) {
            if (mode === 'apply') {
              await base44.asServiceRole.entities.Dataset.update(found.id, patch);
            }
            summary.datasets.updated++;
            summary.datasets.details.push({ codigo: ds.codigo, action: 'update', fields: Object.keys(patch) });
          } else {
            summary.datasets.skipped++;
          }
        }
      }
    }

    return Response.json({
      ok: true,
      mode,
      message: mode === 'preview'
        ? 'PREVIEW mode — nenhuma escrita foi feita. Re-execute com mode=apply para aplicar.'
        : 'APPLIED — alterações persistidas no banco.',
      summary,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});