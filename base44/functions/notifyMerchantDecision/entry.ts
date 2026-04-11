import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png';
function buildEmail({ title, subtitle, greeting, body: ps, ctaText, ctaUrl, infoBox, footerNote, accent = '#2bc196' }) {
  const cta = ctaText && ctaUrl ? `<div style="text-align:center;margin:30px 0"><a href="${ctaUrl}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px">${ctaText}</a></div>` : '';
  const info = infoBox ? `<div style="margin:24px 0;padding:18px;background:#f0fdf4;border-radius:10px;border-left:4px solid ${accent}">${infoBox}</div>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:20px"><div style="background:linear-gradient(135deg,#002443,#003366,#004080);padding:36px 30px 28px;border-radius:16px 16px 0 0;text-align:center"><img src="${LOGO}" alt="Pagsmile" style="height:32px;margin-bottom:20px"/><h1 style="color:${accent};margin:0;font-size:22px;font-weight:700">${title}</h1>${subtitle?`<p style="color:rgba(255,255,255,0.75);margin:10px 0 0;font-size:14px">${subtitle}</p>`:''}</div><div style="background:#fff;padding:32px 30px;border:1px solid #e2e8f0;border-top:none">${greeting?`<p style="color:#002443;font-size:16px;font-weight:600;margin:0 0 16px">${greeting}</p>`:''}${ps.map(p=>`<p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 14px">${p}</p>`).join('')}${info}${cta}</div><div style="background:#f8fafc;padding:24px 30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;text-align:center">${footerNote?`<p style="color:#64748b;font-size:12px;margin:0 0 8px">${footerNote}</p>`:''}<p style="color:#94a3b8;font-size:11px;margin:0">Pagsmile — Soluções de Pagamento Inteligentes<br>Este é um e-mail automático. Para dúvidas, entre em contato pelo seu canal comercial.</p></div></div></body></html>`;
}

