import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafTestAuth — Testa autenticação CAF em TODOS os domínios.
 *
 * Dois contextos completamente distintos:
 *   1. Core API (api.combateafraude.com) — usa CAF_CORE_API_TOKEN (JWT estático gerado
 *      no Trust Platform → Tokens). Começa com "eyJhbGci..." e tem iss=ckid_...
 *   2. SDK Web (BFF /bff/session-tokens) — usa CAF_CLIENT_ID + CAF_CLIENT_SECRET (Mobile Key)
 *      para assinar um JWT HS256 on-demand e trocar por sessionToken.
 *
 * Doc: https://docs.caf.io/caf-api/core-api/authentication
 */

// ── Helper: assina JWT HS256 com client-secret cru da Mobile Key ──
async function signMobileJwt(clientId, clientSecret, ttlSeconds = 300) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: clientId, exp: now + ttlSeconds };
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
    'raw', enc.encode(clientSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput));
  const sigB64 = b64url(new Uint8Array(sigBuf));
  return `${signingInput}.${sigB64}`;
}

async function testEndpoint(name, url, method, headers, body = null, bodyType = 'json') {
  const startTime = Date.now();
  try {
    const opts = { method, headers: { ...headers } };
    if (body) {
      if (bodyType === 'form') {
        opts.body = body;
        opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else {
        opts.body = JSON.stringify(body);
        opts.headers['Content-Type'] = 'application/json';
      }
    }
    const res = await fetch(url, opts);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text.substring(0, 1000); }
    return { name, url, status: res.status, ok: res.ok, duration_ms: Date.now() - startTime, response: data };
  } catch (err) {
    return { name, url, status: 'ERROR', ok: false, duration_ms: Date.now() - startTime, error: err.message };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const CAF_CLIENT_ID = Deno.env.get('CAF_CLIENT_ID');
    const CAF_CLIENT_SECRET = Deno.env.get('CAF_CLIENT_SECRET');
    const CAF_CORE_API_TOKEN = Deno.env.get('CAF_CORE_API_TOKEN');

    if (!CAF_CORE_API_TOKEN) {
      return Response.json({ error: 'CAF_CORE_API_TOKEN não configurado (JWT estático do Trust Platform)' }, { status: 500 });
    }
    if (!CAF_CLIENT_ID || !CAF_CLIENT_SECRET) {
      return Response.json({ error: 'CAF_CLIENT_ID ou CAF_CLIENT_SECRET não configurados (Mobile Key)' }, { status: 500 });
    }

    const coreBearer = `Bearer ${CAF_CORE_API_TOKEN}`;
    const mobileJwt = await signMobileJwt(CAF_CLIENT_ID, CAF_CLIENT_SECRET, 300);

    const results = [];

    // ═══ CORE API (api.combateafraude.com) — usa CAF_CORE_API_TOKEN ═══
    results.push(await testEndpoint(
      '1: Core API — List Transactions',
      'https://api.combateafraude.com/v1/transactions?_limit=1',
      'GET', { 'Authorization': coreBearer }
    ));

    results.push(await testEndpoint(
      '2: Core API — Create Transaction (pfBasicData)',
      'https://api.combateafraude.com/v1/transactions',
      'POST', { 'Authorization': coreBearer },
      { template: { services: ['pfBasicData'] }, parameters: { cpf: '00000000000' } }
    ));

    results.push(await testEndpoint(
      '3: Core API — Get Person Profile',
      'https://api.combateafraude.com/v1/people/00000000000',
      'GET', { 'Authorization': coreBearer }
    ));

    results.push(await testEndpoint(
      '4: Core API — Create Onboarding (test)',
      'https://api.combateafraude.com/v1/onboardings?origin=TRUST',
      'POST', { 'Authorization': coreBearer },
      { type: 'PF', transactionTemplateId: 'test-dummy-id', noNotification: true }
    ));

    results.push(await testEndpoint(
      '5: Core API — Faces endpoint',
      'https://api.combateafraude.com/v1/faces',
      'POST', { 'Authorization': coreBearer },
      { personId: '00000000000', imageUrl: 'https://example.com/test.png' }
    ));

    // ═══ SDK Web BFF — usa Mobile Key (JWT HS256 assinado) ═══
    results.push(await testEndpoint(
      '6: BFF — Session Token Exchange (Mobile Key)',
      'https://web.us.prd.caf.io/bff/session-tokens',
      'GET', { 'Authorization': mobileJwt } // BFF espera SEM "Bearer"
    ));

    const summary = results.map(r => ({
      name: r.name, status: r.status, ok: r.ok, duration_ms: r.duration_ms,
      responsePreview: typeof r.response === 'object' ? JSON.stringify(r.response).substring(0, 200) : String(r.response).substring(0, 200),
    }));

    return Response.json({
      credentials: {
        coreApiToken: {
          present: true,
          length: CAF_CORE_API_TOKEN.length,
          prefix: CAF_CORE_API_TOKEN.substring(0, 12) + '...',
        },
        mobileKey: {
          clientId: CAF_CLIENT_ID,
          clientSecretLength: CAF_CLIENT_SECRET.length,
          jwtGeneratedLength: mobileJwt.length,
        },
      },
      summary,
      details: results,
    });

  } catch (error) {
    console.error('[TEST] Fatal error:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});