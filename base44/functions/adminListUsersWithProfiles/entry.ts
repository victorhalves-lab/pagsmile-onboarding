import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Lista todos os usuários + perfil atual (join por role = slug).

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const [users, profiles] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.AccessProfile.list()
    ]);

    const profileBySlug = {};
    for (const p of profiles) profileBySlug[p.slug] = p;

    const enriched = users.map(u => {
      const p = profileBySlug[u.role];
      return {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        created_date: u.created_date,
        profile: p ? {
          slug: p.slug, name: p.name, color: p.color, icon: p.icon,
          isSystem: p.isSystem, isActive: p.isActive
        } : null
      };
    });

    enriched.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

    return Response.json({ success: true, users: enriched, profiles });
  } catch (error) {
    console.error('[adminListUsersWithProfiles] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});