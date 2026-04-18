import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Admin-only: resets 2FA of another user.
// Forces them to re-enroll on next login.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const actor = await base44.auth.me().catch(() => null);
    if (!actor?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (actor.role !== 'admin') return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const targetUserId = String(body.userId || '').trim();
    if (!targetUserId) return Response.json({ error: 'userId required' }, { status: 400 });

    const target = await base44.asServiceRole.entities.User.get(targetUserId);
    if (!target) return Response.json({ error: 'User not found' }, { status: 404 });

    await base44.asServiceRole.entities.User.update(targetUserId, {
      totp_secret: null,
      totp_enabled: false,
      pin_hash: null,
      pin_salt: null,
      pin_enabled: false,
      backup_codes_hash: [],
      force_2fa_reset: true,
    });

    await base44.asServiceRole.entities.TwoFactorAudit.create({
      user_email: target.email,
      event: 'admin_reset',
      details: { reset_by: actor.email, reason: body.reason || '' },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('[twoFactorResetUser]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});