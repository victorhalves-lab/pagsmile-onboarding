import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC — unified autosave for the /onboarding flow.
 *
 * Persists partial state (formData, documentsData, currentStep) into a
 * ComplianceSession keyed by (caseId, mode). Validates caseId + token
 * against OnboardingCase.docLinkToken — same security model as every
 * other public compliance endpoint.
 *
 * Body: { caseId, token, mode, currentStep, formData, documentsData, currentPhase }
 *
 * All non-critical fields are optional — any call with just caseId+token+mode
 * still bumps lastAccessDate (useful for "last seen" indicators).
 */

const SUPPORTED_MODES = new Set(['full', 'docs_caf', 'docs_only', 'caf_only']);

async function getClient(req) {
  try { return createClientFromRequest(req); }
  catch (_) {
    const { createClient } = await import('npm:@base44/sdk@0.8.25');
    return createClient({ appId: Deno.env.get('BASE44_APP_ID'), requiresAuth: false });
  }
}

function sessionKey(caseId, mode) {
  return `onboarding_v2_${caseId}_${mode}`;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return Response.json({ ok: false, reason: 'method_not_allowed' });
    const body = await req.json().catch(() => ({}));
    const { caseId, token, mode, currentStep, currentPhase, formData, documentsData } = body;

    if (!caseId || !token) return Response.json({ ok: false, reason: 'missing_params' });
    if (!SUPPORTED_MODES.has(mode)) return Response.json({ ok: false, reason: 'invalid_mode' });

    const base44 = await getClient(req);

    // Validate token
    let cases = [];
    try { cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId }); }
    catch (_) {}
    if (cases.length === 0) return Response.json({ ok: false, reason: 'case_not_found' });
    if (cases[0].docLinkToken && cases[0].docLinkToken !== token) {
      return Response.json({ ok: false, reason: 'token_mismatch' });
    }

    const sessionToken = sessionKey(caseId, mode);

    // Upsert session
    let existing = [];
    try { existing = await base44.asServiceRole.entities.ComplianceSession.filter({ sessionToken }); }
    catch (_) {}

    if (existing.length > 0) {
      const updates = { lastAccessDate: new Date().toISOString() };
      if (currentPhase !== undefined) updates.currentPhase = currentPhase;
      if (currentStep !== undefined) updates.currentStep = currentStep;
      if (formData !== undefined) updates.formData = formData;
      if (documentsData !== undefined) updates.documentsData = documentsData;
      await base44.asServiceRole.entities.ComplianceSession.update(existing[0].id, updates);
      return Response.json({ ok: true, isNew: false });
    }

    await base44.asServiceRole.entities.ComplianceSession.create({
      sessionToken,
      flowType: `onboarding_v2_${mode}`,
      templateModel: cases[0].questionnaireTemplateId || '',
      currentPhase: currentPhase || (mode === 'full' ? 'questionnaire' : 'documents'),
      currentStep: currentStep || 1,
      formData: formData || {},
      documentsData: documentsData || {},
      lastAccessDate: new Date().toISOString(),
      status: 'active',
    });
    return Response.json({ ok: true, isNew: true });
  } catch (error) {
    console.error('publicOnboardingSave error:', error);
    return Response.json({ ok: false, reason: 'server_error', message: error.message });
  }
});