import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafConnectAuth — Authentication helper for CAF APIs
 *
 * Core API (legacy): CAF_CLIENT_SECRET as static Bearer token on api.combateafraude.com
 * Connect API (new): OAuth2 client_credentials on api.us.prd.caf.io/oauth2/token
 *   - Uses CAF_CONNECT_CLIENT_ID + CAF_CONNECT_CLIENT_SECRET
 *   - Access token cached in-memory until ~60s before expiry
 *
 * Reference: https://docs.caf.io/caf-api/connect/authentication/authenticating
 */

// ── In-memory token cache (per-instance) ──
let connectTokenCache = { accessToken: null, expiresAt: 0 };

async function fetchConnectAccessToken() {
  const clientId = Deno.env.get('CAF_CONNECT_CLIENT_ID');
  const clientSecret = Deno.env.get('CAF_CONNECT_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error('CAF_CONNECT_CLIENT_ID ou CAF_CONNECT_CLIENT_SECRET não configurados');
  }

  const now = Date.now();
  // Reuse cached token if still valid (60s safety buffer)
  if (connectTokenCache.accessToken && connectTokenCache.expiresAt - 60_000 > now) {
    return {
      accessToken: connectTokenCache.accessToken,
      expiresAt: connectTokenCache.expiresAt,
      cached: true,
    };
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch('https://api.us.prd.caf.io/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: body.toString(),
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  if (!res.ok || !json.access_token) {
    throw new Error(`CAF Connect OAuth2 falhou: HTTP ${res.status} — ${JSON.stringify(json)}`);
  }

  const expiresInMs = (Number(json.expires_in) || 3600) * 1000;
  connectTokenCache = {
    accessToken: json.access_token,
    expiresAt: now + expiresInMs,
  };

  return {
    accessToken: json.access_token,
    expiresAt: connectTokenCache.expiresAt,
    tokenType: json.token_type || 'Bearer',
    expiresIn: json.expires_in,
    cached: false,
  };
}

// Export helper for other backend functions
export async function getCafConnectAccessToken() {
  return await fetchConnectAccessToken();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const method = body.method || 'connect';

    if (method === 'core') {
      return Response.json({
        success: true,
        method: 'core',
        token_type: 'Bearer',
        note: 'Static Bearer token (CAF_CLIENT_SECRET) for Core API (api.combateafraude.com)',
      });
    }

    if (method === 'connect') {
      const tok = await fetchConnectAccessToken();
      return Response.json({
        success: true,
        method: 'connect',
        token_type: tok.tokenType || 'Bearer',
        access_token_preview: `${tok.accessToken.slice(0, 20)}...${tok.accessToken.slice(-10)}`,
        access_token_length: tok.accessToken.length,
        expires_at: new Date(tok.expiresAt).toISOString(),
        cached: tok.cached,
        expires_in: tok.expiresIn,
        note: 'OAuth2 client_credentials token for Connect API (api.us.prd.caf.io). Use Authorization: Bearer <access_token>.',
      });
    }

    return Response.json({ error: `method '${method}' não reconhecido` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});