// ─────────────────────────────────────────────────────────────────────
// bdcEnrichCaseV5_2 — Pipeline de scoring V5.2 (paralelo ao V4 e V5.1)
// ─────────────────────────────────────────────────────────────────────
// REGRAS SUPREMAS:
//   - NUNCA chamada para casos V4 ou V5.1. Router garante isso por framework_version.
//   - NUNCA chama bdcEnrichCase (V4) nem bdcEnrichCaseV5_1.
//   - NUNCA modifica campos V4. Só toca em campos *_v5_2/*_v5_1 + framework_version.
//   - Escalas corrigidas: T1/T2/Sub PJ/Sub PF = 0-850, T3 = 0-999.
//   - 15 segmentos canônicos (+5 vs V5.1: turismo, eventos, servicos_b2b, servicos_locais, crossborder).
//   - Capabilities canônicas: splits/subseller, crossborder, recurrence, cap_financial_capacity_validation.
//   - Cat 5 (Monitoramento Intensivo) proposta quando bloqueio mitigável + analista aprova.
// ─────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── tiers V5.2 ──
const TIERS = {
  TIER_1: 'tier_1', TIER_2: 'tier_2', TIER_3: 'tier_3',
  SUBSELLER_PJ: 'subseller_pj', SUBSELLER_PF: 'subseller_pf',
};

// Apenas gateway e crossborder escalam pra Tier 3 livremente por TPV
const SEGMENTOS_TIER_3_ONLY = ['gateway', 'crossborder'];

function resolverTier({ tpvMensalDeclarado, segmento, isSubseller, merchantType }) {
  if (isSubseller) return merchantType === 'PF' ? TIERS.SUBSELLER_PF : TIERS.SUBSELLER_PJ;
  if (segmento === 'marketplace') return TIERS.TIER_2; // fixed
  const tpv = Number(tpvMensalDeclarado) || 0;
  if (tpv <= 50_000) return TIERS.TIER_1;
  if (tpv <= 500_000) return TIERS.TIER_2;
  if (SEGMENTOS_TIER_3_ONLY.includes(segmento)) return TIERS.TIER_3;
  return TIERS.TIER_2; // cap em T2 para os demais
}

// ── segmentos críticos (escala mais conservadora) ──
const SEGMENTOS_CRITICOS = ['gateway', 'marketplace', 'dropshipping', 'crossborder'];
const isSegmentoCritico = (s) => SEGMENTOS_CRITICOS.includes(s);

// ── morfologias ──
const MORF = {
  PIX_ONLY: 'pix_only', PIX_HEAVY: 'pix_heavy', CARTAO_HEAVY: 'cartao_heavy',
  MULTI_MEI: 'multi_mei', B2C_NACIONAL: 'b2c_nacional', B2C_CROSSBORDER: 'b2c_crossborder',
  B2B_NACIONAL: 'b2b_nacional', B2B_CROSSBORDER: 'b2b_crossborder',
  SAAS_RECORRENTE: 'saas_recorrente', LINK_PAGAMENTO_AVULSO: 'link_pagamento_avulso',
  PADRAO: 'padrao',
};

function resolverMorfologia({ distribuicaoTpv = {}, segmento, modeloVenda, paisAtuacao }) {
  const pix = Number(distribuicaoTpv.pix) || 0;
  const cartao = Number(distribuicaoTpv.cartao) || 0;
  if (pix >= 95) return MORF.PIX_ONLY;
  if (pix >= 70) return MORF.PIX_HEAVY;
  if (cartao >= 70) return MORF.CARTAO_HEAVY;
  if (paisAtuacao && paisAtuacao !== 'BR') {
    return modeloVenda === 'b2b' ? MORF.B2B_CROSSBORDER : MORF.B2C_CROSSBORDER;
  }
  if (segmento === 'saas') return MORF.SAAS_RECORRENTE;
  if (segmento === 'link_pagamento') return MORF.LINK_PAGAMENTO_AVULSO;
  return modeloVenda === 'b2b' ? MORF.B2B_NACIONAL : MORF.B2C_NACIONAL;
}

