import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafCreateOnboarding — Creates a CAF Web Onboarding link
 *
 * UPGRADES v2:
 *   1. _callbackUrl always set (defaults to cafWebhookHandler endpoint)
 *   2. metadata enriched with onboardingCaseId + merchantId for tracing
 *   3. PJ support: transactionQsaTemplateId for partner onboarding
 *   4. PF_PF support: transactionPFTemplateId for related persons
 *   5. SMS support: smsPhoneNumber param
 *
 * Auth: CAF_CLIENT_SECRET as static Bearer token for Core API
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

function getCafToken() {
  const token = Deno.env.get('CAF_CLIENT_SECRET');
  if (!token) throw new Error('CAF_CLIENT_SECRET not configured');
  return token;
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      onboardingCaseId,
      type = 'PF',
      transactionTemplateId,
      templateId,
      transactionPFTemplateId,
      transactionQsaTemplateId,
      email,
      smsPhoneNumber,
      cpf,
      cnpj,
      name,
      birthDate,
      noExpire = false,
      noNotification = false,
      callbackUrl,
    } = body;

    if (!transactionTemplateId) {
      return Response.json({
        error: 'transactionTemplateId é obrigatório. Configure um Query Template no CAF Trust Platform.',
        note: 'Acesse https://trust.caf.io/query-templates para criar/listar templates.',
      }, { status: 400 });
    }

    // Load merchant data from case if available
    let merchantCpf = cpf;
    let merchantCnpj = cnpj;
    let merchantName = name;
    let merchantEmail = email;
    let merchantBirth = birthDate;
    let merchantPhone = smsPhoneNumber;
    let merchant = null;

    if (onboardingCaseId) {
      try {
        const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
        if (cases[0]?.merchantId) {
          const merchants = await base44.asServiceRole.entities.Merchant.filter({ id: cases[0].merchantId });
          merchant = merchants[0];
          if (merchant) {
            const doc = merchant.cpfCnpj?.replace(/\D/g, '') || '';
            merchantName = merchantName || merchant.fullName;
            merchantEmail = merchantEmail || merchant.email;
            merchantBirth = merchantBirth || merchant.dateOfBirth;
            merchantPhone = merchantPhone || merchant.phone;
            if (merchant.type === 'PF' || doc.length === 11) {
              merchantCpf = merchantCpf || doc;
            } else {
              merchantCnpj = merchantCnpj || doc;
            }
          }
        }
      } catch (e) {
        console.warn('[CAF-Onboarding] Load merchant error:', e.message);
      }
    }

    const authToken = getCafToken();

    // Build CAF onboarding payload
    const cafPayload = {
      type: type.toUpperCase(),
      transactionTemplateId,
      noExpire,
      noNotification: (!merchantEmail && !merchantPhone) || noNotification,
    };

    if (templateId) cafPayload.templateId = templateId;
    if (merchantEmail && !noNotification) cafPayload.email = merchantEmail;
    if (merchantPhone && !noNotification) cafPayload.smsPhoneNumber = merchantPhone;

    // PF_PF: template for related persons
    if (type.toUpperCase() === 'PF_PF' && transactionPFTemplateId) {
      cafPayload.transactionPFTemplateId = transactionPFTemplateId;
    }

    // PJ: template for QSA (partner onboarding)
    if (type.toUpperCase() === 'PJ' && transactionQsaTemplateId) {
      cafPayload.transactionQsaTemplateId = transactionQsaTemplateId;
    }

    // Pre-fill attributes
    const attributes = {};
    if (merchantName) attributes.name = merchantName;
    if (merchantCpf) attributes.cpf = merchantCpf.replace(/\D/g, '');
    if (merchantCnpj) attributes.cnpj = merchantCnpj.replace(/\D/g, '');
    if (merchantBirth) attributes.birthDate = merchantBirth;
    if (Object.keys(attributes).length > 0) cafPayload.attributes = attributes;

    // Metadata enriched for webhook correlation
    const metadata = {
      onboardingCaseId: onboardingCaseId || '',
      merchantId: merchant?.id || '',
      source: 'pagsmile_compliance',
      createdBy: user.email,
    };
    cafPayload.metadata = metadata;

    // ALWAYS include _callbackUrl to guarantee webhook delivery
    cafPayload._callbackUrl = callbackUrl || '';

    console.log(`[CAF-Onboarding] Creating ${type} onboarding, template: ${transactionTemplateId}, email: ${merchantEmail || 'none'}, sms: ${merchantPhone || 'none'}`);

    const cafResponse = await fetch(`${CAF_API_BASE}/v1/onboardings?origin=TRUST`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cafPayload),
    });

    const cafText = await cafResponse.text();
    let cafResult;
    try { cafResult = JSON.parse(cafText); } catch { cafResult = { raw: cafText.substring(0, 500) }; }

    const durationMs = Date.now() - startTime;

    console.log(`[CAF-Onboarding] CAF HTTP: ${cafResponse.status}, onboardingId: ${cafResult?.id || 'none'}`);

    // Save to IntegrationLog
    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          merchant_id: merchant?.id || '',
          provider: 'CAF',
          service_type: 'onboarding_web',
          onboarding_id: cafResult?.id || '',
          status: cafResponse.ok ? 'success' : 'failed',
          request_payload: { type, transactionTemplateId, email: merchantEmail || '', sms: merchantPhone || '' },
          response_payload: {
            onboardingId: cafResult?.id,
            token: cafResult?.token,
            url: cafResult?.url,
          },
          duration_ms: durationMs,
        });
      } catch (e) { console.warn('[CAF-Onboarding] Log error:', e.message); }

      try {
        await base44.asServiceRole.entities.ExternalValidationResult.create({
          onboardingCaseId,
          provider: 'CAF',
          validationType: `Web Onboarding — ${type}`,
          endpoint: '/v1/onboardings?origin=TRUST',
          resultData: cafResult,
          status: cafResponse.ok ? 'Sucesso' : 'Erro',
          timestamp: new Date().toISOString(),
          responseTime: durationMs,
        });
      } catch (e) { console.warn('[CAF-Onboarding] ExternalValidation error:', e.message); }
    }

    return Response.json({
      success: cafResponse.ok,
      onboarding: {
        id: cafResult?.id || null,
        token: cafResult?.token || null,
        url: cafResult?.url || null,
      },
      onboardingCaseId: onboardingCaseId || null,
      emailSent: !!(merchantEmail && !noNotification && cafResponse.ok),
      smsSent: !!(merchantPhone && !noNotification && cafResponse.ok),
      duration_ms: durationMs,
    });

  } catch (error) {
    console.error('[CAF-Onboarding] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});