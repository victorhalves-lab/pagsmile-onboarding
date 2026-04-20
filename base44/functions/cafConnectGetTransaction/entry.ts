import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafConnectGetTransaction — busca resultado de uma transaction por ID.
 * GET /v1/transactions/:id
 *
 * Entrada: { transactionId, includeCroppedImages?: boolean }
 */

const CONNECT_BASE = 'https://api.us.prd.caf.io';
let tokenCache = { accessToken: null, expiresAt: 0 };

async function getAccessToken() {
  const clientId = Deno.env.get('CAF_CONNECT_CLIENT_ID');
  const clientSecret = Deno.env.get('CAF_CONNECT_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('CAF_CONNECT_CLIENT_ID/SECRET não configurados');
  const now = Date.now();
  if (tokenCache.accessToken && tokenCache.expiresAt - 60_000 > now) return tokenCache.accessToken;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(`${CONNECT_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: body.toString(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new Error(`OAuth2 falhou: ${JSON.stringify(json)}`);
  tokenCache = { accessToken: json.access_token, expiresAt: now + (Number(json.expires_in) || 3600) * 1000 };
  return json.access_token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { transactionId, includeCroppedImages = false, lang = 'pt' } = body;

    if (!transactionId) return Response.json({ error: 'transactionId é obrigatório' }, { status: 400 });

    const accessToken = await getAccessToken();
    const params = new URLSearchParams({
      _includeCroppedImages: String(!!includeCroppedImages),
      _lang: lang,
    });

    const t0 = Date.now();
    const res = await fetch(`${CONNECT_BASE}/v1/transactions/${transactionId}?${params}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
    });
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = { raw: text.substring(0, 500) }; }

    return Response.json({
      success: res.ok,
      status: res.status,
      duration_ms: Date.now() - t0,
      data,
      ...(res.ok ? {} : { error: data?.message || `HTTP ${res.status}` }),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});