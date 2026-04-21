import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC endpoint — logs client-side errors from anonymous public pages.
 * Creates an IntegrationLog record so we can diagnose issues without asking the client
 * to send us their browser console.
 *
 * Called from the frontend whenever an upload / save / critical action fails.
 *
 * Required: { stage, errorMessage }
 * Optional: { caseId, merchantId, linkCode, fileName, fileSize, fileType, userAgent, extra }
 */
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
    }
    const body = await req.json().catch(() => ({}));
    const {
      stage,
      errorMessage,
      caseId,
      merchantId,
      linkCode,
      fileName,
      fileSize,
      fileType,
      userAgent,
      extra,
    } = body;

    if (!stage || !errorMessage) {
      return Response.json({ ok: false, error: 'stage and errorMessage required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    await base44.asServiceRole.entities.IntegrationLog.create({
      onboarding_case_id: caseId || null,
      merchant_id: merchantId || null,
      provider: 'BigDataCorp', // reusing enum — not a real provider, but required
      service_type: 'caf_webhook_received', // reusing enum
      status: 'failed',
      error_message: `[${stage}] ${errorMessage}`.slice(0, 500),
      request_payload: {
        stage,
        linkCode: linkCode || null,
        fileName: fileName || null,
        fileSize: typeof fileSize === 'number' ? fileSize : null,
        fileType: fileType || null,
        userAgent: (userAgent || '').slice(0, 300),
        extra: extra || null,
        loggedAt: new Date().toISOString(),
      },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[logPublicClientError] ERROR:', error?.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});