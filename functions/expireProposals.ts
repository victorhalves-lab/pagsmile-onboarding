import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    
    // Get all proposals that could be expired
    const proposals = await base44.asServiceRole.entities.Proposal.filter({});
    
    const expirableStatuses = ['rascunho', 'enviada', 'visualizada'];
    const expiredProposals = [];

    for (const proposal of proposals) {
      if (!expirableStatuses.includes(proposal.status)) continue;
      if (!proposal.validUntil) continue;
      
      const expiryDate = new Date(proposal.validUntil);
      if (expiryDate >= now) continue;

      // Expire the proposal
      await base44.asServiceRole.entities.Proposal.update(proposal.id, {
        status: 'expirada'
      });

      // Log activity on the lead
      if (proposal.leadId) {
        await base44.asServiceRole.entities.LeadActivity.create({
          leadId: proposal.leadId,
          activityType: 'nota_adicionada',
          description: `Proposta ${proposal.codigo || proposal.id} expirou automaticamente (validade: ${expiryDate.toLocaleDateString('pt-BR')})`,
          performedBy: 'sistema',
          activityDate: now.toISOString()
        });
      }

      expiredProposals.push({
        id: proposal.id,
        codigo: proposal.codigo,
        clienteNome: proposal.clienteNome,
        validUntil: proposal.validUntil,
        leadId: proposal.leadId
      });
    }

    // Send notification email if any proposals expired
    if (expiredProposals.length > 0) {
      const list = expiredProposals
        .map(p => `• ${p.codigo || 'Sem código'} — ${p.clienteNome || 'N/A'} (vencida em ${new Date(p.validUntil).toLocaleDateString('pt-BR')})`)
        .join('\n');

      const emailBody = `
<div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #002443, #003366); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 20px;">📋 Propostas Expiradas Automaticamente</h1>
    <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">${expiredProposals.length} proposta(s) expiraram hoje</p>
  </div>
  <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <pre style="background: #f8f9fa; padding: 16px; border-radius: 8px; font-size: 13px; color: #002443; white-space: pre-wrap; line-height: 1.8;">${list}</pre>
    <p style="color: #002443; font-size: 13px; margin-top: 16px; opacity: 0.7;">Considere entrar em contato com os clientes para renovar as propostas.</p>
  </div>
</div>`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `📋 ${expiredProposals.length} proposta(s) expirada(s) automaticamente`,
        body: emailBody
      });
    }

    return Response.json({
      message: `${expiredProposals.length} proposals expired`,
      count: expiredProposals.length,
      proposals: expiredProposals
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});