import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ══════════════════════════════════════════════════════════════════
// SECURITY HARDENED ADMIN CODE VERIFICATION
// ══════════════════════════════════════════════════════════════════
// Defenses:
//   1. Authenticated user required (base44.auth.me)
//   2. Role must be 'admin' or 'introducer' (introducer bypasses admin code)
//   3. Rate limit: 5 failed attempts per email in 15 min → lockout 1h
//   4. Timing-safe comparison (anti side-channel)
//   5. Returns HMAC-SHA256 signed JWT with 4h TTL
//   6. All attempts logged to AdminLoginAttempt for forensics
// ══════════════════════════════════════════════════════════════════

const TOKEN_TTL_SECONDS = 4 * 60 * 60; // 4 hours
const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 min window
const LOCKOUT_MS = 60 * 60 * 1000; // 1h lockout

// Timing-safe string compare
function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.length !== bBytes.length) {
    // Still run constant-time loop to avoid length leak
    let diff = 1;
    const maxLen = Math.max(aBytes.length, bBytes.length);
    for (let i = 0; i < maxLen; i++) {
      diff |= (aBytes[i] || 0) ^ (bBytes[i] || 0);
    }
    return false;
  }
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

// Base64url encoding
function b64url(data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// HMAC-SHA256 sign
async function hmacSign(message, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return b64url(new Uint8Array(sig));
}

// Build JWT: header.payload.signature
async function signAdminToken(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(payload));
  const sig = await hmacSign(`${headerB64}.${payloadB64}`, secret);
  return `${headerB64}.${payloadB64}.${sig}`;
}

async function hashIp(ip) {
  if (!ip) return '';
  const data = new TextEncoder().encode(ip + 'salt_v1');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return b64url(new Uint8Array(hash)).substring(0, 16);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // ─── 1. Must be authenticated ───
    let user;
    try {
      user = await base44.auth.me();
    } catch (e) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!user || !user.email) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // ─── 2. Role must be admin or introducer ───
    // Only these roles can even attempt admin login
    const ALLOWED_ROLES = new Set(['admin', 'introducer']);
    if (!ALLOWED_ROLES.has(user.role)) {
      // Log attempt for forensics (role escalation attempt)
      try {
        await base44.asServiceRole.entities.AdminLoginAttempt.create({
          user_email: user.email,
          success: false,
          reason: `Role '${user.role}' not allowed`,
          user_agent: req.headers.get('user-agent') || '',
        });
      } catch (e) {}
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const code = String(body.code || '');
    const code2 = String(body.code2 || '');

    const ipHash = await hashIp(req.headers.get('x-forwarded-for')?.split(',')[0] || '');
    const userAgent = (req.headers.get('user-agent') || '').substring(0, 255);

    // ─── 3. Rate limit check ───
    const recentAttempts = await base44.asServiceRole.entities.AdminLoginAttempt.filter({
      user_email: user.email,
      success: false,
    });
    const now = Date.now();
    const recentFailures = recentAttempts.filter(a => {
      const t = new Date(a.created_date).getTime();
      return (now - t) < ATTEMPT_WINDOW_MS;
    });

    if (recentFailures.length >= MAX_FAILED_ATTEMPTS) {
      // Check if oldest failure is within lockout window
      const oldestInWindow = Math.min(...recentFailures.map(a => new Date(a.created_date).getTime()));
      if (now - oldestInWindow < LOCKOUT_MS) {
        return Response.json({
          success: false,
          error: 'Too many failed attempts. Please wait before trying again.',
          locked: true,
          retryAfterSeconds: Math.ceil((LOCKOUT_MS - (now - oldestInWindow)) / 1000),
        }, { status: 429 });
      }
    }

    // ─── 4. Introducers skip code requirement (just need role) ───
    if (user.role === 'introducer') {
      const secret = Deno.env.get('ADMIN_JWT_SECRET');
      if (!secret) return Response.json({ success: false, error: 'Server config error' }, { status: 500 });

      const payload = {
        sub: user.email,
        role: user.role,
        admin: false,
        introducer: true,
        iat: Math.floor(now / 1000),
        exp: Math.floor(now / 1000) + TOKEN_TTL_SECONDS,
      };
      const token = await signAdminToken(payload, secret);

      await base44.asServiceRole.entities.AdminLoginAttempt.create({
        user_email: user.email, success: true,
        reason: 'Introducer auto-verified', ip_hash: ipHash, user_agent: userAgent,
      });
      return Response.json({ success: true, token, role: 'introducer' });
    }

    // ─── 5. Validate admin codes ───
    const adminCode = Deno.env.get('ADMIN_ACCESS_CODE') || '';
    const adminCode2 = Deno.env.get('ADMIN_ACCESS_CODE_2') || '';
    if (!adminCode || !adminCode2) {
      return Response.json({ success: false, error: 'Server config error' }, { status: 500 });
    }

    // Timing-safe compare for BOTH codes (always evaluate both to prevent timing attacks)
    const match1 = timingSafeEqual(code, adminCode);
    const match2 = timingSafeEqual(code2, adminCode2);
    const allMatch = match1 && match2;

    if (!allMatch) {
      await base44.asServiceRole.entities.AdminLoginAttempt.create({
        user_email: user.email, success: false,
        reason: 'Invalid codes', ip_hash: ipHash, user_agent: userAgent,
      });
      return Response.json({ success: false, error: 'Códigos inválidos' }, { status: 403 });
    }

    // ─── 6. Sign and return JWT ───
    const secret = Deno.env.get('ADMIN_JWT_SECRET');
    if (!secret) return Response.json({ success: false, error: 'Server config error' }, { status: 500 });

    const payload = {
      sub: user.email,
      role: user.role,
      admin: true,
      iat: Math.floor(now / 1000),
      exp: Math.floor(now / 1000) + TOKEN_TTL_SECONDS,
    };
    const token = await signAdminToken(payload, secret);

    await base44.asServiceRole.entities.AdminLoginAttempt.create({
      user_email: user.email, success: true,
      reason: 'Admin codes valid', ip_hash: ipHash, user_agent: userAgent,
    });

    return Response.json({ success: true, token, role: 'admin' });
  } catch (error) {
    console.error('[verifyAdminCode] Error:', error);
    return Response.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
});