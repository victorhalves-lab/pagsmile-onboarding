import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Entity automation — auto-generates publicSlug on CREATE for Proposal,
 * StandardProposal, PixProposal and Contract. Idempotent: if slug is already
 * present, does nothing.
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

function generateSlug(companyName) {
  const base = slugifyText(companyName);
  const suffix = randomSuffix(4);
  if (!base) return `proposta-${randomSuffix(8)}`;
  return `${base}-${suffix}`;
}

const NAME_FIELD = {
  Proposal: 'clienteNome',
  StandardProposal: 'clienteNome',
  PixProposal: 'clienteNome',
  Contract: 'clientName',
};

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
    if (entity.publicSlug) return Response.json({ ok: true, skipped: 'already has slug' });

    const nameField = NAME_FIELD[event.entity_name];
    const slug = generateSlug(entity[nameField] || '');
    await base44.asServiceRole.entities[event.entity_name].update(event.entity_id, { publicSlug: slug });
    return Response.json({ ok: true, slug });
  } catch (error) {
    console.error('autoGeneratePublicSlug error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});