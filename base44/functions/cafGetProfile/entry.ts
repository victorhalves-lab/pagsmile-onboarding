import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafGetProfile — Fetches consolidated PF/PJ profile from CAF Core API
 *
 * GET /v1/people/{cpf} — consolidated profile of a person (all transactions)
 * GET /v1/companies/{cnpj} — consolidated profile of a company (QSA, transactions, sources)
 *
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
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { cpf, cnpj, onboardingCaseId } = body;

    if (!cpf && !cnpj) return Response.json({ error: 'CPF ou CNPJ é obrigatório' }, { status: 400 });

    const authToken = getCafToken();
    const isPJ = !!cnpj;
    const document = (cnpj || cpf).replace(/\D/g, '');

    let url;
    if (isPJ) {
      url = `${CAF_API_BASE}/v1/companies/${document}?_includeOnboardingQsa=true`;
    } else {
      url = `${CAF_API_BASE}/v1/people/${document}`;
    }

    console.log(`[CAF-Profile] Fetching ${isPJ ? 'PJ' : 'PF'}: ***${document.slice(-4)}`);

    const cafResponse = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    const cafText = await cafResponse.text();
    let cafResult;
    try { cafResult = JSON.parse(cafText); } catch { cafResult = { raw: cafText.substring(0, 500) }; }

    const durationMs = Date.now() - startTime;

    console.log(`[CAF-Profile] HTTP: ${cafResponse.status}, status: ${cafResult?.status}`);

    // Save to logs if case-linked
    if (onboardingCaseId && cafResponse.ok) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          provider: 'CAF',
          service_type: isPJ ? 'kyb_business_identity' : 'empresas_kyc',
          status: 'success',
          request_payload: { document: `***${document.slice(-4)}`, type: isPJ ? 'PJ' : 'PF' },
          response_payload: {
            cafStatus: cafResult?.status,
            basicData: cafResult?.basicData,
            executionsCount: cafResult?.executions?.length || 0,
            sourcesCount: Object.keys(cafResult?.sources || {}).length,
            qsaCount: cafResult?.qsa?.items?.length || 0,
          },
          duration_ms: durationMs,
        });
      } catch (e) { console.warn('[CAF-Profile] Log error:', e.message); }

      try {
        await base44.asServiceRole.entities.ExternalValidationResult.create({
          onboardingCaseId,
          provider: 'CAF',
          validationType: `Profile Consolidado — ${isPJ ? 'PJ (CNPJ)' : 'PF (CPF)'}`,
          endpoint: isPJ ? `/v1/companies/${document}` : `/v1/people/${document}`,
          resultData: {
            status: cafResult?.status,
            basicData: cafResult?.basicData,
            sources: cafResult?.sources,
            qsa: cafResult?.qsa,
            onboarding: cafResult?.onboarding,
            executionsCount: cafResult?.executions?.length || 0,
          },
          status: cafResult?.status === 'APPROVED' ? 'Sucesso' : cafResult?.status === 'REPROVED' ? 'Falha' : 'Pendente',
          timestamp: new Date().toISOString(),
          responseTime: durationMs,
        });
      } catch (e) { console.warn('[CAF-Profile] ExternalValidation error:', e.message); }
    }

    return Response.json({
      success: cafResponse.ok,
      type: isPJ ? 'PJ' : 'PF',
      profileId: cafResult?.id || null,
      profileStatus: cafResult?.status || null,
      basicData: cafResult?.basicData || null,
      sources: cafResult?.sources || null,
      qsa: cafResult?.qsa || null,
      onboarding: cafResult?.onboarding || null,
      executions: cafResult?.executions || [],
      duration_ms: durationMs,
    });

  } catch (error) {
    console.error('[CAF-Profile] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});