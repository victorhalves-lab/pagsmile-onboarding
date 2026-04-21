import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * SCHEDULED job — mark as "expirada" all Proposal/StandardProposal/PixProposal
 * whose validUntil has passed, provided the status is still one of the
 * "open" pre-terminal states. Runs once per day.
 *
 * Not exposed to the public. No auth guard because it runs via scheduled
 * automation context (system-level), like bdcRetryWorker / cafHealthCheck.
 *
 * Fix for BUG-010: the existing `expireProposals` function requires
 * user.role === 'admin' and therefore can never be triggered by a scheduled
 * job. And the registered automation `emailProposalReminders` references a
 * function that doesn't exist. This supersedes both.
 */

const EXPIRABLE_STATUSES = new Set(['rascunho', 'enviada', 'visualizada']);

async function expireOne(base44, entityName) {
  const now = Date.now();
  // Pull only open-state proposals — keeps the scan small.
  // We cannot filter by validUntil server-side easily across three statuses,
  // so we fan out per status and check dates client-side.
  const expired = [];
  for (const status of EXPIRABLE_STATUSES) {
    let batch = [];
    try {
      batch = await base44.asServiceRole.entities[entityName].filter({ status });
    } catch (_) {
      batch = [];
    }
    for (const p of batch) {
      if (!p.validUntil) continue;
      const expiryMs = new Date(p.validUntil).getTime();
      if (!expiryMs || expiryMs >= now) continue;

      try {
        await base44.asServiceRole.entities[entityName].update(p.id, { status: 'expirada' });
        expired.push({ entity: entityName, id: p.id, codigo: p.codigo || '', clienteNome: p.clienteNome || '' });

        // Non-blocking activity log (only for Proposal — other entities don't always link to Lead)
        if (entityName === 'Proposal' && p.leadId) {
          try {
            await base44.asServiceRole.entities.LeadActivity.create({
              leadId: p.leadId,
              activityType: 'nota_adicionada',
              description: `Proposta ${p.codigo || p.id} expirou automaticamente (validade: ${new Date(p.validUntil).toLocaleDateString('pt-BR')})`,
              performedBy: 'sistema',
              activityDate: new Date().toISOString(),
            });
          } catch (_) {}
        }
      } catch (e) {
        console.error(`Failed to expire ${entityName}/${p.id}:`, e.message);
      }
    }
  }
  return expired;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const [proposals, standard, pix] = await Promise.all([
      expireOne(base44, 'Proposal'),
      expireOne(base44, 'StandardProposal'),
      expireOne(base44, 'PixProposal'),
    ]);

    const total = proposals.length + standard.length + pix.length;
    console.log(`Expired ${total} proposals (Proposal: ${proposals.length}, Standard: ${standard.length}, Pix: ${pix.length})`);

    return Response.json({
      ok: true,
      total,
      breakdown: {
        Proposal: proposals.length,
        StandardProposal: standard.length,
        PixProposal: pix.length,
      },
      expired: [...proposals, ...standard, ...pix],
    });
  } catch (error) {
    console.error('expireProposalsScheduled error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});