import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Returns the current 2FA status of the authenticated user.
// Used by frontend gate to decide: show enrollment screen, login screen, or proceed.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const freshUser = await base44.asServiceRole.entities.User.get(user.id);
    const totpEnabled = !!freshUser?.totp_enabled;
    const pinEnabled = !!freshUser?.pin_enabled;
    const forceReset = !!freshUser?.force_2fa_reset;
    const enrolled = totpEnabled && pinEnabled && !forceReset;

    return Response.json({
      enrolled,
      totpEnabled,
      pinEnabled,
      forceReset,
      enrolledAt: freshUser?.two_factor_enrolled_at || null,
      backupCodesRemaining: (freshUser?.backup_codes_hash || []).length,
      role: user.role,
    });
  } catch (error) {
    console.error('[twoFactorStatus]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});