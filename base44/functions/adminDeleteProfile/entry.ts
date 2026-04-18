import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Deleta perfil. Bloqueia: isSystem ou qualquer usuário atribuído.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { id } = body;
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const profiles = await base44.asServiceRole.entities.AccessProfile.filter({ id });
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'Not found' }, { status: 404 });
    if (profile.isSystem) return Response.json({ error: 'System profiles cannot be deleted' }, { status: 400 });

    // Checar usuários atribuídos
    const users = await base44.asServiceRole.entities.User.filter({ role: profile.slug });
    if (users.length > 0) {
      return Response.json({
        error: 'Cannot delete: users still assigned',
        assignedUsers: users.map(u => ({ email: u.email, full_name: u.full_name }))
      }, { status: 400 });
    }

    await base44.asServiceRole.entities.AccessProfile.delete(id);

    try {
      await base44.asServiceRole.entities.AccessAudit.create({
        user_email: user.email, user_name: user.full_name, profile_slug: user.role,
        action: 'profile_deleted', target_entity: 'AccessProfile', target_entity_id: id,
        allowed: true, details: { slug: profile.slug, name: profile.name }
      });
    } catch {}

    return Response.json({ success: true });
  } catch (error) {
    console.error('[adminDeleteProfile] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});