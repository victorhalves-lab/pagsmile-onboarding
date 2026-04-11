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
 * RÉGUA #5 — E-mail: Fluxo Compliance (momentos pós-análise)
 * Trigger: OnboardingCase [update]
 * 
 * IMPORTANTE - Mapeamento do fluxo:
 * O cliente preenche o questionário de compliance → ao finalizar, ele automaticamente
 * é direcionado para upload de documentos → e depois para verificação CAF (liveness/facematch).
 * Tudo isso acontece em sequência no mesmo fluxo, sem e-mail.
 * 
 * Os e-mails desta função são disparados DEPOIS que o time interno analisa:
 * - "Docs Solicitados": analista pediu docs ADICIONAIS após a análise inicial
 * - "Em Processamento": confirma que a análise está rodando
 * - "Manual": caso foi encaminhado para revisão manual
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const caseData = body.data;
    const oldData = body.old_data;
    if (!caseData || !oldData) return Response.json({ skipped: true, reason: 'no_data' });

    const changedFields = body.changed_fields || [];
    if (!changedFields.includes('status')) return Response.json({ skipped: true, reason: 'status_not_changed' });

    const newStatus = caseData.status;
    const oldStatus = oldData.status;
    if (newStatus === oldStatus) return Response.json({ skipped: true, reason: 'same_status' });

    const handledStatuses = ['Docs Solicitados', 'Em Processamento', 'Manual'];
    if (!handledStatuses.includes(newStatus)) return Response.json({ skipped: true, reason: 'not_compliance_flow_status' });

    const merchantId = caseData.merchantId;
    if (!merchantId) return Response.json({ skipped: true, reason: 'no_merchant' });

    const [merchant] = await base44.asServiceRole.entities.Merchant.filter({ id: merchantId });
    if (!merchant?.email) return Response.json({ skipped: true, reason: 'no_email' });

    const merchantName = merchant.companyName || merchant.fullName || 'Parceiro(a)';

    let emailConfig;

    if (newStatus === 'Docs Solicitados') {
      const docUrl = caseData.docLinkToken 
        ? `${BASE_URL}/ComplianceDocOnly?token=${caseData.docLinkToken}`
        : null;

      emailConfig = {
        title: 'Documentos Adicionais Necessários 📄',
        subtitle: 'Precisamos de documentos complementares para concluir sua análise.',
        greeting: `Olá, ${merchantName}!`,
        body: [
          `Sua análise de compliance está em andamento. Após revisão das informações e documentos já enviados, nosso time identificou a necessidade de <strong>documentos complementares</strong>.`,
          `${docUrl ? 'Clique no botão abaixo para acessar a página segura de envio.' : 'Em breve você receberá orientações sobre como enviá-los.'}`,
          `<strong>Exemplos do que pode ser solicitado:</strong> documentos societários atualizados, comprovantes adicionais, procurações, entre outros.`,
          `Quanto antes recebermos, mais rápido concluímos a análise. Estamos aqui para ajudar! 💪`,
        ],
        ctaText: docUrl ? 'Enviar Documentos Adicionais' : null,
        ctaUrl: docUrl,
        subject: `📄 ${merchantName}, precisamos de documentos complementares`,
        fromName: 'Pagsmile (não responda)',
      };

    } else if (newStatus === 'Em Processamento') {
      emailConfig = {
        title: 'Análise em Andamento 🔍',
        subtitle: 'Recebemos tudo! Sua análise está sendo processada.',
        greeting: `Olá, ${merchantName}!`,
        body: [
          `Informamos que sua análise de compliance está em andamento. Nosso time de especialistas, apoiado por tecnologia de ponta, está avaliando todas as informações com cuidado.`,
          `<strong>Tempo estimado:</strong> a maioria das análises são concluídas em até 24 horas úteis.`,
          `Você receberá um e-mail assim que o resultado estiver disponível. Fique tranquilo(a)!`,
        ],
        subject: `🔍 ${merchantName}, sua análise está em andamento`,
        fromName: 'Pagsmile (não responda)',
      };

    } else if (newStatus === 'Manual') {
      emailConfig = {
        title: 'Revisão Especializada em Andamento 👁️',
        subtitle: 'Sua análise requer atenção de um especialista.',
        greeting: `Olá, ${merchantName}!`,
        body: [
          `Informamos que sua análise de compliance foi encaminhada para revisão por um especialista do nosso time.`,
          `Isso é parte do nosso processo padrão de qualidade e <strong>não significa necessariamente um problema</strong>. Muitas análises passam por revisão manual para garantir a melhor experiência.`,
          `Um analista dedicado está avaliando seu caso e poderá entrar em contato caso precise de informações adicionais.`,
          `<strong>Tempo estimado:</strong> revisões manuais são concluídas em até 48 horas úteis.`,
          `Obrigado pela paciência! 🤝`,
        ],
        subject: `👁️ ${merchantName}, sua análise está em revisão especializada`,
        fromName: 'Pagsmile (não responda)',
        accent: '#f59e0b',
      };
    }

    if (!emailConfig) return Response.json({ skipped: true, reason: 'no_config' });

    const html = buildEmail({
      title: emailConfig.title,
      subtitle: emailConfig.subtitle,
      greeting: emailConfig.greeting,
      body: emailConfig.body,
      ctaText: emailConfig.ctaText || null,
      ctaUrl: emailConfig.ctaUrl || null,
      footerNote: 'Pagsmile Compliance — Processo seguro e transparente.',
      accent: emailConfig.accent || '#2bc196',
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: merchant.email,
      subject: emailConfig.subject,
      body: html,
      from_name: emailConfig.fromName,
    });

    console.log(`[ComplianceFlow] Email "${newStatus}" sent to ${merchant.email} for case ${caseData.id}`);
    return Response.json({ success: true, status: newStatus, email: merchant.email });
  } catch (error) {
    console.error('[ComplianceFlow] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});