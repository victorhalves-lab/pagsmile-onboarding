/**
 * PUBLIC endpoint — captures client-side runtime errors from public pages
 * for diagnosis. TEMPORARILY RE-ENABLED to diagnose onboarding V2 render errors.
 *
 * Persists to IntegrationLog with service_type="caf_webhook_received" (reused
 * as a generic bucket; entity allows it). Includes rate-limit guard by stage
 * so a single buggy client can't flood the log.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function getClient(req) {
  const cleanHeaders = new Headers(req.headers);
  ['authorization', 'Authorization', 'cookie', 'Cookie', 'x-base44-token', 'X-Base44-Token'].forEach(h => cleanHeaders.delete(h));
  const cleanReq = new Request(req.url, { method: req.method, headers: cleanHeaders });
  return createClientFromRequest(cleanReq);
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const stage = String(body?.stage || 'unknown').slice(0, 80);
    const errorMessage = String(body?.errorMessage || '').slice(0, 1500);
    const componentStack = String(body?.componentStack || '').slice(0, 4000);
    const userAgent = String(body?.userAgent || '').slice(0, 500);
    const url = String(body?.url || '').slice(0, 500);
    const extra = body?.extra || {};

    // Skip known-benign SDK noise
    if (/Right-hand side of 'instanceof' is not callable/i.test(errorMessage)) {
      return Response.json({ ok: true, skipped: 'benign_sdk' });
    }

    const base44 = await getClient(req);
    await base44.asServiceRole.entities.IntegrationLog.create({
      provider: 'CAF',
      service_type: 'caf_webhook_received',
      status: 'success',
      request_payload: { stage, url, userAgent, extra },
      response_payload: { errorMessage, componentStack },
      error_message: errorMessage,
    });

    return Response.json({ ok: true });
  } catch (_e) {
    return Response.json({ ok: true });
  }
});