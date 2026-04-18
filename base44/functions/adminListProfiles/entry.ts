import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Lista todos os perfis + contagem de usuários em cada.
// Só admin pode acessar.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const profiles = await base44.asServiceRole.entities.AccessProfile.list();
    const users = await base44.asServiceRole.entities.User.list();

    // Contar usuários por slug
    const countBySlug = {};
    for (const u of users) {
      const slug = u.role || 'unassigned';
      countBySlug[slug] = (countBySlug[slug] || 0) + 1;
    }

    const enriched = profiles.map(p => ({
      ...p,
      userCount: countBySlug[p.slug] || 0
    }));

    // Ordenar: sistema primeiro, depois alfabético
    enriched.sort((a, b) => {
      if (a.isSystem && !b.isSystem) return -1;
      if (!a.isSystem && b.isSystem) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    return Response.json({ success: true, profiles: enriched });
  } catch (error) {
    console.error('[adminListProfiles] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});