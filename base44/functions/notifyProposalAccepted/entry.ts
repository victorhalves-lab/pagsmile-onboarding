import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SLACK_CHANNEL = '#comercial-sub';
const SLACK_BOT_NAME = 'Pagsmile Bot';
const SLACK_BOT_EMOJI = ':moneybag:';

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

    const newStatus = data?.status;
    const oldStatus = old_data?.status;

    // Only trigger on status transitions we care about
    const trackedTransitions = {
      'aceita': { emoji: '🎉', header: 'Proposta Aceita!', color: '#2bc196' },
      'recusada': { emoji: '❌', header: 'Proposta Recusada', color: '#ef4444' },
      'contraproposta': { emoji: '🤝', header: 'Contraproposta Recebida', color: '#3b82f6' },
    };

    if (!trackedTransitions[newStatus] || oldStatus === newStatus) {
      return Response.json({ message: 'Skipped: not a tracked status change' });
    }

    const config = trackedTransitions[newStatus];
    const proposal = data;
    const now = new Date();

    const statusFields = [
      { type: 'mrkdwn', text: `*Proposta:*\n${proposal.codigo || 'N/A'}` },
      { type: 'mrkdwn', text: `*Cliente:*\n${proposal.clienteNome || 'N/A'}` },
    ];

    if (newStatus === 'aceita' && proposal.acceptedDate) {
      statusFields.push({ type: 'mrkdwn', text: `*Aceita em:*\n${new Date(proposal.acceptedDate).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}` });
    }

    if (newStatus === 'recusada' && proposal.rejectedReason) {
      statusFields.push({ type: 'mrkdwn', text: `*Motivo:*\n${proposal.rejectedReason}` });
    }

    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${config.emoji} ${config.header}`, emoji: true }
      },
      {
        type: 'section',
        fields: statusFields
      },
    ];

    if (newStatus === 'aceita') {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: ':rocket: *Próximo passo:* O cliente foi direcionado para o questionário de Compliance. Acompanhe o progresso no painel.' }
      });
    }

    if (newStatus === 'contraproposta' && proposal.counterProposalDetails) {
      const details = proposal.counterProposalDetails;
      let detailText = '';
      if (details.mensagem) detailText += `*Mensagem do cliente:*\n${details.mensagem}\n`;
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: detailText || '_Sem detalhes adicionais_' }
      });
    }

    blocks.push({
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `Responsável: ${proposal.responsavelNome || proposal.created_by || 'N/A'} • ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}` }
      ]
    });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
    const slackResult = await sendSlackMessage(
      accessToken,
      SLACK_CHANNEL,
      `${config.emoji} ${proposal.clienteNome || 'Cliente'} — ${config.header} (${proposal.codigo || ''})`,
      blocks
    );

    console.log('Slack result:', JSON.stringify(slackResult));

    return Response.json({ 
      message: `Slack notification sent for status: ${newStatus}`,
      slackResult,
      proposal: proposal.codigo
    });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});