import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Probes each Connect API permission by making a harmless read (or minimal validation call)
 * to determine what the current credentials can actually do.
 *
 * Results inform the migration strategy.
 */

const CONNECT_API_BASE = 'https://api.us.prd.caf.io';

async function getToken() {
  const clientId = Deno.env.get('CAF_CONNECT_CLIENT_ID');
  const clientSecret = Deno.env.get('CAF_CONNECT_CLIENT_SECRET');
  const body = new URLSearchParams({
    grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret,
  });
  const res = await fetch(`${CONNECT_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const json = await res.json();
  return json.access_token;
}

async function probe(name, method, path, extra = {}) {
  const token = extra._token;
  const start = Date.now();
  try {
    const opts = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
      },
    };
    if (extra.body) opts.body = JSON.stringify(extra.body);

    const res = await fetch(`${CONNECT_API_BASE}${path}`, opts);
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { raw: text.substring(0, 300) }; }

    // Interpret the status to determine permission
    let verdict;
    if (res.status === 403 && /not authorized/i.test(body.Message || body.message || '')) {
      verdict = 'DENIED (permission missing)';
    } else if (res.status === 401) {
      verdict = 'AUTH FAILED (bad token)';
    } else if (res.status >= 500) {
      verdict = 'SERVER ERROR';
    } else {
      verdict = 'ALLOWED';
    }

    return {
      name, method, path,
      status: res.status,
      latency_ms: Date.now() - start,
      verdict,
      response: body,
    };
  } catch (err) {
    return { name, method, path, status: 'ERROR', verdict: 'NETWORK ERROR', error: err.message };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const token = await getToken();

    // Probes — each one maps to one permission in the Connect API
    const results = await Promise.all([
      probe('Read Transaction (list)', 'GET', '/v1/transactions?_limit=1', { _token: token }),
      probe('Read People Profile', 'GET', '/v1/profiles/peoples/00000000000', { _token: token }),
      probe('Read Company Profile', 'GET', '/v1/profiles/companies/00000000000000', { _token: token }),
      // Create Onboarding: we send an intentionally INVALID body — if we get 400 it means
      // the permission is granted (just the payload was rejected); if we get 403 it means denied.
      probe('Create Onboarding (bad body)', 'POST', '/v1/onboardings?origin=TRUST', {
        _token: token,
        body: { type: 'PF' }, // missing transactionTemplateId — should 400 if allowed
      }),
      // Create Transaction probe (same trick: missing templateId should return 400 if allowed)
      probe('Create Transaction (bad body)', 'POST', '/v1/transactions?origin=TRUST', {
        _token: token,
        body: {},
      }),
      // Read Face Authentication Attempts
      probe('Read Face Attempt', 'GET', '/v1/faces/attempts/00000000000000000000000000', { _token: token }),
    ]);

    const allowed = results.filter(r => r.verdict === 'ALLOWED').map(r => r.name);
    const denied = results.filter(r => r.verdict.startsWith('DENIED')).map(r => r.name);

    return Response.json({
      success: true,
      summary: {
        allowedPermissions: allowed,
        deniedPermissions: denied,
        totalProbed: results.length,
      },
      details: results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});