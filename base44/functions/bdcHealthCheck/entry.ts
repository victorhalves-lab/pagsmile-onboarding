import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * BDC Health Check — Validates BDC tokens are working.
 * Called by scheduled automation every 6 hours.
 * Makes a minimal basic_data query to confirm API access.
 */

const BDC_BASE_URL = 'https://plataforma.bigdatacorp.com.br';
// Known test CNPJ (Banco do Brasil — always active)
const TEST_CNPJ = '00000000000191';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
    const tokenId = Deno.env.get('BDC_TOKEN_ID');

    if (!accessToken || !tokenId) {
      console.error('[BDC-Health] CRITICAL: BDC tokens not configured');
      return Response.json({ healthy: false, error: 'BDC tokens not configured' });
    }

    const startMs = Date.now();
    const response = await fetch(`${BDC_BASE_URL}/empresas`, {
      method: 'POST',
      headers: {
        'AccessToken': accessToken,
        'TokenId': tokenId,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Datasets: 'basic_data', q: `doc{${TEST_CNPJ}}`, Limit: 1 }),
    });

    const durationMs = Date.now() - startMs;
    const text = await response.text();

    if (response.status !== 200) {
      console.error(`[BDC-Health] CRITICAL: HTTP ${response.status} — Token may be expired`);
      return Response.json({ healthy: false, httpStatus: response.status, durationMs, error: text.substring(0, 200) });
    }

    let data;
    try { data = JSON.parse(text); } catch (e) {
      console.error('[BDC-Health] CRITICAL: Response parse error');
      return Response.json({ healthy: false, durationMs, error: 'Parse error' });
    }

    const hasResult = data.Result && data.Result.length > 0;
    const companyName = data.Result?.[0]?.BasicData?.OfficialName || data.Result?.[0]?.BasicData?.CompanyName || '';

    if (hasResult) {
      console.log(`[BDC-Health] OK — ${durationMs}ms — ${companyName}`);
    } else {
      console.warn(`[BDC-Health] WARNING: No results returned for test CNPJ`);
    }

    return Response.json({
      healthy: hasResult,
      durationMs,
      queryDate: data.QueryDate,
      companyName,
      datasetsReturned: data.Status ? Object.keys(data.Status).length : 0,
    });

  } catch (error) {
    console.error('[BDC-Health] ERROR:', error.message);
    return Response.json({ healthy: false, error: error.message }, { status: 500 });
  }
});