import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Confirms TOTP by validating user's first code, creates PIN, generates backup codes.
// Completes the full 2FA enrollment.

// ── Base32 decode (RFC 4648) ──
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
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bitStr.substring(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

async function hmacSha1(key, data) {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, data));
}

async function computeTotp(secretB32, counter) {
  const key = base32Decode(secretB32);
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(4, counter, false);
  const hmac = await hmacSha1(key, new Uint8Array(buf));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return (code % 1000000).toString().padStart(6, '0');
}

async function verifyTotp(secret, token) {
  const now = Math.floor(Date.now() / 1000 / 30);
  // ±1 window tolerance
  for (let w = -1; w <= 1; w++) {
    const expected = await computeTotp(secret, now + w);
    if (expected === token) return true;
  }
  return false;
}

function b64url(bytes) {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return b64url(new Uint8Array(hash));
}

function generateSalt(length = 16) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return b64url(bytes);
}

function generateBackupCode() {
  // 10 chars: 2 groups of 5 (A-Z + 2-9)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < 10; i++) {
    if (i === 5) code += '-';
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const pin = String(body.pin || '').trim();
    const totpCode = String(body.totpCode || '').trim(); // optional fallback

    if (!/^\d{6}$/.test(pin)) return Response.json({ error: 'PIN deve ter 6 dígitos' }, { status: 400 });

    const freshUser = await base44.asServiceRole.entities.User.get(user.id);
    if (!freshUser?.totp_secret) {
      return Response.json({ error: 'Secret TOTP não iniciado' }, { status: 400 });
    }

    // Accept if TOTP was already verified in step 1 within the last 10 minutes.
    const verifiedAt = freshUser.totp_enroll_verified_at ? new Date(freshUser.totp_enroll_verified_at).getTime() : 0;
    const verifiedRecent = verifiedAt > 0 && (Date.now() - verifiedAt) < 10 * 60 * 1000;

    let totpValid = verifiedRecent;
    // Fallback: if TOTP was resubmitted, validate it now (keeps backward compat).
    if (!totpValid && /^\d{6}$/.test(totpCode)) {
      totpValid = await verifyTotp(freshUser.totp_secret, totpCode);
    }
    if (!totpValid) {
      await base44.asServiceRole.entities.TwoFactorAudit.create({
        user_email: user.email, event: 'totp_fail',
        details: { phase: 'enrollment' },
      });
      return Response.json({ error: 'Código TOTP expirado. Volte ao passo 1 e digite um novo código.' }, { status: 400 });
    }

    // Hash PIN with salt
    const pinSalt = generateSalt(16);
    const pinHash = await sha256Hex(pin + ':' + pinSalt);

    // Generate 10 backup codes
    const backupCodes = [];
    const backupHashes = [];
    for (let i = 0; i < 10; i++) {
      const code = generateBackupCode();
      backupCodes.push(code);
      backupHashes.push(await sha256Hex(code));
    }

    // Persist full enrollment
    await base44.asServiceRole.entities.User.update(user.id, {
      totp_enabled: true,
      pin_hash: pinHash,
      pin_salt: pinSalt,
      pin_enabled: true,
      two_factor_enrolled_at: new Date().toISOString(),
      backup_codes_hash: backupHashes,
      force_2fa_reset: false,
    });

    await base44.asServiceRole.entities.TwoFactorAudit.create({
      user_email: user.email, event: 'enroll_complete',
      user_agent: (req.headers.get('user-agent') || '').substring(0, 255),
    });

    return Response.json({ success: true, backupCodes });
  } catch (error) {
    console.error('[twoFactorEnrollConfirm]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});