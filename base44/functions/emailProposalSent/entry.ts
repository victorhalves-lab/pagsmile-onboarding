import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png';
const BASE_URL = 'https://pagsmile-onboarding.base44.app';

function buildEmail({ title, subtitle, greeting, body: ps, ctaText, ctaUrl, infoBox, footerNote, accent = '#2bc196' }) {
  const cta = ctaText && ctaUrl ? `<div style="text-align:center;margin:30px 0"><a href="${ctaUrl}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px">${ctaText}</a></div>` : '';
  const info = infoBox ? `<div style="margin:24px 0;padding:18px;background:#f0fdf4;border-radius:10px;border-left:4px solid ${accent}">${infoBox}</div>` : '';
  const noReply = '<div style="margin:20px 0;padding:14px;background:#fff7ed;border-radius:10px;border-left:4px solid #f59e0b"><p style="color:#92400e;margin:0;font-size:12px"><strong>⚠️ Este é um e-mail automático (no-reply).</strong> Por favor, não responda a este e-mail — respostas não serão recebidas. Para dúvidas, entre em contato pelos canais oficiais da Pagsmile.</p></div>';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:20px"><div style="background:linear-gradient(135deg,#002443,#003366,#004080);padding:36px 30px 28px;border-radius:16px 16px 0 0;text-align:center"><img src="${LOGO}" alt="Pagsmile" style="height:32px;margin-bottom:20px"/><h1 style="color:${accent};margin:0;font-size:22px;font-weight:700">${title}</h1>${subtitle?`<p style="color:rgba(255,255,255,0.75);margin:10px 0 0;font-size:14px">${subtitle}</p>`:''}</div><div style="background:#fff;padding:32px 30px;border:1px solid #e2e8f0;border-top:none">${greeting?`<p style="color:#002443;font-size:16px;font-weight:600;margin:0 0 16px">${greeting}</p>`:''}${ps.map(p=>`<p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 14px">${p}</p>`).join('')}${info}${noReply}${cta}</div><div style="background:#f8fafc;padding:24px 30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;text-align:center">${footerNote?`<p style="color:#64748b;font-size:12px;margin:0 0 8px">${footerNote}</p>`:''}<p style="color:#94a3b8;font-size:11px;margin:0">Pagsmile — Soluções de Pagamento Inteligentes<br>Este é um e-mail automático (no-reply). Não responda.</p></div></div></body></html>`;
}

/**
 * RÉGUA #3 — E-mail: Proposta Enviada ao Cliente
 * Trigger: Proposal [update] status → 'enviada'
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const proposal = body.data;
    const oldData = body.old_data;
    if (!proposal || !oldData) return Response.json({ skipped: true, reason: 'no_data' });

    if (proposal.status !== 'enviada') return Response.json({ skipped: true, reason: 'not_enviada' });
    if (oldData.status === 'enviada') return Response.json({ skipped: true, reason: 'already_enviada' });

    const leadId = proposal.leadId;
    let clientEmail = null;
    let clientName = proposal.clienteNome || 'Parceiro(a)';

    if (leadId) {
      const [lead] = await base44.asServiceRole.entities.Lead.filter({ id: leadId });
      if (lead?.email) {
        clientEmail = lead.email;
        clientName = lead.companyName || lead.fullName || clientName;
      }
    }

    if (!clientEmail) return Response.json({ skipped: true, reason: 'no_client_email' });

    const publicCode = proposal.publicLinkCode || proposal.tokenPublico;
    const proposalUrl = publicCode ? `${BASE_URL}/PropostaPublica?code=${publicCode}` : null;

    const validUntil = proposal.validUntil 
      ? new Date(proposal.validUntil).toLocaleDateString('pt-BR')
      : null;

    const html = buildEmail({
      title: 'Sua Proposta Comercial está pronta! 📊',
      subtitle: `Proposta ${proposal.codigo || ''} — personalizada para o seu negócio`,
      greeting: `Olá, ${clientName}!`,
      body: [
        `Preparamos uma proposta comercial personalizada para o seu negócio. Analisamos seu perfil e desenhamos condições sob medida para atender às suas necessidades.`,
        `Na proposta, você encontrará todos os detalhes das taxas, condições e serviços que oferecemos.`,
        `${validUntil ? `<strong>⏰ Validade:</strong> esta proposta é válida até <strong>${validUntil}</strong>. Após essa data, as condições podem ser revisadas.` : ''}`,
        `Caso tenha qualquer dúvida, entre em contato pelos canais oficiais da Pagsmile.`,
        `Estamos ansiosos para tê-lo(a) conosco! 🚀`,
      ],
      ctaText: proposalUrl ? 'Ver Minha Proposta' : null,
      ctaUrl: proposalUrl,
      infoBox: `<p style="color:#166534;margin:0;font-size:13px"><strong>Código:</strong> ${proposal.codigo || 'N/A'}<br><strong>Segmento:</strong> ${proposal.businessSubCategory || 'N/A'}</p>`,
      footerNote: 'Obrigado por considerar a Pagsmile! 💚',
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: clientEmail,
      subject: `📊 ${clientName}, sua proposta comercial Pagsmile está pronta!`,
      body: html,
      from_name: 'Pagsmile (não responda)'
    });

    console.log(`[ProposalSent] Email sent to ${clientEmail} for proposal ${proposal.id}`);
    return Response.json({ success: true, email: clientEmail, proposalId: proposal.id });
  } catch (error) {
    console.error('[ProposalSent] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});