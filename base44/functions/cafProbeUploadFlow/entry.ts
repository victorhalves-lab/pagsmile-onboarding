import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafProbeUploadFlow — Testa o fluxo de upload de arquivos para uma transação
 *
 * Descobre se podemos fazer:
 *   1. POST /v1/transactions (criar)
 *   2. POST /v1/transactions/:id/files (upload image)
 *   3. POST /v1/transactions/:id/process (trigger processing)
 *   4. GET /v1/transactions/:id (get result)
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const transactionId = body.transactionId || '69e3c9c4ff3d5d00022cb51e';
    const authToken = Deno.env.get('CAF_CLIENT_SECRET');

    const attempts = [];

    const paths = [
      { method: 'POST', path: `/v1/transactions/${transactionId}/files`, body: { files: [] } },
      { method: 'GET', path: `/v1/transactions/${transactionId}/files` },
      { method: 'POST', path: `/v1/transactions/${transactionId}/process`, body: {} },
      { method: 'POST', path: `/v1/transactions/${transactionId}/start`, body: {} },
      { method: 'POST', path: `/v1/transactions/${transactionId}/images`, body: { type: 'selfie' } },
      { method: 'POST', path: `/v1/files`, body: { transactionId, type: 'selfie' } },
      // Descobrir templates via outro caminho
      { method: 'GET', path: `/v1/tenants/me` },
      { method: 'GET', path: `/v1/me` },
      { method: 'GET', path: `/v1/profile` },
    ];

    for (const step of paths) {
      const a = { method: step.method, endpoint: step.path };
      try {
        const res = await fetch(`${CAF_API_BASE}${step.path}`, {
          method: step.method,
          headers: {
            'Authorization': `Bearer ${authToken}`,
            ...(step.body ? { 'Content-Type': 'application/json' } : {}),
          },
          body: step.body ? JSON.stringify(step.body) : undefined,
        });
        a.status = res.status;
        const t = await res.text();
        a.response_preview = t.substring(0, 2000);
        a.ok = res.ok;
      } catch (e) { a.error = e.message; }
      attempts.push(a);
    }

    return Response.json({ transactionId, attempts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});