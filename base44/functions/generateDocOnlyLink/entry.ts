import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * generateDocOnlyLink — admin-only endpoint to generate a public link
 * that allows a merchant to upload ONLY documents (no CAF identity SDK)
 * for an existing OnboardingCase.
 *
 * Flow:
 *   1. Authenticate admin.
 *   2. Validate case has a linked template with requiredDocuments.
 *   3. Block if case is already finished (docCompleted=true) — prevents overwriting.
 *   4. Generate or reuse docLinkToken (same token used by ComplianceDocOnly).
 *   5. Return the full URL with mode=docs_only.
 */

function generateToken() {
  // 32-char hex token (crypto-safe in Deno)
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

    // Load case
    const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
    if (cases.length === 0) {
      return Response.json({ error: 'Caso não encontrado' }, { status: 404 });
    }
    const onboardingCase = cases[0];

    // Block if already completed — prevents overwriting finished work
    if (onboardingCase.docCompleted === true) {
      return Response.json({
        error: 'Este caso já teve os documentos concluídos. Para re-enviar, peça a um admin para resetar docCompleted primeiro.',
        code: 'DOC_ALREADY_COMPLETED',
      }, { status: 409 });
    }

    // Validate template is linked
    if (!onboardingCase.questionnaireTemplateId) {
      return Response.json({
        error: 'Caso não tem template de questionário vinculado.',
        code: 'NO_TEMPLATE',
      }, { status: 400 });
    }

    // Load template and verify it has requiredDocuments
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
    const requiredDocs = Array.isArray(template.requiredDocuments) ? template.requiredDocuments : [];
    if (requiredDocs.length === 0) {
      return Response.json({
        error: 'O template vinculado a este caso não tem documentos requeridos cadastrados.',
        code: 'TEMPLATE_HAS_NO_DOCS',
      }, { status: 400 });
    }

    // Generate or reuse docLinkToken
    let docLinkToken = onboardingCase.docLinkToken;
    if (!docLinkToken) {
      docLinkToken = generateToken();
      await base44.asServiceRole.entities.OnboardingCase.update(caseId, { docLinkToken });
    }

    // Build URL. baseUrl is the app's origin (passed from frontend for environment-awareness).
    const origin = (baseUrl || '').replace(/\/+$/, '') || 'https://app.base44.com';
    // V2 URL — unified /onboarding route. Legacy /ComplianceDocOnly still redirects here.
    const url = `${origin}/onboarding?case=${encodeURIComponent(caseId)}&token=${encodeURIComponent(docLinkToken)}&mode=docs_only`;

    return Response.json({
      success: true,
      url,
      token: docLinkToken,
      requiredDocsCount: requiredDocs.length,
      templateName: template.name,
      templateModel: template.model || null,
    });
  } catch (error) {
    console.error('[generateDocOnlyLink] Error:', error);
    return Response.json({ error: error.message || 'Erro desconhecido' }, { status: 500 });
  }
});