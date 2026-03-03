import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { leadId, messageTemplateId, leadEmail, leadName, linkUrl } = await req.json();

    let body = '';
    let subject = 'Lembrete: Complete seu cadastro';

    if (messageTemplateId) {
      const templates = await base44.asServiceRole.entities.MessageTemplate.filter({ id: messageTemplateId });
      const template = templates[0];
      if (template) {
        body = template.body
          .replace(/\{\{leadName\}\}/g, leadName || 'Prezado(a)')
          .replace(/\{\{linkUrl\}\}/g, linkUrl || '')
          .replace(/\{\{companyName\}\}/g, 'Pagsmile');
        subject = (template.subject || subject)
          .replace(/\{\{leadName\}\}/g, leadName || 'Prezado(a)');
      }
    }

    if (!body) {
      body = `<p>Olá ${leadName || 'Prezado(a)'},</p>
<p>Notamos que você iniciou seu cadastro na Pagsmile mas ainda não completou o processo.</p>
<p>Continue de onde parou: <a href="${linkUrl || '#'}">${linkUrl || 'clique aqui'}</a></p>
<p>Estamos à disposição para qualquer dúvida!</p>
<p>Equipe Pagsmile</p>`;
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: leadEmail,
      subject,
      body,
      from_name: 'Pagsmile'
    });

    return Response.json({ message: 'Follow-up email sent', to: leadEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});