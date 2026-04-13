import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafKybSearch — KYB/KYC via Core API Transaction
 *
 * Services PJ: pjData, pjPublicData, pjSimples, pjKycCompliance, pjKycComplianceOwners
 * Services PF: pfData, pfBasicData, pfKycCompliance, pfAddresses, pfMediaProfileAndExposure
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
    const { cnpj, cpf, onboardingCaseId, services } = body;

    if (!cnpj && !cpf) {
      return Response.json({ error: 'CNPJ ou CPF é obrigatório' }, { status: 400 });
    }

    const authToken = getCafToken();
    const isPJ = !!cnpj;
    const document = (cnpj || cpf).replace(/\D/g, '');

    // Default services — comprehensive
    const requestServices = services || (isPJ
      ? ['pjData', 'pjPublicData', 'pjSimples', 'pjKycCompliance', 'pjKycComplianceOwners']
      : ['pfData', 'pfBasicData', 'pfKycCompliance', 'pfAddresses', 'pfMediaProfileAndExposure']);

    console.log(`[KYB] Querying ${isPJ ? 'PJ' : 'PF'}: ***${document.slice(-4)}, services: ${requestServices.join(', ')}`);

    const cafPayload = {
      template: { services: requestServices },
      parameters: isPJ ? { cnpj: document } : { cpf: document },
    };

    const cafResponse = await fetch(`${CAF_API_BASE}/v1/transactions`, {
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

    const sections = cafResult?.sections || {};
    const durationMs = Date.now() - startTime;

    console.log(`[KYB] CAF HTTP: ${cafResponse.status}, sections: ${Object.keys(sections).join(', ')}`);

    // Log and save if case-based
    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          provider: 'CAF',
          service_type: 'kyb_company_search',
          transaction_id: cafResult?.uuid || '',
          status: cafResponse.ok ? 'success' : 'failed',
          request_payload: { document: `***${document.slice(-4)}`, services: requestServices },
          response_payload: { sectionsReturned: Object.keys(sections), transactionId: cafResult?.uuid },
          duration_ms: durationMs,
        });
      } catch (e) { console.warn('[KYB] Log error:', e.message); }

      try {
        await base44.asServiceRole.entities.ExternalValidationResult.create({
          onboardingCaseId,
          provider: 'CAF',
          validationType: `KYB — ${isPJ ? 'PJ' : 'PF'} Data + KYC + Owners`,
          endpoint: `/v1/transactions (${requestServices.join(', ')})`,
          resultData: sections,
          status: cafResponse.ok ? 'Sucesso' : 'Erro',
          timestamp: new Date().toISOString(),
          responseTime: durationMs,
        });
      } catch (e) { console.warn('[KYB] ExternalValidation error:', e.message); }
    }

    return Response.json({
      success: cafResponse.ok,
      type: isPJ ? 'PJ' : 'PF',
      transactionId: cafResult?.uuid || null,
      sections,
      sectionsReturned: Object.keys(sections),
      duration_ms: durationMs,
    });

  } catch (error) {
    console.error('[KYB] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});