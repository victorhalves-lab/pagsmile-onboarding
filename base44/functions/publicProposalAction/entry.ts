import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC endpoint — actions on a proposal from the public link.
 * The caller does NOT need to be authenticated, but MUST provide a valid tokenPublico.
 * We look up the proposal by token (server-side) and perform the action with service role.
 *
 * action: 'view' | 'accept' | 'reject' | 'counter'
 * type:   'proposal' | 'pix_proposal'
 */
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const { token, type, action, payload } = body;

    if (!token || !type || !action) {
      return Response.json({ error: 'Missing required params: token, type, action' }, { status: 400 });
    }
    if (!['proposal', 'pix_proposal'].includes(type)) {
      return Response.json({ error: 'Invalid type' }, { status: 400 });
    }
    if (!['view', 'accept', 'reject', 'counter'].includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const entityName = type === 'proposal' ? 'Proposal' : 'PixProposal';
    const actLabel   = type === 'proposal' ? 'Proposta'  : 'Proposta PIX';

    // 1. Lookup proposal by token (service role, never trust payload IDs)
    const results = await base44.asServiceRole.entities[entityName].filter({ tokenPublico: token });
    if (!results || results.length === 0) {
      return Response.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }
    const proposta = results[0];
    const now = new Date().toISOString();

    // 2. Build updates based on action
    let proposalUpdates = {};
    let leadStatus = null;
    let activityType = null;
    let activityDescription = '';

    switch (action) {
      case 'view':
        if (proposta.status !== 'enviada') {
          // idempotent — no-op if already viewed/accepted/etc.
          return Response.json({ ok: true, skipped: true });
        }
        proposalUpdates = { status: 'visualizada' };
        activityType = 'proposta_visualizada';
        activityDescription = `${actLabel} ${proposta.codigo || ''} visualizada pelo cliente`;
        break;

      case 'accept':
        // Idempotent: if already accepted, return ok without re-writing (prevents duplicate activities)
        if (proposta.status === 'aceita') {
          return Response.json({ ok: true, skipped: true, proposta });
        }
        // Do not allow accepting an already-rejected/countered/expired proposal
        if (['recusada', 'expirada', 'cancelada'].includes(proposta.status)) {
          return Response.json({ error: `Proposta já está ${proposta.status} e não pode ser aceita.` }, { status: 409 });
        }
        proposalUpdates = { status: 'aceita', acceptedDate: now };
        leadStatus = 'proposta_aceita';
        activityType = 'proposta_aceita';
        activityDescription = `${actLabel} ${proposta.codigo || ''} aceita pelo cliente`;
        break;

      case 'reject': {
        const motivo = payload?.motivo || 'Não informado';
        const detalhe = payload?.detalhe || '';
        proposalUpdates = {
          status: 'recusada',
          rejectedDate: now,
          rejectedReason: `${motivo}${detalhe ? `: ${detalhe}` : ''}`,
        };
        leadStatus = 'proposta_recusada';
        activityType = 'proposta_recusada';
        activityDescription = `${actLabel} ${proposta.codigo || ''} recusada: ${motivo}`;
        break;
      }

      case 'counter':
        proposalUpdates = {
          status: 'contraproposta',
          counterProposalDetails: payload?.details || {},
        };
        leadStatus = 'em_contato_comercial';
        activityType = 'proposta_contraproposta';
        activityDescription = `Contraproposta recebida para ${actLabel} ${proposta.codigo || ''}`;
        break;
    }

    // 3. Apply proposal update
    await base44.asServiceRole.entities[entityName].update(proposta.id, proposalUpdates);

    // 4. Update Lead (if linked)
    if (proposta.leadId && leadStatus) {
      try {
        await base44.asServiceRole.entities.Lead.update(proposta.leadId, {
          status: leadStatus,
          lastInteractionDate: now,
        });
      } catch (_) { /* lead may not exist, ignore */ }
    }

    // 5. Create LeadActivity
    if (activityType) {
      try {
        await base44.asServiceRole.entities.LeadActivity.create({
          leadId: proposta.leadId || '',
          activityType,
          description: activityDescription,
          performedBy: 'cliente',
          activityDate: now,
        });
      } catch (_) { /* non-blocking */ }
    }

    // 6. Return the updated proposal (so frontend can use its fields, e.g. leadId for compliance redirect)
    const updated = await base44.asServiceRole.entities[entityName].filter({ id: proposta.id });
    return Response.json({ ok: true, proposta: updated[0] || proposta });

  } catch (error) {
    console.error('publicProposalAction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});