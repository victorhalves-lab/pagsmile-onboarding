/**
 * backfillReservaFinanceira — admin-only.
 *
 * Aplica o default Pagsmile (PIX 1%/90d + Cartão 20%/180d) em TODAS as propostas
 * que ainda não têm o campo `rates.reservaFinanceira` gravado.
 *
 * Cobre: Proposal, PixProposal, StandardProposal.
 *
 * Payload opcional:
 *   { dryRun: true }  → não escreve, só conta quantas seriam afetadas.
 *
 * NOTA: este é o "Modo B" solicitado pelo usuário (alterar o banco) —
 * propostas com o campo já preenchido NÃO são modificadas.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DEFAULT_RESERVA = {
  pix: { percentual: 1, diasRetencao: 90, ativa: true },
  cartao: { percentual: 20, diasRetencao: 180, ativa: true },
  disclaimer: 'A reserva financeira poderá ser liberada antecipadamente conforme a saudabilidade da operação.',
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function processEntity(base44, entityName, dryRun) {
  const all = await base44.asServiceRole.entities[entityName].list('-created_date', 5000);
  const needsBackfill = all.filter(p => !p.rates?.reservaFinanceira);

  if (dryRun) {
    return { entityName, total: all.length, needsBackfill: needsBackfill.length, updated: 0, errors: 0 };
  }

  // Sequencial com pequeno delay para evitar 429 (rate limit do Base44).
  let updated = 0, errors = 0;
  for (const p of needsBackfill) {
    try {
      const nextRates = { ...(p.rates || {}), reservaFinanceira: { ...DEFAULT_RESERVA } };
      await base44.asServiceRole.entities[entityName].update(p.id, { rates: nextRates });
      updated++;
    } catch (e) {
      errors++;
      console.error(`[backfill ${entityName}] ${p.id}:`, e.message);
    }
    await sleep(120); // ~8 ops/s — bem abaixo do rate limit
  }

  return { entityName, total: all.length, needsBackfill: needsBackfill.length, updated, errors };
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