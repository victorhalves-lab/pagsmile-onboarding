import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Lista as últimas consultas BDC Lookup (apenas admin).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { limit = 50 } = await req.json().catch(() => ({}));
    const logs = await base44.asServiceRole.entities.BdcLookupQueryLog.list('-created_date', Math.min(limit, 200));
    return Response.json({ success: true, logs });
  } catch (error) {
    console.error('bdcLookupHistory error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});