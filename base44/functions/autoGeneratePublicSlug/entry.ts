import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Entity automation — auto-generates unique publicSlug on CREATE for Proposal,
 * StandardProposal, PixProposal and Contract.
 *
 * Uniqueness guarantee: queries the entity by `publicSlug` and retries with a
 * fresh random suffix until a free slot is found (up to 8 attempts).
 *
 * Also FIXES cases where a slug was COPIED from another record (e.g. version
 * spread via spread operator) — when this happens, the create event fires with
 * `publicSlug` already set but pointing at a non-unique value. We detect it by
 * counting how many records share that slug and forcing a regeneration.
 *
 * Payload shape (from entity automation):
 *   - event: { type, entity_name, entity_id }
 *   - data: current entity data
 *   - old_data: previous data (update events only)
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

function buildSlug(companyName, suffixLen = 4) {
  const base = slugifyText(companyName);
  const suffix = randomSuffix(suffixLen);
  if (!base) return `proposta-${randomSuffix(8)}`;
  return `${base}-${suffix}`;
}

const NAME_FIELD = {
  Proposal: 'clienteNome',
  StandardProposal: 'clienteNome',
  PixProposal: 'clienteNome',
  Contract: 'clientName',
};

async function isSlugTaken(base44, entityName, slug, excludeId) {
  try {
    const hits = await base44.asServiceRole.entities[entityName].filter({ publicSlug: slug });
    if (!Array.isArray(hits) || hits.length === 0) return false;
    // Taken if any OTHER record has it
    return hits.some(r => r.id !== excludeId);
  } catch (_) {
    return false;
  }
}

async function generateUniqueSlug(base44, entityName, companyName, excludeId) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const suffixLen = attempt < 3 ? 4 : attempt < 6 ? 6 : 8;
    const candidate = buildSlug(companyName, suffixLen);
    const taken = await isSlugTaken(base44, entityName, candidate, excludeId);
    if (!taken) return candidate;
  }
  // Last resort: timestamp-based fallback
  return `${slugifyText(companyName) || 'proposta'}-${Date.now().toString(36)}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { event, data, payload_too_large } = body;
    if (!event?.entity_name || !event?.entity_id) {
      return Response.json({ ok: true, skipped: 'no event' });
    }

    let entity = data;
    if (payload_too_large || !entity) {
      entity = await base44.asServiceRole.entities[event.entity_name].get(event.entity_id);
    }
    if (!entity) return Response.json({ ok: true, skipped: 'not found' });

    const nameField = NAME_FIELD[event.entity_name];
    if (!nameField) return Response.json({ ok: true, skipped: 'unsupported entity' });

    // Case 1: no slug yet → generate a fresh unique one.
    // Case 2: slug already set but COLLIDES with another record (usually caused
    // by version spread operator copying the slug) → regenerate.
    if (entity.publicSlug) {
      const collides = await isSlugTaken(base44, event.entity_name, entity.publicSlug, entity.id);
      if (!collides) {
        return Response.json({ ok: true, skipped: 'already has unique slug' });
      }
      console.log(`⚠️ Slug collision detected for ${event.entity_name}/${entity.id}: "${entity.publicSlug}" — regenerating`);
    }

    const slug = await generateUniqueSlug(base44, event.entity_name, entity[nameField] || '', entity.id);
    await base44.asServiceRole.entities[event.entity_name].update(event.entity_id, { publicSlug: slug });
    return Response.json({ ok: true, slug });
  } catch (error) {
    console.error('autoGeneratePublicSlug error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});