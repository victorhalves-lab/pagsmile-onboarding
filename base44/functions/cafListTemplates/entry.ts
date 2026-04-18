import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafListTemplates — Lista Query Templates existentes na conta CAF
 *
 * Tenta múltiplos endpoints para descobrir templates disponíveis:
 *   1. GET /v1/transaction-templates (templates de transaction)
 *   2. GET /v1/templates (templates gerais)
 *   3. GET /v1/query-templates (templates Trust)
 *
 * Também testa CRIAR um template PF básico automaticamente se nenhum existir.
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

function getCafToken() {
  const token = Deno.env.get('CAF_CLIENT_SECRET');
  if (!token) throw new Error('CAF_CLIENT_SECRET not configured');
  return token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const authToken = getCafToken();
    const attempts = [];

    // Endpoints possíveis para listar templates
    const endpoints = [
      '/v1/transaction-templates',
      '/v1/templates',
      '/v1/query-templates',
      '/v1/onboardings/templates',
      '/v1/transaction-templates?type=PF',
    ];

    for (const path of endpoints) {
      const attempt = { endpoint: path };
      try {
        const res = await fetch(`${CAF_API_BASE}${path}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        attempt.status = res.status;
        const text = await res.text();
        attempt.response_preview = text.substring(0, 2000);
        attempt.ok = res.ok;
        if (res.ok) {
          try {
            const data = JSON.parse(text);
            const items = data?.items || data?.data || (Array.isArray(data) ? data : []);
            attempt.items_count = items.length;
            attempt.templates_found = items.slice(0, 10).map(t => ({
              id: t.id || t._id,
              name: t.name,
              type: t.type,
              services: t.services || t.queryServices,
            }));
          } catch {
            attempt.parse_error = true;
          }
        }
      } catch (e) {
        attempt.ok = false;
        attempt.error = e.message;
      }
      attempts.push(attempt);
    }

    return Response.json({
      api_base: CAF_API_BASE,
      client_id_preview: (Deno.env.get('CAF_CLIENT_ID') || '').substring(0, 8) + '...',
      attempts,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});