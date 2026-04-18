import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC endpoint — read-only access to admin-locked entities needed by public flows.
 * Restricts what can be read and returns only safe fields.
 *
 * Supported queries:
 *   - { kind: "lead_by_id", leadId } → returns minimal Lead info needed by PropostaPublica to resolve compliance model
 *   - { kind: "commercial_agent", userId } → returns {id, full_name} of a commercial agent
 */
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const { kind } = body;
    const base44 = createClientFromRequest(req);

    if (kind === 'lead_by_id') {
      const { leadId } = body;
      if (!leadId) return Response.json({ error: 'leadId required' }, { status: 400 });
      let leads = [];
      try { leads = await base44.asServiceRole.entities.Lead.filter({ id: leadId }); } catch (_) { leads = []; }
      if (leads.length === 0) return Response.json({ lead: null });
      const l = leads[0];
      // Return ONLY fields that the public page needs (no PII dump)
      return Response.json({
        lead: {
          id: l.id,
          businessSubCategory: l.businessSubCategory,
          questionnaireData: l.questionnaireData || null,
        },
      });
    }

    // ── Lead for prefill (compliance flow) — returns fields needed by useLeadPrefill ──
    if (kind === 'lead_for_prefill' || kind === 'lead_for_prefill_by_link') {
      let leads = [];
      try {
        if (kind === 'lead_for_prefill') {
          if (!body.leadId) return Response.json({ error: 'leadId required' }, { status: 400 });
          leads = await base44.asServiceRole.entities.Lead.filter({ id: body.leadId });
        } else {
          if (!body.linkCode) return Response.json({ error: 'linkCode required' }, { status: 400 });
          leads = await base44.asServiceRole.entities.Lead.filter({ onboardingLinkCode: body.linkCode }, '-created_date', 1);
        }
      } catch (_) { leads = []; }
      if (leads.length === 0) return Response.json({ lead: null });
      const l = leads[0];
      // Limited PII exposure: only fields needed for pre-fill
      return Response.json({
        lead: {
          id: l.id,
          cpfCnpj: l.cpfCnpj,
          fullName: l.fullName,
          companyName: l.companyName,
          email: l.email,
          phone: l.phone,
          website: l.website,
          mcc: l.mcc,
          contactName: l.contactName,
          contactRole: l.contactRole,
          tpvMensal: l.tpvMensal,
          ticketMedio: l.ticketMedio,
          transacoesMes: l.transacoesMes,
          expectativaCrescimento: l.expectativaCrescimento,
          businessSubCategory: l.businessSubCategory,
          leadQuestionnaireTemplateId: l.leadQuestionnaireTemplateId,
          questionnaireData: l.questionnaireData || null,
          commercialAgentId: l.commercialAgentId,
          commercialAgentName: l.commercialAgentName,
          onboardingCaseId: l.onboardingCaseId,
        },
      });
    }

    if (kind === 'commercial_agent') {
      const { userId } = body;
      if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });
      let users = [];
      try { users = await base44.asServiceRole.entities.User.filter({ id: userId }); } catch (_) { users = []; }
      if (users.length === 0) return Response.json({ user: null });
      const u = users[0];
      return Response.json({
        user: {
          id: u.id,
          full_name: u.full_name,
        },
      });
    }

    return Response.json({ error: 'Unknown kind' }, { status: 400 });
  } catch (error) {
    console.error('publicReadData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});