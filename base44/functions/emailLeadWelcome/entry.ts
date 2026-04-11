import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png';

function buildEmail({ title, subtitle, greeting, body: ps, ctaText, ctaUrl, infoBox, footerNote, accent = '#2bc196' }) {
  const cta = ctaText && ctaUrl ? `<div style="text-align:center;margin:30px 0"><a href="${ctaUrl}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px">${ctaText}</a></div>` : '';
  const info = infoBox ? `<div style="margin:24px 0;padding:18px;background:#f0fdf4;border-radius:10px;border-left:4px solid ${accent}">${infoBox}</div>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:20px"><div style="background:linear-gradient(135deg,#002443,#003366,#004080);padding:36px 30px 28px;border-radius:16px 16px 0 0;text-align:center"><img src="${LOGO}" alt="Pagsmile" style="height:32px;margin-bottom:20px"/><h1 style="color:${accent};margin:0;font-size:22px;font-weight:700">${title}</h1>${subtitle?`<p style="color:rgba(255,255,255,0.75);margin:10px 0 0;font-size:14px">${subtitle}</p>`:''}</div><div style="background:#fff;padding:32px 30px;border:1px solid #e2e8f0;border-top:none">${greeting?`<p style="color:#002443;font-size:16px;font-weight:600;margin:0 0 16px">${greeting}</p>`:''}${ps.map(p=>`<p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 14px">${p}</p>`).join('')}${info}${cta}</div><div style="background:#f8fafc;padding:24px 30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;text-align:center">${footerNote?`<p style="color:#64748b;font-size:12px;margin:0 0 8px">${footerNote}</p>`:''}<p style="color:#94a3b8;font-size:11px;margin:0">Pagsmile — Soluções de Pagamento Inteligentes<br>Este é um e-mail automático. Para dúvidas, entre em contato pelo seu canal comercial.</p></div></div></body></html>`;
}

/**
 * RÉGUA #1 — E-mail de Boas-vindas ao Lead
 * Trigger: Lead [create]
 * Quando: Lead preenche questionário de captação
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const lead = body.data;
    if (!lead) return Response.json({ skipped: true, reason: 'no_data' });

    const email = lead.email;
    if (!email) return Response.json({ skipped: true, reason: 'no_email' });

    const name = lead.fullName || lead.contactName || 'Parceiro(a)';
    const protocolo = lead.protocolo || '';

    const html = buildEmail({
      title: 'Recebemos seu questionário! 📋',
      subtitle: 'Obrigado pelo seu interesse na Pagsmile.',
      greeting: `Olá, ${name}!`,
      body: [
        `Confirmamos o recebimento do seu questionário de interesse. Estamos felizes que você esteja considerando a Pagsmile como parceiro de pagamentos!`,
        `<strong>O que acontece agora?</strong><br>Nossa equipe já está analisando suas informações. Em breve, um consultor comercial entrará em contato para discutir a melhor solução para o seu negócio.`,
        `${protocolo ? `Seu protocolo de acompanhamento é: <strong>${protocolo}</strong>` : ''}`,
        `Enquanto isso, fique à vontade para responder este e-mail caso tenha alguma dúvida ou informação adicional.`,
      ],
      infoBox: `<p style="color:#166534;margin:0;font-size:13px"><strong>Segmento:</strong> ${lead.businessSubCategory || 'Em análise'}<br><strong>Serviços solicitados:</strong> Pagamentos digitais</p>`,
      footerNote: 'Obrigado por confiar na Pagsmile! 💚',
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: `📋 Recebemos seu questionário, ${name}!`,
      body: html,
      from_name: 'Pagsmile Comercial'
    });

    console.log(`[LeadWelcome] Email sent to ${email}`);
    return Response.json({ success: true, email });
  } catch (error) {
    console.error('[LeadWelcome] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});