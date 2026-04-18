import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ══════════════════════════════════════════════════════════════════
// VERIFY ADMIN TOKEN — Validates an admin JWT server-side
// ══════════════════════════════════════════════════════════════════
// Called by the frontend on every mount to verify the session is still valid.
// CANNOT be bypassed by manipulating sessionStorage or React DevTools because
// the signature validation happens on the server.
// ══════════════════════════════════════════════════════════════════

function b64urlDecode(str) {
  const pad = str.length % 4 ? '='.repeat(4 - (str.length % 4)) : '';
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function b64url(data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacSign(message, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return b64url(new Uint8Array(sig));
}

function timingSafeEqualStr(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyAdminJwt(token, secret) {
  if (!token || typeof token !== 'string') return { valid: false, reason: 'no_token' };
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false, reason: 'malformed' };

  const [headerB64, payloadB64, sig] = parts;
  const expectedSig = await hmacSign(`${headerB64}.${payloadB64}`, secret);
  if (!timingSafeEqualStr(sig, expectedSig)) return { valid: false, reason: 'bad_signature' };

  let payload;
  try {
    const decoded = new TextDecoder().decode(b64urlDecode(payloadB64));
    payload = JSON.parse(decoded);
  } catch (e) { return { valid: false, reason: 'bad_payload' }; }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) return { valid: false, reason: 'expired' };
  if (!payload.iat || payload.iat > now + 60) return { valid: false, reason: 'future_iat' };

  return { valid: true, payload };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Must be authenticated
    let user;
    try { user = await base44.auth.me(); } catch (e) {
      return Response.json({ valid: false, reason: 'unauthenticated' }, { status: 401 });
    }
    if (!user || !user.email) {
      return Response.json({ valid: false, reason: 'unauthenticated' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const token = String(body.token || '');
    const secret = Deno.env.get('ADMIN_JWT_SECRET');
    if (!secret) return Response.json({ valid: false, reason: 'server_config' }, { status: 500 });

    const result = await verifyAdminJwt(token, secret);
    if (!result.valid) return Response.json({ valid: false, reason: result.reason });

    // Double-check: token subject must match authenticated user
    if (result.payload.sub !== user.email) {
      return Response.json({ valid: false, reason: 'subject_mismatch' });
    }
    // Role must still match user's current role
    if (result.payload.role !== user.role) {
      return Response.json({ valid: false, reason: 'role_mismatch' });
    }

    return Response.json({
      valid: true,
      role: result.payload.role,
      admin: result.payload.admin === true,
      introducer: result.payload.introducer === true,
      exp: result.payload.exp,
    });
  } catch (error) {
    console.error('[verifyAdminToken] Error:', error);
    return Response.json({ valid: false, reason: 'internal_error' }, { status: 500 });
  }
});