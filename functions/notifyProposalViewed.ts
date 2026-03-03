import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { event, data, old_data } = await req.json();

    // Only trigger on proposal updates
    if (event?.type !== 'update') {
      return Response.json({ message: 'Skipped: not an update event' });
    }

    // Only trigger when status changes to 'visualizada'
    if (data?.status !== 'visualizada' || old_data?.status === 'visualizada') {
      return Response.json({ message: 'Skipped: not a view event' });
    }

    const proposal = data;
    const now = new Date();

    // Get the responsible user (proposer) to notify
    let recipientEmail = null;
    
    if (proposal.responsavelId) {
      try {
        const users = await base44.asServiceRole.entities.User.filter({ id: proposal.responsavelId });
        if (users[0]) recipientEmail = users[0].email;
      } catch (e) {
        // ignore
      }
    }

    // Fallback: use created_by
    if (!recipientEmail && proposal.created_by) {
      recipientEmail = proposal.created_by;
    }

    if (!recipientEmail) {
      return Response.json({ message: 'No recipient found' });
    }

    const emailBody = `
<div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #2bc196, #1fa87f); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 20px;">👀 Proposta Visualizada!</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">O cliente abriu sua proposta agora</p>
  </div>
  <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <p style="margin: 0; font-size: 15px; color: #002443;"><strong>Proposta:</strong> ${proposal.codigo || 'N/A'}</p>
      <p style="margin: 4px 0 0; font-size: 15px; color: #002443;"><strong>Cliente:</strong> ${proposal.clienteNome || 'N/A'}</p>
      <p style="margin: 4px 0 0; font-size: 13px; color: #002443; opacity: 0.7;">Visualizada em: ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
    </div>
    <p style="color: #002443; font-size: 13px; opacity: 0.7;">💡 <strong>Dica:</strong> Este é o momento ideal para fazer um follow-up! O cliente está analisando a proposta agora.</p>
  </div>
</div>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `👀 ${proposal.clienteNome || 'Cliente'} visualizou a proposta ${proposal.codigo || ''}`,
      body: emailBody
    });

    return Response.json({ 
      message: 'Notification sent',
      to: recipientEmail,
      proposal: proposal.codigo
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});