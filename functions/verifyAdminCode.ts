import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();

    const adminCode = Deno.env.get("ADMIN_ACCESS_CODE");

    if (!adminCode) {
      return Response.json({ error: 'Admin code not configured' }, { status: 500 });
    }

    if (code === adminCode) {
      return Response.json({ success: true });
    } else {
      return Response.json({ success: false, error: 'Código inválido' }, { status: 403 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});