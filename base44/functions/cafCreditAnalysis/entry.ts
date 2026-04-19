import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafCreditAnalysis — Análise de crédito PF/PJ via Core API
 * Auth: CAF_CLIENT_SECRET as static Bearer token
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

function getCafToken() {
  const token = Deno.env.get('CAF_CORE_API_TOKEN');
  if (!token) throw new Error('CAF_CORE_API_TOKEN not configured');
  return token;
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { cpf, cnpj, onboardingCaseId } = body;

    // Auth: allow (1) admin, (2) service-role, (3) pipeline chain via onboardingCaseId
    let isAuth = false;
    try { const u = await base44.auth.me(); if (u?.role === 'admin') isAuth = true; } catch {}
    if (!isAuth) { try { await base44.asServiceRole.entities.OnboardingCase.list('-created_date', 1); isAuth = true; } catch {} }
    if (!isAuth && onboardingCaseId) {
      try {
        const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
        if (cases[0]) isAuth = true;
      } catch { /* */ }
    }
    if (!isAuth) return Response.json({ error: 'Forbidden' }, { status: 403 });

    if (!cpf && !cnpj) return Response.json({ error: 'CPF ou CNPJ é obrigatório' }, { status: 400 });

    const isPF = !!cpf;
    const service = isPF ? 'pfCreditProfileDetails' : 'pjCreditProfileDetails';
    const document = (cpf || cnpj).replace(/\D/g, '');

    const authToken = getCafToken();

    const cafResponse = await fetch(`${CAF_API_BASE}/v1/transactions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: { services: [service] },
        parameters: isPF ? { cpf: document } : { cnpj: document },
      }),
    });

    const cafText = await cafResponse.text();
    let cafResult;
    try { cafResult = JSON.parse(cafText); } catch { cafResult = { raw: cafText.substring(0, 500) }; }

    const creditSection = cafResult?.sections?.[service] || cafResult?.sections?.creditProfile || null;
    const durationMs = Date.now() - startTime;

    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          provider: 'CAF',
          service_type: isPF ? 'pf_credit_profile' : 'pj_credit_profile',
          transaction_id: cafResult?.uuid || '',
          status: cafResponse.ok ? 'success' : 'failed',
          request_payload: { document: `***${document.slice(-4)}`, service },
          response_payload: { hasCreditData: !!creditSection },
          score: creditSection?.score || null,
          duration_ms: durationMs,
        });
      } catch (e) { console.warn('[Credit] Log error:', e.message); }

      try {
        await base44.asServiceRole.entities.ExternalValidationResult.create({
          onboardingCaseId,
          provider: 'CAF',
          validationType: `Credit Profile — ${isPF ? 'PF' : 'PJ'}`,
          endpoint: `/v1/transactions (${service})`,
          resultData: creditSection || cafResult,
          score: creditSection?.score || null,
          status: cafResponse.ok ? 'Sucesso' : 'Erro',
          timestamp: new Date().toISOString(),
          responseTime: durationMs,
        });
      } catch (e) { console.warn('[Credit] ExternalValidation error:', e.message); }
    }

    return Response.json({
      success: true,
      type: isPF ? 'PF' : 'PJ',
      creditProfile: creditSection,
      transactionId: cafResult?.uuid || null,
      duration_ms: durationMs,
    });

  } catch (error) {
    console.error('[Credit] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});