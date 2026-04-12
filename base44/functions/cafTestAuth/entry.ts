import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { encodeBase64 } from 'https://deno.land/std@0.220.0/encoding/base64.ts';

/**
 * cafTestAuth — Testa autenticação em TODAS as APIs CAF para diagnóstico.
 * 
 * Testa:
 *   1. Core API (api.combateafraude.com) com JWT HS256
 *   2. Core API (api.combateafraude.com) com token direto (sem Bearer)
 *   3. Mobile API deprecated (api.mobile.combateafraude.com) com JWT HS256
 *   4. SDK BFF (web.us.prd.caf.io) com JWT HS256
 */

function base64UrlEncode(data) {
  const b64 = encodeBase64(data);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createJwtToken(clientId, clientSecret, extraPayload = {}) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: clientId, exp: now + 300, ...extraPayload };
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(clientSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  return `${headerB64}.${payloadB64}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function testEndpoint(name, url, method, headers, body = null) {
  const startTime = Date.now();
  try {
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text.substring(0, 500); }
    return {
      name,
      url,
      status: res.status,
      ok: res.ok,
      duration_ms: Date.now() - startTime,
      response: data,
    };
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
      return Response.json({ error: 'CAF_CLIENT_ID or CAF_CLIENT_SECRET not set' }, { status: 500 });
    }

    console.log('[TEST] CAF_CLIENT_ID:', CAF_CLIENT_ID);
    console.log('[TEST] CAF_CLIENT_SECRET length:', CAF_CLIENT_SECRET.length);

    // Generate JWT tokens
    const jwtToken = await createJwtToken(CAF_CLIENT_ID, CAF_CLIENT_SECRET);
    const jwtWithPeopleId = await createJwtToken(CAF_CLIENT_ID, CAF_CLIENT_SECRET, { peopleId: '00000000000' });

    console.log('[TEST] JWT token generated, length:', jwtToken.length);
    console.log('[TEST] JWT preview:', jwtToken.substring(0, 50) + '...');

    const results = [];

    // ═══ Test 1: Core API — POST /v1/transactions with JWT Bearer ═══
    results.push(await testEndpoint(
      'Core API — JWT Bearer — POST /v1/transactions',
      'https://api.combateafraude.com/v1/transactions',
      'POST',
      { 'Authorization': `Bearer ${jwtToken}`, 'Content-Type': 'application/json' },
      { template: { services: ['pfBasicData'] }, parameters: { cpf: '00000000000' } }
    ));

    // ═══ Test 2: Core API — POST /v1/transactions with origin=TRUST ═══
    results.push(await testEndpoint(
      'Core API — JWT Bearer + origin=TRUST',
      'https://api.combateafraude.com/v1/transactions?origin=TRUST',
      'POST',
      { 'Authorization': `Bearer ${jwtToken}`, 'Content-Type': 'application/json' },
      { templateId: 'test', attributes: { cpf: '00000000000' } }
    ));

    // ═══ Test 3: Core API — JWT as raw token (no Bearer prefix) ═══
    results.push(await testEndpoint(
      'Core API — JWT raw (no Bearer) — POST /v1/transactions',
      'https://api.combateafraude.com/v1/transactions',
      'POST',
      { 'Authorization': jwtToken, 'Content-Type': 'application/json' },
      { template: { services: ['pfBasicData'] }, parameters: { cpf: '00000000000' } }
    ));

    // ═══ Test 4: Core API — GET /v1/transactions (list) ═══
    results.push(await testEndpoint(
      'Core API — JWT Bearer — GET /v1/transactions',
      'https://api.combateafraude.com/v1/transactions?_limit=1',
      'GET',
      { 'Authorization': `Bearer ${jwtToken}` }
    ));

    // ═══ Test 5: Core API — Using CLIENT_ID directly as Bearer token ═══
    results.push(await testEndpoint(
      'Core API — CLIENT_ID as Bearer — GET /v1/transactions',
      'https://api.combateafraude.com/v1/transactions?_limit=1',
      'GET',
      { 'Authorization': `Bearer ${CAF_CLIENT_ID}` }
    ));

    // ═══ Test 6: Core API — Using CLIENT_SECRET directly as Bearer token ═══
    results.push(await testEndpoint(
      'Core API — CLIENT_SECRET as Bearer — GET /v1/transactions',
      'https://api.combateafraude.com/v1/transactions?_limit=1',
      'GET',
      { 'Authorization': `Bearer ${CAF_CLIENT_SECRET}` }
    ));

    // ═══ Test 7: Mobile API deprecated — POST /faces/authenticate ═══
    results.push(await testEndpoint(
      'Mobile API — JWT Bearer — GET /faces (list)',
      'https://api.mobile.combateafraude.com/faces?_limit=1',
      'GET',
      { 'Authorization': `Bearer ${jwtToken}` }
    ));

    // ═══ Test 8: Mobile API — POST with JWT with peopleId ═══
    results.push(await testEndpoint(
      'Mobile API — JWT+peopleId — POST /faces/authenticate',
      'https://api.mobile.combateafraude.com/faces/authenticate',
      'POST',
      { 'Authorization': `Bearer ${jwtWithPeopleId}`, 'Content-Type': 'application/json' },
      { peopleId: '00000000000', imageUrl: 'https://example.com/test.jpg' }
    ));

    // ═══ Test 9: SDK BFF — Session Token ═══
    results.push(await testEndpoint(
      'SDK BFF — JWT Auth — GET /bff/session-tokens',
      'https://web.us.prd.caf.io/bff/session-tokens',
      'GET',
      { 'Authorization': jwtToken }
    ));

    // Summary
    const summary = results.map(r => ({
      name: r.name,
      status: r.status,
      ok: r.ok,
      duration_ms: r.duration_ms,
    }));

    console.log('[TEST] Results summary:', JSON.stringify(summary, null, 2));

    return Response.json({
      credentials: {
        clientId: CAF_CLIENT_ID,
        clientSecretLength: CAF_CLIENT_SECRET.length,
        jwtTokenPreview: jwtToken.substring(0, 60) + '...',
      },
      summary,
      details: results,
    });

  } catch (error) {
    console.error('[TEST] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});