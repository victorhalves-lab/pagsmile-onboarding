import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png';

function buildEmail({ title, subtitle, greeting, body: ps, ctaText, ctaUrl, infoBox, footerNote, accent = '#2bc196' }) {
  const cta = ctaText && ctaUrl ? `<div style="text-align:center;margin:30px 0"><a href="${ctaUrl}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px">${ctaText}</a></div>` : '';
  const info = infoBox ? `<div style="margin:24px 0;padding:18px;background:#f0fdf4;border-radius:10px;border-left:4px solid ${accent}">${infoBox}</div>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:20px"><div style="background:linear-gradient(135deg,#002443,#003366,#004080);padding:36px 30px 28px;border-radius:16px 16px 0 0;text-align:center"><img src="${LOGO}" alt="Pagsmile" style="height:32px;margin-bottom:20px"/><h1 style="color:${accent};margin:0;font-size:22px;font-weight:700">${title}</h1>${subtitle?`<p style="color:rgba(255,255,255,0.75);margin:10px 0 0;font-size:14px">${subtitle}</p>`:''}</div><div style="background:#fff;padding:32px 30px;border:1px solid #e2e8f0;border-top:none">${greeting?`<p style="color:#002443;font-size:16px;font-weight:600;margin:0 0 16px">${greeting}</p>`:''}${ps.map(p=>`<p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 14px">${p}</p>`).join('')}${info}${cta}</div><div style="background:#f8fafc;padding:24px 30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;text-align:center">${footerNote?`<p style="color:#64748b;font-size:12px;margin:0 0 8px">${footerNote}</p>`:''}<p style="color:#94a3b8;font-size:11px;margin:0">Pagsmile — Soluções de Pagamento Inteligentes<br>Este é um e-mail automático. Para dúvidas, entre em contato pelo seu canal comercial.</p></div></div></body></html>`;
}

/**
 * RÉGUA #2 — E-mail: Lead Pré-Qualificado pela IA
 * Trigger: Lead [update] quando leadQualifierScore muda
 * Envia notificação INTERNA ao time comercial (não ao lead)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const lead = body.data;
    const oldData = body.old_data;
    if (!lead || !oldData) return Response.json({ skipped: true, reason: 'no_data' });

    // Only proceed if qualifier score actually changed
    const changedFields = body.changed_fields || [];
    if (!changedFields.includes('leadQualifierScore')) return Response.json({ skipped: true, reason: 'score_not_changed' });

    const score = lead.leadQualifierScore;
    const level = lead.leadQualifierLevel || 'PENDENTE';
    if (!score || level === 'PENDENTE') return Response.json({ skipped: true, reason: 'no_score' });

    const name = lead.fullName || lead.contactName || 'Lead';
    const agentEmail = lead.commercialAgentId; // may be an email
    
    // Send internal notification to commercial agent or admin
    const recipients = [];
    if (agentEmail && agentEmail.includes('@')) {
      recipients.push(agentEmail);
    }
    // Always notify created_by (the system or agent that captured the lead)
    if (lead.created_by && lead.created_by.includes('@') && !recipients.includes(lead.created_by)) {
      recipients.push(lead.created_by);
    }

    if (recipients.length === 0) {
      return Response.json({ skipped: true, reason: 'no_recipients' });
    }

    const levelConfig = {
      'EXCELENTE': { emoji: '🌟', color: '#16a34a', label: 'Excelente — Lead Prioritário' },
      'BOM': { emoji: '✅', color: '#2bc196', label: 'Bom — Lead Qualificado' },
      'REGULAR': { emoji: '🔶', color: '#f59e0b', label: 'Regular — Verificar Detalhes' },
      'FRACO': { emoji: '⚠️', color: '#ef4444', label: 'Fraco — Baixa Maturidade' },
      'INSUFICIENTE': { emoji: '❌', color: '#991b1b', label: 'Insuficiente — Desqualificado' },
    };
    const cfg = levelConfig[level] || { emoji: '📊', color: '#64748b', label: level };

    const html = buildEmail({
      title: `${cfg.emoji} Lead Qualificado pela IA`,
      subtitle: `Score: ${score}/100 — ${cfg.label}`,
      greeting: `Novo lead pré-qualificado!`,
      body: [
        `A IA analisou o lead <strong>${name}</strong> (${lead.email || 'sem e-mail'}) e atribuiu a seguinte qualificação:`,
        `<div style="text-align:center;margin:16px 0"><span style="font-size:32px;font-weight:800;color:${cfg.color}">${score}</span><span style="color:#94a3b8;font-size:14px">/100</span><br><span style="color:${cfg.color};font-size:14px;font-weight:600">${cfg.label}</span></div>`,
        `${lead.iaSuggestions?.length ? `<strong>Sugestões da IA:</strong><ul style="line-height:2">${lead.iaSuggestions.map(s => `<li>${s}</li>`).join('')}</ul>` : ''}`,
        `Acesse o pipeline para dar seguimento a este lead.`,
      ],
      infoBox: `<p style="color:#166534;margin:0;font-size:13px"><strong>Empresa:</strong> ${lead.companyName || name}<br><strong>Segmento:</strong> ${lead.businessSubCategory || 'N/A'}<br><strong>TPV Mensal:</strong> ${lead.tpvMensal ? `R$ ${Number(lead.tpvMensal).toLocaleString('pt-BR')}` : 'N/A'}</p>`,
      footerNote: 'Notificação interna — Lead Qualifier IA',
    });

    for (const to of recipients) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to,
        subject: `${cfg.emoji} Lead qualificado: ${name} — Score ${score}/100`,
        body: html,
        from_name: 'Pagsmile Lead Qualifier'
      });
    }

    console.log(`[LeadQualified] Emails sent to ${recipients.join(', ')} for lead ${lead.id}`);
    return Response.json({ success: true, recipients, score, level });
  } catch (error) {
    console.error('[LeadQualified] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});