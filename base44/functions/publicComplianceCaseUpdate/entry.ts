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
    const { caseId, updates, docLinkToken } = body;
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

    // Tolerante a requests anônimos: se o token do cliente estiver inválido/expirado,
    // criamos um cliente "limpo" (sem auth). As operações usam asServiceRole.
    let base44;
    try {
      base44 = createClientFromRequest(req);
    } catch (_) {
      const { createClient } = await import('npm:@base44/sdk@0.8.25');
      base44 = createClient({
        appId: Deno.env.get('BASE44_APP_ID'),
        requiresAuth: false,
      });
    }

    // Verify case exists (service role) and check the docLinkToken matches.
    // The token is generated server-side at publicComplianceSubmit and returned to the
    // client, so only the session that created the case can flip these flags.
    let cases = [];
    try { cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId }); } catch (_) {}
    if (cases.length === 0) {
      return Response.json({ error: 'Caso não encontrado' }, { status: 404 });
    }

    const theCase = cases[0];
    // Cases created AFTER this deploy will always have a docLinkToken. If the case has
    // a token, the caller MUST provide a matching one. Legacy cases without a token are
    // still accepted without auth to avoid breaking in-flight flows.
    if (theCase.docLinkToken) {
      if (!docLinkToken || docLinkToken !== theCase.docLinkToken) {
        return Response.json({ error: 'Invalid or missing docLinkToken' }, { status: 403 });
      }
    }

    await base44.asServiceRole.entities.OnboardingCase.update(caseId, safeUpdates);

    // Audit trail — non-blocking
    try {
      const headers = req.headers;
      const ip = headers.get('cf-connecting-ip') || (headers.get('x-forwarded-for') || '').split(',')[0].trim() || headers.get('x-real-ip') || null;
      base44.asServiceRole.entities.AccessTrail.create({
        eventType: 'compliance_case_update',
        onboardingCaseId: caseId,
        action: Object.keys(safeUpdates).join(','),
        ip,
        country: headers.get('cf-ipcountry') || null,
        region: headers.get('cf-region') || null,
        city: headers.get('cf-ipcity') || null,
        userAgent: (headers.get('user-agent') || '').slice(0, 500),
        referer: (headers.get('referer') || '').slice(0, 500),
        docLinkToken: (docLinkToken || '').slice(0, 6),
        metadata: { fieldsUpdated: safeUpdates },
        serverTimestamp: new Date().toISOString(),
      }).catch(() => {});
    } catch (_) { /* silent */ }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('publicComplianceCaseUpdate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});