/**
 * FASE 4 — E-mail #20/#23: Decisão Aprovado/Recusado (V4 automático)
 * Trigger: OnboardingCase [update] com status = Aprovado ou Recusado
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const caseId = body.event?.entity_id || body.data?.id;
    if (!caseId) return Response.json({ skipped: true, reason: 'no_case_id' });

    const caseData = body.data;
    const oldData = body.old_data;
    if (!caseData || !oldData) return Response.json({ skipped: true, reason: 'no_data' });

    const changedFields = body.changed_fields || [];
    if (!changedFields.includes('status')) return Response.json({ skipped: true, reason: 'status_not_changed' });

    const newStatus = caseData.status;
    const oldStatus = oldData.status;
    if (newStatus === oldStatus) return Response.json({ skipped: true, reason: 'same_status' });
    if (!['Aprovado', 'Recusado'].includes(newStatus)) return Response.json({ skipped: true, reason: 'not_terminal' });

    const merchantId = caseData.merchantId;
    if (!merchantId) return Response.json({ skipped: true, reason: 'no_merchant' });

    const [merchant] = await base44.asServiceRole.entities.Merchant.filter({ id: merchantId });
    if (!merchant?.email) return Response.json({ skipped: true, reason: 'no_email' });

    const merchantName = merchant.companyName || merchant.fullName || 'Parceiro(a)';
    const isApproved = newStatus === 'Aprovado';
    const subfaixa = caseData.subfaixaNome || caseData.subfaixa || '';

    const hasConditions = caseData.condicoesAutomaticas?.length > 0;

    const html = isApproved ? buildEmail({
      title: hasConditions ? 'Aprovado com Condições! ✅' : 'Parabéns, você foi aprovado! 🎉',
      subtitle: hasConditions 
        ? 'Sua análise foi concluída — com algumas observações.'
        : 'Sua análise de compliance foi concluída com sucesso total.',
      greeting: `Olá, ${merchantName}!`,
      body: hasConditions ? [
        `Temos uma ótima notícia! Sua análise de compliance foi <strong style="color:#2bc196">aprovada</strong>. Estamos muito felizes em ter você como parceiro(a)!`,
        `Para garantir o melhor para ambos, foram aplicadas algumas condições que precisam ser atendidas:`,
        `<ul style="color:#475569;line-height:2">${caseData.condicoesAutomaticas.map(c => `<li>${c}</li>`).join('')}</ul>`,
        `Nosso time vai acompanhar de perto o cumprimento dessas condições e estará disponível para qualquer dúvida. Estamos juntos nessa! 💪`,
      ] : [
        `É com enorme satisfação que comunicamos: sua análise de compliance foi <strong style="color:#2bc196">aprovada</strong> sem nenhuma restrição!`,
        `Isso demonstra a solidez e seriedade do seu negócio. Estamos muito orgulhosos de tê-lo(a) como parceiro(a) da Pagsmile.`,
        `<strong>Próximos passos:</strong><br>Nossa equipe entrará em contato para iniciar o processo de ativação dos seus serviços de pagamento. Em breve você estará operando com a gente!`,
        `Obrigado por confiar na Pagsmile. Vamos construir algo incrível juntos! 🚀`,
      ],
      infoBox: `<p style="color:#166534;margin:0;font-size:13px"><strong>Classificação:</strong> ${subfaixa}${caseData.rollingReservePercent > 0 ? `<br><strong>Rolling Reserve:</strong> ${caseData.rollingReservePercent}%` : ''}</p>`,
      footerNote: 'Bem-vindo(a) à Pagsmile! 💚',
    }) : buildEmail({
      title: 'Resultado da sua análise ⚠️',
      subtitle: 'Agradecemos seu interesse na Pagsmile.',
      greeting: `Olá, ${merchantName}!`,
      body: [
        `Após uma análise cuidadosa e detalhada dos dados fornecidos, identificamos pontos que, neste momento, não nos permitem seguir com a ativação.`,
        // BC 3978: explicitar os motivos da decisão ao titular
        ...(caseData.bloqueiosAtivos?.length > 0 ? [
          `<strong>Motivos identificados na análise:</strong><ul style="color:#475569;line-height:2;margin:8px 0">${caseData.bloqueiosAtivos.map(b => {
            const reasons = {
              'B01_CNPJ_INATIVO': 'Situação cadastral do CNPJ não está ativa na Receita Federal',
              'B02_SITUACAO_ESPECIAL': 'Empresa em situação especial (recuperação judicial ou similar)',
              'B03_ATIVIDADE_PROIBIDA': 'Atividade econômica não permitida para operação de pagamentos',
              'B04_SANCAO_OFAC': 'Presença em listas de sanções internacionais',
              'B05_CPF_OBITO': 'CPF do responsável com registro de óbito',
              'B06_DEEPFAKE': 'Verificação biométrica não aprovada (prova de vida)',
              'B07_DOC_FALSIFICADO': 'Documento apresentado não passou na validação de autenticidade',
              'B08_FACEMATCH_LOW': 'Similaridade facial entre documento e selfie abaixo do mínimo',
              'B09_MEI_INTERMEDIARIO': 'MEI não pode operar como intermediário de pagamentos',
              'B10_RJ_PIX_INTERMEDIARIO': 'Empresa em recuperação judicial não pode operar como intermediário PIX',
            };
            return `<li>${reasons[b] || b.replace(/_/g, ' ')}</li>`;
          }).join('')}</ul>`,
        ] : [
          `Os motivos estão relacionados a pendências regulatórias e/ou documentais identificadas durante o processo de compliance.`,
        ]),
        `Sabemos que essa não é a notícia que você esperava. Em muitos casos, essas pendências podem ser resolvidas. Nossa equipe comercial está à disposição para orientar sobre os próximos passos e auxiliar na regularização.`,
        `Valorizamos muito o seu interesse na Pagsmile e esperamos poder atendê-lo(a) no futuro. As portas estão sempre abertas! 🤝`,
      ],
      accent: '#f59e0b',
      footerNote: 'Conforme regulamentação do Banco Central (BC 3978), os motivos da decisão são comunicados ao titular.',
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: merchant.email,
      subject: isApproved 
        ? (hasConditions ? `✅ ${merchantName}, aprovado com condições!` : `🎉 Parabéns ${merchantName} — aprovado na Pagsmile!`)
        : `⚠️ ${merchantName}, resultado da sua análise de compliance`,
      body: html,
      from_name: 'Pagsmile Compliance'
    });

    console.log(`[NotifyDecision] Email sent to ${merchant.email} for case ${caseId}: ${newStatus}`);

    return Response.json({ success: true, caseId, status: newStatus, email: merchant.email });
  } catch (error) {
    console.error('[NotifyDecision] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});