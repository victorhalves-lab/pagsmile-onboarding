import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const code = body.code || '';
    const code2 = body.code2 || '';

    const adminCode = Deno.env.get("ADMIN_ACCESS_CODE") || '';
    const adminCode2 = Deno.env.get("ADMIN_ACCESS_CODE_2") || '';

    if (!adminCode || !adminCode2) {
      return Response.json({ error: 'Admin codes not configured' }, { status: 500 });
    }

    // Both codes must match
    if (code === adminCode && code2 === adminCode2) {
      return Response.json({ success: true });
    }

    return Response.json({ success: false, error: 'Códigos inválidos' }, { status: 403 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});