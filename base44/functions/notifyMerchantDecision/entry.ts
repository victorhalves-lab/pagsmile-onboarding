import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * notifyMerchantDecision — GAP 6
 * Envia e-mail ao merchant quando a decisão automática V4 é tomada.
 * Trigger: OnboardingCase [update] com changed_fields contendo "status".
 * Só envia se decisão foi automática (subfaixas 1A-3B = Aprovado, ou 5 = Recusado com bloqueio).
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

    // Only proceed if status actually changed
    const changedFields = body.changed_fields || [];
    if (!changedFields.includes('status')) {
      return Response.json({ skipped: true, reason: 'status_not_changed' });
    }

    // Only notify for transitions TO terminal states
    const newStatus = caseData.status;
    const oldStatus = oldData.status;
    if (newStatus === oldStatus) return Response.json({ skipped: true, reason: 'same_status' });

    // Only notify for automatic decisions (subfaixas 1A-3B = Aprovado, or bloqueio = Recusado)
    const notifiableStatuses = ['Aprovado', 'Recusado'];
    if (!notifiableStatuses.includes(newStatus)) {
      return Response.json({ skipped: true, reason: 'not_terminal_status' });
    }

    // Get merchant
    const merchantId = caseData.merchantId;
    if (!merchantId) return Response.json({ skipped: true, reason: 'no_merchant' });

    const [merchant] = await base44.asServiceRole.entities.Merchant.filter({ id: merchantId });
    if (!merchant?.email) {
      console.log(`[NotifyDecision] Merchant ${merchantId} has no email, skipping.`);
      return Response.json({ skipped: true, reason: 'no_email' });
    }

    const merchantName = merchant.companyName || merchant.fullName || 'Cliente';
    const isApproved = newStatus === 'Aprovado';
    const subfaixa = caseData.subfaixaNome || caseData.subfaixa || '';

    const subject = isApproved
      ? `✅ Sua análise de compliance foi aprovada — ${merchantName}`
      : `⚠️ Atualização sobre sua análise de compliance — ${merchantName}`;

    const body_html = isApproved
      ? `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #002443, #003366); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #2bc196; margin: 0; font-size: 24px;">✅ Aprovado!</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0;">Sua análise de compliance foi concluída com sucesso.</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="color: #002443; font-size: 16px;">Olá <strong>${merchantName}</strong>,</p>
    <p style="color: #334155; line-height: 1.6;">
      Temos o prazer de informar que sua análise de compliance foi <strong style="color: #2bc196;">aprovada</strong>.
      ${caseData.condicoesAutomaticas?.length > 0
        ? `<br><br>Algumas condições foram aplicadas:<ul style="color: #334155;">${caseData.condicoesAutomaticas.map(c => `<li>${c}</li>`).join('')}</ul>`
        : ''
      }
    </p>
    <p style="color: #334155; line-height: 1.6;">
      Nossa equipe entrará em contato com os próximos passos para a ativação dos seus serviços.
    </p>
    <div style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
      <p style="color: #166534; margin: 0; font-size: 13px;">
        <strong>Classificação:</strong> ${subfaixa}
        ${caseData.rollingReservePercent > 0 ? `<br><strong>Rolling Reserve:</strong> ${caseData.rollingReservePercent}%` : ''}
      </p>
    </div>
    <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
      Este é um e-mail automático. Não responda diretamente — entre em contato pelo canal comercial.
    </p>
  </div>
</div>`
      : `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #002443, #003366); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #f59e0b; margin: 0; font-size: 24px;">⚠️ Análise Concluída</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0;">Informações sobre sua análise de compliance.</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="color: #002443; font-size: 16px;">Olá <strong>${merchantName}</strong>,</p>
    <p style="color: #334155; line-height: 1.6;">
      Após análise detalhada dos dados fornecidos, identificamos pendências que impedem a aprovação neste momento.
    </p>
    <p style="color: #334155; line-height: 1.6;">
      Nossa equipe comercial entrará em contato para orientá-lo sobre os próximos passos e eventuais regularizações necessárias.
    </p>
    <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
      Este é um e-mail automático. Não responda diretamente — entre em contato pelo canal comercial.
    </p>
  </div>
</div>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: merchant.email,
      subject,
      body: body_html,
      from_name: 'Pagsmile Compliance'
    });

    console.log(`[NotifyDecision] Email sent to ${merchant.email} for case ${caseId}: ${newStatus}`);

    return Response.json({ success: true, caseId, status: newStatus, email: merchant.email });
  } catch (error) {
    console.error('[NotifyDecision] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});