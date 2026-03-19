import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SLACK_CHANNEL = '#comercial-sub';
const SLACK_BOT_NAME = 'Pagsmile Bot';
const SLACK_BOT_EMOJI = ':hourglass_flowing_sand:';

async function sendSlackMessage(accessToken, channel, text, blocks) {
  const body = { channel, text, username: SLACK_BOT_NAME, icon_emoji: SLACK_BOT_EMOJI };
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
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const proposals = await base44.asServiceRole.entities.Proposal.filter({});
    const expiringProposals = [];

    for (const proposal of proposals) {
      if (!['enviada', 'visualizada'].includes(proposal.status)) continue;
      if (!proposal.validUntil) continue;

      const expiryDate = new Date(proposal.validUntil);
      // Between now and 3 days from now
      if (expiryDate > now && expiryDate <= threeDaysLater) {
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        expiringProposals.push({
          id: proposal.id,
          codigo: proposal.codigo,
          clienteNome: proposal.clienteNome,
          validUntil: proposal.validUntil,
          daysLeft,
          status: proposal.status,
          leadId: proposal.leadId
        });
      }
    }

    if (expiringProposals.length === 0) {
      return Response.json({ message: 'No expiring proposals', count: 0 });
    }

    const lines = expiringProposals
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .map(p => {
        const urgency = p.daysLeft <= 1 ? '🔴' : '🟡';
        return `${urgency} *${p.codigo || 'Sem código'}* — ${p.clienteNome || 'N/A'} (expira em *${p.daysLeft} dia${p.daysLeft !== 1 ? 's' : ''}*, status: ${p.status})`;
      })
      .join('\n');

    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: `⏰ ${expiringProposals.length} Proposta(s) Prestes a Expirar`, emoji: true }
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: lines }
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '💡 *Ação recomendada:* Entre em contato com os clientes antes que as propostas expirem.' }
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `Verificação automática • ${now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}` }
        ]
      }
    ];

    const slackToken = await base44.asServiceRole.connectors.getAccessToken('slackbot');
    await sendSlackMessage(
      slackToken,
      SLACK_CHANNEL,
      `⏰ ${expiringProposals.length} proposta(s) expirando nos próximos 3 dias`,
      blocks
    );

    return Response.json({
      message: `${expiringProposals.length} expiring proposals notified`,
      count: expiringProposals.length,
      proposals: expiringProposals
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});