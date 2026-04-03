import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SLACK_CHANNEL = '#comercial-sub';

async function sendSlack(token, channel, text, blocks) {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, text, blocks, username: 'Pagsmile Bot', icon_emoji: ':clipboard:' }),
  });
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event?.type !== 'create') return Response.json({ message: 'skip' });

    const lead = data;
    const tpv = lead.tpvMensal ? `R$ ${Number(lead.tpvMensal).toLocaleString('pt-BR')}` : 'N/A';

    const blocks = [
      { type: 'header', text: { type: 'plain_text', text: '📋 Novo Lead via Proposta Padrão!', emoji: true } },
      { type: 'section', fields: [
        { type: 'mrkdwn', text: `*Empresa:*\n${lead.razaoSocial || lead.nomeFantasia || 'N/A'}` },
        { type: 'mrkdwn', text: `*CNPJ:*\n${lead.cnpj || 'N/A'}` },
        { type: 'mrkdwn', text: `*Segmento:*\n${lead.segment || 'N/A'}` },
        { type: 'mrkdwn', text: `*TPV Mensal:*\n${tpv}` },
      ]},
      { type: 'section', fields: [
        { type: 'mrkdwn', text: `*Contato:*\n${lead.contactName || 'N/A'} (${lead.email || ''})` },
        { type: 'mrkdwn', text: `*Telefone:*\n${lead.phone || 'N/A'}` },
      ]},
    ];

    if (lead.introducerName) {
      blocks.push({ type: 'context', elements: [
        { type: 'mrkdwn', text: `👤 Introducer: *${lead.introducerName}*` }
      ]});
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
    const result = await sendSlack(accessToken, SLACK_CHANNEL,
      `📋 Lead via Proposta Padrão: ${lead.razaoSocial || 'N/A'} — ${lead.segment || ''}`, blocks);

    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});