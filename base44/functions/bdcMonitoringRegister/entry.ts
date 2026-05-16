/**
 * bdcMonitoringRegister — GAP 10 (admin)
 * Registra/desregistra um CNPJ/CPF no BDC Monitoring para receber webhooks
 * automáticos quando houver mudanças nos campos monitorados.
 *
 * Body:
 *   { action: 'register' | 'unregister', document: '12345678901234',
 *     onboardingCaseId?: '...', datasets?: ['kyc','processes','configurable_recency_qsa'] }
 *
 * Datasets padrão monitorados se não especificado:
 *   PJ: kyc, owners_kyc, processes, configurable_recency_qsa, esg_and_compliance, basic_data
 *   PF: kyc, processes, scr_positive_score, basic_data
 *
 * Requisitos: admin authenticated; BDC tokens configurados.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BDC_BASE_URL = 'https://plataforma.bigdatacorp.com.br';
const MONITORING_ENDPOINT = '/monitoring/subscriptions';

const DEFAULT_DATASETS_PJ = ['kyc', 'owners_kyc', 'processes', 'configurable_recency_qsa', 'esg_and_compliance', 'basic_data', 'government_debtors'];
const DEFAULT_DATASETS_PF = ['kyc', 'processes', 'scr_positive_score', 'basic_data', 'government_debtors'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden: Admin required' }, { status: 403 });

    const body = await req.json();
    const { action, document, onboardingCaseId, datasets, callbackUrl } = body;
    if (!action || !document) return Response.json({ error: 'action and document are required' }, { status: 400 });
    if (!['register', 'unregister'].includes(action)) return Response.json({ error: 'action must be register or unregister' }, { status: 400 });

    const cleanDoc = String(document).replace(/\D/g, '');
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) return Response.json({ error: 'document must be CPF (11) or CNPJ (14)' }, { status: 400 });

    const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
    const tokenId = Deno.env.get('BDC_TOKEN_ID');
    if (!accessToken || !tokenId) return Response.json({ error: 'BDC tokens not configured' }, { status: 500 });

    const isPF = cleanDoc.length === 11;
    const dsList = datasets && Array.isArray(datasets) ? datasets : (isPF ? DEFAULT_DATASETS_PF : DEFAULT_DATASETS_PJ);

    // Webhook URL — usa próprio bdcMonitoringWebhook desta app + secret
    const secret = Deno.env.get('BDC_WEBHOOK_SECRET');
    if (!secret && action === 'register') return Response.json({ error: 'BDC_WEBHOOK_SECRET not configured — required for webhook registration' }, { status: 500 });
    const appUrl = Deno.env.get('APP_URL') || `https://${Deno.env.get('BASE44_APP_ID')}.base44.app`;
    const finalCallback = callbackUrl || `${appUrl}/functions/bdcMonitoringWebhook?secret=${secret}`;

    const payload = {
      Document: cleanDoc,
      DocumentType: isPF ? 'CPF' : 'CNPJ',
      Datasets: dsList,
      CallbackUrl: finalCallback,
      Action: action.toUpperCase(),
    };

    const start = Date.now();
    const r = await fetch(`${BDC_BASE_URL}${MONITORING_ENDPOINT}`, {
      method: action === 'register' ? 'POST' : 'DELETE',
      headers: { 'AccessToken': accessToken, 'TokenId': tokenId, 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const elapsed = Date.now() - start;
    const txt = await r.text();
    let bdcResp;
    try { bdcResp = JSON.parse(txt); } catch { bdcResp = { raw: txt.substring(0, 500) }; }

    if (r.status >= 400) {
      return Response.json({ success: false, action, document: cleanDoc, error: `BDC HTTP ${r.status}`, bdcResponse: bdcResp, elapsed_ms: elapsed }, { status: 502 });
    }

    // Persist a log entry
    try {
      await base44.asServiceRole.entities.IntegrationLog.create({
        provider: 'BigDataCorp',
        service_type: `monitoring_${action}`,
        status: 'success',
        request_payload: { document: cleanDoc, datasets: dsList, onboardingCaseId },
        response_payload: bdcResp,
        duration_ms: elapsed,
      });
    } catch {}

    return Response.json({
      success: true,
      action,
      document: cleanDoc,
      datasetsMonitored: dsList,
      subscriptionId: bdcResp?.SubscriptionId || bdcResp?.Id || null,
      callbackUrl: finalCallback,
      elapsed_ms: elapsed,
    });
  } catch (error) {
    console.error('[bdcMonitoringRegister] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});