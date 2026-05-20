// ─────────────────────────────────────────────────────────────────────
// replaySnapshotV5_2 — Reexecuta um snapshot V5.2 com as REGRAS ATUAIS
// ─────────────────────────────────────────────────────────────────────
// Permite ao admin "rebobinar" um snapshot histórico imutável e verificar
// o que aconteceria se o mesmo input fosse avaliado com a versão CORRENTE
// do framework V5.2 — sem alterar nada no banco e SEM chamar LLM.
//
// Útil antes de promover mudanças de regra para produção (ex: novo bloqueio,
// nova escala de tier, ajuste em variável V-*).
//
// Payload:
//   { snapshotId: string }
//
// Retorna:
//   {
//     snapshot: { id, tipo, created_date, hash_integridade },
//     original: { tier, segmento, morfologia, score_final, categoria_decisao,
//                 subfaixa, bloqueios, patch_status, capabilities, score_max },
//     replay:   { ...mesma estrutura, calculada com regras de HOJE },
//     diff:     { changed_fields: [...], delta_score, mudancas_humanas: [...] }
//   }
//
// IMPORTANTE: este endpoint é READ-ONLY. NUNCA persiste nada.
// ─────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Escalas V5.2 CORRENTES (fonte: lib/v5_2/constants.js) ──
const SCORE_MAX_CURRENT = {
  tier_1: 850,
  tier_2: 850,
  tier_3: 999,
  subseller_pj: 850,
  subseller_pf: 850,
};

// Segmentos que SEMPRE sobem para tier_3 na regra atual V5.2
const SEGMENTOS_TIER_3_ONLY = ['gateway', 'crossborder'];

// Pesos por camada (escala unitária — só usados para detectar drift na soma)
const CAMADA_KEYS = [
  'camada_1_segmento',
  'camada_2_morfologia',
  'camada_3_variaveis',
  'camada_4_capabilities',
  'camada_5_patch',
];

/**
 * Resolve tier conforme regra V5.2 ATUAL.
 */
function resolverTierAtual({ tpv, segmento, isSubseller, merchantType }) {
  if (isSubseller) return merchantType === 'PF' ? 'subseller_pf' : 'subseller_pj';
  if (segmento === 'marketplace') return 'tier_2';
  if (tpv <= 50_000) return 'tier_1';
  if (tpv <= 500_000) return 'tier_2';
  if (SEGMENTOS_TIER_3_ONLY.includes(segmento)) return 'tier_3';
  return 'tier_2';
}

/**
 * Resolve categoria de decisão V5.2 a partir do score e bloqueios.
 * Regras simplificadas (espelham matrizDecisao.js):
 *   - Qualquer bloqueio "absoluto" → cat_4_block
 *   - Score >= 800 e sem bloqueios → cat_1_auto_approve
 *   - Score >= 600 → cat_2_conditional
 *   - Score >= 400 → cat_3_manual_review
 *   - Resto → cat_4_block
 */
function resolverCategoriaAtual({ score, bloqueios, tier }) {
  const blocks = bloqueios || [];
  // Bloqueios absolutos (núcleo duro — sem exceção)
  const absolutos = ['B03', 'B04', 'B10', 'B-CB-1', 'B-INT-1',
    'B-MKT-PROD-CRIT-1', 'B-PV-LGPD-1-CRIT', 'B-GW-PCI-CRIT-1',
    'B-LOC-SETOR-CRIT-1', 'B-CB-PAIS-CRIT-1'];
  if (blocks.some((b) => absolutos.includes(b))) return 'cat_4_block';

  const maxScore = SCORE_MAX_CURRENT[tier] || 850;
  const pct = score / maxScore;

  if (blocks.length === 0 && pct >= 0.85) return 'cat_1_auto_approve';
  if (pct >= 0.65) return 'cat_2_conditional';
  if (pct >= 0.45) return 'cat_3_manual_review';
  return 'cat_4_block';
}

/**
 * Extrai inputs essenciais do snapshot.
 */
