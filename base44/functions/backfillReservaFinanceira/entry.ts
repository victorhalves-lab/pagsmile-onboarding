/**
 * backfillReservaFinanceira — admin-only.
 *
 * Garante que TODAS as propostas (Proposal + PixProposal + StandardProposal)
 * tenham `rates.reservaFinanceira` com o disclaimer OFICIAL FIXO.
 *
 * Comportamento:
 *   • Se não existe → cria com default Pagsmile (PIX 1%/90d + Cartão 20%/180d).
 *   • Se existe mas disclaimer está divergente → sobrescreve o disclaimer
 *     mantendo percentuais e ativa/inativa configurados pelo vendedor.
 *   • Prazos são SEMPRE forçados para 90 (PIX) e 180 (Cartão).
 *
 * Payload opcional:
 *   { dryRun: true }  → não escreve, só conta quantas seriam afetadas.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OFFICIAL_DISCLAIMER =
  'A reserva financeira poderá ser liberada antecipadamente conforme a saudabilidade da operação.';

const DEFAULT_RESERVA = {
  pix: { percentual: 1, diasRetencao: 90, ativa: true },
  cartao: { percentual: 20, diasRetencao: 180, ativa: true },
  disclaimer: OFFICIAL_DISCLAIMER,
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** Decide se a proposta precisa de update (novo ou disclaimer/prazo divergente). */
function buildNormalized(existing) {
  if (!existing) return { reserva: { ...DEFAULT_RESERVA }, reason: 'missing' };

  const pix = existing.pix || {};
  const cartao = existing.cartao || {};
  const normalized = {
    pix: {
      percentual: pix.percentual ?? DEFAULT_RESERVA.pix.percentual,
      diasRetencao: 90,
      ativa: pix.ativa !== false,
    },
    cartao: {
      percentual: cartao.percentual ?? DEFAULT_RESERVA.cartao.percentual,
      diasRetencao: 180,
      ativa: cartao.ativa !== false,
    },
    disclaimer: OFFICIAL_DISCLAIMER,
  };

  // Detecta divergência: disclaimer diferente OU prazo diferente
  const disclaimerDivergent = existing.disclaimer !== OFFICIAL_DISCLAIMER;
  const prazoDivergent = pix.diasRetencao !== 90 || cartao.diasRetencao !== 180;

  if (disclaimerDivergent || prazoDivergent) {
    return { reserva: normalized, reason: disclaimerDivergent ? 'disclaimer' : 'prazo' };
  }
  return null; // sem mudanças necessárias
}

async function processEntity(base44, entityName, dryRun) {
  const all = await base44.asServiceRole.entities[entityName].list('-created_date', 5000);

  const todo = [];
  for (const p of all) {
    const diff = buildNormalized(p.rates?.reservaFinanceira);
    if (diff) todo.push({ p, diff });
  }

  if (dryRun) {
    const byReason = todo.reduce((acc, { diff }) => {
      acc[diff.reason] = (acc[diff.reason] || 0) + 1;
      return acc;
    }, {});
    return { entityName, total: all.length, needsBackfill: todo.length, byReason, updated: 0, errors: 0 };
  }

  let updated = 0, errors = 0;
  for (const { p, diff } of todo) {
    try {
      const nextRates = { ...(p.rates || {}), reservaFinanceira: diff.reserva };
      await base44.asServiceRole.entities[entityName].update(p.id, { rates: nextRates });
      updated++;
    } catch (e) {
      errors++;
      console.error(`[backfill ${entityName}] ${p.id}:`, e.message);
    }
    await sleep(120);
  }

  return { entityName, total: all.length, needsBackfill: todo.length, updated, errors };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    const results = [];
    for (const entityName of ['Proposal', 'PixProposal', 'StandardProposal']) {
      results.push(await processEntity(base44, entityName, dryRun));
    }

    const totals = results.reduce((acc, r) => ({
      total: acc.total + r.total,
      needsBackfill: acc.needsBackfill + r.needsBackfill,
      updated: acc.updated + r.updated,
      errors: acc.errors + r.errors,
    }), { total: 0, needsBackfill: 0, updated: 0, errors: 0 });

    return Response.json({
      success: true,
      dryRun,
      defaultApplied: dryRun ? null : DEFAULT_RESERVA,
      perEntity: results,
      totals,
    });
  } catch (error) {
    console.error('[backfillReservaFinanceira] erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});