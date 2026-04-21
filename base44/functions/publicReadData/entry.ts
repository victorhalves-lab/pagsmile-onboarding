import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC endpoint — read-only access to admin-locked entities needed by public flows.
 * Restricts what can be read and returns only safe fields.
 *
 * SECURITY (BUG-007 fix — LGPD / PII protection):
 * Lead reads by ID (`lead_by_id`, `lead_for_prefill`) require a proof-of-possession
 * token. Without this gate, anyone with a Lead ObjectId could dump PII (CPF/CNPJ,
 * email, phone, address, volumes, owners) — ObjectIds are not secrets.
 *
 * Accepted proofs:
 *   - `proposalToken`: tokenPublico of a Proposal/StandardProposal/PixProposal
 *                      whose leadId matches the requested leadId.
 *   - `linkCode`: onboardingLinkCode saved on the Lead itself.
 *
 * `lead_for_prefill_by_link` (linkCode is the key) is self-authenticating —
 * knowing the link code already proves possession of the onboarding link.
 *
 * `commercial_agent` returns only {id, full_name} — not sensitive.
 */

// Verify the caller holds a valid proof-of-possession for this Lead.
// Returns true if at least one valid proof is provided.
async function hasLeadProof(base44, lead, { proposalToken, linkCode }) {
  if (!lead) return false;

  // Proof 1 — linkCode matches the Lead's onboardingLinkCode
  if (linkCode && typeof linkCode === 'string' && lead.onboardingLinkCode === linkCode) {
    return true;
  }

  // Proof 2 — proposalToken belongs to a proposal linked to this lead
  if (proposalToken && typeof proposalToken === 'string' && proposalToken.length >= 16) {
    try {
      // Check Proposal
      const props = await base44.asServiceRole.entities.Proposal.filter({ tokenPublico: proposalToken });
      if (props.length > 0 && props[0].leadId === lead.id) return true;
    } catch (_) { /* ignore */ }

    try {
      // Check StandardProposal (tokenPublico). StandardProposalLead links via token, not leadId directly.
      const stdLeads = await base44.asServiceRole.entities.StandardProposalLead.filter({ standardProposalToken: proposalToken, leadId: lead.id });
      if (stdLeads.length > 0) return true;
    } catch (_) { /* ignore */ }

    try {
      // Check PixProposal
      const pix = await base44.asServiceRole.entities.PixProposal.filter({ tokenPublico: proposalToken });
      if (pix.length > 0 && pix[0].leadId === lead.id) return true;
    } catch (_) { /* ignore */ }
  }

  return false;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const { kind } = body;
    const base44 = createClientFromRequest(req);

    if (kind === 'lead_by_id') {
      const { leadId, proposalToken, linkCode } = body;
      if (!leadId) return Response.json({ error: 'leadId required' }, { status: 400 });
      if (!proposalToken && !linkCode) {
        return Response.json({ error: 'proposalToken or linkCode required' }, { status: 403 });
      }
      let leads = [];
      try { leads = await base44.asServiceRole.entities.Lead.filter({ id: leadId }); } catch (_) { leads = []; }
      if (leads.length === 0) return Response.json({ lead: null });
      const l = leads[0];

      const allowed = await hasLeadProof(base44, l, { proposalToken, linkCode });
      if (!allowed) {
        return Response.json({ error: 'Access denied: invalid proof-of-possession' }, { status: 403 });
      }

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
          // Require proof-of-possession when fetching by leadId (enumeration protection)
          if (!body.proposalToken && !body.linkCode) {
            return Response.json({ error: 'proposalToken or linkCode required' }, { status: 403 });
          }
          leads = await base44.asServiceRole.entities.Lead.filter({ id: body.leadId });
          // Validate proof against the fetched lead
          if (leads.length > 0) {
            const allowed = await hasLeadProof(base44, leads[0], {
              proposalToken: body.proposalToken,
              linkCode: body.linkCode,
            });
            if (!allowed) {
              return Response.json({ error: 'Access denied: invalid proof-of-possession' }, { status: 403 });
            }
          }
        } else {
          // lead_for_prefill_by_link — linkCode IS the proof (self-authenticating)
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