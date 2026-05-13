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

// Defaults por segmento (regra de negócio v2026-05-13).
// Aceita tanto a chave técnica (businessSubCategory) quanto o label visual (segment).
const SEGMENT_DEFAULTS = {
  gateway:               { cartao: 20, pix: 5 },
  dropshipping:          { cartao: 20, pix: 5 },
  infoprodutos:          { cartao: 15, pix: 3 },
  marketplace:           { cartao: 10, pix: 2 },
  ecommerce:             { cartao: 10, pix: 1 },
  educacao:              { cartao: 5,  pix: 1 },
  saas:                  { cartao: 5,  pix: 1 },
  mpe:                   { cartao: 5,  pix: 1 },
  plataformas_verticais: { cartao: 5,  pix: 1 },
  link_pagamento:        { cartao: 5,  pix: 1 },
};

function reservaForSegment(seg) {
  if (!seg) return null;
  let key = String(seg).toLowerCase()
    .replace(/[-\s]/g, '_')
    .replace(/ç/g, 'c').replace(/ã/g, 'a').replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
    .replace(/^e_commerce$/, 'ecommerce');
  // Aliases legados (valores antigos do enum do Lead em UPPERCASE).
  if (key === 'merchan') key = 'gateway';   // categoria histórica → trata como Gateway
  if (key === 'general') key = null;        // sem mapeamento → fallback
  const cfg = key ? SEGMENT_DEFAULTS[key] : null;
  if (!cfg) return null;
  return {
    pix: { percentual: cfg.pix, diasRetencao: 90, ativa: true },
    cartao: { percentual: cfg.cartao, diasRetencao: 180, ativa: true },
    disclaimer: OFFICIAL_DISCLAIMER,
  };
}

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

// Cache para evitar refetch do mesmo Lead várias vezes.
async function resolveSegmentForProposal(base44, p, leadCache) {
  // 1) direto da proposta
  if (p.businessSubCategory) return p.businessSubCategory;
  // 2) via Lead vinculado (caso de PixProposal e algumas Proposals antigas)
  if (p.leadId) {
    if (leadCache.has(p.leadId)) return leadCache.get(p.leadId);
    try {
      const lead = await base44.asServiceRole.entities.Lead.get(p.leadId);
      const seg = lead?.businessSubCategory || null;
      leadCache.set(p.leadId, seg);
      return seg;
    } catch {
      leadCache.set(p.leadId, null);
      return null;
    }
  }
  return null;
}

async function processEntity(base44, entityName, dryRun, applySegmentDefaults = false) {
  const all = await base44.asServiceRole.entities[entityName].list('-created_date', 5000);

  const todo = [];
  const unresolved = []; // propostas sem segmento detectável (fallback)
  const leadCache = new Map();

  for (const p of all) {
    // Modo applySegmentDefaults: FORÇA reserva conforme segmento (regra v2026-05-13).
    // Aplica a Proposal, PixProposal e StandardProposal.
    if (applySegmentDefaults) {
      const seg = (entityName === 'StandardProposal')
        ? (p.businessSubCategory || p.segment)
        : await resolveSegmentForProposal(base44, p, leadCache);
      const segReserva = reservaForSegment(seg);
      if (segReserva) {
        const current = p.rates?.reservaFinanceira;
        const needsUpdate = !current
          || current.pix?.percentual !== segReserva.pix.percentual
          || current.cartao?.percentual !== segReserva.cartao.percentual
          || current.pix?.diasRetencao !== 90
          || current.cartao?.diasRetencao !== 180
          || current.disclaimer !== OFFICIAL_DISCLAIMER;
        if (needsUpdate) todo.push({ p, diff: { reserva: segReserva, reason: 'segment_default', segment: seg } });
        continue;
      }
      // Sem segmento: cai no comportamento padrão (DEFAULT_RESERVA 20%/1%).
      unresolved.push(p.id);
    }
    const diff = buildNormalized(p.rates?.reservaFinanceira);
    if (diff) todo.push({ p, diff });
  }

  if (dryRun) {
    const byReason = todo.reduce((acc, { diff }) => {
      acc[diff.reason] = (acc[diff.reason] || 0) + 1;
      return acc;
    }, {});
    const bySegment = todo.reduce((acc, { diff }) => {
      if (diff.segment) acc[diff.segment] = (acc[diff.segment] || 0) + 1;
      return acc;
    }, {});
    return {
      entityName,
      total: all.length,
      needsBackfill: todo.length,
      byReason,
      bySegment,
      unresolvedCount: unresolved.length,
      updated: 0,
      errors: 0,
    };
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
    // applySegmentDefaults: aplica percentuais POR SEGMENTO nas StandardProposals
    // (modelos padrão). Útil para forçar a regra v2026-05-13 nos templates existentes.
    const applySegmentDefaults = body.applySegmentDefaults === true;

    const results = [];
    for (const entityName of ['Proposal', 'PixProposal', 'StandardProposal']) {
      results.push(await processEntity(base44, entityName, dryRun, applySegmentDefaults));
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