// Endpoint público para o cliente interagir com uma GlobalProposal via token.
// Ações suportadas:
//   - load    : devolve a proposta + questionário vinculado (sem dados sensíveis internos)
//   - accept  : marca status=accepted (atualiza também GlobalQuestionnaire.pipeline_status)
//   - reject  : marca status=rejected
//   - counter : cria nova versão filha com counter_proposal_*; original vira counter_proposal
// Token: public_link_token da GlobalProposal.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, token, payload } = body || {};

    if (!token || typeof token !== 'string') {
      return Response.json({ error: 'Missing token' }, { status: 400 });
    }

    // Busca proposta por token (asServiceRole — endpoint público, sem auth de usuário)
    const list = await base44.asServiceRole.entities.GlobalProposal.filter({ public_link_token: token });
    const proposal = list[0];
    if (!proposal) {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Action: load — retorna proposta + questionário (para a página pública renderizar).
    if (action === 'load') {
      let questionnaire = null;
      if (proposal.questionnaire_id) {
        const q = await base44.asServiceRole.entities.GlobalQuestionnaire.filter({ id: proposal.questionnaire_id });
        questionnaire = q[0] || null;
      }
      return Response.json({ proposal, questionnaire });
    }

    // Action: accept
    if (action === 'accept') {
      if (proposal.status === 'accepted') {
        return Response.json({ proposal, alreadyAccepted: true });
      }
      const updated = await base44.asServiceRole.entities.GlobalProposal.update(proposal.id, { status: 'accepted' });
      if (proposal.questionnaire_id) {
        await base44.asServiceRole.entities.GlobalQuestionnaire.update(proposal.questionnaire_id, {
          pipeline_status: 'proposal_accepted',
        }).catch(() => {});
      }
      return Response.json({ proposal: updated });
    }

    // Action: reject
    if (action === 'reject') {
      const updated = await base44.asServiceRole.entities.GlobalProposal.update(proposal.id, { status: 'rejected' });
      if (proposal.questionnaire_id) {
        await base44.asServiceRole.entities.GlobalQuestionnaire.update(proposal.questionnaire_id, {
          pipeline_status: 'proposal_lost',
        }).catch(() => {});
      }
      return Response.json({ proposal: updated });
    }

    // Action: counter — cria nova versão filha com sugestão do cliente
    if (action === 'counter') {
      const { counter_rate, counter_fixed_fee, counter_settlement, counter_notes } = payload || {};
      // Atualiza a proposta atual para counter_proposal e guarda os valores sugeridos
      await base44.asServiceRole.entities.GlobalProposal.update(proposal.id, {
        status: 'counter_proposal',
        counter_proposal_rate: counter_rate != null ? Number(counter_rate) : undefined,
        counter_proposal_fixed_fee: counter_fixed_fee != null ? Number(counter_fixed_fee) : undefined,
        counter_proposal_settlement_days: counter_settlement || undefined,
        counter_proposal_notes: counter_notes || undefined,
      });
      if (proposal.questionnaire_id) {
        await base44.asServiceRole.entities.GlobalQuestionnaire.update(proposal.questionnaire_id, {
          pipeline_status: 'counter_proposal',
        }).catch(() => {});
      }
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[publicGlobalProposal] error', error);
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
});