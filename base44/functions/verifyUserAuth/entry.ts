import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ══════════════════════════════════════════════════════════════════
// SERVER-SIDE USER ROLE VERIFICATION
// ══════════════════════════════════════════════════════════════════
// Returns the user's role as seen by the server. This is the ONLY
// trustworthy source of role info — the frontend's `user.role` can be
// tampered via React DevTools, but this call cannot be faked.
//
// Frontend should call this on mount of any sensitive area and gate
// rendering on the server's response, NOT on the local user state.
// ══════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user;
    try {
      user = await base44.auth.me();
    } catch (e) {
      return Response.json({ authenticated: false, role: null }, { status: 401 });
    }
    if (!user || !user.email) {
      return Response.json({ authenticated: false, role: null }, { status: 401 });
    }
    return Response.json({
      authenticated: true,
      email: user.email,
      role: user.role || 'user',
    });
  } catch (error) {
    console.error('[verifyUserAuth] Error:', error);
    return Response.json({ authenticated: false, role: null, error: 'Internal error' }, { status: 500 });
  }
});