// ── capabilities V5.2 canônicas ──
const CAPS = {
  SPLITS: 'splits/subseller',
  CB: 'crossborder',
  REC: 'recurrence',
  FIN: 'cap_financial_capacity_validation',
};

const OBRIGATORIA_POR_SEGMENTO = {
  marketplace: [CAPS.SPLITS],
  gateway: [CAPS.SPLITS, CAPS.FIN],
  saas: [CAPS.REC],
  crossborder: [CAPS.CB, CAPS.FIN],
  dropshipping: [CAPS.FIN, CAPS.CB],
  educacao: [CAPS.REC],
  turismo: [CAPS.FIN],
  eventos: [CAPS.FIN],
};

const SEG_FORCAM_PATCH = ['gateway', 'marketplace', 'dropshipping', 'crossborder'];

function resolverCapabilities({ tier, segmento, morfologia, isSubseller }) {
  const ativas = new Set(OBRIGATORIA_POR_SEGMENTO[segmento] || []);
  if (tier === TIERS.TIER_2 || tier === TIERS.TIER_3) ativas.add(CAPS.FIN);
  else if (tier === TIERS.TIER_1 && SEG_FORCAM_PATCH.includes(segmento)) ativas.add(CAPS.FIN);
  if (morfologia === MORF.B2C_CROSSBORDER || morfologia === MORF.B2B_CROSSBORDER) ativas.add(CAPS.CB);
  if (morfologia === MORF.SAAS_RECORRENTE) ativas.add(CAPS.REC);
  if (isSubseller) ativas.add(CAPS.SPLITS);
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

const categoriaToStatusLegacy = (c) => ({
  cat_1_auto_approve: 'Aprovado', cat_2_conditional: 'Aprovado',
  cat_3_manual_review: 'Manual', cat_4_block: 'Recusado',
  cat_5_intensive_monitoring: 'Aprovado',
}[c] || 'Manual');

const categoriaToRecomendacao = (c) => ({
  cat_1_auto_approve: 'Aprovado', cat_2_conditional: 'Aprovado com Condições',
  cat_3_manual_review: 'Revisão Manual', cat_4_block: 'Recusado',
  cat_5_intensive_monitoring: 'Aprovado com Condições',
}[c] || 'Revisão Manual');

// ── subfaixa tier-aware ──
const TIER_SUFFIX = { tier_1: 'T1', tier_2: 'T2', tier_3: 'T3', subseller_pj: 'SubPJ', subseller_pf: 'SubPF' };
const formatSubfaixaTA = (b, t) => b && TIER_SUFFIX[t] ? `${b}-${TIER_SUFFIX[t]}` : (b || '-');

// ─── SCORING V5.2 — ESCALAS CORRIGIDAS ───
// T1/T2/Sub = 850, T3 = 999
const SCORE_MAX_POR_TIER = {
  tier_1: 850, tier_2: 850, tier_3: 999,
  subseller_pj: 850, subseller_pf: 850,
};

// Tabela canônica V5.2 (DOC4 Bloco 3)
const BASE_ST = {
  tier_1: {
    ecommerce: 560, saas: 600, educacao: 580, mpe: 540, infoprodutos: 500,
    foodtech: 560, link_pagamento: 480, plataforma_vertical: 540,
    turismo: 520, eventos: 500, servicos_b2b: 560, servicos_locais: 540,
    gateway: 380, dropshipping: 380, marketplace: 420, crossborder: 360,
    pix_merchant: 560, pix_intermediario: 400,
  },
  tier_2: {
    ecommerce: 560, saas: 600, educacao: 580, mpe: 540, infoprodutos: 520,
    foodtech: 560, link_pagamento: 500, plataforma_vertical: 560,
    turismo: 530, eventos: 510, servicos_b2b: 570, servicos_locais: 550,
    gateway: 420, dropshipping: 420, marketplace: 460, crossborder: 380,
    pix_merchant: 560, pix_intermediario: 440,
  },
  tier_3: {
    saas: 110, ecommerce: 150, marketplace: 170, gateway: 180,
    eventos: 220, infoprodutos: 240, turismo: 250, dropshipping: 260,
    crossborder: 280, plataforma_vertical: 190, servicos_b2b: 200,
    educacao: 200, link_pagamento: 220, servicos_locais: 220, mpe: 200,
    pix_merchant: 200, pix_intermediario: 240,
  },
  subseller_pj: { _default: 600 },
  subseller_pf: { _default: 550 },
};

function calcularScoreV5_2(input) {
  const {
    tier, segmento, morfologia, capabilitiesAtivas = [],
    variaveisInput = {}, resultadosCapabilities = {},
    patchStatus = 'nao_aplicavel', bloqueiosAtivos = [],
  } = input;

  // C1
  const tabela = BASE_ST[tier] || {};
  const c1Valor = tabela[segmento] ?? tabela._default ?? 400;

  // C2
  let c2 = 0; const c2M = [];
  if (morfologia === MORF.PIX_ONLY) { c2 += 10; c2M.push('PIX exclusivo +10'); }
  if (morfologia === MORF.PIX_HEAVY) { c2 += 5; c2M.push('PIX heavy +5'); }
  if (morfologia === MORF.B2C_CROSSBORDER) { c2 -= 40; c2M.push('B2C crossborder -40'); }
  if (morfologia === MORF.B2B_CROSSBORDER) { c2 -= 25; c2M.push('B2B crossborder -25'); }
  if (morfologia === MORF.MULTI_MEI) { c2 -= 50; c2M.push('Multi-MEI -50'); }
  if (morfologia === MORF.SAAS_RECORRENTE) { c2 += 15; c2M.push('SaaS recorrente +15'); }
  if (morfologia === MORF.CARTAO_HEAVY && isSegmentoCritico(segmento)) {
    c2 -= 20; c2M.push('Cartão heavy + crítico -20');
  }

  // C3
  const VARS = [
    'v_cnpj_valido_e_ativo','v_qsa_coherence','v_capital_social_proporcional',
    'v_idade_empresa','v_endereco_coerente','v_atividade_cnae_coerente',
    'v_socios_sem_restricoes','v_socios_sem_pep_sancoes','v_socios_sem_processos_criticos',
    'v_score_credito_pj','v_score_credito_socios','v_dominio_proprio_ativo',
    'v_presenca_digital','v_reclamacoes_consumidor','v_historico_chargeback',
    'v_financial_coherence',
  ];
  let c3 = 0; const c3Apl = {}; const c3Pos = []; const c3Neg = [];
  for (const nome of VARS) {
    const v = variaveisInput[nome];
    if (v == null) continue;
    const valor = typeof v === 'object' ? Number(v.valor) || 0 : Number(v) || 0;
    if (valor === 0) continue;
    c3 += valor;
    c3Apl[nome] = { valor, descricao: (typeof v === 'object' ? v.descricao : '') || '' };
    if (valor > 0) c3Pos.push(`${nome}: +${valor}`); else c3Neg.push(`${nome}: ${valor}`);
  }

  // C4
  let c4 = 0; const c4M = [];
  for (const cap of capabilitiesAtivas) {
    const res = resultadosCapabilities[cap];
    if (!res) { c4 -= 10; c4M.push(`${cap} sem dados -10`); continue; }
    if (res.status === 'warning') { c4 -= 20; c4M.push(`${cap} warning -20`); }
    if (res.status === 'fail') { c4 -= 50; c4M.push(`${cap} fail -50`); }
  }

  // C5
  const C5_MAP = { verde: 20, amarelo: -10, laranja: -40, vermelho: -100, nao_aplicavel: 0 };
  const c5 = C5_MAP[patchStatus] ?? 0;

  const bruto = c1Valor + c2 + c3 + c4 + c5;
  const max = SCORE_MAX_POR_TIER[tier] || 850;
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
    framework_version: 'v5.2',
    score_final: final, score_max: max,
    score_normalizado: Math.round(norm * 10) / 10,
    camadas: {
      c1_segmento_tier: { valor: c1Valor, explicacao: `Base (${segmento}) × ${tier}` },
      c2_morfologia: { valor: c2, explicacao: c2M.join('; ') || 'padrão (0)' },
      c3_variaveis: { valor: c3, aplicadas: c3Apl, positivas: c3Pos, negativas: c3Neg },
      c4_capabilities: { valor: c4, explicacao: c4M.join('; ') || 'OK (0)' },
      c5_patch_financeiro: { valor: c5, explicacao: `Patch ${patchStatus}` },
    },
    subfaixa_base: subfaixaBase,
    subfaixa_tier_aware: formatSubfaixaTA(subfaixaBase, tier),
    categoria_decisao: categoria,
    variaveis_positivas: c3Pos, variaveis_negativas: c3Neg,
    patch_financeiro_status: patchStatus,
  };
}

