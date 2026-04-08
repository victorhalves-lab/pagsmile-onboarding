import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SLACK_CHANNEL = '#comercial-sub';
const SLACK_BOT_NAME = 'Pagsmile Bot';
const SLACK_BOT_EMOJI = ':star:';

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
    const body = await req.json();

    // This is called by entity automation on Lead create
    const event = body.event;
    const data = body.data;

    if (!data || event?.type !== 'create') {
      return Response.json({ message: 'Not a create event, skipping' });
    }

    const lead = data;
    const score = lead.priscilaQualityScore || 0;
    const risk = lead.priscilaRiskLevel || 'EM_ANALISE';

    // Build Slack message
    const riskEmoji = {
      BAIXO: '🟢', MEDIO: '🟡', ALTO: '🟠', CRITICO: '🔴', EM_ANALISE: '⚪'
    }[risk] || '⚪';

    const scoreEmoji = score >= 70 ? '🌟' : score >= 40 ? '⚡' : '⚠️';

    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🆕 Novo Lead Recebido!', emoji: true }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Empresa:*\n${lead.companyName || lead.fullName || 'N/A'}` },
          { type: 'mrkdwn', text: `*Contato:*\n${lead.contactName || lead.email || 'N/A'}` },
          { type: 'mrkdwn', text: `*Score:* ${scoreEmoji} ${score}/100` },
          { type: 'mrkdwn', text: `*Risco:* ${riskEmoji} ${risk}` },
        ]
      }
    ];

    if (lead.tpvMensal) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `💰 *TPV Mensal:* R$ ${lead.tpvMensal.toLocaleString('pt-BR')}` }
      });
    }

    // Show real segment label from questionnaireData if available, fallback to businessSubCategory
    const segmentoLabel = lead.questionnaireData?.segmentoLabel || lead.questionnaireData?.segmento || lead.businessSubCategory || '';
    if (segmentoLabel) {
      blocks.push({
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `Segmento: ${segmentoLabel} • Origem: ${lead.origemLead || 'Direto'} • Protocolo: ${lead.protocolo || '-'}` }
        ]
      });
    }

    // Highlight high-score or critical leads
    if (score >= 70) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: '🌟 *Lead de alto potencial!* Considere priorizar o contato.' }
      });
    } else if (risk === 'CRITICO' || risk === 'ALTO') {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `⚠️ *Atenção:* Lead com risco ${risk}. Verifique antes de prosseguir.` }
      });
    }

    const { accessToken: slackToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
    const result = await sendSlackMessage(
      slackToken,
      SLACK_CHANNEL,
      `🆕 Novo lead: ${lead.companyName || lead.fullName || 'N/A'} (Score: ${score}, Risco: ${risk})`,
      blocks
    );

    return Response.json({ message: 'Notification sent', slackResult: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});