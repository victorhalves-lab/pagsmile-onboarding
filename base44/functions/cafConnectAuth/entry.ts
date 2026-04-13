import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafConnectAuth — Authentication helper for CAF APIs
 *
 * Core API: CAF_CLIENT_SECRET as static Bearer token
 * Connect API: requires separate OAuth2 credentials (not yet configured)
 */

function getCafToken() {
  const token = Deno.env.get('CAF_CLIENT_SECRET');
  if (!token) throw new Error('CAF_CLIENT_SECRET not configured');
  return token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const method = body.method || 'core';

    if (method === 'core') {
      return Response.json({
        success: true,
        method: 'core',
        token_type: 'Bearer',
        note: 'Static Bearer token for Core API (api.combateafraude.com)',
      });
    }

    if (method === 'connect') {
      return Response.json({
        success: false,
        method: 'connect',
        error: 'Connect API requires separate OAuth2 credentials.',
        note: 'Request Connect API credentials from CAF support for api.us.prd.caf.io.',
      });
    }

    return Response.json({ error: `method '${method}' não reconhecido` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});