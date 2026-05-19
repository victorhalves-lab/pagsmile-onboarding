// ─────────────────────────────────────────────────────────────────────
// bdcEnrichCaseV5_1 — Pipeline de scoring V5.1 (paralelo ao V4)
// ─────────────────────────────────────────────────────────────────────
// REGRA SUPREMA:
// - Esta função NUNCA é chamada para casos V4. O router garante isso.
// - Esta função NUNCA chama bdcEnrichCase (V4). Calcula score próprio.
// - Esta função NUNCA modifica campos V4 do OnboardingCase/ComplianceScore.
//   Só toca em campos *_v5_1, framework_version, etc.
// - Esta função AGORA é um MVP: lê dados do questionário/merchant, resolve
//   tier/segmento/morfologia/capabilities, calcula score com função pura,
//   persiste em ComplianceScore + cria Snapshot. NÃO integra BDC ainda
//   (deduplicação com infraestrutura BDC vem em fase posterior).
// ─────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// V5.1 helpers (importados do lib via fetch local — Deno não tem acesso a /src)
// Como functions são deployadas isoladas, REPLICAMOS as funções puras aqui.
// (Princípio: backend functions são módulos auto-contidos.)

// ── tiers ──
const TIERS = {
  TIER_1: 'tier_1', TIER_2: 'tier_2', TIER_3: 'tier_3',
  SUBSELLER_PJ: 'subseller_pj', SUBSELLER_PF: 'subseller_pf',
};
function resolverTier({ tpvMensalDeclarado, segmento, isSubseller, merchantType }) {
  if (isSubseller) return merchantType === 'PF' ? TIERS.SUBSELLER_PF : TIERS.SUBSELLER_PJ;
  if (segmento === 'marketplace') return TIERS.TIER_2;
  const tpv = Number(tpvMensalDeclarado) || 0;
  if (tpv <= 50_000) return TIERS.TIER_1;
  if (tpv <= 500_000) return TIERS.TIER_2;
  return TIERS.TIER_3;
}

// ── segmentos críticos ──
const SEGMENTOS_CRITICOS_FINANCEIRO = ['gateway', 'dropshipping', 'marketplace'];
function isSegmentoCritico(s) { return SEGMENTOS_CRITICOS_FINANCEIRO.includes(s); }

// ── morfologias ──
const MORFOLOGIAS = {
  PIX_ONLY: 'pix_only', PIX_HEAVY: 'pix_heavy', CARTAO_HEAVY: 'cartao_heavy',
  MULTI_MEI: 'multi_mei', B2C_NACIONAL: 'b2c_nacional', B2C_CROSSBORDER: 'b2c_crossborder',
  B2B_NACIONAL: 'b2b_nacional', B2B_CROSSBORDER: 'b2b_crossborder',
  SAAS_RECORRENTE: 'saas_recorrente', LINK_PAGAMENTO_AVULSO: 'link_pagamento_avulso',
  PADRAO: 'padrao',
};
function resolverMorfologia({ distribuicaoTpv = {}, segmento, modeloVenda, paisAtuacao }) {
  const pix = Number(distribuicaoTpv.pix) || 0;
  const cartao = Number(distribuicaoTpv.cartao) || 0;
  if (pix >= 95) return MORFOLOGIAS.PIX_ONLY;
  if (pix >= 70) return MORFOLOGIAS.PIX_HEAVY;
  if (cartao >= 70) return MORFOLOGIAS.CARTAO_HEAVY;
  if (paisAtuacao && paisAtuacao !== 'BR') {
    return modeloVenda === 'b2b' ? MORFOLOGIAS.B2B_CROSSBORDER : MORFOLOGIAS.B2C_CROSSBORDER;
  }
  if (segmento === 'saas') return MORFOLOGIAS.SAAS_RECORRENTE;
  if (segmento === 'link_pagamento') return MORFOLOGIAS.LINK_PAGAMENTO_AVULSO;
  return modeloVenda === 'b2b' ? MORFOLOGIAS.B2B_NACIONAL : MORFOLOGIAS.B2C_NACIONAL;
}

// ── capabilities ──
const CAPABILITIES = {
  FIN: 'cap_financial_capacity_validation',
  MKT: 'cap_marketplace_kyc',
  CB: 'cap_crossborder_compliance',
  SUB: 'cap_subseller_kyb',
};
function resolverCapabilities({ tier, segmento, morfologia, isSubseller }) {
  const ativas = new Set();
  if (tier === TIERS.TIER_2 || tier === TIERS.TIER_3) ativas.add(CAPABILITIES.FIN);
  else if (tier === TIERS.TIER_1 && isSegmentoCritico(segmento)) ativas.add(CAPABILITIES.FIN);
  if (segmento === 'marketplace') ativas.add(CAPABILITIES.MKT);
  if (morfologia === MORFOLOGIAS.B2C_CROSSBORDER || morfologia === MORFOLOGIAS.B2B_CROSSBORDER) {
    ativas.add(CAPABILITIES.CB);
  }
  if (isSubseller) ativas.add(CAPABILITIES.SUB);
  return Array.from(ativas);
}

