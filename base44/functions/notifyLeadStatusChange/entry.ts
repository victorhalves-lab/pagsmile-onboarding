import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SLACK_CHANNEL = '#comercial-sub';

const STATUS_LABELS = {
  questionario_preenchido: '📝 Questionário Preenchido',
  analisado_priscila: '🤖 Analisado pela PRISCILA',
  em_contato_comercial: '📞 Em Contato Comercial',
  proposta_enviada: '📤 Proposta Enviada',
  proposta_aceita: '✅ Proposta Aceita',
  proposta_recusada: '❌ Proposta Recusada',
  kyc_iniciado: '🔍 KYC Iniciado',
  kyc_aprovado: '✅ KYC Aprovado',
  kyc_revisao_manual: '⚠️ KYC Revisão Manual',
  ativado: '🚀 Ativado',
  perdido: '💀 Perdido',
};

async function sendSlack(token, channel, text, blocks) {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, text, blocks, username: 'Pagsmile Bot', icon_emoji: ':arrows_counterclockwise:' }),
  });
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data, changed_fields } = await req.json();

    if (event?.type !== 'update') return Response.json({ message: 'skip' });
    if (!changed_fields?.includes('status')) return Response.json({ message: 'skip: status not changed' });

    const oldStatus = old_data?.status;
    const newStatus = data?.status;
    if (oldStatus === newStatus) return Response.json({ message: 'skip: same status' });

    const lead = data;
    const oldLabel = STATUS_LABELS[oldStatus] || oldStatus || 'N/A';
    const newLabel = STATUS_LABELS[newStatus] || newStatus || 'N/A';

    const blocks = [
      { type: 'header', text: { type: 'plain_text', text: '🔄 Lead Mudou de Status', emoji: true } },
      { type: 'section', fields: [
        { type: 'mrkdwn', text: `*Empresa:*\n${lead.companyName || lead.fullName || 'N/A'}` },
        { type: 'mrkdwn', text: `*Segmento:*\n${lead.businessSubCategory || 'N/A'}` },
        { type: 'mrkdwn', text: `*De:*\n${oldLabel}` },
        { type: 'mrkdwn', text: `*Para:*\n${newLabel}` },
      ]},
    ];

    if (lead.commercialAgentName) {
      blocks.push({ type: 'context', elements: [
        { type: 'mrkdwn', text: `Responsável: ${lead.commercialAgentName}` }
      ]});
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
    const result = await sendSlack(accessToken, SLACK_CHANNEL,
      `🔄 ${lead.companyName || lead.fullName || 'Lead'}: ${oldLabel} → ${newLabel}`, blocks);

    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});