import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafListTransactions — Lista e audita transações históricas na CAF Core API
 *
 * NEW FUNCTION: Permite consultar o histórico de transações por período, template,
 * e buscar transações órfãs (sem IntegrationLog vinculado).
 *
 * Modos:
 *   - list: lista transações com filtros
 *   - orphans: identifica transações CAF sem log interno
 *   - stats: resumo estatístico por status
 *
 * Auth: CAF_CLIENT_SECRET as static Bearer token
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

function getCafToken() {
  const token = Deno.env.get('CAF_CORE_API_TOKEN');
  if (!token) throw new Error('CAF_CORE_API_TOKEN not configured');
  return token;
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const authToken = getCafToken();
    const { mode = 'list', templateId, startDate, endDate, limit = 10, offset = 0 } = body;

    const params = new URLSearchParams();
    params.set('_limit', String(Math.min(limit, 10)));
    params.set('_offset', String(offset));
    params.set('_order', 'desc');
    if (templateId) params.set('_templates', templateId);
    if (startDate) params.set('_startCreatedDate', startDate);
    if (endDate) params.set('_endCreatedDate', endDate);

    console.log(`[CAF-ListTx] Mode: ${mode}, params: ${params.toString()}`);

    const response = await fetch(`${CAF_API_BASE}/v1/transactions?${params}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } catch { result = { raw: text.substring(0, 500) }; }

    const items = result?.items || [];
    const totalItems = result?.totalItems || 0;

    // ── MODE: orphans — find CAF transactions not in our IntegrationLog ──
    if (mode === 'orphans') {
      const orphans = [];
      for (const item of items) {
        try {
          const logs = await base44.asServiceRole.entities.IntegrationLog.filter({
            transaction_id: item.id, provider: 'CAF',
          });
          if (logs.length === 0) {
            orphans.push({
              id: item.id,
              status: item.status,
              createdAt: item.createdAt,
              data: item.data,
            });
          }
        } catch { /* */ }
      }

      return Response.json({
        success: response.ok,
        mode: 'orphans',
        orphanCount: orphans.length,
        totalScanned: items.length,
        totalItems,
        orphans,
        duration_ms: Date.now() - startTime,
      });
    }

    // ── MODE: stats — aggregate by status ──
    if (mode === 'stats') {
      const stats = { APPROVED: 0, REPROVED: 0, PENDING: 0, PROCESSING: 0, OTHER: 0 };
      for (const item of items) {
        const s = item.status || 'OTHER';
        stats[s] = (stats[s] || 0) + 1;
      }

      return Response.json({
        success: response.ok,
        mode: 'stats',
        totalItems,
        scannedItems: items.length,
        statusDistribution: stats,
        duration_ms: Date.now() - startTime,
      });
    }

    // ── MODE: list (default) ──
    return Response.json({
      success: response.ok,
      mode: 'list',
      items: items.map(item => ({
        id: item.id,
        status: item.status,
        createdAt: item.createdAt,
        data: item.data,
      })),
      totalItems,
      offset,
      limit: Math.min(limit, 10),
      duration_ms: Date.now() - startTime,
    });

  } catch (error) {
    console.error('[CAF-ListTx] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});