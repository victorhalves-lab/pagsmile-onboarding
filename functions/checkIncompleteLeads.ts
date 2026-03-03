import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get links with clicks but no submissions
    const links = await base44.asServiceRole.entities.OnboardingLink.filter({});
    const incompleteLinks = links.filter(l =>
      (l.clickCount || 0) > 0 &&
      (l.submissionCount || 0) === 0 &&
      l.isActive &&
      new Date(l.updated_date || l.created_date) >= sevenDaysAgo &&
      new Date(l.updated_date || l.created_date) <= oneDayAgo
    );

    if (incompleteLinks.length === 0) {
      return Response.json({ message: 'No incomplete leads found', count: 0 });
    }

    // Get follow-up templates
    const templates = await base44.asServiceRole.entities.MessageTemplate.filter({ category: 'FOLLOW_UP', isActive: true });
    const followUpTemplate = templates[0]; // Use first active follow-up template

    const results = [];

    for (const link of incompleteLinks) {
      // Check if agent has email info via the link
      if (!link.commercialAgentName) continue;

      // Try to find associated leads by link code
      const leads = await base44.asServiceRole.entities.Lead.filter({ onboardingLinkCode: link.uniqueCode });
      
      for (const lead of leads) {
        if (!lead.email) continue;

        // Check if follow-up was already sent recently
        const activities = await base44.asServiceRole.entities.LeadActivity.filter({ leadId: lead.id });
        const recentFollowUp = activities.some(a =>
          a.description?.includes('Follow-up enviado') &&
          (now - new Date(a.activityDate || a.created_date)) < (24 * 60 * 60 * 1000)
        );

        if (recentFollowUp) continue;

        // Send follow-up
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: lead.email,
          subject: 'Lembrete: Complete seu cadastro na Pagsmile',
          body: `<p>Olá ${lead.fullName || lead.contactName || 'Prezado(a)'},</p>
<p>Notamos que você iniciou seu processo de cadastro na Pagsmile mas ainda não o completou.</p>
<p>Estamos à disposição para auxiliá-lo(a) no que for necessário.</p>
<p>Equipe Pagsmile</p>`,
          from_name: 'Pagsmile'
        });

        await base44.asServiceRole.entities.LeadActivity.create({
          leadId: lead.id,
          activityType: 'nota_adicionada',
          description: '📧 Follow-up enviado automaticamente (lead incompleto)',
          performedBy: 'sistema',
          activityDate: now.toISOString()
        });

        results.push({ leadId: lead.id, email: lead.email });
      }
    }

    return Response.json({
      message: `${results.length} follow-up emails sent`,
      count: results.length,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});