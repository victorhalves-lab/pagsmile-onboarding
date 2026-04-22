import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC — single round-trip that boots the new unified /onboarding page.
 *
 * Given (case, token, mode), validates the token against case.docLinkToken and
 * returns EVERYTHING the UI needs in ONE call:
 *   - sanitized case (only progress-relevant fields)
 *   - merchant (public-safe fields only)
 *   - template (with requiredDocuments[])
 *   - questions (ordered)
 *   - persisted session (documentsData, formData) — for auto-resume
 *
 * Supported modes: full | docs_caf | docs_only | caf_only
 * - mode=full rehydrates questionnaire too. Others skip the questionnaire entirely.
 *
 * All failures return { ok: false, reason } with 200 — the UI handles
 * everything gracefully and NEVER escalates to ErrorBoundary.
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
    const { caseId, token, mode } = body;

    if (!caseId || !token) return Response.json({ ok: false, reason: 'missing_params' });
    if (!SUPPORTED_MODES.has(mode)) return Response.json({ ok: false, reason: 'invalid_mode' });

    const base44 = await getClient(req);

    // 1) Load + validate case
    let cases = [];
    try { cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId }); }
    catch (_) {}
    if (cases.length === 0) return Response.json({ ok: false, reason: 'case_not_found' });

    const theCase = cases[0];
    if (theCase.docLinkToken && theCase.docLinkToken !== token) {
      return Response.json({ ok: false, reason: 'token_mismatch' });
    }
    // Legacy cases without docLinkToken: allow (backwards compat with pre-refactor links).

    // 2) Load template + questions + merchant in parallel
    const [templatesR, questionsR, merchantsR] = await Promise.all([
      base44.asServiceRole.entities.QuestionnaireTemplate.filter({ id: theCase.questionnaireTemplateId }).catch(() => []),
      base44.asServiceRole.entities.Question.filter({ questionnaireTemplateId: theCase.questionnaireTemplateId }, 'order').catch(() => []),
      base44.asServiceRole.entities.Merchant.filter({ id: theCase.merchantId }).catch(() => []),
    ]);
    const template = templatesR[0] || null;
    const merchant = merchantsR[0] || null;

    if (!template) return Response.json({ ok: false, reason: 'template_not_found' });

    // 3) Load persisted session (if any) for auto-resume
    let session = null;
    try {
      const found = await base44.asServiceRole.entities.ComplianceSession.filter({
        sessionToken: sessionKey(caseId, mode),
      });
      if (found.length > 0) {
        const s = found[0];
        session = {
          currentPhase: s.currentPhase,
          currentStep: s.currentStep,
          formData: s.formData || {},
          documentsData: s.documentsData || {},
          lastAccessDate: s.lastAccessDate,
        };
      }
    } catch (_) {}

    // 4) Load already-uploaded documents from DocumentUpload entity (source of truth).
    // This makes resume rock-solid even if the client's localStorage is wiped or the
    // ComplianceSession wasn't created (older flows).
    let uploadedDocs = [];
    try {
      const docs = await base44.asServiceRole.entities.DocumentUpload.filter({ onboardingCaseId: caseId });
      uploadedDocs = docs.map(d => ({
        documentUploadId: d.id,
        documentTypeId: d.documentTypeId,
        documentName: d.documentName,
        fileName: d.fileName,
        fileSize: d.fileSize,
        fileType: d.fileType,
        uploadDate: d.uploadDate,
        notAvailable: !!d.notAvailable,
        notAvailableReason: d.notAvailableReason || '',
        validationStatus: d.validationStatus,
      }));
    } catch (_) {}

    return Response.json({
      ok: true,
      mode,
      case: {
        id: theCase.id,
        merchantId: theCase.merchantId,
        questionnaireTemplateId: theCase.questionnaireTemplateId,
        status: theCase.status,
        docCompleted: !!theCase.docCompleted,
        cafCompleted: !!theCase.cafCompleted,
        docLinkToken: theCase.docLinkToken || null,
      },
      merchant: merchant ? {
        id: merchant.id,
        type: merchant.type,
        fullName: merchant.fullName,
        companyName: merchant.companyName,
        cpfCnpj: merchant.cpfCnpj,
        email: merchant.email,
      } : null,
      template: {
        id: template.id,
        name: template.name,
        model: template.model,
        merchantType: template.merchantType,
        requiredDocuments: template.requiredDocuments || [],
      },
      questions: questionsR,
      session,
      uploadedDocs,
    });
  } catch (error) {
    console.error('publicOnboardingBootstrap error:', error);
    return Response.json({ ok: false, reason: 'server_error', message: error.message });
  }
});