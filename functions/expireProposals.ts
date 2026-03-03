import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SLACK_CHANNEL = '#comercial-sub';
const SLACK_BOT_NAME = 'Pagsmile Bot';
const SLACK_BOT_EMOJI = ':clipboard:';

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
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const proposals = await base44.asServiceRole.entities.Proposal.filter({});
    
    const expirableStatuses = ['rascunho', 'enviada', 'visualizada'];
    const expiredProposals = [];

    for (const proposal of proposals) {
      if (!expirableStatuses.includes(proposal.status)) continue;
      if (!proposal.validUntil) continue;
      
      const expiryDate = new Date(proposal.validUntil);
      if (expiryDate >= now) continue;

      await base44.asServiceRole.entities.Proposal.update(proposal.id, {
        status: 'expirada'
      });

      if (proposal.leadId) {
        await base44.asServiceRole.entities.LeadActivity.create({
          leadId: proposal.leadId,
          activityType: 'nota_adicionada',
          description: `Proposta ${proposal.codigo || proposal.id} expirou automaticamente (validade: ${expiryDate.toLocaleDateString('pt-BR')})`,
          performedBy: 'sistema',
          activityDate: now.toISOString()
        });
      }

      expiredProposals.push({
        id: proposal.id,
        codigo: proposal.codigo,
        clienteNome: proposal.clienteNome,
        validUntil: proposal.validUntil,
        leadId: proposal.leadId
      });
    }

    if (expiredProposals.length > 0) {
      const lines = expiredProposals
        .map(p => `• *${p.codigo || 'Sem código'}* — ${p.clienteNome || 'N/A'} (vencida em ${new Date(p.validUntil).toLocaleDateString('pt-BR')})`)
        .join('\n');

      const blocks = [
        {
          type: 'header',
          text: { type: 'plain_text', text: `📋 ${expiredProposals.length} Proposta(s) Expirada(s)`, emoji: true }
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: lines }
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: ':bulb: Considere entrar em contato com os clientes para renovar as propostas.' }
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
        `📋 ${expiredProposals.length} proposta(s) expirada(s) automaticamente`,
        blocks
      );
    }

    return Response.json({
      message: `${expiredProposals.length} proposals expired`,
      count: expiredProposals.length,
      proposals: expiredProposals
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});