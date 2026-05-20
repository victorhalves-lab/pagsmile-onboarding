// ─────────────────────────────────────────────────────────────────────
// scoreV5_2DryRun — Comparador V5.1 vs V5.2 sem persistir
// ─────────────────────────────────────────────────────────────────────
// Permite ao admin ver, lado-a-lado, o que mudaria entre V5.1 e V5.2
// para um conjunto de casos REAIS, sem alterar nada no banco.
//
// Payload:
//   { caseIds: [...] }          → calcula para casos específicos
//   { limit: 20, tier?, segmento? } → varredura amostral
//
// Retorna comparação tabular: case, tier_v5_1, tier_v5_2, score_v5_1,
// score_v5_2, score_max_v5_1, score_max_v5_2, cat_v5_1, cat_v5_2,
// mudancas[].
// ─────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── V5.1 (escalas antigas, INCORRETAS) ──
const SCORE_MAX_V5_1 = { tier_1: 499, tier_2: 849, tier_3: 849, subseller_pj: 999, subseller_pf: 999 };
// ── V5.2 (escalas CORRETAS) ──
const SCORE_MAX_V5_2 = { tier_1: 850, tier_2: 850, tier_3: 999, subseller_pj: 850, subseller_pf: 850 };

const SEGMENTOS_TIER_3_ONLY_V5_2 = ['gateway', 'crossborder'];

function resolverTierV5_1({ tpv, segmento, isSubseller, merchantType }) {
  if (isSubseller) return merchantType === 'PF' ? 'subseller_pf' : 'subseller_pj';
  if (segmento === 'marketplace') return 'tier_2';
  if (tpv <= 50_000) return 'tier_1';
  if (tpv <= 500_000) return 'tier_2';
  return 'tier_3'; // V5.1 deixava todos subir
}

function resolverTierV5_2({ tpv, segmento, isSubseller, merchantType }) {
  if (isSubseller) return merchantType === 'PF' ? 'subseller_pf' : 'subseller_pj';
  if (segmento === 'marketplace') return 'tier_2';
  if (tpv <= 50_000) return 'tier_1';
  if (tpv <= 500_000) return 'tier_2';
  if (SEGMENTOS_TIER_3_ONLY_V5_2.includes(segmento)) return 'tier_3';
  return 'tier_2';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    let cases = [];
    if (Array.isArray(body.caseIds) && body.caseIds.length > 0) {
      for (const id of body.caseIds) {
        const [c] = await base44.asServiceRole.entities.OnboardingCase.filter({ id });
        if (c) cases.push(c);
      }
    } else {
      const limit = Math.min(Number(body.limit) || 20, 100);
      const filter = {};
      if (body.tier) filter.tier = body.tier;
      if (body.segmento) filter.segmento_v5_1 = body.segmento;
      cases = await base44.asServiceRole.entities.OnboardingCase.filter(filter, '-created_date', limit);
    }

    const results = [];

    for (const oc of cases) {
      try {
        const [merchant] = await base44.asServiceRole.entities.Merchant.filter({ id: oc.merchantId });
        const responses = await base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId: oc.id });

        let tpvDeclarado = 0, segmento = oc.segmento_v5_1 || 'ecommerce';
        for (const r of responses) {
          const t = (r.questionText || '').toLowerCase();
          const v = r.valueText || '';
          const num = Number(String(v).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
          if (t.includes('tpv') && t.includes('mensal') && num > 0) tpvDeclarado = num;
        }

        const isSubseller = !!oc.isSubsellerCase;
        const merchantType = merchant?.type || 'PJ';

        const tierV5_1 = resolverTierV5_1({ tpv: tpvDeclarado, segmento, isSubseller, merchantType });
        const tierV5_2 = resolverTierV5_2({ tpv: tpvDeclarado, segmento, isSubseller, merchantType });

        const scoreMaxV5_1 = SCORE_MAX_V5_1[tierV5_1] || 849;
        const scoreMaxV5_2 = SCORE_MAX_V5_2[tierV5_2] || 850;

        const mudancas = [];
        if (tierV5_1 !== tierV5_2) {
          mudancas.push(`Tier: ${tierV5_1} → ${tierV5_2}`);
        }
        if (scoreMaxV5_1 !== scoreMaxV5_2) {
          mudancas.push(`Escala máx: ${scoreMaxV5_1} → ${scoreMaxV5_2}`);
        }

        results.push({
          caseId: oc.id,
          merchantName: merchant?.fullName || '(sem merchant)',
          cpfCnpj: merchant?.cpfCnpj || '',
          framework_version_atual: oc.framework_version || 'v4.0',
          segmento, tpvDeclarado,
          tier_v5_1: tierV5_1, tier_v5_2: tierV5_2,
          score_max_v5_1: scoreMaxV5_1, score_max_v5_2: scoreMaxV5_2,
          score_atual: oc.risk_score_v5_1 || oc.riskScoreV4 || 0,
          mudancas,
          tem_mudanca: mudancas.length > 0,
        });
      } catch (e) {
        results.push({ caseId: oc.id, error: e.message });
      }
    }

    const sumario = {
      total: results.length,
      com_mudanca: results.filter((r) => r.tem_mudanca).length,
      mudancas_tier: results.filter((r) => r.tier_v5_1 !== r.tier_v5_2).length,
      mudancas_escala: results.filter((r) => r.score_max_v5_1 !== r.score_max_v5_2).length,
    };

    return Response.json({ ok: true, sumario, results });
  } catch (e) {
    return Response.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
});