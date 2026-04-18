import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Generates a TOTP secret + otpauth URI for QR code.
// Does NOT persist — user must confirm via twoFactorEnrollConfirm.

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function generateBase32Secret(length = 32) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += BASE32_ALPHABET[bytes[i] % 32];
  }
  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // CRITICAL: reuse existing pending secret if enrollment is not complete yet.
    // Otherwise, every remount/StrictMode re-run regenerates the secret and invalidates
    // the QR code the user just scanned — causing "TOTP inválido" on confirm.
    const fresh = await base44.asServiceRole.entities.User.get(user.id);
    let secret = fresh?.totp_secret;
    const alreadyEnrolled = !!fresh?.totp_enabled;

    if (alreadyEnrolled) {
      return Response.json({ error: '2FA já configurado' }, { status: 400 });
    }

    const isNewSecret = !secret || secret.length < 16;
    if (isNewSecret) {
      secret = generateBase32Secret(32);
      await base44.asServiceRole.entities.User.update(user.id, {
        totp_secret: secret,
        totp_enabled: false,
      });
      await base44.asServiceRole.entities.TwoFactorAudit.create({
        user_email: user.email,
        event: 'enroll_start',
        user_agent: (req.headers.get('user-agent') || '').substring(0, 255),
      });
    }

    const issuer = 'Pagsmile Admin';
    const label = encodeURIComponent(`${issuer}:${user.email}`);
    const otpauthUri = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

    return Response.json({ success: true, otpauthUri, secret, reused: !isNewSecret });
  } catch (error) {
    console.error('[twoFactorEnrollStart]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});