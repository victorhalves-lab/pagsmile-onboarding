import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC endpoint — update an OnboardingCase from the compliance public flow.
 *
 * Only allows a whitelisted set of "progress" fields to be updated, so a malicious
 * client cannot flip status to Aprovado or set scores.
 *
 * Required:  { caseId, updates }
 * Allowed updates keys: docCompleted, cafCompleted, submissionDate
 */
const ALLOWED_FIELDS = new Set(['docCompleted', 'cafCompleted', 'submissionDate']);

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    const body = await req.json().catch(() => ({}));
    const { caseId, updates } = body;
    if (!caseId || !updates || typeof updates !== 'object') {
      return Response.json({ error: 'caseId and updates required' }, { status: 400 });
    }

    // Whitelist keys
    const safeUpdates = {};
    for (const k of Object.keys(updates)) {
      if (ALLOWED_FIELDS.has(k)) safeUpdates[k] = updates[k];
    }
    if (Object.keys(safeUpdates).length === 0) {
      return Response.json({ error: 'No allowed fields in updates' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Verify case exists (service role)
    let cases = [];
    try { cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId }); } catch (_) {}
    if (cases.length === 0) {
      return Response.json({ error: 'Caso não encontrado' }, { status: 404 });
    }

    await base44.asServiceRole.entities.OnboardingCase.update(caseId, safeUpdates);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('publicComplianceCaseUpdate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});