import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SLACK_CHANNEL = '#comercial-sub';

async function sendSlack(token, channel, text, blocks) {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, text, blocks, username: 'Pagsmile Bot', icon_emoji: ':memo:' }),
  });
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event?.type !== 'create') return Response.json({ message: 'skip' });

    const p = data;
    const blocks = [
      { type: 'header', text: { type: 'plain_text', text: '📝 Nova Proposta Criada!', emoji: true } },
      { type: 'section', fields: [
        { type: 'mrkdwn', text: `*Código:*\n${p.codigo || 'N/A'}` },
        { type: 'mrkdwn', text: `*Cliente:*\n${p.clienteNome || 'N/A'}` },
        { type: 'mrkdwn', text: `*Segmento:*\n${p.businessSubCategory || 'N/A'}` },
        { type: 'mrkdwn', text: `*Parceiro:*\n${p.chosenPartnerName || 'N/A'}` },
      ]},
      { type: 'context', elements: [
        { type: 'mrkdwn', text: `Responsável: ${p.responsavelNome || p.created_by || 'N/A'} • Origem: ${p.sourceFlow || 'manual'}` }
      ]},
    ];

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
    const result = await sendSlack(accessToken, SLACK_CHANNEL,
      `📝 Nova proposta: ${p.clienteNome || 'N/A'} — ${p.codigo || ''}`, blocks);

    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});