// ── matriz decisão ──
const CATEGORIAS = {
  AUTO: 'cat_1_auto_approve',
  COND: 'cat_2_conditional',
  MANUAL: 'cat_3_manual_review',
  BLOCK: 'cat_4_block',
  INTENSIVE: 'cat_5_intensive_monitoring',
};
function categoriaToStatusLegacy(c) {
  return { cat_1_auto_approve: 'Aprovado', cat_2_conditional: 'Aprovado',
    cat_3_manual_review: 'Manual', cat_4_block: 'Recusado',
    cat_5_intensive_monitoring: 'Aprovado' }[c] || 'Manual';
}
function categoriaToRecomendacao(c) {
  return { cat_1_auto_approve: 'Aprovado', cat_2_conditional: 'Aprovado com Condições',
    cat_3_manual_review: 'Revisão Manual', cat_4_block: 'Recusado',
    cat_5_intensive_monitoring: 'Aprovado com Condições' }[c] || 'Revisão Manual';
}

// ── subfaixa tier-aware ──
const TIER_SUFFIX = { tier_1: 'T1', tier_2: 'T2', tier_3: 'T3', subseller_pj: 'SubPJ', subseller_pf: 'SubPF' };
function formatSubfaixaTA(base, tier) {
  const s = TIER_SUFFIX[tier];
  return base && s ? `${base}-${s}` : (base || '-');
}

