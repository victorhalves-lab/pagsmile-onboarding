import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafHealthCheck — ITEM 6: Monitoramento proativo da integração CAF
 *
 * Testa todos os endpoints CAF críticos e notifica via Slack se algum estiver fora.
 * Chamado automaticamente a cada 6 horas via scheduled automation.
 *
 * Endpoints testados:
 *   1. Core API — List Transactions (leitura)
 *   2. Core API — People Profile (leitura)
 *   3. Core API — Companies Profile (leitura)
 *
 * NÃO cria transações de teste (evita custos).
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

function getCafToken() {
  // Core API usa CAF_CORE_API_TOKEN (JWT estático do Trust Platform).
  // CAF_CLIENT_SECRET é da Mobile Key (SDK Web), não serve pra Core API.
  const token = Deno.env.get('CAF_CORE_API_TOKEN');
  if (!token) throw new Error('CAF_CORE_API_TOKEN not configured');
  return token;
}

async function testEndpoint(name, url, authToken) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    // 400 = API working but rejected invalid test data (expected)
    // 404 = API working but no data found (expected)
    // Only 401/403/5xx indicate real problems
    const isHealthy = res.ok || res.status === 400 || res.status === 404;
    return {
      name,
      status: res.status,
      ok: isHealthy,
      latency_ms: Date.now() - start,
    };
  } catch (err) {
    return {
      name,
      status: 'ERROR',
      ok: false,
      latency_ms: Date.now() - start,
      error: err.message,
    };
  }
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);

    // Allow both admin and scheduled (service role) calls
    try {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      // Called via scheduled automation — allowed
    }

    const authToken = getCafToken();

    console.log('[CAF-Health] Running health check...');

    // Test all critical endpoints in parallel
    const results = await Promise.all([
      testEndpoint(
        'Core API — List Transactions',
        `${CAF_API_BASE}/v1/transactions?_limit=1`,
        authToken
      ),
      testEndpoint(
        'Core API — People Profile',
        `${CAF_API_BASE}/v1/people/00000000000`,
        authToken
      ),
      testEndpoint(
        'Core API — Companies Profile',
        `${CAF_API_BASE}/v1/companies/00000000000000`,
        authToken
      ),
    ]);

    const allHealthy = results.every(r => r.ok);
    const failedEndpoints = results.filter(r => !r.ok);
    const avgLatency = Math.round(results.reduce((sum, r) => sum + r.latency_ms, 0) / results.length);

    console.log(`[CAF-Health] ${allHealthy ? 'ALL OK' : `${failedEndpoints.length} FAILED`}, avg latency: ${avgLatency}ms`);

    // Send Slack notification if any endpoint is down
    if (!allHealthy) {
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
        const failedList = failedEndpoints.map(f => `  ❌ ${f.name}: HTTP ${f.status}${f.error ? ` — ${f.error}` : ''}`).join('\n');

        const message = [
          `🚨 *CAF Health Check — ALERTA*`,
          ``,
          `${failedEndpoints.length} de ${results.length} endpoints com problema:`,
          failedList,
          ``,
          `Endpoints OK:`,
          ...results.filter(r => r.ok).map(r => `  ✅ ${r.name}: ${r.latency_ms}ms`),
          ``,
          `⚠️ Pipeline de compliance pode ser impactado. Verificar credenciais e status da CAF.`,
        ].join('\n');

        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: '#compliance', text: message, unfurl_links: false }),
        });

        console.log('[CAF-Health] Slack alert sent');
      } catch (e) {
        console.warn('[CAF-Health] Slack notification failed:', e.message);
      }
    }

    // Also alert on high latency (> 5s average)
    if (allHealthy && avgLatency > 5000) {
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
        const message = `⚠️ *CAF Health Check — Latência Alta*\n\nLatência média: ${avgLatency}ms (threshold: 5000ms)\n${results.map(r => `  ${r.name}: ${r.latency_ms}ms`).join('\n')}\n\nPerformance degradada pode impactar o pipeline de compliance.`;

        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: '#compliance', text: message, unfurl_links: false }),
        });
      } catch { /* */ }
    }

    return Response.json({
      success: true,
      healthy: allHealthy,
      endpoints: results,
      failedCount: failedEndpoints.length,
      avgLatency_ms: avgLatency,
      duration_ms: Date.now() - startTime,
    });

  } catch (error) {
    console.error('[CAF-Health] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});