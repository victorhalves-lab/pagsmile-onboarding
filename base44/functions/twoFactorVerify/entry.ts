import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Verifies TOTP + PIN (or backup code) and issues signed admin JWT.
// This REPLACES verifyAdminCode for enrolled users.

// ── Base32/TOTP ──
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32Decode(str) {
  const clean = str.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  const bits = [];
  for (const ch of clean) {
    const val = BASE32.indexOf(ch);
    if (val === -1) continue;
    bits.push(val.toString(2).padStart(5, '0'));
  }
  const bitStr = bits.join('');
  const bytes = new Uint8Array(Math.floor(bitStr.length / 8));
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(bitStr.substring(i * 8, i * 8 + 8), 2);
  return bytes;
}

async function hmacSha1(key, data) {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, data));
}

async function computeTotp(secretB32, counter) {
  const key = base32Decode(secretB32);
  const buf = new ArrayBuffer(8);
  new DataView(buf).setUint32(4, counter, false);
  const hmac = await hmacSha1(key, new Uint8Array(buf));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return (code % 1000000).toString().padStart(6, '0');
}

async function verifyTotp(secret, token) {
  const now = Math.floor(Date.now() / 1000 / 30);
  for (let w = -1; w <= 1; w++) {
    if ((await computeTotp(secret, now + w)) === token) return true;
  }
  return false;
}

// ── Hashing & encoding ──
function b64url(data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return b64url(new Uint8Array(hash));
}

// ── JWT signing ──
async function hmacSign(message, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return b64url(new Uint8Array(sig));
}

async function signAdminToken(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(payload));
  const sig = await hmacSign(`${headerB64}.${payloadB64}`, secret);
  return `${headerB64}.${payloadB64}.${sig}`;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ── Constants ──
const TOKEN_TTL_SECONDS = 4 * 60 * 60;
const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 60 * 60 * 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const ALLOWED_ROLES = new Set(['admin', 'introducer']);
    if (!ALLOWED_ROLES.has(user.role)) {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Introducer bypass (no 2FA required)
    if (user.role === 'introducer') {
      const secret = Deno.env.get('ADMIN_JWT_SECRET');
      if (!secret) return Response.json({ success: false, error: 'Server config error' }, { status: 500 });
      const now = Date.now();
      const token = await signAdminToken({
        sub: user.email, role: 'introducer', admin: false, introducer: true,
        iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + TOKEN_TTL_SECONDS,
      }, secret);
      return Response.json({ success: true, token, role: 'introducer' });
    }

    const body = await req.json().catch(() => ({}));
    const totpCode = String(body.totpCode || '').trim();
    const pin = String(body.pin || '').trim();
    const backupCode = String(body.backupCode || '').trim().toUpperCase();

    // Rate limit
    const recentAttempts = await base44.asServiceRole.entities.AdminLoginAttempt.filter({
      user_email: user.email, success: false,
    });
    const now = Date.now();
    const recentFailures = recentAttempts.filter(a => (now - new Date(a.created_date).getTime()) < ATTEMPT_WINDOW_MS);
    if (recentFailures.length >= MAX_FAILED_ATTEMPTS) {
      const oldest = Math.min(...recentFailures.map(a => new Date(a.created_date).getTime()));
      if (now - oldest < LOCKOUT_MS) {
        return Response.json({
          success: false, locked: true,
          retryAfterSeconds: Math.ceil((LOCKOUT_MS - (now - oldest)) / 1000),
          error: 'Muitas tentativas. Aguarde.'
        }, { status: 429 });
      }
    }

    const freshUser = await base44.asServiceRole.entities.User.get(user.id);
    if (!freshUser?.totp_enabled || !freshUser?.pin_enabled) {
      return Response.json({ success: false, error: 'NEEDS_ENROLLMENT', needsEnrollment: true }, { status: 400 });
    }

    const userAgent = (req.headers.get('user-agent') || '').substring(0, 255);

    // ─── Path A: backup code (single factor — consumes code) ───
    if (backupCode) {
      const inputHash = await sha256Hex(backupCode);
      const currentHashes = freshUser.backup_codes_hash || [];
      const idx = currentHashes.findIndex(h => timingSafeEqual(h, inputHash));

      if (idx === -1) {
        await base44.asServiceRole.entities.AdminLoginAttempt.create({
          user_email: user.email, success: false, reason: 'Invalid backup code', user_agent: userAgent,
        });
        await base44.asServiceRole.entities.TwoFactorAudit.create({
          user_email: user.email, event: 'totp_fail', details: { reason: 'bad_backup_code' },
        });
        return Response.json({ success: false, error: 'Código de backup inválido' }, { status: 403 });
      }

      // Consume the code
      const updatedHashes = [...currentHashes];
      updatedHashes.splice(idx, 1);
      await base44.asServiceRole.entities.User.update(user.id, { backup_codes_hash: updatedHashes });

      await base44.asServiceRole.entities.TwoFactorAudit.create({
        user_email: user.email, event: 'backup_code_used',
        details: { remaining: updatedHashes.length }, user_agent: userAgent,
      });
    } else {
      // ─── Path B: TOTP + PIN (normal flow) ───
      if (!/^\d{6}$/.test(totpCode) || !/^\d{6}$/.test(pin)) {
        return Response.json({ success: false, error: 'TOTP e PIN devem ter 6 dígitos' }, { status: 400 });
      }

      const totpValid = await verifyTotp(freshUser.totp_secret, totpCode);
      const pinHash = await sha256Hex(pin + ':' + (freshUser.pin_salt || ''));
      const pinValid = timingSafeEqual(pinHash, freshUser.pin_hash || '');

      if (!totpValid || !pinValid) {
        await base44.asServiceRole.entities.AdminLoginAttempt.create({
          user_email: user.email, success: false,
          reason: !totpValid ? 'TOTP fail' : 'PIN fail', user_agent: userAgent,
        });
        await base44.asServiceRole.entities.TwoFactorAudit.create({
          user_email: user.email, event: !totpValid ? 'totp_fail' : 'pin_fail', user_agent: userAgent,
        });
        return Response.json({ success: false, error: 'Código TOTP ou PIN inválido' }, { status: 403 });
      }

      await base44.asServiceRole.entities.TwoFactorAudit.create({
        user_email: user.email, event: 'totp_success', user_agent: userAgent,
      });
    }

    // ─── Issue JWT ───
    const jwtSecret = Deno.env.get('ADMIN_JWT_SECRET');
    if (!jwtSecret) return Response.json({ success: false, error: 'Server config error' }, { status: 500 });

    const token = await signAdminToken({
      sub: user.email, role: user.role, admin: true,
      iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + TOKEN_TTL_SECONDS,
    }, jwtSecret);

    await base44.asServiceRole.entities.AdminLoginAttempt.create({
      user_email: user.email, success: true,
      reason: backupCode ? 'Backup code used' : 'TOTP+PIN valid', user_agent: userAgent,
    });

    return Response.json({ success: true, token, role: 'admin' });
  } catch (error) {
    console.error('[twoFactorVerify]', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});