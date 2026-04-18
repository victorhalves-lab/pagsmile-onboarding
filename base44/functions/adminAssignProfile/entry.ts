import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Atribui um perfil a um usuário (atualiza user.role + loga histórico).

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const actor = await base44.auth.me().catch(() => null);
    if (!actor || actor.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { userId, profileSlug, reason } = body;
    if (!userId || !profileSlug) {
      return Response.json({ error: 'userId and profileSlug required' }, { status: 400 });
    }

    // Garantir que o perfil existe
    const profiles = await base44.asServiceRole.entities.AccessProfile.filter({ slug: profileSlug });
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    // Buscar user
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    const targetUser = users[0];
    if (!targetUser) return Response.json({ error: 'User not found' }, { status: 404 });

    const oldRole = targetUser.role;

    // Não permitir rebaixar o próprio admin
    if (targetUser.email === actor.email && oldRole === 'admin' && profileSlug !== 'admin') {
      return Response.json({ error: 'Cannot remove admin role from yourself' }, { status: 400 });
    }

    // Atualizar role
    await base44.asServiceRole.entities.User.update(userId, { role: profileSlug });

    // Marcar assignments anteriores como não-current
    try {
      const prior = await base44.asServiceRole.entities.UserProfileAssignment.filter({
        user_email: targetUser.email, is_current: true
      });
      for (const a of prior) {
        await base44.asServiceRole.entities.UserProfileAssignment.update(a.id, { is_current: false });
      }
    } catch {}

    // Criar novo assignment
    const assignment = await base44.asServiceRole.entities.UserProfileAssignment.create({
      user_email: targetUser.email,
      user_full_name: targetUser.full_name,
      profile_slug: profileSlug,
      profile_name: profile.name,
      assigned_by_email: actor.email,
      assigned_by_name: actor.full_name,
      assigned_at: new Date().toISOString(),
      is_current: true,
      reason: reason || ''
    });

    // Audit
    try {
      await base44.asServiceRole.entities.AccessAudit.create({
        user_email: actor.email, user_name: actor.full_name, profile_slug: actor.role,
        action: 'user_assigned', target_entity: 'User', target_entity_id: userId,
        allowed: true,
        details: { target_email: targetUser.email, from: oldRole, to: profileSlug, reason }
      });
    } catch {}

    return Response.json({ success: true, assignment, oldRole, newRole: profileSlug });
  } catch (error) {
    console.error('[adminAssignProfile] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});