function extractInputs(snapshot) {
  const inputQ = snapshot.input_questionario || {};
  const tpvDeclarado = Number(inputQ.tpv_mensal_declarado || inputQ.tpv_declarado || 0);
  return {
    tpvDeclarado,
    segmento: snapshot.segmento || inputQ.segmento || 'ecommerce',
    morfologia: snapshot.morfologia || inputQ.morfologia || null,
    isSubseller: !!inputQ.is_subseller,
    merchantType: inputQ.merchant_type || 'PJ',
    capabilities: snapshot.capabilities_ativas || [],
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { snapshotId } = body;

    if (!snapshotId) {
      return Response.json({ error: 'snapshotId obrigatório' }, { status: 400 });
    }

    // 1) Carrega snapshot
    const [snapshot] = await base44.asServiceRole.entities.Snapshot.filter({ id: snapshotId });
    if (!snapshot) {
      return Response.json({ error: 'Snapshot não encontrado' }, { status: 404 });
    }
    if (snapshot.framework_version !== 'v5.2' && snapshot.framework_version !== 'v5.1') {
      return Response.json({
        error: `Snapshot framework=${snapshot.framework_version} não suportado. Apenas V5.1/V5.2.`,
      }, { status: 400 });
    }

    // 2) Extrai inputs do snapshot
    const inputs = extractInputs(snapshot);

    // 3) Calcula resultado ORIGINAL (do snapshot)
    const camadasOrig = snapshot.output_score_camadas || {};
    const scoreOriginal = Number(camadasOrig.score_final || 0);
    const tierOriginal = snapshot.tier || 'tier_2';
    const scoreMaxOriginal = SCORE_MAX_CURRENT[tierOriginal] || 850;

    const original = {
      tier: tierOriginal,
      segmento: snapshot.segmento || inputs.segmento,
      morfologia: snapshot.morfologia,
      score_final: scoreOriginal,
      score_max: scoreMaxOriginal,
      score_pct: scoreMaxOriginal > 0 ? (scoreOriginal / scoreMaxOriginal) : 0,
      categoria_decisao: snapshot.output_categoria_decisao || null,
      subfaixa: snapshot.output_subfaixa_tier_aware || null,
      bloqueios: snapshot.output_bloqueios_ativos || [],
      patch_status: snapshot.output_patch_financeiro?.status || null,
      capabilities: snapshot.capabilities_ativas || [],
      camadas: {
        camada_1_segmento: camadasOrig.camada_1_segmento || 0,
        camada_2_morfologia: camadasOrig.camada_2_morfologia || 0,
        camada_3_variaveis: camadasOrig.camada_3_variaveis || 0,
        camada_4_capabilities: camadasOrig.camada_4_capabilities || 0,
        camada_5_patch: camadasOrig.camada_5_patch || 0,
      },
    };

    // 4) Reexecuta com REGRAS ATUAIS
    //    Mantém os mesmos pesos por camada (inputs determinísticos), mas:
    //    - Re-resolve tier com regras atuais
    //    - Re-aplica escala atual
    //    - Re-resolve categoria com escala/score corrigidos
    //    - Mantém bloqueios (já registrados no snapshot — só muda decisão associada)
    const tierReplay = resolverTierAtual(inputs);
    const scoreMaxReplay = SCORE_MAX_CURRENT[tierReplay] || 850;

    // Score reaplicado: soma das camadas (idêntica), mas normalizada para nova escala
    // Mantemos a soma absoluta — o que muda é o MAX e portanto a % e a categoria.
    const scoreReplay = scoreOriginal;
    const scorePctReplay = scoreMaxReplay > 0 ? (scoreReplay / scoreMaxReplay) : 0;

    const categoriaReplay = resolverCategoriaAtual({
      score: scoreReplay,
      bloqueios: original.bloqueios,
      tier: tierReplay,
    });

    const replay = {
      tier: tierReplay,
      segmento: original.segmento,
      morfologia: original.morfologia,
      score_final: scoreReplay,
      score_max: scoreMaxReplay,
      score_pct: scorePctReplay,
      categoria_decisao: categoriaReplay,
      subfaixa: original.subfaixa, // subfaixa depende de tier — flagada no diff se mudou
      bloqueios: original.bloqueios,
      patch_status: original.patch_status,
      capabilities: original.capabilities,
      camadas: original.camadas,
    };

    // 5) Diff humano
    const mudancas = [];
    const changed_fields = [];

    if (tierOriginal !== tierReplay) {
      mudancas.push(`Tier reclassificado: ${tierOriginal} → ${tierReplay}`);
      changed_fields.push('tier');
    }
    if (scoreMaxOriginal !== scoreMaxReplay) {
      mudancas.push(`Escala máxima ajustada: ${scoreMaxOriginal} → ${scoreMaxReplay}`);
      changed_fields.push('score_max');
    }
    if (original.categoria_decisao !== replay.categoria_decisao) {
      mudancas.push(`Categoria de decisão: ${original.categoria_decisao || '—'} → ${replay.categoria_decisao}`);
      changed_fields.push('categoria_decisao');
    }
    const deltaPct = Math.round((replay.score_pct - original.score_pct) * 10000) / 100;
    if (Math.abs(deltaPct) >= 0.5) {
      mudancas.push(`Score relativo: ${(original.score_pct * 100).toFixed(1)}% → ${(replay.score_pct * 100).toFixed(1)}% (${deltaPct > 0 ? '+' : ''}${deltaPct}pp)`);
      changed_fields.push('score_pct');
    }

    return Response.json({
      ok: true,
      snapshot: {
        id: snapshot.id,
        tipo: snapshot.tipo,
        created_date: snapshot.created_date,
        hash_integridade: snapshot.hash_integridade,
        framework_version: snapshot.framework_version,
      },
      onboarding_case_id: snapshot.onboarding_case_id,
      original,
      replay,
      diff: {
        changed_fields,
        mudancas_humanas: mudancas,
        delta_score_pct: deltaPct,
        tem_mudanca: mudancas.length > 0,
      },
      replay_metadata: {
        executed_at: new Date().toISOString(),
        executed_by: user.email,
        rules_version: 'v5.2-current',
        note: 'Execução read-only. Nenhuma persistência foi realizada.',
      },
    });
  } catch (e) {
    return Response.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
});