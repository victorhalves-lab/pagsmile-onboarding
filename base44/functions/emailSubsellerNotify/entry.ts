import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png';

function buildEmail({ title, subtitle, greeting, body: ps, ctaText, ctaUrl, infoBox, footerNote, accent = '#2bc196' }) {
  const cta = ctaText && ctaUrl ? `<div style="text-align:center;margin:30px 0"><a href="${ctaUrl}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px">${ctaText}</a></div>` : '';
  const info = infoBox ? `<div style="margin:24px 0;padding:18px;background:#f0fdf4;border-radius:10px;border-left:4px solid ${accent}">${infoBox}</div>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:20px"><div style="background:linear-gradient(135deg,#002443,#003366,#004080);padding:36px 30px 28px;border-radius:16px 16px 0 0;text-align:center"><img src="${LOGO}" alt="Pagsmile" style="height:32px;margin-bottom:20px"/><h1 style="color:${accent};margin:0;font-size:22px;font-weight:700">${title}</h1>${subtitle?`<p style="color:rgba(255,255,255,0.75);margin:10px 0 0;font-size:14px">${subtitle}</p>`:''}</div><div style="background:#fff;padding:32px 30px;border:1px solid #e2e8f0;border-top:none">${greeting?`<p style="color:#002443;font-size:16px;font-weight:600;margin:0 0 16px">${greeting}</p>`:''}${ps.map(p=>`<p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 14px">${p}</p>`).join('')}${info}${cta}</div><div style="background:#f8fafc;padding:24px 30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;text-align:center">${footerNote?`<p style="color:#64748b;font-size:12px;margin:0 0 8px">${footerNote}</p>`:''}<p style="color:#94a3b8;font-size:11px;margin:0">Pagsmile — Soluções de Pagamento Inteligentes<br>Este é um e-mail automático. Para dúvidas, entre em contato pelo seu canal comercial.</p></div></div></body></html>`;
}

/**
 * RÉGUA #7 — E-mail: Subseller Aprovado/Recusado → Seller Principal
 * Trigger: OnboardingCase [update] quando isSubsellerCase=true e status muda
 * Notifica o seller principal sobre a decisão do subseller
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const caseData = body.data;
    const oldData = body.old_data;
    if (!caseData || !oldData) return Response.json({ skipped: true, reason: 'no_data' });

    // Only for subseller cases
    if (!caseData.isSubsellerCase) return Response.json({ skipped: true, reason: 'not_subseller' });

    const changedFields = body.changed_fields || [];
    if (!changedFields.includes('status')) return Response.json({ skipped: true, reason: 'status_not_changed' });

    const newStatus = caseData.status;
    const oldStatus = oldData.status;
    if (newStatus === oldStatus) return Response.json({ skipped: true, reason: 'same_status' });
    if (!['Aprovado', 'Recusado'].includes(newStatus)) return Response.json({ skipped: true, reason: 'not_terminal' });

    // Get subseller merchant
    const merchantId = caseData.merchantId;
    if (!merchantId) return Response.json({ skipped: true, reason: 'no_merchant' });

    const [subsellerMerchant] = await base44.asServiceRole.entities.Merchant.filter({ id: merchantId });
    if (!subsellerMerchant) return Response.json({ skipped: true, reason: 'subseller_not_found' });

    // Get parent (seller) merchant
    const parentId = caseData.parentMerchantId || subsellerMerchant.parentMerchantId;
    if (!parentId) return Response.json({ skipped: true, reason: 'no_parent' });

    const [parentMerchant] = await base44.asServiceRole.entities.Merchant.filter({ id: parentId });
    if (!parentMerchant?.email) return Response.json({ skipped: true, reason: 'no_parent_email' });

    const parentName = parentMerchant.companyName || parentMerchant.fullName || 'Parceiro(a)';
    const subName = subsellerMerchant.companyName || subsellerMerchant.fullName || 'Subconta';
    const isApproved = newStatus === 'Aprovado';

    const html = buildEmail({
      title: isApproved ? `Subconta Aprovada! ✅` : `Resultado da análise da subconta ⚠️`,
      subtitle: `Subconta: ${subName}`,
      greeting: `Olá, ${parentName}!`,
      body: isApproved ? [
        `Temos boas notícias! A subconta <strong>${subName}</strong> vinculada à sua conta foi <strong style="color:#2bc196">aprovada</strong> na análise de compliance.`,
        `Essa subconta já está habilitada para processar transações dentro da sua operação.`,
        `Caso tenha mais subcontas pendentes, você pode acompanhar o status de todas pelo painel.`,
      ] : [
        `Informamos que a subconta <strong>${subName}</strong> vinculada à sua conta <strong style="color:#ef4444">não foi aprovada</strong> na análise de compliance neste momento.`,
        `${caseData.bloqueiosAtivos?.length > 0 ? `<strong>Motivos:</strong><ul style="line-height:2">${caseData.bloqueiosAtivos.map(b => `<li>${b.replace(/_/g, ' ')}</li>`).join('')}</ul>` : 'Os motivos estão relacionados a pendências documentais e/ou regulatórias.'}`,
        `Caso deseje, entre em contato com nosso time para orientações sobre como regularizar a situação.`,
      ],
      accent: isApproved ? '#2bc196' : '#f59e0b',
      infoBox: `<p style="color:#166534;margin:0;font-size:13px"><strong>Subconta:</strong> ${subName}<br><strong>CNPJ/CPF:</strong> ${subsellerMerchant.cpfCnpj || 'N/A'}<br><strong>Status:</strong> ${newStatus}</p>`,
      footerNote: 'Pagsmile — Gestão de Subcontas',
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: parentMerchant.email,
      subject: isApproved 
        ? `✅ Subconta ${subName} aprovada!`
        : `⚠️ Resultado da análise: subconta ${subName}`,
      body: html,
      from_name: 'Pagsmile Compliance'
    });

    console.log(`[SubsellerNotify] Email sent to ${parentMerchant.email} about subseller ${subName}: ${newStatus}`);
    return Response.json({ success: true, parentEmail: parentMerchant.email, subsellerName: subName, status: newStatus });
  } catch (error) {
    console.error('[SubsellerNotify] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});