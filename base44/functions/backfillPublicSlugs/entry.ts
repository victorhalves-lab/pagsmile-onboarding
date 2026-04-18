import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Backfill publicSlug on all existing Proposals, StandardProposals, PixProposals, and Contracts.
 * Also runs on newly-created records that are missing a slug.
 *
 * Admin-only. Safe to re-run (idempotent) — only fills records without publicSlug.
 */

function slugifyText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56);
}

function randomSuffix(len = 4) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

function generateSlug(companyName) {
  const base = slugifyText(companyName);
  const suffix = randomSuffix(4);
  if (!base) return `proposta-${randomSuffix(8)}`;
  return `${base}-${suffix}`;
}

async function backfillEntity(base44, entityName, nameField) {
  const all = await base44.asServiceRole.entities[entityName].list('-created_date', 10000);
  let updated = 0;
  let skipped = 0;
  for (const item of all) {
    if (item.publicSlug) { skipped++; continue; }
    const slug = generateSlug(item[nameField] || '');
    try {
      await base44.asServiceRole.entities[entityName].update(item.id, { publicSlug: slug });
      updated++;
    } catch (e) {
      console.error(`[backfill] ${entityName} ${item.id} failed:`, e.message);
    }
  }
  return { entity: entityName, total: all.length, updated, skipped };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const results = [];
    results.push(await backfillEntity(base44, 'Proposal', 'clienteNome'));
    results.push(await backfillEntity(base44, 'StandardProposal', 'clienteNome'));
    results.push(await backfillEntity(base44, 'PixProposal', 'clienteNome'));
    results.push(await backfillEntity(base44, 'Contract', 'clientName'));

    return Response.json({ success: true, results });
  } catch (error) {
    console.error('backfillPublicSlugs error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});