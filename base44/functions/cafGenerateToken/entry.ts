import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafGenerateToken — Fluxo OFICIAL de autenticação CAF SDK
 * 
 * Referência: https://docs.caf.io/caf-sdk/authentication
 * 
 * Passos (exatamente como a doc manda):
 *   1. Gera JWT HS256 com { iss: CAF_CLIENT_ID, exp: now+5min }, assinado com CAF_CLIENT_SECRET.
 *   2. Troca esse JWT por Session Token via GET https://web.us.prd.caf.io/bff/session-tokens
 *      com header "Authorization: <JWT>" (SEM prefixo "Bearer").
 *   3. Retorna sessionToken ao frontend, que usa no SDK init.
 * 
 * ⚠️  NÃO expor CAF_CLIENT_SECRET ao frontend. NÃO reutilizar Session Tokens entre sessões.
 * ⚠️  CAF revoga keys identificadas como expostas automaticamente.
 */

// HS256 JWT sign usando Web Crypto API (Deno)
async function signJwtHS256(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const enc = new TextEncoder();

  const b64url = (bytes) => {
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };

  const headerB64 = b64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = b64url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput));
  const sigB64 = b64url(new Uint8Array(sigBuf));

  return `${signingInput}.${sigB64}`;
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    // Tolerante a tokens inválidos — este endpoint é público (SDK CAF no navegador do cliente).
    let base44;
    try {
      base44 = createClientFromRequest(req);
    } catch (_) {
      const { createClient } = await import('npm:@base44/sdk@0.8.25');
      base44 = createClient({
        appId: Deno.env.get('BASE44_APP_ID'),
        requiresAuth: false,
      });
    }
    const body = await req.json().catch(() => ({}));
    const { personCpf, onboardingCaseId } = body;

    const clientId = Deno.env.get('CAF_CLIENT_ID');
    const clientSecret = Deno.env.get('CAF_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return Response.json({
        error: 'CAF_CLIENT_ID ou CAF_CLIENT_SECRET não configurados.',
      }, { status: 500 });
    }

    // ── 1. Gerar Authentication Token (JWT HS256) ──
    const now = Math.floor(Date.now() / 1000);
    const authPayload = {
      iss: clientId,
      exp: now + 300, // 5 minutos (short-lived, como a doc recomenda)
    };

    const authJwt = await signJwtHS256(authPayload, clientSecret);

    // ── 2. Trocar por Session Token em /bff/session-tokens ──
    const exchangeUrl = 'https://web.us.prd.caf.io/bff/session-tokens';
    const exchangeRes = await fetch(exchangeUrl, {
      method: 'GET',
      headers: {
        'Authorization': authJwt, // SEM "Bearer", exatamente como a doc manda
        'Accept': 'application/json',
      },
    });

    const exchangeBodyText = await exchangeRes.text();
    let exchangeBody;
    try { exchangeBody = JSON.parse(exchangeBodyText); } catch { exchangeBody = { raw: exchangeBodyText }; }

    if (!exchangeRes.ok) {
      console.error('[CAF-Token] session-tokens exchange failed', {
        status: exchangeRes.status,
        body: exchangeBody,
      });

      if (onboardingCaseId) {
        try {
          await base44.asServiceRole.entities.IntegrationLog.create({
            onboarding_case_id: onboardingCaseId,
            provider: 'CAF',
            service_type: 'sdk_token_generation',
            status: 'failed',
            result_status: 'REPROVED',
            error_message: `session-tokens HTTP ${exchangeRes.status}`,
            request_payload: { endpoint: exchangeUrl, jwt_iss: clientId },
            response_payload: { status: exchangeRes.status, body: exchangeBody },
            duration_ms: Date.now() - startTime,
          });
        } catch (e) { console.warn('[CAF-Token] Log error:', e.message); }
      }

      return Response.json({
        error: 'Falha ao obter session token da CAF',
        details: {
          status: exchangeRes.status,
          body: exchangeBody,
        },
      }, { status: 502 });
    }

    const sessionToken = exchangeBody?.sessionToken;
    const requestId = exchangeBody?.requestId;

    if (!sessionToken) {
      return Response.json({
        error: 'CAF retornou 200 mas sem sessionToken',
        details: exchangeBody,
      }, { status: 502 });
    }

    // ── 3. PersonId (opcional mas recomendado) ──
    const cleanCpf = (personCpf || '').replace(/\D/g, '');
    const hasValidCpf = cleanCpf.length === 11;
    const personId = hasValidCpf ? cleanCpf : 'anonymous';

    // ── 4. Log sucesso ──
    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          provider: 'CAF',
          service_type: 'sdk_token_generation',
          status: 'success',
          result_status: 'APPROVED',
          request_id: requestId,
          request_payload: {
            endpoint: exchangeUrl,
            jwt_iss: clientId,
            hasCpf: hasValidCpf,
          },
          response_payload: {
            sessionTokenLength: sessionToken.length,
            requestId,
          },
          duration_ms: Date.now() - startTime,
        });
      } catch (e) { console.warn('[CAF-Token] Log error:', e.message); }
    }

    console.log(`[CAF-Token] Session token obtained (len=${sessionToken.length}, requestId=${requestId})`);

    return Response.json({
      sdkToken: sessionToken,
      personId,
      tokenType: 'session',
      tokenStrategy: 'official_session_exchange',
      requestId,
      canUseFaceAuth: false, // face auth exige face pré-registrada via /v1/faces — não suportamos isso ainda
      duration_ms: Date.now() - startTime,
    });

  } catch (error) {
    console.error('[CAF-Token] Fatal error:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});