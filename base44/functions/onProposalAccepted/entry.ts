import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Entity automation: dispara quando uma Proposal ou PixProposal é atualizada para status='aceita'.
 *
 * REGRA DE NEGÓCIO (definida pelo Victor em 2026-05-10):
 *   Cliente NÃO assina contrato. Proposta aceita = NEGÓCIO FECHADO.
 *
 * Ação: atualiza Lead.status para 'proposta_aceita' assim que a proposta vai para 'aceita',
 * para que o pipeline reflita o fechamento sem depender de mover manualmente.
 *
 * Idempotente: se Lead já está em 'proposta_aceita', 'kyc_*' ou 'ativado', não rebaixa.
 */

const TERMINAL_FORWARD_STATUSES = new Set([
  'proposta_aceita',
  'kyc_iniciado',
  'kyc_aprovado',
  'kyc_revisao_manual',
  'ativado',
]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { event, data, old_data } = body || {};

    if (!event || event.type !== 'update') {
      return Response.json({ ok: true, skipped: 'not_update' });
    }
    if (!data || data.status !== 'aceita') {
      return Response.json({ ok: true, skipped: 'not_aceita' });
    }
    if (old_data && old_data.status === 'aceita') {
      return Response.json({ ok: true, skipped: 'already_aceita' });
    }

    const leadId = data.leadId;
    if (!leadId) {
      return Response.json({ ok: true, skipped: 'no_leadId' });
    }

    let lead;
    try {
      lead = await base44.asServiceRole.entities.Lead.get(leadId);
    } catch (_) {
      return Response.json({ ok: true, skipped: 'lead_not_found' });
    }
    if (!lead) return Response.json({ ok: true, skipped: 'lead_not_found' });

    if (TERMINAL_FORWARD_STATUSES.has(lead.status)) {
      return Response.json({ ok: true, skipped: 'lead_already_forward', currentStatus: lead.status });
    }

    await base44.asServiceRole.entities.Lead.update(leadId, {
      status: 'proposta_aceita',
      lastInteractionDate: new Date().toISOString(),
    });

    try {
      await base44.asServiceRole.entities.LeadActivity.create({
        leadId,
        activityType: 'proposta_aceita_auto',
        description: `Proposta ${data.codigo || data.id} aceita pelo cliente — Lead movido para 'proposta_aceita' (negócio fechado).`,
        performedBy: 'system_automation',
        activityDate: new Date().toISOString(),
      });
    } catch (_) {}

    return Response.json({ ok: true, leadId, oldStatus: lead.status, newStatus: 'proposta_aceita' });
  } catch (error) {
    console.error('onProposalAccepted error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});