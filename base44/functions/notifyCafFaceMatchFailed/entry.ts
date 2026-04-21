import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Sends a Slack alert to the compliance channel when a CAF face match fails.
 *
 * Called from:
 *  - cafFaceMatchTransaction (após poll retornar REPROVED/score baixo)
 *  - cafWebhookHandler (quando FACE_AUTH_MISMATCH ou FACEMATCH_FAILED flag é adicionada)
 *
 * Idempotent: dedupa por (onboardingCaseId + transactionId) — se já enviou, ignora.
 */

async function sendSlackMessage(base44, channel, blocks, text) {
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ channel, blocks, text }),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: !!json.ok, error: json.error || null };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const {
      onboardingCaseId,
      transactionId = '',
      similarity = null,
      status = '',
      reason = '',
      errorName = '',
      errorMessage = '',
      attemptCount = 1,
    } = body;

    if (!onboardingCaseId) {
      return Response.json({ error: 'onboardingCaseId required' }, { status: 400 });
    }

    // Dedupe: check if we already sent a slack alert for this event
    const dedupeKey = `slack_face_match_${onboardingCaseId}_${transactionId || attemptCount}`;
    try {
      const existing = await base44.asServiceRole.entities.IntegrationLog.filter({
        request_id: dedupeKey,
        service_type: 'caf_webhook_received',
      });
      if (existing.length > 0) {
        return Response.json({ ok: true, deduped: true });
      }
    } catch {}

    // Enrich context
    const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
    const theCase = cases[0];
    if (!theCase) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    let merchant = null;
    if (theCase.merchantId) {
      const merchants = await base44.asServiceRole.entities.Merchant.filter({ id: theCase.merchantId });
      merchant = merchants[0];
    }

    const merchantName = merchant?.fullName || merchant?.companyName || 'Merchant desconhecido';
    const merchantCnpj = merchant?.cpfCnpj || '—';
    const appUrl = (Deno.env.get('APP_URL') || '').replace(/\/$/, '');
    const caseLink = appUrl ? `${appUrl}/AnaliseDeCasos?id=${onboardingCaseId}` : `AnaliseDeCasos?id=${onboardingCaseId}`;

    const simText = similarity !== null && similarity !== undefined
      ? `${Math.round(similarity * 100)}%`
      : 'N/A';

    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: '⚠️ CAF Face Match Reprovado', emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Merchant:*\n${merchantName}` },
          { type: 'mrkdwn', text: `*CNPJ/CPF:*\n${merchantCnpj}` },
          { type: 'mrkdwn', text: `*Similarity:*\n${simText}` },
          { type: 'mrkdwn', text: `*Status CAF:*\n${status || 'N/A'}` },
          { type: 'mrkdwn', text: `*Tentativa:*\n#${attemptCount}` },
          { type: 'mrkdwn', text: `*Case ID:*\n\`${onboardingCaseId.substring(0, 12)}...\`` },
        ],
      },
      ...(reason || errorMessage ? [{
        type: 'section',
        text: { type: 'mrkdwn', text: `*Motivo:* ${reason || errorMessage}${errorName ? ` (\`${errorName}\`)` : ''}` },
      }] : []),
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '👁️ Ver Caso', emoji: true },
            url: caseLink,
            style: 'primary',
          },
        ],
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: '💡 Sugestão: gerar link "CAF Only" para o cliente refazer a selfie com melhor iluminação.' },
        ],
      },
    ];

    const channel = Deno.env.get('SLACK_COMPLIANCE_CHANNEL');
    if (!channel) {
      return Response.json({ ok: false, error: 'SLACK_COMPLIANCE_CHANNEL not configured' }, { status: 500 });
    }

    const result = await sendSlackMessage(
      base44,
      channel,
      blocks,
      `⚠️ CAF Face Match reprovado — ${merchantName} (similarity: ${simText})`
    );

    // Log the notification (also serves as dedupe key)
    try {
      await base44.asServiceRole.entities.IntegrationLog.create({
        onboarding_case_id: onboardingCaseId,
        provider: 'CAF',
        service_type: 'caf_webhook_received',
        request_id: dedupeKey,
        transaction_id: transactionId,
        status: result.ok ? 'success' : 'failed',
        request_payload: { channel, similarity, status, reason, attemptCount },
        response_payload: { slack_ok: result.ok, slack_error: result.error },
        error_message: result.error || undefined,
      });
    } catch {}

    return Response.json({ ok: result.ok, error: result.error });
  } catch (error) {
    console.error('[notifyCafFaceMatchFailed] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});