// ── scoring (cópia da função pura) ──
const SCORE_MAX_POR_TIER = { tier_1: 499, tier_2: 849, tier_3: 849, subseller_pj: 999, subseller_pf: 999 };
const BASE_ST = {
  tier_1: { ecommerce: 320, saas: 360, educacao: 340, mpe: 320, infoprodutos: 300, foodtech: 320,
    link_pagamento: 280, plataforma_vertical: 320, gateway: 220, dropshipping: 220, marketplace: 220,
    pix_merchant: 320, pix_intermediario: 240 },
  tier_2: { ecommerce: 560, saas: 600, educacao: 580, mpe: 540, infoprodutos: 520, foodtech: 560,
    link_pagamento: 500, plataforma_vertical: 560, gateway: 420, dropshipping: 420, marketplace: 460,
    pix_merchant: 560, pix_intermediario: 440 },
  tier_3: { ecommerce: 540, saas: 580, educacao: 560, mpe: 520, infoprodutos: 500, foodtech: 540,
    link_pagamento: 480, plataforma_vertical: 540, gateway: 380, dropshipping: 380, marketplace: 420,
    pix_merchant: 540, pix_intermediario: 400 },
  subseller_pj: { _default: 700 },
  subseller_pf: { _default: 650 },
};
function calcularScoreV5_1(input) {
  const { tier, segmento, morfologia, capabilitiesAtivas = [], variaveisInput = {},
    resultadosCapabilities = {}, patchStatus = 'nao_aplicavel', bloqueiosAtivos = [] } = input;

  // C1
  const tabela = BASE_ST[tier] || {};
  const c1Valor = tabela[segmento] ?? tabela._default ?? 400;

  // C2
  let c2 = 0; const c2Motivos = [];
  if (morfologia === MORFOLOGIAS.PIX_ONLY) { c2 += 10; c2Motivos.push('PIX exclusivo +10'); }
  if (morfologia === MORFOLOGIAS.PIX_HEAVY) { c2 += 5; c2Motivos.push('PIX heavy +5'); }
  if (morfologia === MORFOLOGIAS.B2C_CROSSBORDER) { c2 -= 40; c2Motivos.push('B2C crossborder -40'); }
  if (morfologia === MORFOLOGIAS.B2B_CROSSBORDER) { c2 -= 25; c2Motivos.push('B2B crossborder -25'); }
  if (morfologia === MORFOLOGIAS.MULTI_MEI) { c2 -= 50; c2Motivos.push('Multi-MEI -50'); }
  if (morfologia === MORFOLOGIAS.SAAS_RECORRENTE) { c2 += 15; c2Motivos.push('SaaS recorrente +15'); }
  if (morfologia === MORFOLOGIAS.CARTAO_HEAVY && isSegmentoCritico(segmento)) {
    c2 -= 20; c2Motivos.push('Cartão heavy + crítico -20');
  }

  // C3
  const VARS = ['v_cnpj_valido_e_ativo','v_qsa_coherence','v_capital_social_proporcional',
    'v_idade_empresa','v_endereco_coerente','v_atividade_cnae_coerente','v_socios_sem_restricoes',
    'v_socios_sem_pep_sancoes','v_socios_sem_processos_criticos','v_score_credito_pj',
    'v_score_credito_socios','v_dominio_proprio_ativo','v_presenca_digital','v_reclamacoes_consumidor',
    'v_historico_chargeback','v_financial_coherence'];
  let c3 = 0; const c3Aplicadas = {}; const c3Pos = []; const c3Neg = [];
  for (const nome of VARS) {
    const v = variaveisInput[nome];
    if (v == null) continue;
    const valor = typeof v === 'object' ? Number(v.valor) || 0 : Number(v) || 0;
    if (valor === 0) continue;
    c3 += valor;
    c3Aplicadas[nome] = { valor, descricao: (typeof v === 'object' ? v.descricao : '') || '' };
    if (valor > 0) c3Pos.push(`${nome}: +${valor}`); else c3Neg.push(`${nome}: ${valor}`);
  }

  // C4
  let c4 = 0; const c4Motivos = [];
  for (const cap of capabilitiesAtivas) {
    const res = resultadosCapabilities[cap];
    if (!res) { c4 -= 10; c4Motivos.push(`${cap} sem dados -10`); continue; }
    if (res.status === 'warning') { c4 -= 20; c4Motivos.push(`${cap} warning -20`); }
    if (res.status === 'fail') { c4 -= 50; c4Motivos.push(`${cap} fail -50`); }
  }

  // C5
  const C5_MAP = { verde: 20, amarelo: -10, laranja: -40, vermelho: -100, nao_aplicavel: 0 };
  const c5 = C5_MAP[patchStatus] ?? 0;

  const bruto = c1Valor + c2 + c3 + c4 + c5;
  const max = SCORE_MAX_POR_TIER[tier] || 849;
  const final = Math.max(0, Math.min(max, bruto));
  const norm = (final / max) * 100;

  let subfaixaBase;
  if (norm >= 90) subfaixaBase = '1A';
  else if (norm >= 80) subfaixaBase = '1B';
  else if (norm >= 70) subfaixaBase = '2A';
  else if (norm >= 60) subfaixaBase = '2B';
  else if (norm >= 50) subfaixaBase = '3A';
  else if (norm >= 40) subfaixaBase = '3B';
  else if (norm >= 25) subfaixaBase = '4';
  else subfaixaBase = '5';

  let categoria;
  if (bloqueiosAtivos.length > 0 || patchStatus === 'vermelho' || subfaixaBase === '5') categoria = CATEGORIAS.BLOCK;
  else if (subfaixaBase === '4') categoria = CATEGORIAS.MANUAL;
  else if (subfaixaBase === '3A' || subfaixaBase === '3B') categoria = CATEGORIAS.COND;
  else if ((subfaixaBase === '2A' || subfaixaBase === '2B') && (patchStatus === 'amarelo' || patchStatus === 'laranja')) categoria = CATEGORIAS.COND;
  else categoria = CATEGORIAS.AUTO;

  return {
    score_final: final, score_max: max, score_normalizado: Math.round(norm * 10) / 10,
    camadas: {
      c1_segmento_tier: { valor: c1Valor, explicacao: `Base (${segmento}) × ${tier}` },
      c2_morfologia: { valor: c2, explicacao: c2Motivos.join('; ') || 'padrão (0)' },
      c3_variaveis: { valor: c3, aplicadas: c3Aplicadas, positivas: c3Pos, negativas: c3Neg },
      c4_capabilities: { valor: c4, explicacao: c4Motivos.join('; ') || 'OK (0)' },
      c5_patch_financeiro: { valor: c5, explicacao: `Patch ${patchStatus}` },
    },
    subfaixa_base: subfaixaBase,
    subfaixa_tier_aware: formatSubfaixaTA(subfaixaBase, tier),
    categoria_decisao: categoria,
    variaveis_positivas: c3Pos, variaveis_negativas: c3Neg,
    patch_financeiro_status: patchStatus,
  };
}

