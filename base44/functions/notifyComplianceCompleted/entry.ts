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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data, changed_fields } = await req.json();

    if (event?.type !== 'update') return Response.json({ message: 'skip' });
    if (!changed_fields?.includes('currentPhase')) return Response.json({ message: 'skip' });

    const newPhase = data?.currentPhase;
    const oldPhase = old_data?.currentPhase;
    if (newPhase !== 'completed' || oldPhase === 'completed') return Response.json({ message: 'skip' });

    const session = data;
    const modelo = session.templateModel || session.flowType || 'N/A';

    const blocks = [
      { type: 'header', text: { type: 'plain_text', text: '📋 Questionário de Compliance Preenchido!', emoji: true } },
      { type: 'section', fields: [
        { type: 'mrkdwn', text: `*Empresa:*\n${session.clientName || 'N/A'}` },
        { type: 'mrkdwn', text: `*E-mail:*\n${session.clientEmail || 'N/A'}` },
        { type: 'mrkdwn', text: `*Modelo:*\n${modelo.toUpperCase()}` },
        { type: 'mrkdwn', text: `*Data:*\n${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}` },
      ]},
      { type: 'section', text: { type: 'mrkdwn', text: '👉 *Próximo passo:* Aguardando análise de risco pelo SENTINEL.' } },
    ];

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
    const result = await sendSlack(accessToken, SLACK_CHANNEL,
      `📋 Compliance preenchido: ${session.clientName || 'N/A'} (${modelo.toUpperCase()})`, blocks);

    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});