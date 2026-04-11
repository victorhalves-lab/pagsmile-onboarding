import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { encodeBase64 } from 'https://deno.land/std@0.220.0/encoding/base64.ts';

/**
 * cafConnectAuth — Helper de autenticação para APIs CAF
 *
 * Suporta dois métodos:
 *   1. Core API (api.combateafraude.com) — JWT HS256 ← ATIVO
 *   2. Connect API (api.public.caf.io) — OAuth2 Client Credentials ← Requer credenciais separadas
 *
 * NOTA: As credenciais atuais (CAF_CLIENT_ID / CAF_CLIENT_SECRET) autenticam apenas na Core API.
 * A Connect API precisa de credenciais OAuth2 separadas, solicitadas ao suporte CAF.
 */

function base64UrlEncode(data) {
  const b64 = encodeBase64(data);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getCoreToken() {
  const clientId = Deno.env.get('CAF_CLIENT_ID');
  const clientSecret = Deno.env.get('CAF_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('CAF_CLIENT_ID/SECRET not configured');
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: clientId, exp: now + 300 };
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(clientSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  return `${headerB64}.${payloadB64}.${base64UrlEncode(new Uint8Array(signature))}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const method = body.method || 'core';

    if (method === 'core') {
      const token = await getCoreToken();
      return Response.json({
        success: true,
        method: 'core',
        token_type: 'Bearer',
        note: 'JWT HS256 para Core API (api.combateafraude.com)',
      });
    }

    if (method === 'connect') {
      return Response.json({
        success: false,
        method: 'connect',
        error: 'Connect API requer credenciais OAuth2 separadas (CAF_CONNECT_CLIENT_ID / CAF_CONNECT_CLIENT_SECRET).',
        note: 'Solicite ao suporte CAF credenciais para a Connect API (api.public.caf.io). Quando obtidas, configure os secrets e atualize esta função.',
      });
    }

    return Response.json({ error: `method '${method}' não reconhecido (use 'core' ou 'connect')` }, { status: 400 });
  } catch (error) {
    console.error('[CAF Auth] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});