// ── hash SHA-256 para integridade do Snapshot ──
async function sha256Hash(obj) {
  const json = JSON.stringify(obj);
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(json));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const t0 = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const caseId = body.onboardingCaseId;
    if (!caseId) return Response.json({ error: 'onboardingCaseId obrigatório' }, { status: 400 });

    // ─── Load case ───
    const [oc] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
    if (!oc) return Response.json({ error: 'case_not_found' }, { status: 404 });

    // GUARD: nunca processa caso V4 aqui
    if ((oc.framework_version || 'v4.0') !== 'v5.1') {
      return Response.json({ skipped: true, reason: 'not_v5_1', framework: oc.framework_version || 'v4.0' });
    }

    console.log(`[bdcEnrichCaseV5_1] ═══ Starting V5.1 scoring for case ${caseId} ═══`);

    // ─── Load merchant + questionnaire responses ───
    const [merchant] = await base44.asServiceRole.entities.Merchant.filter({ id: oc.merchantId });
    const responses = await base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId: caseId });

    // ─── Extract inputs from questionnaire (heurística simples por keyword) ───
    let tpvDeclarado = 0, segmento = 'ecommerce', modeloVenda = 'b2c', paisAtuacao = 'BR';
    const distrib = { pix: 0, cartao: 0, boleto: 0 };

    for (const r of responses) {
      const t = (r.questionText || '').toLowerCase();
      const v = r.valueText || '';
      const num = Number(String(v).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

      if (t.includes('tpv') && t.includes('mensal') && num > 0) tpvDeclarado = num;
      if (t.includes('segmento') && v) segmento = String(v).toLowerCase().trim();
      if (t.includes('modelo') && (t.includes('b2b') || t.includes('b2c')) && v) {
        if (String(v).toLowerCase().includes('b2b')) modeloVenda = 'b2b';
      }
      if (t.includes('país') && v && String(v).toUpperCase() !== 'BR' && String(v).toUpperCase() !== 'BRASIL') {
        paisAtuacao = String(v).toUpperCase().slice(0, 2);
      }
      if (t.includes('% pix') || (t.includes('pix') && t.includes('percentual'))) distrib.pix = num;
      if (t.includes('% cartão') || t.includes('% cartao') || (t.includes('cartão') && t.includes('percentual'))) distrib.cartao = num;
    }

    // Fallback de segmento via template
    if (!segmento || segmento === 'ecommerce') {
      try {
        const [tpl] = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ id: oc.questionnaireTemplateId });
        if (tpl?.segmento_v5_1) segmento = tpl.segmento_v5_1;
      } catch {}
    }

    const isSubseller = !!oc.isSubsellerCase;
    const merchantType = merchant?.type || 'PJ';

    // ─── Resolve tier/morfologia/capabilities ───
    const tier = resolverTier({ tpvMensalDeclarado: tpvDeclarado, segmento, isSubseller, merchantType });
    const morfologia = resolverMorfologia({ distribuicaoTpv: distrib, segmento, modeloVenda, paisAtuacao });
    const capabilitiesAtivas = resolverCapabilities({ tier, segmento, morfologia, isSubseller });

    // ─── MVP: variáveis canônicas começam vazias (serão alimentadas em fases futuras
    //         por enrichment BDC + análise de docs). Patch financeiro = nao_aplicavel.
    const variaveisInput = {};
    const resultadosCapabilities = {};
    const patchStatus = 'nao_aplicavel';
    const bloqueiosAtivos = []; // catálogo Bloqueio será consultado em fase futura

    // ─── Calcula score ───
    const scoreOut = calcularScoreV5_1({
      tier, segmento, morfologia, capabilitiesAtivas,
      variaveisInput, resultadosCapabilities, patchStatus, bloqueiosAtivos,
    });

    const categoria = scoreOut.categoria_decisao;
    const statusLegacy = categoriaToStatusLegacy(categoria);
    const recomendacao = categoriaToRecomendacao(categoria);

    console.log(`[bdcEnrichCaseV5_1] tier=${tier} segmento=${segmento} score=${scoreOut.score_final}/${scoreOut.score_max} subfaixa=${scoreOut.subfaixa_tier_aware} cat=${categoria}`);

    // ─── Persist Snapshot (imutável, antes do update final) ───
    const snapshotInput = {
      questionario: responses.map(r => ({ q: r.questionText, a: r.valueText })),
      merchant: { type: merchant?.type, cpfCnpj: merchant?.cpfCnpj },
      tier, segmento, morfologia, capabilities_ativas: capabilitiesAtivas,
      tpv_declarado: tpvDeclarado, modelo_venda: modeloVenda, pais_atuacao: paisAtuacao,
    };
    const snapshotOutput = {
      score_camadas: scoreOut.camadas,
      score_final: scoreOut.score_final, score_max: scoreOut.score_max,
      subfaixa_tier_aware: scoreOut.subfaixa_tier_aware,
      categoria_decisao: categoria,
      bloqueios_ativos: bloqueiosAtivos,
      patch_financeiro: { status: patchStatus },
    };
    const hash = await sha256Hash({ in: snapshotInput, out: snapshotOutput });

    const snapshot = await base44.asServiceRole.entities.Snapshot.create({
      onboarding_case_id: caseId,
      merchant_id: oc.merchantId,
      framework_version: 'v5.1',
      tipo: 'initial_analysis',
      tier, segmento, morfologia, capabilities_ativas: capabilitiesAtivas,
      input_questionario: snapshotInput,
      input_datasets: {},
      input_documentos: [],
      output_score_camadas: scoreOut.camadas,
      output_bloqueios_ativos: bloqueiosAtivos,
      output_categoria_decisao: categoria,
      output_subfaixa_tier_aware: scoreOut.subfaixa_tier_aware,
      output_patch_financeiro: { status: patchStatus },
      datasets_obtidos: [], datasets_faltantes: [],
      elapsed_ms: Date.now() - t0,
      hash_integridade: hash, imutavel: true,
    });

    // ─── Update OnboardingCase (somente campos V5.1 + status) ───
    await base44.asServiceRole.entities.OnboardingCase.update(caseId, {
      tier,
      segmento_v5_1: segmento,
      morfologia,
      capabilities_ativas: capabilitiesAtivas,
      risk_score_v5_1: scoreOut.score_final,
      subfaixa_tier_aware: scoreOut.subfaixa_tier_aware,
      patch_financeiro_status: patchStatus,
      iaDecision: recomendacao,
      iaExplanation: `[V5.1] Categoria ${categoria} — Score ${scoreOut.score_final}/${scoreOut.score_max} — Subfaixa ${scoreOut.subfaixa_tier_aware}`,
      bigDataCorpCompleted: true,
      validationsCompleted: true,
      finalDecisionDate: new Date().toISOString(),
    });

    // ─── Persist ComplianceScore (campos V5.1 + framework_version) ───
    const existing = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: caseId });
    const scorePayload = {
      onboarding_case_id: caseId,
      framework_version: 'v5.1',
      versao_agente: 'sentinel-v5.1-mvp',
      segmento: segmento,
      questionario_id: oc.questionnaireTemplateId,
      tier_v5_1: tier,
      morfologia_v5_1: morfologia,
      capabilities_ativas_v5_1: capabilitiesAtivas,
      score_camada_1_segmento: scoreOut.camadas.c1_segmento_tier.valor,
      score_camada_2_morfologia: scoreOut.camadas.c2_morfologia.valor,
      score_camada_3_variaveis: scoreOut.camadas.c3_variaveis.valor,
      score_camada_4_capabilities: scoreOut.camadas.c4_capabilities.valor,
      score_camada_5_patch: scoreOut.camadas.c5_patch_financeiro.valor,
      score_v5_1_final: scoreOut.score_final,
      subfaixa_tier_aware: scoreOut.subfaixa_tier_aware,
      categoria_decisao_v5_1: categoria,
      patch_financeiro_status: patchStatus,
      patch_financeiro_dimensoes: {},
      bloqueios_v5_1_ativos: bloqueiosAtivos,
      cross_validation_16_fields: [],
      snapshot_id: snapshot.id,
      recomendacao_final: recomendacao,
      decisao_automatica: categoria === CATEGORIAS.AUTO,
      variaveis_positivas: scoreOut.variaveis_positivas,
      variaveis_negativas: scoreOut.variaveis_negativas,
      data_analise_fase_2: new Date().toISOString(),
      fase_2_completa: true,
    };
    if (existing.length > 0) {
      await base44.asServiceRole.entities.ComplianceScore.update(existing[0].id, scorePayload);
    } else {
      await base44.asServiceRole.entities.ComplianceScore.create(scorePayload);
    }

    const elapsed = Date.now() - t0;
    console.log(`[bdcEnrichCaseV5_1] ═══ Completed in ${elapsed}ms — snapshot=${snapshot.id} ═══`);

    return Response.json({
      success: true,
      caseId,
      framework_version: 'v5.1',
      tier, segmento, morfologia,
      capabilities_ativas: capabilitiesAtivas,
      score: scoreOut.score_final,
      score_max: scoreOut.score_max,
      subfaixa_tier_aware: scoreOut.subfaixa_tier_aware,
      categoria_decisao: categoria,
      status_legacy: statusLegacy,
      recomendacao_final: recomendacao,
      snapshot_id: snapshot.id,
      elapsed_ms: elapsed,
    });
  } catch (e) {
    console.error('[bdcEnrichCaseV5_1] ERROR:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
});