// ── SHA-256 ──
async function sha256Hash(obj) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(obj)));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const t0 = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const caseId = body.onboardingCaseId;
    const dryRun = body.dryRun === true; // se true: calcula mas NÃO persiste
    if (!caseId) return Response.json({ error: 'onboardingCaseId obrigatório' }, { status: 400 });

    // ─── Load case ───
    const [oc] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
    if (!oc) return Response.json({ error: 'case_not_found' }, { status: 404 });

    // GUARD: só processa V5.2 (ou dryRun forçado em qualquer)
    const fv = oc.framework_version || 'v4.0';
    if (fv !== 'v5.2' && !dryRun) {
      return Response.json({ skipped: true, reason: 'not_v5_2', framework: fv });
    }

    console.log(`[bdcEnrichCaseV5_2] ═══ ${dryRun ? 'DRY-RUN' : 'LIVE'} V5.2 scoring for case ${caseId} ═══`);

    const [merchant] = await base44.asServiceRole.entities.Merchant.filter({ id: oc.merchantId });
    const responses = await base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId: caseId });

    // ─── Extract inputs ───
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
      if (t.includes('% cartão') || t.includes('% cartao')) distrib.cartao = num;
    }

    // Fallback segmento via template
    if (!segmento || segmento === 'ecommerce') {
      try {
        const [tpl] = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ id: oc.questionnaireTemplateId });
        if (tpl?.segmento_v5_1) segmento = tpl.segmento_v5_1;
      } catch {}
    }

    const isSubseller = !!oc.isSubsellerCase;
    const merchantType = merchant?.type || 'PJ';

    // ─── Resolve ───
    const tier = resolverTier({ tpvMensalDeclarado: tpvDeclarado, segmento, isSubseller, merchantType });
    const morfologia = resolverMorfologia({ distribuicaoTpv: distrib, segmento, modeloVenda, paisAtuacao });
    const capabilitiesAtivas = resolverCapabilities({ tier, segmento, morfologia, isSubseller });

    // MVP: variáveis/resultados vazios. Enrichment real virá na Entrega 3 (pipeline).
    const variaveisInput = {};
    const resultadosCapabilities = {};
    const patchStatus = 'nao_aplicavel';
    const bloqueiosAtivos = [];

    const scoreOut = calcularScoreV5_2({
      tier, segmento, morfologia, capabilitiesAtivas,
      variaveisInput, resultadosCapabilities, patchStatus, bloqueiosAtivos,
    });

    const categoria = scoreOut.categoria_decisao;
    const statusLegacy = categoriaToStatusLegacy(categoria);
    const recomendacao = categoriaToRecomendacao(categoria);

    console.log(`[bdcEnrichCaseV5_2] tier=${tier} seg=${segmento} score=${scoreOut.score_final}/${scoreOut.score_max} sub=${scoreOut.subfaixa_tier_aware} cat=${categoria}`);

    // ── DRY-RUN: retorna sem persistir ──
    if (dryRun) {
      return Response.json({
        success: true,
        dryRun: true,
        caseId,
        framework_version: 'v5.2',
        framework_atual_do_caso: fv,
        tier, segmento, morfologia,
        capabilities_ativas: capabilitiesAtivas,
        score: scoreOut.score_final, score_max: scoreOut.score_max,
        subfaixa_tier_aware: scoreOut.subfaixa_tier_aware,
        categoria_decisao: categoria,
        status_legacy: statusLegacy,
        recomendacao_final: recomendacao,
        camadas: scoreOut.camadas,
        elapsed_ms: Date.now() - t0,
      });
    }

    // ─── Snapshot imutável ───
    const snapshotInput = {
      questionario: responses.map((r) => ({ q: r.questionText, a: r.valueText })),
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
      framework_version: 'v5.2',
      tipo: 'initial_analysis',
      tier, segmento, morfologia, capabilities_ativas: capabilitiesAtivas,
      input_questionario: snapshotInput,
      input_datasets: {}, input_documentos: [],
      output_score_camadas: scoreOut.camadas,
      output_bloqueios_ativos: bloqueiosAtivos,
      output_categoria_decisao: categoria,
      output_subfaixa_tier_aware: scoreOut.subfaixa_tier_aware,
      output_patch_financeiro: { status: patchStatus },
      datasets_obtidos: [], datasets_faltantes: [],
      elapsed_ms: Date.now() - t0,
      hash_integridade: hash, imutavel: true,
    });

    // ─── Update OnboardingCase ───
    await base44.asServiceRole.entities.OnboardingCase.update(caseId, {
      tier,
      segmento_v5_1: segmento, // campo compartilhado V5.1/V5.2
      morfologia,
      capabilities_ativas: capabilitiesAtivas,
      risk_score_v5_1: scoreOut.score_final,
      subfaixa_tier_aware: scoreOut.subfaixa_tier_aware,
      patch_financeiro_status: patchStatus,
      categoria_decisao_v5_2: categoria,
      iaDecision: recomendacao,
      iaExplanation: `[V5.2] Categoria ${categoria} — Score ${scoreOut.score_final}/${scoreOut.score_max} — Subfaixa ${scoreOut.subfaixa_tier_aware}`,
      bigDataCorpCompleted: true,
      validationsCompleted: true,
      finalDecisionDate: new Date().toISOString(),
    });

    // ─── ComplianceScore (framework_version=v5.2) ───
    const existing = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: caseId });
    const scorePayload = {
      onboarding_case_id: caseId,
      framework_version: 'v5.2',
      versao_agente: 'sentinel-v5.2-mvp',
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
    console.log(`[bdcEnrichCaseV5_2] ═══ Completed in ${elapsed}ms — snapshot=${snapshot.id} ═══`);

    return Response.json({
      success: true,
      caseId,
      framework_version: 'v5.2',
      tier, segmento, morfologia,
      capabilities_ativas: capabilitiesAtivas,
      score: scoreOut.score_final, score_max: scoreOut.score_max,
      subfaixa_tier_aware: scoreOut.subfaixa_tier_aware,
      categoria_decisao: categoria,
      status_legacy: statusLegacy,
      recomendacao_final: recomendacao,
      snapshot_id: snapshot.id,
      elapsed_ms: elapsed,
    });
  } catch (e) {
    console.error('[bdcEnrichCaseV5_2] ERROR:', e);
    return Response.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
});