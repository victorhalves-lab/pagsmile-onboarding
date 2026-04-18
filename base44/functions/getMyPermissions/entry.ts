import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ══════════════════════════════════════════════════════════════════
// GET MY PERMISSIONS — retorna perfil + permissões do usuário atual
// ══════════════════════════════════════════════════════════════════
// Chamado pelo PermissionsProvider no mount. Fonte da verdade server-side.
// NUNCA confie em user.role do frontend — sempre use esta função.
//
// Resposta:
// {
//   authenticated: bool,
//   user: { email, full_name, role },
//   profile: { slug, name, description, color, icon, homePage, requiresAdminCode, isAdmin, isSystem },
//   pagePermissions: [...],  // array original do perfil
//   isAdmin: bool            // admin tem bypass full
// }
// ══════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let user;
    try { user = await base44.auth.me(); }
    catch (e) {
      return Response.json({ authenticated: false }, { status: 401 });
    }
    if (!user || !user.email) {
      return Response.json({ authenticated: false }, { status: 401 });
    }

    // Descobrir o slug do perfil = user.role (nossa convenção)
    const profileSlug = user.role || 'user';

    // Admin: bypass full. Não precisa nem buscar o perfil no DB.
    if (profileSlug === 'admin') {
      return Response.json({
        authenticated: true,
        user: { email: user.email, full_name: user.full_name, role: user.role },
        profile: {
          slug: 'admin',
          name: 'Administrador',
          description: 'Acesso total',
          color: '#ef4444',
          icon: 'Crown',
          homePage: 'Home',
          requiresAdminCode: true,
          isSystem: true,
          isAdmin: true
        },
        pagePermissions: [],
        isAdmin: true
      });
    }

    // Buscar perfil no DB (service role — ignora RLS)
    let profile = null;
    try {
      const profiles = await base44.asServiceRole.entities.AccessProfile.filter({ slug: profileSlug });
      profile = profiles[0] || null;
    } catch (e) {
      console.warn('[getMyPermissions] Profile lookup failed:', e?.message);
    }

    if (!profile) {
      // Sem perfil configurado → default deny (só vê /Home se estiver logado)
      return Response.json({
        authenticated: true,
        user: { email: user.email, full_name: user.full_name, role: user.role },
        profile: null,
        pagePermissions: [],
        isAdmin: false,
        warning: `No profile found for role '${profileSlug}'. Contact admin.`
      });
    }

    if (!profile.isActive) {
      return Response.json({
        authenticated: true,
        user: { email: user.email, full_name: user.full_name, role: user.role },
        profile: null,
        pagePermissions: [],
        isAdmin: false,
        warning: `Profile '${profileSlug}' is inactive.`
      });
    }

    return Response.json({
      authenticated: true,
      user: { email: user.email, full_name: user.full_name, role: user.role },
      profile: {
        slug: profile.slug,
        name: profile.name,
        description: profile.description,
        color: profile.color,
        icon: profile.icon,
        homePage: profile.homePage,
        requiresAdminCode: profile.requiresAdminCode,
        isSystem: !!profile.isSystem,
        isAdmin: false
      },
      pagePermissions: profile.pagePermissions || [],
      isAdmin: false
    });
  } catch (error) {
    console.error('[getMyPermissions] Error:', error);
    return Response.json({ error: error.message, authenticated: false }, { status: 500 });
  }
});