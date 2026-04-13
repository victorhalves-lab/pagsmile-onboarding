import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafTestAuth — Tests auth across all CAF API endpoints
 * Now uses CAF_CLIENT_SECRET directly as Bearer token for Core API.
 */

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

    if (!CAF_CLIENT_SECRET) {
      return Response.json({ error: 'CAF_CLIENT_SECRET not set' }, { status: 500 });
    }

    const results = [];

    // Test 1: Core API — Bearer with static token (our primary method)
    results.push(await testEndpoint(
      '1: Core API — Static Bearer Token',
      'https://api.combateafraude.com/v1/transactions?_limit=1',
      'GET',
      { 'Authorization': `Bearer ${CAF_CLIENT_SECRET}` }
    ));

    // Test 2: Core API — Create Transaction (PF basic data)
    results.push(await testEndpoint(
      '2: Core API — Create Transaction (pfBasicData)',
      'https://api.combateafraude.com/v1/transactions',
      'POST',
      { 'Authorization': `Bearer ${CAF_CLIENT_SECRET}` },
      { template: { services: ['pfBasicData'] }, parameters: { cpf: '00000000000' } }
    ));

    // Test 3: Core API — Get Profile (people)
    results.push(await testEndpoint(
      '3: Core API — Get Person Profile',
      'https://api.combateafraude.com/v1/people/00000000000',
      'GET',
      { 'Authorization': `Bearer ${CAF_CLIENT_SECRET}` }
    ));

    // Test 4: Core API — Create Onboarding
    results.push(await testEndpoint(
      '4: Core API — Create Onboarding (test)',
      'https://api.combateafraude.com/v1/onboardings?origin=TRUST',
      'POST',
      { 'Authorization': `Bearer ${CAF_CLIENT_SECRET}` },
      { type: 'PF', transactionTemplateId: 'test-dummy-id', noNotification: true }
    ));

    // Test 5: Core API — Face Registration endpoint
    results.push(await testEndpoint(
      '5: Core API — Faces endpoint',
      'https://api.combateafraude.com/v1/faces',
      'POST',
      { 'Authorization': `Bearer ${CAF_CLIENT_SECRET}` },
      { personId: '00000000000', imageUrl: 'https://example.com/test.png' }
    ));

    // Test 6: Connect API — OAuth2 (requires separate credentials)
    if (CAF_CLIENT_ID) {
      results.push(await testEndpoint(
        '6: Connect API — OAuth2 (may need separate creds)',
        'https://api.us.prd.caf.io/oauth2/token',
        'POST',
        {},
        `grant_type=client_credentials&client_id=${encodeURIComponent(CAF_CLIENT_ID)}&client_secret=${encodeURIComponent(CAF_CLIENT_SECRET)}`,
        'form'
      ));
    }

    const summary = results.map(r => ({
      name: r.name, status: r.status, ok: r.ok, duration_ms: r.duration_ms,
      responsePreview: typeof r.response === 'object' ? JSON.stringify(r.response).substring(0, 200) : String(r.response).substring(0, 200),
    }));

    return Response.json({
      credentials: {
        clientId: CAF_CLIENT_ID,
        clientSecretLength: CAF_CLIENT_SECRET?.length || 0,
        clientSecretPrefix: (CAF_CLIENT_SECRET || '').substring(0, 8) + '...',
      },
      summary,
      details: results,
    });

  } catch (error) {
    console.error('[TEST] Fatal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});