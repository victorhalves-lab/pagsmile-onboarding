import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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
      // Skip final statuses
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

    // Group overdue leads for email
    const leadsList = overdueLeads
      .sort((a, b) => b.daysOverdue - a.daysOverdue)
      .map(l => `• ${l.name} — ${l.rule} (${l.daysOverdue} dia(s) excedido, ${l.totalDays}d no total)`)
      .join('\n');

    const emailBody = `
<div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #002443, #003366); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 20px;">⚠️ Alerta de SLA — Leads Parados</h1>
    <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">${overdueLeads.length} lead(s) com SLA excedido</p>
  </div>
  <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="color: #002443; font-size: 14px; margin-bottom: 16px;">Os seguintes leads estão parados além do prazo de SLA definido:</p>
    <pre style="background: #f8f9fa; padding: 16px; border-radius: 8px; font-size: 13px; color: #002443; white-space: pre-wrap; line-height: 1.8;">${leadsList}</pre>
    <p style="color: #002443; font-size: 13px; margin-top: 16px; opacity: 0.7;">Acesse o Pipeline Comercial para tomar ações.</p>
  </div>
</div>`;

    // Send email notification to admin
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: `⚠️ SLA Alert: ${overdueLeads.length} lead(s) parado(s)`,
      body: emailBody
    });

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
      message: `Email sent. ${overdueLeads.length} overdue leads found.`,
      count: overdueLeads.length,
      leads: overdueLeads 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});