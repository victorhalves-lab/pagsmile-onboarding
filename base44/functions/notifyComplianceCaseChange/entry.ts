import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SLACK_CHANNEL = '#compliance-sub';

async function sendSlack(token, channel, text, blocks) {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, text, blocks, username: 'Pagsmile Compliance', icon_emoji: ':shield:' }),
  });
  return res.json();
}

const STATUS_CONFIG = {
  'Manual': { emoji: '⚠️', header: 'Caso Requer Revisão Manual', color: 'warning' },
  'Recusado': { emoji: '🔴', header: 'Caso de Compliance Recusado', color: 'danger' },
  'Aprovado': { emoji: '✅', header: 'Caso de Compliance Aprovado', color: 'good' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data, changed_fields } = await req.json();

    if (event?.type !== 'update') return Response.json({ message: 'skip' });

    // Check status change
    const statusChanged = changed_fields?.includes('status');
    const docChanged = changed_fields?.includes('docCompleted');
    const bigDataChanged = changed_fields?.includes('bigDataCorpCompleted');
    const cafChanged = changed_fields?.includes('cafCompleted');

    if (!statusChanged && !docChanged && !bigDataChanged && !cafChanged) {
      return Response.json({ message: 'skip: no relevant change' });
    }

    // Get merchant name
    let empresaNome = 'N/A';
    if (data?.merchantId) {
      try {
        const merchants = await base44.asServiceRole.entities.Merchant.filter({ id: data.merchantId });
        if (merchants?.length > 0) empresaNome = merchants[0].fullName || merchants[0].companyName || 'N/A';
      } catch (e) { /* ignore */ }
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');

    // Status change notifications
    if (statusChanged && data?.status !== old_data?.status) {
      const cfg = STATUS_CONFIG[data.status];
      if (cfg) {
        const blocks = [
          { type: 'header', text: { type: 'plain_text', text: `${cfg.emoji} ${cfg.header}`, emoji: true } },
          { type: 'section', fields: [
            { type: 'mrkdwn', text: `*Empresa:*\n${empresaNome}` },
            { type: 'mrkdwn', text: `*Status anterior:*\n${old_data?.status || 'N/A'}` },
            { type: 'mrkdwn', text: `*Score:*\n${data.riskScore || data.riskScoreV4 || 'N/A'}` },
            { type: 'mrkdwn', text: `*Prioridade:*\n${data.priority || 'medium'}` },
          ]},
        ];

        if (data.iaExplanation) {
          const explanation = data.iaExplanation.length > 200 ? data.iaExplanation.substring(0, 200) + '...' : data.iaExplanation;
          blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `🤖 ${explanation}` } });
        }

        if (data.redFlags?.length > 0) {
          blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `🚩 *Red Flags:* ${data.redFlags.join(', ')}` } });
        }

        await sendSlack(accessToken, SLACK_CHANNEL,
          `${cfg.emoji} ${empresaNome}: ${cfg.header}`, blocks);
      }
    }

    // Doc completed notification
    if (docChanged && data?.docCompleted === true && old_data?.docCompleted !== true) {
      const blocks = [
        { type: 'header', text: { type: 'plain_text', text: '📎 Documentos de Compliance Enviados!', emoji: true } },
        { type: 'section', fields: [
          { type: 'mrkdwn', text: `*Empresa:*\n${empresaNome}` },
          { type: 'mrkdwn', text: `*Status do Caso:*\n${data.status || 'N/A'}` },
        ]},
        { type: 'section', text: { type: 'mrkdwn', text: '👉 *Próximo passo:* Documentos disponíveis para análise no painel.' } },
      ];

      await sendSlack(accessToken, SLACK_CHANNEL,
        `📎 Docs enviados: ${empresaNome}`, blocks);
    }

    // External validation completed
    if (bigDataChanged && data?.bigDataCorpCompleted === true && old_data?.bigDataCorpCompleted !== true) {
      await sendSlack(accessToken, SLACK_CHANNEL,
        `🔬 Validação BigDataCorp concluída: ${empresaNome}`,
        [{ type: 'header', text: { type: 'plain_text', text: '🔬 Validação BigDataCorp Concluída', emoji: true } },
         { type: 'section', fields: [
           { type: 'mrkdwn', text: `*Empresa:*\n${empresaNome}` },
           { type: 'mrkdwn', text: `*Status:*\n${data.status || 'N/A'}` },
         ]}]);
    }

    if (cafChanged && data?.cafCompleted === true && old_data?.cafCompleted !== true) {
      await sendSlack(accessToken, SLACK_CHANNEL,
        `📷 Validação CAF concluída: ${empresaNome}`,
        [{ type: 'header', text: { type: 'plain_text', text: '📷 Validação CAF Concluída', emoji: true } },
         { type: 'section', fields: [
           { type: 'mrkdwn', text: `*Empresa:*\n${empresaNome}` },
           { type: 'mrkdwn', text: `*Status:*\n${data.status || 'N/A'}` },
         ]}]);
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});