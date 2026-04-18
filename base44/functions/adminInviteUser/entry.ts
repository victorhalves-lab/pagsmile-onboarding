// Post-invite step: called AFTER the frontend triggers base44.users.inviteUser().
// This function assigns the chosen profile to the newly invited user and creates
// the UserProfileAssignment + AccessAudit records.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller || caller.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, fullName, profileSlug, reason } = await req.json();
    if (!email || !profileSlug) {
      return Response.json({ error: 'email e profileSlug são obrigatórios' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const profiles = await base44.asServiceRole.entities.AccessProfile.filter({ slug: profileSlug });
    const profile = profiles[0];
    if (!profile) {
      return Response.json({ error: `Perfil "${profileSlug}" não encontrado` }, { status: 404 });
    }

    // Look up the user (invitation may take a moment — retry up to 3x)
    let user = null;
    for (let i = 0; i < 3; i++) {
      const list = await base44.asServiceRole.entities.User.filter({ email: normalizedEmail });
      if (list[0]) { user = list[0]; break; }
      await new Promise(r => setTimeout(r, 1000));
    }

    if (!user) {
      return Response.json({
        success: false,
        pending: true,
        message: 'Convite enviado, mas o registro do usuário ainda não foi criado. O perfil será atribuído quando ele fizer o primeiro login.'
      });
    }

    // Update role on User entity
    if (user.role !== profileSlug) {
      await base44.asServiceRole.entities.User.update(user.id, { role: profileSlug });
    }

    // Mark previous current assignments as not current
    const previous = await base44.asServiceRole.entities.UserProfileAssignment.filter({
      user_email: normalizedEmail, is_current: true
    });
    for (const prev of previous) {
      await base44.asServiceRole.entities.UserProfileAssignment.update(prev.id, { is_current: false });
    }

    await base44.asServiceRole.entities.UserProfileAssignment.create({
      user_email: normalizedEmail,
      user_full_name: user.full_name || fullName || '',
      profile_slug: profileSlug,
      profile_name: profile.name,
      assigned_by_email: caller.email,
      assigned_by_name: caller.full_name || '',
      assigned_at: new Date().toISOString(),
      is_current: true,
      reason: reason || 'Convite inicial'
    });

    await base44.asServiceRole.entities.AccessAudit.create({
      user_email: caller.email,
      user_name: caller.full_name || '',
      profile_slug: caller.role,
      action: 'user_assigned',
      allowed: true,
      details: { target_email: normalizedEmail, profile_slug: profileSlug, via: 'invite' }
    });

    return Response.json({
      success: true,
      user: { id: user.id, email: user.email, role: profileSlug },
      message: `Perfil "${profile.name}" atribuído a ${normalizedEmail}.`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});