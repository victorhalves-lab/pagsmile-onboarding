import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafGetWebhookUrl — monta a URL pública do webhook CAF.
 * Admin-only. Aceita { appBaseUrl } do frontend (ele tem via appParams) ou usa env var.
 *
 * Formato final (que deve ser cadastrado no Trust portal):
 *   https://<app-base-url>/functions/cafWebhookHandler
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // URL oficial fixa do webhook (domínio público da app Pagsmile Compliance)
    const baseUrl = 'https://pagsmilecompliance.base44.app';
    const webhookUrl = `${baseUrl}/functions/cafWebhookHandler`;
    const hasSecret = !!Deno.env.get('CAF_WEBHOOK_SECRET');

    return Response.json({
      webhookUrl,
      baseUrl,
      hasSecretConfigured: hasSecret,
      instructions: {
        step1: 'Acesse https://trust.caf.io/ → Settings (ícone de engrenagem) → API Configurations → aba Webhooks',
        step2: 'Clique em "+ New webhook"',
        step3_payloadUrl: webhookUrl,
        step4_secret: 'Gere um secret forte (ex: openssl rand -hex 32) — guarde-o pra adicionar nos secrets da app',
        step5_auth: 'Authentication: None (usamos HMAC SHA-256 via X-Caf-Signature)',
        step6_events: 'Selecione "Send me everything" OU individualmente:',
        step6_eventList: [
          'TRANSACTIONPROCESSSTARTEDEVENT — transação iniciou processamento',
          'TRANSACTIONSTATUSUPDATED — status atualizado (APPROVED/REPROVED/PENDING)',
          'TRANSACTIONDOCUMENTSCOPYREQUESTEDEVENT — análise documentoscópica solicitada',
          'FACEAUTHENTICATIONEVENT — tentativa de autenticação facial',
          'PROFILEUPDATEDEVENT — status do profile (PF/PJ) atualizado',
        ],
        step7: 'Marque "Active" e clique em "Create webhook"',
        step8: 'Depois de criado, adicione o secret nos secrets da Base44 como CAF_WEBHOOK_SECRET',
      },
      security: {
        signatureHeader: 'X-Caf-Signature',
        algorithm: 'HMAC SHA-256 (hex encoded)',
        expectedResponse: '202 Accepted em menos de 2 segundos',
        retryPolicy: 'CAF tenta por até 15 minutos em caso de 5xx/timeout',
        cloudEventsSpec: 'https://cloudevents.io/',
        officialDocs: 'https://docs.caf.io/caf-api/connect/webhook',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});