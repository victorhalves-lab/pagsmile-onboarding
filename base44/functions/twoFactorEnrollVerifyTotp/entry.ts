import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Step 1 of enrollment: validates the TOTP code immediately while it's fresh,
// and marks the user as "TOTP verified" so the next step (PIN) doesn't fail
// because the code already expired.

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

async function computeTotp(secretB32, counter) {
  const key = base32Decode(secretB32);
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(4, counter, false);
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, new Uint8Array(buf)));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return (code % 1000000).toString().padStart(6, '0');
}

async function verifyTotp(secret, token) {
  const now = Math.floor(Date.now() / 1000 / 30);
  for (let w = -1; w <= 1; w++) {
    const expected = await computeTotp(secret, now + w);
    if (expected === token) return true;
  }
  return false;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const totpCode = String(body.totpCode || '').trim();
    if (!/^\d{6}$/.test(totpCode)) return Response.json({ error: 'Código TOTP inválido' }, { status: 400 });

    const fresh = await base44.asServiceRole.entities.User.get(user.id);
    if (!fresh?.totp_secret) return Response.json({ error: 'Secret TOTP não iniciado' }, { status: 400 });

    const ok = await verifyTotp(fresh.totp_secret, totpCode);
    if (!ok) return Response.json({ error: 'Código TOTP inválido. Aguarde o próximo código no app e tente novamente.' }, { status: 400 });

    // Mark TOTP as verified — valid for the PIN step within 10 minutes.
    await base44.asServiceRole.entities.User.update(user.id, {
      totp_enroll_verified_at: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('[twoFactorEnrollVerifyTotp]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});