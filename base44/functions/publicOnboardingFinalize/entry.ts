import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC — finalizes the /onboarding flow.
 *
 * Depending on mode, flips the right completion flags on OnboardingCase and
 * triggers the re-analysis pipeline (autoEnrichOnboarding) — non-blocking.
 *
 * For mode=full this ALSO creates QuestionnaireResponse rows from formData
 * (replacing any previously-submitted answers) so the compliance analyst sees
 * the final submitted state.
 *
 * Body: { caseId, token, mode, formData? }
 *
 *   mode=full      → doc + caf completed, upsert responses, mark submissionDate
 *   mode=docs_caf  → doc + caf completed, submissionDate
 *   mode=docs_only → doc completed, submissionDate
 *   mode=caf_only  → caf completed, submissionDate
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

async function upsertQuestionnaireResponses(base44, caseId, questions, formData) {
  if (!formData || typeof formData !== 'object') return { created: 0 };
  // Wipe previous responses for this case — we always write fresh on finalize.
  try {
    const prev = await base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId: caseId });
    for (const p of prev) {
      try { await base44.asServiceRole.entities.QuestionnaireResponse.delete(p.id); } catch (_) {}
    }
  } catch (_) {}

  const qById = new Map((questions || []).map(q => [q.id, q]));
  const rows = [];
  for (const [qid, value] of Object.entries(formData)) {
    const q = qById.get(qid);
    const row = {
      onboardingCaseId: caseId,
      questionId: qid,
      questionText: q?.text || '',
      questionType: q?.type || '',
    };
    if (Array.isArray(value)) row.valueArray = value.map(String);
    else if (typeof value === 'boolean') row.valueBoolean = value;
    else if (typeof value === 'number') row.valueNumber = value;
    else if (value !== null && value !== undefined) row.valueText = String(value);
    rows.push(row);
  }
  if (rows.length > 0) {
    try { await base44.asServiceRole.entities.QuestionnaireResponse.bulkCreate(rows); }
    catch (_) {
      // Fallback: row-by-row
      for (const r of rows) {
        try { await base44.asServiceRole.entities.QuestionnaireResponse.create(r); } catch (_) {}
      }
    }
  }
  return { created: rows.length };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return Response.json({ ok: false, reason: 'method_not_allowed' });
    const body = await req.json().catch(() => ({}));
    const { caseId, token, mode, formData } = body;

    if (!caseId || !token) return Response.json({ ok: false, reason: 'missing_params' });
    if (!SUPPORTED_MODES.has(mode)) return Response.json({ ok: false, reason: 'invalid_mode' });

    const base44 = await getClient(req);

    // Validate token
    let cases = [];
    try { cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId }); }
    catch (_) {}
    if (cases.length === 0) return Response.json({ ok: false, reason: 'case_not_found' });
    const theCase = cases[0];
    if (theCase.docLinkToken && theCase.docLinkToken !== token) {
      return Response.json({ ok: false, reason: 'token_mismatch' });
    }

    // Build updates based on mode
    const updates = { submissionDate: new Date().toISOString() };
    if (mode === 'full' || mode === 'docs_caf') {
      updates.docCompleted = true;
      updates.cafCompleted = true;
    } else if (mode === 'docs_only') {
      updates.docCompleted = true;
    } else if (mode === 'caf_only') {
      updates.cafCompleted = true;
    }

    // For mode=full, also persist questionnaire responses
    let responsesInfo = null;
    if (mode === 'full' && formData) {
      let questions = [];
      try { questions = await base44.asServiceRole.entities.Question.filter({ questionnaireTemplateId: theCase.questionnaireTemplateId }); }
      catch (_) {}
      responsesInfo = await upsertQuestionnaireResponses(base44, caseId, questions, formData);
    }

    await base44.asServiceRole.entities.OnboardingCase.update(caseId, updates);

    // Mark session as completed (best-effort)
    try {
      const sessions = await base44.asServiceRole.entities.ComplianceSession.filter({ sessionToken: sessionKey(caseId, mode) });
      if (sessions.length > 0) {
        await base44.asServiceRole.entities.ComplianceSession.update(sessions[0].id, { status: 'completed' });
      }
    } catch (_) {}

    // Trigger re-analysis pipeline (non-blocking)
    try {
      base44.asServiceRole.functions.invoke('autoEnrichOnboarding', { onboardingCaseId: caseId }).catch(() => {});
    } catch (_) {}

    return Response.json({
      ok: true,
      mode,
      caseId,
      updatesApplied: Object.keys(updates),
      responsesInfo,
    });
  } catch (error) {
    console.error('publicOnboardingFinalize error:', error);
    return Response.json({ ok: false, reason: 'server_error', message: error.message });
  }
});