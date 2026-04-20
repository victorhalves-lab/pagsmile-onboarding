import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafConnectKybSearch — KYB/KYC via CAF CONNECT API (OAuth2)
 *
 * NEW: Uses the Connect API (api.us.prd.caf.io) with OAuth2 client_credentials.
 * Equivalent to the legacy cafKybSearch (Core API), but uses a pre-configured
 * Query Template at Trust Platform instead of an inline `services` array.
 *
 * Auth: CAF_CONNECT_CLIENT_ID + CAF_CONNECT_CLIENT_SECRET (OAuth2)
 * Endpoint: POST /v1/transactions?origin=TRUST
 * Body: { templateId, attributes: { cpf | cnpj, ... }, metadata }
 *
 * NOTE: On Connect API, `services` are defined by the TEMPLATE (not in the request body).
 * To migrate a specific KYB search, create a Query Template at trust.caf.io with the
 * desired services (pjData, pjKycCompliance, etc.) and pass that templateId here.
 */

const CONNECT_API_BASE = 'https://api.us.prd.caf.io';

// In-memory OAuth2 token cache (per isolate)
let tokenCache = { accessToken: null, expiresAt: 0 };

async function getConnectAccessToken() {
  const clientId = Deno.env.get('CAF_CONNECT_CLIENT_ID');
  const clientSecret = Deno.env.get('CAF_CONNECT_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error('CAF_CONNECT_CLIENT_ID/SECRET não configurados');
  }

  const now = Date.now();
  if (tokenCache.accessToken && tokenCache.expiresAt - 60_000 > now) {
    return tokenCache.accessToken;
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${CONNECT_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: body.toString(),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new Error(`OAuth2 falhou HTTP ${res.status}: ${JSON.stringify(json)}`);
  }

  tokenCache = {
    accessToken: json.access_token,
    expiresAt: now + (Number(json.expires_in) || 3600) * 1000,
  };
  return json.access_token;
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
    const { cnpj, cpf, templateId, onboardingCaseId, attributes: extraAttributes } = body;

    if (!cnpj && !cpf) {
      return Response.json({ error: 'CNPJ ou CPF é obrigatório' }, { status: 400 });
    }
    if (!templateId) {
      return Response.json({
        error: 'templateId (do Trust Platform) é obrigatório no Connect API.',
        note: 'Crie/obtenha um Query Template em https://trust.caf.io com os serviços desejados (ex: pjData, pjKycCompliance).',
      }, { status: 400 });
    }

    const isPJ = !!cnpj;
    const document = (cnpj || cpf).replace(/\D/g, '');

    // Get OAuth2 access token
    const accessToken = await getConnectAccessToken();

    // Build Connect API body — attributes contain the document + optional extras
    const attributes = {
      ...(isPJ ? { cnpj: document } : { cpf: document }),
      ...(extraAttributes || {}),
    };

    const connectPayload = {
      templateId,
      attributes,
      metadata: {
        onboardingCaseId: onboardingCaseId || '',
        source: 'pagsmile_compliance',
        createdBy: user.email,
      },
    };

    console.log(`[ConnectKYB] Creating transaction — templateId: ${templateId}, doc: ***${document.slice(-4)}, type: ${isPJ ? 'PJ' : 'PF'}`);

    const cafRes = await fetch(`${CONNECT_API_BASE}/v1/transactions?origin=TRUST`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(connectPayload),
    });

    const cafText = await cafRes.text();
    let cafResult;
    try { cafResult = JSON.parse(cafText); } catch { cafResult = { raw: cafText.substring(0, 500) }; }

    const durationMs = Date.now() - startTime;
    console.log(`[ConnectKYB] CAF HTTP: ${cafRes.status}, transactionId: ${cafResult?.id || 'none'}`);

    // Persist logs only when tied to a case
    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          provider: 'CAF',
          service_type: 'kyb_company_search',
          transaction_id: cafResult?.id || '',
          request_id: cafResult?.requestId || '',
          status: cafRes.ok ? 'success' : 'failed',
          request_payload: {
            api: 'connect',
            endpoint: '/v1/transactions?origin=TRUST',
            templateId,
            document: `***${document.slice(-4)}`,
          },
          response_payload: {
            transactionId: cafResult?.id,
            requestId: cafResult?.requestId,
          },
          duration_ms: durationMs,
        });
      } catch (e) { console.warn('[ConnectKYB] Log error:', e.message); }

      try {
        await base44.asServiceRole.entities.ExternalValidationResult.create({
          onboardingCaseId,
          provider: 'CAF',
          validationType: `KYB Connect — ${isPJ ? 'PJ' : 'PF'} (template ${templateId})`,
          endpoint: '/v1/transactions?origin=TRUST (Connect API)',
          resultData: cafResult,
          status: cafRes.ok ? 'Sucesso' : 'Erro',
          timestamp: new Date().toISOString(),
          responseTime: durationMs,
        });
      } catch (e) { console.warn('[ConnectKYB] ExternalValidation error:', e.message); }
    }

    return Response.json({
      success: cafRes.ok,
      api: 'connect',
      transactionId: cafResult?.id || null,
      requestId: cafResult?.requestId || null,
      type: isPJ ? 'PJ' : 'PF',
      duration_ms: durationMs,
      rawResponse: cafResult,
      ...(cafRes.ok ? {} : { status: cafRes.status, error: cafResult }),
    });

  } catch (error) {
    console.error('[ConnectKYB] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});