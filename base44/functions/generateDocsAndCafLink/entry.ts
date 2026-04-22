import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * generateDocsAndCafLink — admin-only endpoint to generate a PUBLIC link
 * that allows a merchant to upload DOCUMENTS + complete CAF identity verification
 * in a single session (mode=docs_and_caf).
 *
 * Use case: the client filled the questionnaire but either:
 *   - never went to the upload page (bug/redirect failure), OR
 *   - got stuck mid-flow and we need to send them back to pick up from docs onwards.
 *
 * This is the "complete recovery link" — pass through docs AND CAF.
 * Token is shared with ComplianceDocOnly (via docLinkToken on the case).
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
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });

    const { caseId, baseUrl } = await req.json();
    if (!caseId) return Response.json({ error: 'caseId is required' }, { status: 400 });

    const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
    if (cases.length === 0) return Response.json({ error: 'Caso não encontrado' }, { status: 404 });
    const onboardingCase = cases[0];

    if (!onboardingCase.questionnaireTemplateId) {
      return Response.json({ error: 'Caso não tem template vinculado.', code: 'NO_TEMPLATE' }, { status: 400 });
    }

    const templates = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({
      id: onboardingCase.questionnaireTemplateId,
    });
    if (templates.length === 0) {
      return Response.json({ error: 'Template não encontrado.', code: 'TEMPLATE_NOT_FOUND' }, { status: 404 });
    }
    const template = templates[0];
    const requiredDocs = Array.isArray(template.requiredDocuments) ? template.requiredDocuments : [];
    if (requiredDocs.length === 0) {
      return Response.json({ error: 'Template sem documentos requeridos.', code: 'TEMPLATE_HAS_NO_DOCS' }, { status: 400 });
    }

    // Generate or reuse docLinkToken
    let docLinkToken = onboardingCase.docLinkToken;
    if (!docLinkToken) {
      docLinkToken = generateToken();
      await base44.asServiceRole.entities.OnboardingCase.update(caseId, { docLinkToken });
    }

    const origin = (baseUrl || '').replace(/\/+$/, '') || 'https://app.base44.com';
    // V2 URL — unified /onboarding route. Legacy /ComplianceDocOnly still redirects here.
    const url = `${origin}/onboarding?case=${encodeURIComponent(caseId)}&token=${encodeURIComponent(docLinkToken)}&mode=docs_caf`;

    return Response.json({
      success: true,
      url,
      token: docLinkToken,
      templateName: template.name,
      templateModel: template.model || null,
      requiredDocsCount: requiredDocs.length,
      docsAlreadyCompleted: onboardingCase.docCompleted === true,
      cafAlreadyCompleted: onboardingCase.cafCompleted === true,
    });
  } catch (error) {
    console.error('[generateDocsAndCafLink] Error:', error);
    return Response.json({ error: error.message || 'Erro desconhecido' }, { status: 500 });
  }
});