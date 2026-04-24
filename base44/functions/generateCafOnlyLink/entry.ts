import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * generateCafOnlyLink — admin-only endpoint to generate a public link
 * that allows a merchant to complete ONLY the CAF identity verification
 * (RG/CNH front+back + selfie + liveness + facematch) for an existing OnboardingCase.
 *
 * Use case: the client already filled the compliance questionnaire and uploaded
 * business documents, but got stuck / gave up / failed at the CAF SDK step.
 * We send them a dedicated link to redo ONLY that final piece.
 *
 * Flow:
 *   1. Authenticate admin.
 *   2. Validate case exists and has a linked template.
 *   3. Generate or reuse docLinkToken (same token shared with ComplianceDocOnly).
 *   4. Return the full URL with mode=caf_only.
 *
 * Unlike generateDocOnlyLink, we do NOT block when cafCompleted=true — we allow
 * regeneration so the client can redo CAF if the analyst needs a new capture.
 * The frontend warns the admin if CAF was already completed.
 */

function generateToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { caseId, baseUrl } = body;
    if (!caseId) {
      return Response.json({ error: 'caseId is required' }, { status: 400 });
    }

    const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
    if (cases.length === 0) {
      return Response.json({ error: 'Caso não encontrado' }, { status: 404 });
    }
    const onboardingCase = cases[0];

    if (!onboardingCase.questionnaireTemplateId) {
      return Response.json({
        error: 'Caso não tem template de questionário vinculado.',
        code: 'NO_TEMPLATE',
      }, { status: 400 });
    }

    const templates = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({
      id: onboardingCase.questionnaireTemplateId,
    });
    if (templates.length === 0) {
      return Response.json({
        error: 'Template do caso não encontrado.',
        code: 'TEMPLATE_NOT_FOUND',
      }, { status: 404 });
    }
    const template = templates[0];

    // Generate or reuse docLinkToken (shared with ComplianceDocOnly)
    let docLinkToken = onboardingCase.docLinkToken;
    if (!docLinkToken) {
      docLinkToken = generateToken();
      await base44.asServiceRole.entities.OnboardingCase.update(caseId, { docLinkToken });
    }

    const origin = (baseUrl || '').replace(/\/+$/, '') || 'https://app.base44.com';
    // V2 URL — unified /PublicOnboarding route. MUST match a key in pages.config.js
    // so the Base44 platform gateway recognizes it as a public page (otherwise
    // the gateway returns 401 on the HTML itself before our code even runs).
    const url = `${origin}/PublicOnboarding?case=${encodeURIComponent(caseId)}&token=${encodeURIComponent(docLinkToken)}&mode=caf_only`;

    return Response.json({
      success: true,
      url,
      token: docLinkToken,
      templateName: template.name,
      templateModel: template.model || null,
      alreadyCompleted: onboardingCase.cafCompleted === true,
    });
  } catch (error) {
    console.error('[generateCafOnlyLink] Error:', error);
    return Response.json({ error: error.message || 'Erro desconhecido' }, { status: 500 });
  }
});