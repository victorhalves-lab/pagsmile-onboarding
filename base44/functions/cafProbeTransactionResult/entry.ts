import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafProbeTransactionResult — Busca o resultado de uma transação CAF criada
 * para descobrir seu formato e se entrega um token SDK.
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
      `/v1/transactions/${transactionId}`,
      `/v1/transactions/${transactionId}?raw=true`,
      `/v1/transactions/${transactionId}/token`,
      `/v1/transactions/${transactionId}/sdk-token`,
      `/v1/transactions/${transactionId}/url`,
    ];

    for (const p of paths) {
      const a = { endpoint: p };
      try {
        const res = await fetch(`${CAF_API_BASE}${p}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        a.status = res.status;
        const t = await res.text();
        a.response_preview = t.substring(0, 3500);
        a.ok = res.ok;
      } catch (e) { a.error = e.message; }
      attempts.push(a);
    }

    return Response.json({ transactionId, attempts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});