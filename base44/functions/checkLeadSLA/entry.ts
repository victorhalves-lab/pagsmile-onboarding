import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SLACK_CHANNEL = '#comercial-sub';
const SLACK_BOT_NAME = 'Pagsmile Bot';
const SLACK_BOT_EMOJI = ':rotating_light:';

// SLA rules per status (max days expected in each stage)
const SLA_RULES = {
  questionario_preenchido: { maxDays: 2, label: 'Análise em até 2 dias' },
  analisado_priscila: { maxDays: 3, label: 'Contato em até 3 dias' },
  em_contato_comercial: { maxDays: 5, label: 'Proposta em até 5 dias' },
  proposta_enviada: { maxDays: 7, label: 'Resposta em até 7 dias' },
  proposta_aceita: { maxDays: 3, label: 'KYC em até 3 dias' },
  kyc_iniciado: { maxDays: 10, label: 'Conclusão em até 10 dias' },
  kyc_revisao_manual: { maxDays: 5, label: 'Revisão em até 5 dias' },
};

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

    const leads = await base44.asServiceRole.entities.Lead.filter({});
    const now = new Date();
    const overdueLeads = [];

    for (const lead of leads) {
      if (['ativado', 'perdido', 'proposta_recusada'].includes(lead.status)) continue;

      const rule = SLA_RULES[lead.status];
      if (!rule) continue;

      const lastDate = lead.lastInteractionDate || lead.updated_date || lead.created_date;
      if (!lastDate) continue;

      const daysInStage = Math.floor((now - new Date(lastDate)) / (1000 * 60 * 60 * 24));
      
      if (daysInStage > rule.maxDays) {
        overdueLeads.push({
          id: lead.id,
          name: lead.companyName || lead.fullName || lead.email,
          status: lead.status,
          daysOverdue: daysInStage - rule.maxDays,
          totalDays: daysInStage,
          rule: rule.label,
          email: lead.email,
          contactName: lead.contactName,
        });
      }
    }

    if (overdueLeads.length === 0) {
      return Response.json({ message: 'No overdue leads', count: 0 });
    }

    // Build Slack message blocks
    const leadLines = overdueLeads
      .sort((a, b) => b.daysOverdue - a.daysOverdue)
      .map(l => `• *${l.name}* — ${l.rule} (:warning: ${l.daysOverdue}d excedido, ${l.totalDays}d no total)`)
      .join('\n');

    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: `⚠️ Alerta de SLA — ${overdueLeads.length} Lead(s) Parado(s)`, emoji: true }
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: leadLines }
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `Verificação automática • ${now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} às ${now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}` }
        ]
      }
    ];

    // Send Slack notification
    const slackToken = await base44.asServiceRole.connectors.getAccessToken('slackbot');
    const slackResult = await sendSlackMessage(
      slackToken,
      SLACK_CHANNEL,
      `⚠️ SLA Alert: ${overdueLeads.length} lead(s) parado(s)`,
      blocks
    );

    // Log activities for each overdue lead (only if not already logged today)
    for (const lead of overdueLeads) {
      const existingActivities = await base44.asServiceRole.entities.LeadActivity.filter({
        leadId: lead.id,
        activityType: 'nota_adicionada'
      });
      
      const alreadyAlertedToday = existingActivities.some(a => {
        if (!a.description?.includes('SLA excedido')) return false;
        const actDate = new Date(a.activityDate || a.created_date);
        return (now - actDate) < (24 * 60 * 60 * 1000);
      });

      if (!alreadyAlertedToday) {
        await base44.asServiceRole.entities.LeadActivity.create({
          leadId: lead.id,
          activityType: 'nota_adicionada',
          description: `⚠️ SLA excedido: ${lead.rule}. Lead parado há ${lead.totalDays} dias.`,
          performedBy: 'sistema',
          activityDate: now.toISOString()
        });
      }
    }

    return Response.json({ 
      message: `Slack notification sent. ${overdueLeads.length} overdue leads found.`,
      count: overdueLeads.length,
      slackResult,
      leads: overdueLeads 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});