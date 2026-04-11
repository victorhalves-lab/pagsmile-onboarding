import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png';

function buildEmail({ title, subtitle, greeting, body: ps, ctaText, ctaUrl, infoBox, footerNote, accent = '#2bc196' }) {
  const cta = ctaText && ctaUrl ? `<div style="text-align:center;margin:30px 0"><a href="${ctaUrl}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px">${ctaText}</a></div>` : '';
  const info = infoBox ? `<div style="margin:24px 0;padding:18px;background:#f0fdf4;border-radius:10px;border-left:4px solid ${accent}">${infoBox}</div>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:20px"><div style="background:linear-gradient(135deg,#002443,#003366,#004080);padding:36px 30px 28px;border-radius:16px 16px 0 0;text-align:center"><img src="${LOGO}" alt="Pagsmile" style="height:32px;margin-bottom:20px"/><h1 style="color:${accent};margin:0;font-size:22px;font-weight:700">${title}</h1>${subtitle?`<p style="color:rgba(255,255,255,0.75);margin:10px 0 0;font-size:14px">${subtitle}</p>`:''}</div><div style="background:#fff;padding:32px 30px;border:1px solid #e2e8f0;border-top:none">${greeting?`<p style="color:#002443;font-size:16px;font-weight:600;margin:0 0 16px">${greeting}</p>`:''}${ps.map(p=>`<p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 14px">${p}</p>`).join('')}${info}${cta}</div><div style="background:#f8fafc;padding:24px 30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;text-align:center">${footerNote?`<p style="color:#64748b;font-size:12px;margin:0 0 8px">${footerNote}</p>`:''}<p style="color:#94a3b8;font-size:11px;margin:0">Pagsmile — Soluções de Pagamento Inteligentes<br>Este é um e-mail automático. Para dúvidas, entre em contato pelo seu canal comercial.</p></div></div></body></html>`;
}

/**
 * RÉGUA #4 — E-mail: Proposta Aceita — Próximo Passo
 * Trigger: Proposal [update] status → 'aceita'
 * Envia e-mail ao cliente orientando sobre compliance
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const proposal = body.data;
    const oldData = body.old_data;
    if (!proposal || !oldData) return Response.json({ skipped: true, reason: 'no_data' });

    if (proposal.status !== 'aceita') return Response.json({ skipped: true, reason: 'not_aceita' });
    if (oldData.status === 'aceita') return Response.json({ skipped: true, reason: 'already_aceita' });

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

    const html = buildEmail({
      title: 'Proposta Aceita! 🎉',
      subtitle: 'Vamos iniciar o processo de compliance e ativação.',
      greeting: `Olá, ${clientName}!`,
      body: [
        `Ficamos muito felizes em saber que você aceitou nossa proposta comercial! Este é um passo importante para iniciarmos nossa parceria.`,
        `<strong>Próximos passos:</strong>`,
        `<ol style="color:#475569;line-height:2.2;padding-left:20px">
          <li><strong>Compliance / KYC</strong> — Em breve você receberá um link para preencher o questionário de compliance. É um processo simples e 100% digital.</li>
          <li><strong>Envio de Documentos</strong> — Dependendo do seu perfil, poderemos solicitar documentos complementares como contrato social, comprovante de endereço e documentos dos sócios.</li>
          <li><strong>Análise e Ativação</strong> — Após recebermos tudo, nossa equipe fará a análise e, uma vez aprovado, iniciaremos a integração técnica.</li>
        </ol>`,
        `Todo o processo é ágil e acompanhado de perto por nosso time. Você será notificado(a) em cada etapa.`,
        `Estamos ansiosos para começar! 🚀`,
      ],
      infoBox: `<p style="color:#166534;margin:0;font-size:13px"><strong>Proposta:</strong> ${proposal.codigo || 'N/A'}<br><strong>Segmento:</strong> ${proposal.businessSubCategory || 'N/A'}${proposal.responsavelNome ? `<br><strong>Consultor:</strong> ${proposal.responsavelNome}` : ''}</p>`,
      footerNote: 'Bem-vindo(a) à Pagsmile! 💚',
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: clientEmail,
      subject: `🎉 Proposta aceita, ${clientName}! Próximos passos com a Pagsmile`,
      body: html,
      from_name: 'Pagsmile Comercial'
    });

    console.log(`[ProposalAccepted] Email sent to ${clientEmail} for proposal ${proposal.id}`);
    return Response.json({ success: true, email: clientEmail, proposalId: proposal.id });
  } catch (error) {
    console.error('[ProposalAccepted] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});