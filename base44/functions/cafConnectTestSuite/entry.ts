import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafConnectTestSuite — Admin-only sanity test for the new Connect API.
 *
 * Runs 4 tests against api.us.prd.caf.io using OAuth2 client_credentials:
 *   1. OAuth2 token exchange
 *   2. List Transactions (read)
 *   3. Get Person profile (read, expects 404 for dummy cpf)
 *   4. Get Company profile (read, expects 404 for dummy cnpj)
 *
 * All tests are READ-ONLY — no transactions/onboardings are created (no cost).
 */

const CONNECT_API_BASE = 'https://api.us.prd.caf.io';

let tokenCache = { accessToken: null, expiresAt: 0 };

async function getConnectToken() {
  const clientId = Deno.env.get('CAF_CONNECT_CLIENT_ID');
  const clientSecret = Deno.env.get('CAF_CONNECT_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('CAF_CONNECT_CLIENT_ID/SECRET missing');

  const now = Date.now();
  if (tokenCache.accessToken && tokenCache.expiresAt - 60_000 > now) {
    return { accessToken: tokenCache.accessToken, cached: true };
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

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  if (!res.ok || !json.access_token) {
    throw new Error(`OAuth2 falhou HTTP ${res.status}: ${JSON.stringify(json)}`);
  }

  tokenCache = {
    accessToken: json.access_token,
    expiresAt: now + (Number(json.expires_in) || 3600) * 1000,
  };
  return { accessToken: json.access_token, expiresIn: json.expires_in, cached: false };
}

async function testEndpoint(name, url, token, acceptedStatuses = [200, 400, 404]) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { raw: text.substring(0, 300) }; }

    const ok = acceptedStatuses.includes(res.status);
    return {
      name,
      url,
      status: res.status,
      ok,
      latency_ms: Date.now() - start,
      responsePreview: ok ? (body.requestId ? { requestId: body.requestId, keys: Object.keys(body).slice(0, 10) } : body) : body,
    };
  } catch (err) {
    return {
      name, url, status: 'ERROR', ok: false,
      latency_ms: Date.now() - start, error: err.message,
    };
  }
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Step 1: OAuth2
    const tokenStart = Date.now();
    const tok = await getConnectToken();
    const tokenResult = {
      name: 'OAuth2 client_credentials',
      ok: true,
      latency_ms: Date.now() - tokenStart,
      tokenLength: tok.accessToken.length,
      expiresIn: tok.expiresIn,
      cached: tok.cached,
    };

    // Step 2-4: read endpoints in parallel
    const [listTx, person, company] = await Promise.all([
      testEndpoint(
        'List Transactions',
        `${CONNECT_API_BASE}/v1/transactions?_limit=1`,
        tok.accessToken
      ),
      testEndpoint(
        'Get Person Profile (404 expected)',
        `${CONNECT_API_BASE}/v1/profiles/peoples/00000000000`,
        tok.accessToken
      ),
      testEndpoint(
        'Get Company Profile (404 expected)',
        `${CONNECT_API_BASE}/v1/profiles/companies/00000000000000`,
        tok.accessToken
      ),
    ]);

    const tests = [tokenResult, listTx, person, company];
    const allOk = tests.every(t => t.ok);

    return Response.json({
      success: true,
      allOk,
      summary: `${tests.filter(t => t.ok).length}/${tests.length} tests passed`,
      tests,
      totalDuration_ms: Date.now() - startTime,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});