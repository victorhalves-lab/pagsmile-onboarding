/**
 * [V5.2] Seed das perguntas canônicas do questionário dinâmico V5.2 (Fase 5.2).
 *
 * Estratégia (ADITIVO E IDEMPOTENTE):
 *   1) Garante que existe um QuestionnaireTemplate com subCategory=V5_2_DYNAMIC
 *      (template ÚNICO dinâmico tier-aware V5.2). Cria se não existir.
 *   2) Para cada pergunta do catálogo (lib/v5_2/questionCatalog.js — agora replicado
 *      aqui no backend pois funções não podem importar de lib/* por restrição
 *      de deploy independente), faz upsert por id_canonico.
 *   3) Atualiza apenas campos novos/vazios em perguntas já existentes (preserva
 *      qualquer ajuste manual).
 *
 * Payload: { mode: 'preview' | 'apply' }
 * Admin-only.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─────────────────────────────────────────────────────────────────────────────
// Cataologo replicado (mantido em sincronia com lib/v5_2/questionCatalog.js)
// Backend functions não podem importar local files — replicação necessária.
// ─────────────────────────────────────────────────────────────────────────────
const QUESTIONS_V5_2 = [
  // BASE — Identidade
  { id_canonico: 'q_base_razao_social', order: 10, text: 'Confirme a Razão Social', type: 'TEXT', isRequired: true, categoria_funcional: 'identidade', modalidade_origem: 'modalidade_a_bdc_confirmacao', cross_check_bdc: { dataset: 'basic_data', campo_bdc: 'companyName', field_id_cv16: 'razao_social' }, norma_regulatoria: 'Circ. BCB 3.978 Art. 19', framework_version_intro: 'v5.2', tiers_aplicaveis: ['tier_1', 'tier_2', 'tier_3'], segmentos_aplicaveis: ['all'] },
  { id_canonico: 'q_base_nome_fantasia', order: 20, text: 'Nome Fantasia', type: 'TEXT', isRequired: false, categoria_funcional: 'identidade', modalidade_origem: 'modalidade_b_bdc_input_hibrido', cross_check_bdc: { dataset: 'basic_data', campo_bdc: 'tradeName', field_id_cv16: 'nome_fantasia' }, framework_version_intro: 'v5.2', tiers_aplicaveis: ['tier_1', 'tier_2', 'tier_3'], segmentos_aplicaveis: ['all'] },
  { id_canonico: 'q_base_cnpj_situacao', order: 30, text: 'Situação na Receita Federal', type: 'SELECT', options: ['ATIVA', 'INAPTA', 'SUSPENSA', 'BAIXADA', 'NULA'], isRequired: true, categoria_funcional: 'identidade', modalidade_origem: 'modalidade_a_bdc_confirmacao', cross_check_bdc: { dataset: 'basic_data', campo_bdc: 'taxIdStatus', field_id_cv16: 'cnpj_situacao' }, b_series_disparados: ['B05'], norma_regulatoria: 'Circ. BCB 3.978 Art. 19', framework_version_intro: 'v5.2', tiers_aplicaveis: ['tier_1', 'tier_2', 'tier_3'], segmentos_aplicaveis: ['all'] },
  { id_canonico: 'q_base_capital_social', order: 40, text: 'Capital Social declarado (R$)', type: 'NUMBER', isRequired: true, categoria_funcional: 'identidade', modalidade_origem: 'modalidade_b_bdc_input_hibrido', cross_check_bdc: { dataset: 'basic_data', campo_bdc: 'capitalSocial', tolerancia_divergencia_pct: 0.1, field_id_cv16: 'capital_social' }, variaveis_risk_score: ['v_capital_vs_tpv'], b_series_disparados: ['B-FIN-1'], framework_version_intro: 'v5.2', tiers_aplicaveis: ['tier_1', 'tier_2', 'tier_3'], segmentos_aplicaveis: ['all'] },
  { id_canonico: 'q_base_data_fundacao', order: 50, text: 'Data de Fundação', type: 'DATE', isRequired: true, categoria_funcional: 'identidade', modalidade_origem: 'modalidade_a_bdc_confirmacao', cross_check_bdc: { dataset: 'basic_data', campo_bdc: 'foundingDate', field_id_cv16: 'data_fundacao' }, variaveis_risk_score: ['v_idade_cnpj'], framework_version_intro: 'v5.2', tiers_aplicaveis: ['tier_1', 'tier_2', 'tier_3'], segmentos_aplicaveis: ['all'] },
  // BASE — Volumetria
  { id_canonico: 'q_base_tpv_mensal_declarado', order: 100, text: 'TPV mensal médio esperado (R$)', type: 'NUMBER', isRequired: true, categoria_funcional: 'volumetria', modalidade_origem: 'modalidade_c_input_puro', variaveis_risk_score: ['v_tpv_declarado', 'v_capital_vs_tpv'], helpText: 'Esta resposta determina o tier do cadastro (T1/T2/T3).', framework_version_intro: 'v5.2', tiers_aplicaveis: ['tier_1', 'tier_2', 'tier_3'], segmentos_aplicaveis: ['all'] },
  { id_canonico: 'q_base_ticket_medio', order: 110, text: 'Ticket médio esperado (R$)', type: 'NUMBER', isRequired: true, categoria_funcional: 'volumetria', modalidade_origem: 'modalidade_c_input_puro', framework_version_intro: 'v5.2', tiers_aplicaveis: ['tier_1', 'tier_2', 'tier_3'], segmentos_aplicaveis: ['all'] },
  { id_canonico: 'q_base_mcc', order: 120, text: 'MCC principal de operação', type: 'TEXT', isRequired: true, categoria_funcional: 'atividade_economica', modalidade_origem: 'modalidade_c_input_puro', variaveis_risk_score: ['v_mcc_risco'], b_series_disparados: ['B-MCC-HIGH-RISK'], framework_version_intro: 'v5.2', tiers_aplicaveis: ['tier_1', 'tier_2', 'tier_3'], segmentos_aplicaveis: ['all'] },
  // T2 — Comprovação Financeira (COMPOSITE)
  { id_canonico: 'q_t2_revenue_proof', order: 200, text: 'Comprovação de Faturamento Anual', type: 'COMPOSITE', isRequired: true, categoria_funcional: 'volumetria', modalidade_origem: 'modalidade_e_documento_upload', documentos_relacionados: ['ecf', 'defis', 'balanco_simplificado', 'extrato_consolidado'], cross_check_bdc: { dataset: 'financial_market', campo_bdc: 'annualRevenue', tolerancia_divergencia_pct: 0.15, field_id_cv16: 'faturamento_anual' }, variaveis_risk_score: ['v_faturamento_doc_vs_ecf', 'v_financial_coherence'], b_series_disparados: ['B-FIN-2'], norma_regulatoria: 'Circ. BCB 3.978 Art. 19 + Resol. BCB 403/2024', framework_version_intro: 'v5.2', tiers_aplicaveis: ['tier_2', 'tier_3'], segmentos_aplicaveis: ['all'], helpText: 'Anexe ECF, DEFIS, balanço simplificado ou extrato consolidado dos últimos 12 meses.' },
  // T3 — Estrutura
  { id_canonico: 'q_t3_estrutura_holding', order: 300, text: 'A empresa pertence a uma estrutura de holding?', type: 'BOOLEAN', isRequired: true, categoria_funcional: 'estrutura_societaria', modalidade_origem: 'modalidade_c_input_puro', framework_version_intro: 'v5.2', tiers_aplicaveis: ['tier_3'], segmentos_aplicaveis: ['all'] },
  // CAP — splits/subseller
  { id_canonico: 'q_cap_splits_kyc_completeness', order: 400, text: 'Quantos sub-sellers já cadastrados na sua plataforma?', type: 'NUMBER', isRequired: true, categoria_funcional: 'splits_marketplace', modalidade_origem: 'modalidade_c_input_puro', variaveis_risk_score: ['v_cap_splits_kyc_completeness'], capabilities_ativam: ['splits/subseller'], framework_version_intro: 'v5.2', tiers_aplicaveis: ['tier_2', 'tier_3'], segmentos_aplicaveis: ['marketplace', 'gateway'] },
  // CAP — crossborder
  { id_canonico: 'q_cap_crossborder_paises_destino', order: 410, text: 'Quais países de destino das operações?', type: 'MULTI_SELECT', options: ['US', 'GB', 'DE', 'FR', 'ES', 'PT', 'CA', 'AR', 'MX', 'CN', 'JP', 'AU', 'AE', 'SY', 'IR', 'KP'], isRequired: true, categoria_funcional: 'internacional_crossborder', modalidade_origem: 'modalidade_c_input_puro', variaveis_risk_score: ['v_cap_crossborder_country_risk'], b_series_disparados: ['B-CB-1', 'B-CB-PAIS-CRIT-1'], capabilities_ativam: ['crossborder'], norma_regulatoria: 'FATF Recommendation 19 + Lei 13.810/2019', framework_version_intro: 'v5.2', tiers_aplicaveis: ['tier_2', 'tier_3'], segmentos_aplicaveis: ['crossborder', 'dropshipping'] },
  // CAP — recurrence
  { id_canonico: 'q_cap_recurrence_cancel_friction', order: 420, text: 'O usuário consegue cancelar a assinatura pelo mesmo canal de contratação?', type: 'BOOLEAN', isRequired: true, categoria_funcional: 'recorrencia_assinaturas', modalidade_origem: 'modalidade_c_input_puro', variaveis_risk_score: ['v_cap_recurrence_cancel_friction'], capabilities_ativam: ['recurrence'], norma_regulatoria: 'CDC + SENACON Portaria 47/2024', framework_version_intro: 'v5.2', tiers_aplicaveis: ['tier_1', 'tier_2', 'tier_3'], segmentos_aplicaveis: ['saas'] },
  // SUBSELLER PJ
  { id_canonico: 'q_sub_pj_tpv_esperado', order: 500, text: 'TPV mensal esperado nesta sub-conta (R$)', type: 'NUMBER', isRequired: true, categoria_funcional: 'subseller_pj', modalidade_origem: 'modalidade_c_input_puro', helpText: 'Determina o grau do sub-seller (A/B/C).', framework_version_intro: 'v5.2', tiers_aplicaveis: ['subseller_pj'], segmentos_aplicaveis: ['all'] },
  // SUBSELLER PF
  { id_canonico: 'q_sub_pf_renda_mensal', order: 600, text: 'Renda mensal líquida (R$)', type: 'NUMBER', isRequired: true, categoria_funcional: 'subseller_pf', modalidade_origem: 'modalidade_c_input_puro', helpText: 'Determina o grau do sub-seller PF (A/B/C).', framework_version_intro: 'v5.2', tiers_aplicaveis: ['subseller_pf'], segmentos_aplicaveis: ['all'] },
  { id_canonico: 'q_sub_pf_dirpf_upload', order: 610, text: 'Anexe sua DIRPF (Declaração de Imposto de Renda) mais recente', type: 'FILE_UPLOAD', isRequired: true, categoria_funcional: 'documental', modalidade_origem: 'modalidade_e_documento_upload', documentos_relacionados: ['dirpf'], conditionalLogic: { dependsOn: 'q_sub_pf_renda_mensal', operator: 'greater_than', value: '10000' }, norma_regulatoria: 'Circ. BCB 3.978 Art. 19 (PF de alta renda)', framework_version_intro: 'v5.2', tiers_aplicaveis: ['subseller_pf'], segmentos_aplicaveis: ['all'] },
];

const TEMPLATE_V5_2_SEED = {
  name: 'V5.2 Dynamic Questionnaire (Master)',
  description: 'Template ÚNICO dinâmico tier-aware V5.2. As perguntas são filtradas em runtime por tier/segmento/capability.',
  merchantType: 'PJ',
  category: 'COMPLIANCE',
  subCategory: 'V5_2_DYNAMIC',
  framework_version: 'v5.2',
  isActive: true,
  isArchived: false,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode === 'apply' ? 'apply' : 'preview';

    const summary = {
      mode,
      template: { found: false, created: false, id: null },
      questions: { inserted: 0, updated: 0, skipped: 0, details: [] },
    };

    // ─── 1) Garante o template master V5.2 ────────────────────────────────
    const tpls = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({
      subCategory: 'V5_2_DYNAMIC',
      framework_version: 'v5.2',
    });
    let template = tpls && tpls[0];

    if (!template) {
      if (mode === 'apply') {
        template = await base44.asServiceRole.entities.QuestionnaireTemplate.create(TEMPLATE_V5_2_SEED);
        summary.template = { found: false, created: true, id: template.id };
      } else {
        summary.template = { found: false, created: false, id: null, note: 'Template will be created on apply.' };
      }
    } else {
      summary.template = { found: true, created: false, id: template.id };
    }

    // Em preview sem template criado, não conseguimos resolver IDs — retornamos sumário
    if (!template) {
      return Response.json({
        ok: true,
        mode,
        message: 'PREVIEW — nenhuma escrita feita. Template V5.2 ainda não existe; re-execute com mode=apply.',
        summary,
        catalog_size: QUESTIONS_V5_2.length,
      });
    }

    // ─── 2) Carrega Questions existentes deste template ───────────────────
    const existingQs = await base44.asServiceRole.entities.Question.filter({
      questionnaireTemplateId: template.id,
    });
    const byIdCanonico = new Map(
      existingQs.filter((q) => q.id_canonico).map((q) => [q.id_canonico, q])
    );

    // ─── 3) Upsert por id_canonico ────────────────────────────────────────
    for (const seed of QUESTIONS_V5_2) {
      const payload = {
        questionnaireTemplateId: template.id,
        ...seed,
      };
      const existing = byIdCanonico.get(seed.id_canonico);

      if (!existing) {
        if (mode === 'apply') {
          await base44.asServiceRole.entities.Question.create(payload);
        }
        summary.questions.inserted++;
        summary.questions.details.push({ id_canonico: seed.id_canonico, action: 'insert' });
      } else {
        // Atualiza apenas campos novos V5.2 que estão vazios
        const patch = {};
        for (const key of Object.keys(seed)) {
          const newVal = seed[key];
          const oldVal = existing[key];
          const isEmptyArr = Array.isArray(oldVal) && oldVal.length === 0;
          const isEmptyObj = oldVal && typeof oldVal === 'object' && !Array.isArray(oldVal) && Object.keys(oldVal).length === 0;
          if (oldVal === undefined || oldVal === null || oldVal === '' || isEmptyArr || isEmptyObj) {
            patch[key] = newVal;
          }
        }
        if (Object.keys(patch).length > 0) {
          if (mode === 'apply') {
            await base44.asServiceRole.entities.Question.update(existing.id, patch);
          }
          summary.questions.updated++;
          summary.questions.details.push({
            id_canonico: seed.id_canonico,
            action: 'update',
            fields: Object.keys(patch),
          });
        } else {
          summary.questions.skipped++;
        }
      }
    }

    return Response.json({
      ok: true,
      mode,
      message:
        mode === 'preview'
          ? 'PREVIEW mode — nenhuma escrita foi feita. Re-execute com mode=apply para aplicar.'
          : 'APPLIED — perguntas V5.2 persistidas (idempotente).',
      summary,
      catalog_size: QUESTIONS_V5_2.length,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});