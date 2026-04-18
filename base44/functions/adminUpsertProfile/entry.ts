import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Cria ou edita perfil. Só admin.
// Payload:
//   { profile: { id?, slug, name, ... } }
// Validações:
//   - slug único
//   - isSystem:true não pode ser deletado (mas pode ser editado nome/cor)
//   - slug não pode ser alterado em perfis existentes

const SLUG_RE = /^[a-z0-9_]+$/;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const profile = body.profile;
    if (!profile || typeof profile !== 'object') {
      return Response.json({ error: 'profile required' }, { status: 400 });
    }

    if (!profile.name || !profile.slug) {
      return Response.json({ error: 'name and slug required' }, { status: 400 });
    }
    if (!SLUG_RE.test(profile.slug)) {
      return Response.json({ error: 'slug must be lowercase alphanumeric + underscore' }, { status: 400 });
    }

    const { id, slug } = profile;

    // Existe outro perfil com esse slug?
    const existing = await base44.asServiceRole.entities.AccessProfile.filter({ slug });
    const sameSlug = existing[0];

    if (id) {
      // UPDATE
      const current = await base44.asServiceRole.entities.AccessProfile.filter({ id });
      const cur = current[0];
      if (!cur) return Response.json({ error: 'Profile not found' }, { status: 404 });

      if (sameSlug && sameSlug.id !== id) {
        return Response.json({ error: 'Slug already in use' }, { status: 409 });
      }
      // Não permite alterar slug de perfil existente (pode quebrar users com esse role)
      if (slug !== cur.slug) {
        return Response.json({ error: 'Slug cannot be changed after creation' }, { status: 400 });
      }

      const payload = {
        name: profile.name,
        description: profile.description || '',
        color: profile.color || '#64748b',
        icon: profile.icon || 'Shield',
        isActive: profile.isActive !== false,
        requiresAdminCode: profile.requiresAdminCode !== false,
        homePage: profile.homePage || 'Home',
        pagePermissions: profile.pagePermissions || []
      };

      const updated = await base44.asServiceRole.entities.AccessProfile.update(id, payload);

      // Audit
      try {
        await base44.asServiceRole.entities.AccessAudit.create({
          user_email: user.email, user_name: user.full_name, profile_slug: user.role,
          action: 'profile_changed', target_entity: 'AccessProfile', target_entity_id: id,
          allowed: true, details: { slug, name: profile.name }
        });
      } catch {}

      return Response.json({ success: true, profile: updated, action: 'updated' });
    } else {
      // CREATE
      if (sameSlug) return Response.json({ error: 'Slug already exists' }, { status: 409 });

      const payload = {
        slug,
        name: profile.name,
        description: profile.description || '',
        color: profile.color || '#64748b',
        icon: profile.icon || 'Shield',
        isSystem: false, // NUNCA permitir criar via UI como isSystem
        isActive: profile.isActive !== false,
        requiresAdminCode: profile.requiresAdminCode !== false,
        homePage: profile.homePage || 'Home',
        pagePermissions: profile.pagePermissions || []
      };

      const created = await base44.asServiceRole.entities.AccessProfile.create(payload);

      try {
        await base44.asServiceRole.entities.AccessAudit.create({
          user_email: user.email, user_name: user.full_name, profile_slug: user.role,
          action: 'profile_created', target_entity: 'AccessProfile', target_entity_id: created.id,
          allowed: true, details: { slug, name: profile.name }
        });
      } catch {}

      return Response.json({ success: true, profile: created, action: 'created' });
    }
  } catch (error) {
    console.error('[adminUpsertProfile] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});