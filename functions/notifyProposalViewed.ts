import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SLACK_CHANNEL = '#comercial-sub';
const SLACK_BOT_NAME = 'Pagsmile Bot';
const SLACK_BOT_EMOJI = ':eyes:';

async function sendSlackMessage(accessToken, channel, text, blocks) {
  const body = {
    channel,
    text,
    username: SLACK_BOT_NAME,
    icon_emoji: SLACK_BOT_EMOJI,
  };
  if (blocks) body.blocks = blocks;

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { event, data, old_data } = await req.json();

    if (event?.type !== 'update') {
      return Response.json({ message: 'Skipped: not an update event' });
    }

    if (data?.status !== 'visualizada' || old_data?.status === 'visualizada') {
      return Response.json({ message: 'Skipped: not a view event' });
    }

    const proposal = data;
    const now = new Date();

    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: '👀 Proposta Visualizada!', emoji: true }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Proposta:*\n${proposal.codigo || 'N/A'}` },
          { type: 'mrkdwn', text: `*Cliente:*\n${proposal.clienteNome || 'N/A'}` },
        ]
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `:clock1: Visualizada em: ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}` }
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: ':bulb: *Dica:* Este é o momento ideal para fazer um follow-up! O cliente está analisando a proposta agora.' }
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `Responsável: ${proposal.responsavelNome || proposal.created_by || 'N/A'}` }
        ]
      }
    ];

    const slackToken = await base44.asServiceRole.connectors.getAccessToken('slackbot');
    const slackResult = await sendSlackMessage(
      slackToken,
      SLACK_CHANNEL,
      `👀 ${proposal.clienteNome || 'Cliente'} visualizou a proposta ${proposal.codigo || ''}`,
      blocks
    );

    return Response.json({ 
      message: 'Slack notification sent',
      slackResult,
      proposal: proposal.codigo
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});