import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafTestAuth — Testa autenticação CAF com Mobile Key (client-id + client-secret cru).
 *
 * Fluxo CORRETO atual (pós troca de credenciais):
 *   1. Assina JWT HS256 com CAF_CLIENT_SECRET (iss=CAF_CLIENT_ID, exp curto)
 *   2. Usa esse JWT como Bearer token na Core API
 *
 * Antes da troca, o secret já era um JWT pré-pronto — não precisava assinar.
 * Agora o secret é o segredo cru (84 chars), então precisamos assinar a cada chamada.
 */

// ── Helper: HS256 JWT sign ──
async function signCafJwt(clientId, clientSecret, ttlSeconds = 300) {
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

    if (!CAF_CLIENT_ID || !CAF_CLIENT_SECRET) {
      return Response.json({ error: 'CAF_CLIENT_ID ou CAF_CLIENT_SECRET não configurados' }, { status: 500 });
    }

    // ── Gerar JWT fresco assinado com o client-secret ──
    const jwt = await signCafJwt(CAF_CLIENT_ID, CAF_CLIENT_SECRET, 300);
    const bearer = `Bearer ${jwt}`;

    const results = [];

    results.push(await testEndpoint(
      '1: Core API — List Transactions (JWT Bearer)',
      'https://api.combateafraude.com/v1/transactions?_limit=1',
      'GET', { 'Authorization': bearer }
    ));

    results.push(await testEndpoint(
      '2: Core API — Create Transaction (pfBasicData)',
      'https://api.combateafraude.com/v1/transactions',
      'POST', { 'Authorization': bearer },
      { template: { services: ['pfBasicData'] }, parameters: { cpf: '00000000000' } }
    ));

    results.push(await testEndpoint(
      '3: Core API — Get Person Profile',
      'https://api.combateafraude.com/v1/people/00000000000',
      'GET', { 'Authorization': bearer }
    ));

    results.push(await testEndpoint(
      '4: Core API — Create Onboarding (test)',
      'https://api.combateafraude.com/v1/onboardings?origin=TRUST',
      'POST', { 'Authorization': bearer },
      { type: 'PF', transactionTemplateId: 'test-dummy-id', noNotification: true }
    ));

    results.push(await testEndpoint(
      '5: Core API — Faces endpoint',
      'https://api.combateafraude.com/v1/faces',
      'POST', { 'Authorization': bearer },
      { personId: '00000000000', imageUrl: 'https://example.com/test.png' }
    ));

    results.push(await testEndpoint(
      '6: BFF — Session Token Exchange (auth sanity)',
      'https://web.us.prd.caf.io/bff/session-tokens',
      'GET', { 'Authorization': jwt } // BFF espera SEM "Bearer"
    ));

    const summary = results.map(r => ({
      name: r.name, status: r.status, ok: r.ok, duration_ms: r.duration_ms,
      responsePreview: typeof r.response === 'object' ? JSON.stringify(r.response).substring(0, 200) : String(r.response).substring(0, 200),
    }));

    return Response.json({
      credentials: {
        clientId: CAF_CLIENT_ID,
        clientSecretLength: CAF_CLIENT_SECRET.length,
        clientSecretPrefix: CAF_CLIENT_SECRET.substring(0, 8) + '...',
        jwtGeneratedLength: jwt.length,
      },
      summary,
      details: results,
    });

  } catch (error) {
    console.error('[TEST] Fatal error:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});