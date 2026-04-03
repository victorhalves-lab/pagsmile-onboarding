import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SLACK_CHANNEL = '#comercial-sub';

async function sendSlack(token, channel, text, blocks) {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, text, blocks, username: 'Pagsmile Bot', icon_emoji: ':rotating_light:' }),
  });
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data, changed_fields } = await req.json();

    if (event?.type !== 'update') return Response.json({ message: 'skip' });
    if (!changed_fields?.includes('priscilaRiskLevel')) return Response.json({ message: 'skip' });

    const newRisk = data?.priscilaRiskLevel;
    const oldRisk = old_data?.priscilaRiskLevel;
    if (newRisk === oldRisk) return Response.json({ message: 'skip' });
    if (newRisk !== 'ALTO' && newRisk !== 'CRITICO') return Response.json({ message: 'skip: not high risk' });

    const lead = data;
    const emoji = newRisk === 'CRITICO' ? '🔴' : '🟠';
    const score = lead.priscilaQualityScore || 0;

    const blocks = [
      { type: 'header', text: { type: 'plain_text', text: `${emoji} Lead com Risco ${newRisk}!`, emoji: true } },
      { type: 'section', fields: [
        { type: 'mrkdwn', text: `*Empresa:*\n${lead.companyName || lead.fullName || 'N/A'}` },
        { type: 'mrkdwn', text: `*CNPJ:*\n${lead.cpfCnpj || 'N/A'}` },
        { type: 'mrkdwn', text: `*Score PRISCILA:*\n${score}/100` },
        { type: 'mrkdwn', text: `*Decisão:*\n${lead.priscilaDecisionPath || 'N/A'}` },
      ]},
      { type: 'section', text: { type: 'mrkdwn', text: `⚠️ *Atenção:* Verifique este lead antes de prosseguir com proposta comercial.` } },
    ];

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
    const result = await sendSlack(accessToken, SLACK_CHANNEL,
      `${emoji} Risco ${newRisk}: ${lead.companyName || lead.fullName || 'Lead'} (Score: ${score})`, blocks);

    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});