import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { encodeBase64 } from 'https://deno.land/std@0.220.0/encoding/base64.ts';

/**
 * cafTestAuth — Teste MICROSCÓPICO e EXAUSTIVO de autenticação em TODAS as APIs CAF.
 * 
 * A CAF tem 3 sistemas distintos:
 *   1. Core API (api.combateafraude.com) — token estático gerado no Trust Platform
 *   2. CAF Connect API (api.us.prd.caf.io) — OAuth2 client_credentials
 *   3. Mobile/SDK API (web.us.prd.caf.io) — JWT HS256 → session tokens
 * 
 * Nosso clientId/clientSecret podem ser:
 *   a) Credenciais de Mobile/SDK (funciona no BFF session-tokens)
 *   b) Credenciais de CAF Connect Application (funciona no OAuth2 flow)
 *   c) Ambos (se foram criadas para ambos)
 * 
 * Este teste tenta TODOS os caminhos possíveis.
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

async function testEndpoint(name, url, method, headers, body = null, bodyType = 'json') {
  const startTime = Date.now();
  try {
    const opts = { method, headers: { ...headers } };
    if (body) {
      if (bodyType === 'form') {
        opts.body = body; // already a string
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
    return {
      name, url, status: res.status, ok: res.ok,
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
      return Response.json({ error: 'CAF credentials not set' }, { status: 500 });
    }

    console.log('[TEST] CAF_CLIENT_ID:', CAF_CLIENT_ID);
    console.log('[TEST] CAF_CLIENT_SECRET length:', CAF_CLIENT_SECRET.length);
    console.log('[TEST] CAF_CLIENT_SECRET first 4 chars:', CAF_CLIENT_SECRET.substring(0, 4));

    const results = [];

    // ═══════════════════════════════════════════════════════════
    // GRUPO 1: CAF Connect API — OAuth2 client_credentials
    // Base URL: https://api.us.prd.caf.io
    // Docs: https://docs.caf.io/caf-api/caf-connect/authentication/authenticating
    // ═══════════════════════════════════════════════════════════
    
    console.log('[TEST] === GRUPO 1: CAF Connect OAuth2 ===');

    // Test 1A: OAuth2 token exchange — form encoded
    const oauthResult = await testEndpoint(
      '1A: CAF Connect — OAuth2 client_credentials (form)',
      'https://api.us.prd.caf.io/oauth2/token',
      'POST',
      {},
      `grant_type=client_credentials&client_id=${encodeURIComponent(CAF_CLIENT_ID)}&client_secret=${encodeURIComponent(CAF_CLIENT_SECRET)}`,
      'form'
    );
    results.push(oauthResult);

    // If OAuth2 worked, test the CAF Connect Transaction API
    let connectAccessToken = null;
    if (oauthResult.ok && oauthResult.response?.access_token) {
      connectAccessToken = oauthResult.response.access_token;
      console.log('[TEST] OAuth2 token obtained! Length:', connectAccessToken.length);

      // Test 1B: List transactions with OAuth2 token
      results.push(await testEndpoint(
        '1B: CAF Connect — List Transactions (OAuth2)',
        'https://api.us.prd.caf.io/v1/transactions?_limit=1',
        'GET',
        { 'Authorization': `Bearer ${connectAccessToken}` }
      ));

      // Test 1C: Create transaction with OAuth2 token (with a real template structure)
      results.push(await testEndpoint(
        '1C: CAF Connect — Create Transaction (OAuth2)',
        'https://api.us.prd.caf.io/v1/transactions?origin=TRUST',
        'POST',
        { 'Authorization': `Bearer ${connectAccessToken}` },
        {
          templateId: 'test-dummy-id',
          attributes: { cpf: '00000000000' }
        }
      ));
    } else {
      console.log('[TEST] OAuth2 failed:', JSON.stringify(oauthResult.response));

      // Try with Basic auth header instead of form body
      const basicAuth = btoa(`${CAF_CLIENT_ID}:${CAF_CLIENT_SECRET}`);
      results.push(await testEndpoint(
        '1A-alt: CAF Connect — OAuth2 client_credentials (Basic Auth header)',
        'https://api.us.prd.caf.io/oauth2/token',
        'POST',
        { 'Authorization': `Basic ${basicAuth}` },
        'grant_type=client_credentials',
        'form'
      ));
    }

    // ═══════════════════════════════════════════════════════════
    // GRUPO 2: Core API — Token estático
    // Base URL: https://api.combateafraude.com
    // Docs: a Core API espera um token criado no Trust Platform
    // Mas vamos tentar TUDO que temos como token
    // ═══════════════════════════════════════════════════════════
    
    console.log('[TEST] === GRUPO 2: Core API (api.combateafraude.com) ===');

    const jwtToken = await createJwtToken(CAF_CLIENT_ID, CAF_CLIENT_SECRET);

    // Test 2A: JWT como Bearer
    results.push(await testEndpoint(
      '2A: Core API — JWT HS256 como Bearer',
      'https://api.combateafraude.com/v1/transactions?_limit=1',
      'GET',
      { 'Authorization': `Bearer ${jwtToken}` }
    ));

    // Test 2B: CLIENT_SECRET diretamente como Bearer (talvez o secret IS the token?)
    results.push(await testEndpoint(
      '2B: Core API — CLIENT_SECRET como Bearer',
      'https://api.combateafraude.com/v1/transactions?_limit=1',
      'GET',
      { 'Authorization': `Bearer ${CAF_CLIENT_SECRET}` }
    ));

    // Test 2C: Se temos o OAuth2 access_token, testar na Core API também
    if (connectAccessToken) {
      results.push(await testEndpoint(
        '2C: Core API — OAuth2 access_token da Connect como Bearer',
        'https://api.combateafraude.com/v1/transactions?_limit=1',
        'GET',
        { 'Authorization': `Bearer ${connectAccessToken}` }
      ));
    }

    // ═══════════════════════════════════════════════════════════
    // GRUPO 3: SDK/BFF — Session tokens
    // Base URL: https://web.us.prd.caf.io
    // ═══════════════════════════════════════════════════════════

    console.log('[TEST] === GRUPO 3: SDK BFF ===');

    results.push(await testEndpoint(
      '3A: SDK BFF — JWT HS256 → Session Token',
      'https://web.us.prd.caf.io/bff/session-tokens',
      'GET',
      { 'Authorization': jwtToken }
    ));

    // ═══════════════════════════════════════════════════════════
    // GRUPO 4: Mobile API deprecated
    // Base URL: https://api.mobile.combateafraude.com
    // ═══════════════════════════════════════════════════════════

    console.log('[TEST] === GRUPO 4: Mobile API deprecated ===');

    // Test 4A: JWT Bearer — GET list
    results.push(await testEndpoint(
      '4A: Mobile API — JWT HS256 — GET /faces',
      'https://api.mobile.combateafraude.com/faces?_limit=1',
      'GET',
      { 'Authorization': `Bearer ${jwtToken}` }
    ));

    // Test 4B: JWT Bearer — POST transaction
    results.push(await testEndpoint(
      '4B: Mobile API — JWT HS256 — POST /transactions',
      'https://api.mobile.combateafraude.com/v1/transactions',
      'POST',
      { 'Authorization': `Bearer ${jwtToken}` },
      { template: { services: ['pfBasicData'] }, parameters: { cpf: '00000000000' } }
    ));

    // Test 4C: JWT Bearer — POST /transactions com origin=TRUST e templateId
    results.push(await testEndpoint(
      '4C: Mobile API — JWT HS256 — POST /v1/transactions?origin=TRUST',
      'https://api.mobile.combateafraude.com/v1/transactions?origin=TRUST',
      'POST',
      { 'Authorization': `Bearer ${jwtToken}` },
      { templateId: 'test', attributes: { cpf: '00000000000' } }
    ));

    // ═══════════════════════════════════════════════════════════
    // GRUPO 5: Tentar na CAF Connect com JWT em vez de OAuth2
    // (talvez aceite JWT direto como as credenciais Mobile?)
    // ═══════════════════════════════════════════════════════════
    
    console.log('[TEST] === GRUPO 5: CAF Connect com JWT direto ===');

    results.push(await testEndpoint(
      '5A: CAF Connect — JWT HS256 como Bearer — GET /v1/transactions',
      'https://api.us.prd.caf.io/v1/transactions?_limit=1',
      'GET',
      { 'Authorization': `Bearer ${jwtToken}` }
    ));

    results.push(await testEndpoint(
      '5B: CAF Connect — JWT HS256 raw (sem Bearer) — GET /v1/transactions',
      'https://api.us.prd.caf.io/v1/transactions?_limit=1',
      'GET',
      { 'Authorization': jwtToken }
    ));

    // ═══════════════════════════════════════════════════════════
    // RESUMO
    // ═══════════════════════════════════════════════════════════
    const summary = results.map(r => ({
      name: r.name,
      status: r.status,
      ok: r.ok,
      duration_ms: r.duration_ms,
      responsePreview: typeof r.response === 'object' 
        ? JSON.stringify(r.response).substring(0, 200) 
        : String(r.response).substring(0, 200),
    }));

    console.log('\n[TEST] ═══ RESUMO FINAL ═══');
    summary.forEach(s => {
      const icon = s.ok ? '✅' : '❌';
      console.log(`${icon} ${s.status} — ${s.name}`);
    });

    return Response.json({
      credentials: {
        clientId: CAF_CLIENT_ID,
        clientIdLength: CAF_CLIENT_ID.length,
        clientSecretLength: CAF_CLIENT_SECRET.length,
        clientSecretPrefix: CAF_CLIENT_SECRET.substring(0, 4) + '...',
      },
      oauthTokenObtained: !!connectAccessToken,
      connectAccessTokenLength: connectAccessToken?.length || 0,
      summary,
      details: results,
    });

  } catch (error) {
    console.error('[TEST] Fatal error:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});