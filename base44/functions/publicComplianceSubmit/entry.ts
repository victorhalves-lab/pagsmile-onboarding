import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC endpoint — consolidates Merchant + OnboardingCase + QuestionnaireResponse creation
 * for the public compliance flow (ComplianceDinamico / DocumentUploadFull / DocumentUploadPix).
 *
 * Also updates the associated Lead (status=kyc_iniciado, onboardingCaseId) via service role.
 *
 * Payload:
 *   - templateId (required)
 *   - merchantData: { type, cpfCnpj, fullName, companyName, email, phone, dateOfBirth, nationality, motherName, isSubseller, parentMerchantId, paymentServices, onboardingStatus }
 *   - onboardingCaseData: { status, priority, onboardingLinkCode, commercialAgentId, commercialAgentName, isSubsellerCase, parentMerchantId }
 *   - responses: [{ questionId, questionText, questionType, valueText?, valueNumber?, valueBoolean?, valueArray? }]
 *   - linkCode (optional): used to validate subseller link + parentMerchantId
 *   - leadId (optional): updates lead with onboardingCaseId + status
 *
 * Security:
 *   - Merchant is created (cpfCnpj validated as present)
 *   - OnboardingCase forced to status="Pendente" or "Em Análise" — cliente NÃO pode injetar Aprovado
 *   - If linkCode points to SUBSELLER_COMPLIANCE, parentMerchantId is taken from the link, NOT from client
 *   - docLinkToken generated server-side
 */
const ALLOWED_CASE_STATUSES = new Set(['Pendente', 'Em Processamento']);
const ALLOWED_MERCHANT_STATUSES = new Set(['Pendente', 'Em Análise']);
const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const { templateId, merchantData = {}, onboardingCaseData = {}, responses = [], linkCode, leadId } = body;

    if (!templateId) {
      return Response.json({ error: 'templateId required' }, { status: 400 });
    }
    if (!merchantData.cpfCnpj && !merchantData.email) {
      return Response.json({ error: 'merchant requires cpfCnpj or email' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Validate template exists
    let templates = [];
    try { templates = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ id: templateId }); } catch (_) { templates = []; }
    if (templates.length === 0) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    // If linkCode present, validate + extract subseller parent from server (never trust client)
    let parentMerchantId = null;
    let isSubsellerLink = false;
    let linkCommercialAgent = null;
    if (linkCode) {
      const links = await base44.asServiceRole.entities.OnboardingLink.filter({ uniqueCode: linkCode });
      const link = links[0];
      if (link) {
        if (link.linkType === 'SUBSELLER_COMPLIANCE' && link.parentMerchantId) {
          parentMerchantId = link.parentMerchantId;
          isSubsellerLink = true;
        }
        linkCommercialAgent = { id: link.commercialAgentId, name: link.commercialAgentName };
      }
    }

    // Sanitize merchant (force-allowed status)
    const safeMerchantStatus = ALLOWED_MERCHANT_STATUSES.has(merchantData.onboardingStatus)
      ? merchantData.onboardingStatus : 'Em Análise';

    const merchantPayload = {
      type: merchantData.type === 'PF' ? 'PF' : 'PJ',
      cpfCnpj: merchantData.cpfCnpj || '',
      fullName: merchantData.fullName || merchantData.companyName || 'N/A',
      companyName: merchantData.companyName || '',
      email: merchantData.email || 'nao-informado@placeholder.com',
      phone: merchantData.phone || '',
      onboardingStatus: safeMerchantStatus,
      isSubseller: !!isSubsellerLink || !!merchantData.isSubseller,
    };
    if (Array.isArray(merchantData.paymentServices)) merchantPayload.paymentServices = merchantData.paymentServices;
    if (merchantData.type === 'PF') {
      if (merchantData.dateOfBirth) merchantPayload.dateOfBirth = merchantData.dateOfBirth;
      if (merchantData.nationality) merchantPayload.nationality = merchantData.nationality;
      if (merchantData.motherName) merchantPayload.motherName = merchantData.motherName;
    }
    if (parentMerchantId) merchantPayload.parentMerchantId = parentMerchantId;

    const merchant = await base44.asServiceRole.entities.Merchant.create(merchantPayload);

    // Sanitize OnboardingCase (force-allowed status + priority)
    const safeCaseStatus = ALLOWED_CASE_STATUSES.has(onboardingCaseData.status)
      ? onboardingCaseData.status : 'Pendente';
    const safePriority = ALLOWED_PRIORITIES.has(onboardingCaseData.priority)
      ? onboardingCaseData.priority : 'medium';

    // Use crypto.randomUUID — Deno native
    const docLinkToken = crypto.randomUUID().replace(/-/g, '').slice(0, 24);

    const casePayload = {
      merchantId: merchant.id,
      questionnaireTemplateId: templateId,
      submissionDate: new Date().toISOString(),
      status: safeCaseStatus,
      priority: safePriority,
      onboardingLinkCode: linkCode || onboardingCaseData.onboardingLinkCode || '',
      commercialAgentId: linkCommercialAgent?.id || onboardingCaseData.commercialAgentId || '',
      commercialAgentName: linkCommercialAgent?.name || onboardingCaseData.commercialAgentName || '',
      isSubsellerCase: !!isSubsellerLink || !!onboardingCaseData.isSubsellerCase,
      docLinkToken,
    };
    if (parentMerchantId) casePayload.parentMerchantId = parentMerchantId;

    const onboardingCase = await base44.asServiceRole.entities.OnboardingCase.create(casePayload);

    // Create QuestionnaireResponses (bulk)
    if (Array.isArray(responses) && responses.length > 0) {
      // Sanitize: only allow known shape
      const sanitized = responses
        .filter(r => r && r.questionId)
        .map(r => ({
          onboardingCaseId: onboardingCase.id,
          questionId: r.questionId,
          questionText: r.questionText || '',
          questionType: r.questionType || '',
          ...(r.valueText !== undefined && { valueText: String(r.valueText) }),
          ...(typeof r.valueNumber === 'number' && { valueNumber: r.valueNumber }),
          ...(typeof r.valueBoolean === 'boolean' && { valueBoolean: r.valueBoolean }),
          ...(Array.isArray(r.valueArray) && { valueArray: r.valueArray }),
        }));
      if (sanitized.length > 0) {
        await base44.asServiceRole.entities.QuestionnaireResponse.bulkCreate(sanitized);
      }
    }

    // Link to Lead if provided (service role — bypass RLS)
    if (leadId) {
      try {
        await base44.asServiceRole.entities.Lead.update(leadId, {
          onboardingCaseId: onboardingCase.id,
          status: 'kyc_iniciado',
        });
      } catch (_) { /* non-blocking */ }
    }

    return Response.json({
      ok: true,
      merchantId: merchant.id,
      onboardingCaseId: onboardingCase.id,
      docLinkToken,
    });
  } catch (error) {
    console.error('publicComplianceSubmit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});