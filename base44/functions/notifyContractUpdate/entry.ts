import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SLACK_CHANNEL = '#comercial-sub';

async function sendSlack(token, channel, text, blocks) {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, text, blocks, username: 'Pagsmile Contratos', icon_emoji: ':page_facing_up:' }),
  });
  return res.json();
}

const STATUS_MAP = {
  sent: { emoji: '📤', header: 'Contrato Enviado ao Cliente' },
  signed: { emoji: '✍️', header: 'Contrato Assinado!' },
  cancelled: { emoji: '🚫', header: 'Contrato Cancelado' },
  ready: { emoji: '✅', header: 'Contrato Pronto para Envio' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data, changed_fields } = await req.json();

    if (event?.type !== 'update') return Response.json({ message: 'skip' });
    if (!changed_fields?.includes('status')) return Response.json({ message: 'skip' });

    const newStatus = data?.status;
    const oldStatus = old_data?.status;
    if (newStatus === oldStatus) return Response.json({ message: 'skip' });

    const cfg = STATUS_MAP[newStatus];
    if (!cfg) return Response.json({ message: 'skip: untracked status' });

    const c = data;
    const blocks = [
      { type: 'header', text: { type: 'plain_text', text: `${cfg.emoji} ${cfg.header}`, emoji: true } },
      { type: 'section', fields: [
        { type: 'mrkdwn', text: `*Cliente:*\n${c.clientName || 'N/A'}` },
        { type: 'mrkdwn', text: `*CNPJ:*\n${c.clientCnpj || 'N/A'}` },
        { type: 'mrkdwn', text: `*Código:*\n${c.codigo || 'N/A'}` },
        { type: 'mrkdwn', text: `*Responsável:*\n${c.responsavelNome || 'N/A'}` },
      ]},
    ];

    if (newStatus === 'signed' && c.signedDate) {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `🎉 Assinado em: ${new Date(c.signedDate).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}` } });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
    const result = await sendSlack(accessToken, SLACK_CHANNEL,
      `${cfg.emoji} ${c.clientName || 'Contrato'}: ${cfg.header} (${c.codigo || ''})`, blocks);

    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});