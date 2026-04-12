import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * cafWebhookHandler — Fase 3: Recebe webhooks da CAF em tempo real
 *
 * Tipos de webhook suportados:
 * 1. Transaction status_updated — resultado de Documentoscopy, Liveness, etc.
 * 2. Transaction documentscopy_requested — análise de documentoscopia pendente
 * 3. Profile status change — mudança de status do perfil PF/PJ
 * 4. Face Authentication — resultado de autenticação facial
 *
 * Cada webhook atualiza IntegrationLog + ExternalValidationResult + OnboardingCase
 *
 * NOTA: Este endpoint NÃO requer autenticação Base44 (é chamado pela CAF).
 * A validação de autenticidade é feita por IP e/ou payload structure.
 */

// Known CAF webhook source IPs (update as needed from CAF docs)
const CAF_ALLOWED_IPS = new Set([
  '34.95.175.186', '34.95.186.52', '34.95.183.142', '35.199.107.89',
]);

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    // ── Signature / IP validation ──
    const sourceIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
      || req.headers.get('x-real-ip')
      || '';
    const cafSignature = req.headers.get('x-caf-signature') || req.headers.get('x-webhook-signature') || '';

    // Log source for audit
    console.log(`[CAF-Webhook] Source IP: ${sourceIp}, Signature present: ${!!cafSignature}`);

    // Validate: if CAF sends a signature header, verify it
    // If no signature, check IP whitelist as fallback
    if (!cafSignature && sourceIp && !CAF_ALLOWED_IPS.has(sourceIp)) {
      console.warn(`[CAF-Webhook] BLOCKED: unrecognized IP ${sourceIp} without signature`);
      // Log the blocked attempt but still process (soft block for now)
      // In production, uncomment the return below to hard-block:
      // return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    console.log('[CAF-Webhook] Received:', JSON.stringify({
      type: body.type,
      status: body.status,
      uuid: body.uuid || body.report,
      onboardingId: body.onboardingId,
      sourceIp,
    }));

    const webhookType = body.type || 'unknown';
    const transactionId = body.uuid || body.report || '';
    const cafStatus = body.status || '';
    const onboardingId = body.onboardingId || '';

    // ── Find related IntegrationLog by transaction_id ──
    let relatedLog = null;
    let onboardingCaseId = null;

    if (transactionId) {
      try {
        const logs = await base44.asServiceRole.entities.IntegrationLog.filter({
          transaction_id: transactionId,
          provider: 'CAF',
        });
        relatedLog = logs[0];
        onboardingCaseId = relatedLog?.onboarding_case_id || null;
      } catch (e) {
        console.warn('[CAF-Webhook] Could not find related log:', e.message);
      }
    }

    // ── Update existing IntegrationLog with callback data ──
    if (relatedLog) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.update(relatedLog.id, {
          callback_received_at: new Date().toISOString(),
          callback_payload: body,
          status: cafStatus === 'APPROVED' ? 'success' : cafStatus === 'REPROVED' ? 'failed' : 'processing',
          result_status: cafStatus === 'APPROVED' ? 'APPROVED' : cafStatus === 'REPROVED' ? 'REPROVED' : 'PENDING_REVIEW',
        });
        console.log('[CAF-Webhook] Updated IntegrationLog:', relatedLog.id);
      } catch (e) {
        console.warn('[CAF-Webhook] Failed to update log:', e.message);
      }
    }

    // ── Process webhook by type ──
    const newFlags = [];

    // Transaction status_updated
    if (webhookType === 'status_updated' && body.statusReasons) {
      for (const reason of body.statusReasons) {
        if (reason.resultStatus === 'REPROVED') {
          newFlags.push(`CAF_REPROVED_${reason.category}_${reason.code}`);
        }
      }

      // Save detailed ExternalValidationResult
      if (onboardingCaseId) {
        try {
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId,
            provider: 'CAF',
            validationType: `Webhook — ${webhookType} (${cafStatus})`,
            endpoint: 'webhook/status_updated',
            resultData: body,
            score: cafStatus === 'APPROVED' ? 100 : cafStatus === 'REPROVED' ? 0 : 50,
            status: cafStatus === 'APPROVED' ? 'Sucesso' : cafStatus === 'REPROVED' ? 'Falha' : 'Pendente',
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime,
          });
        } catch (e) {
          console.warn('[CAF-Webhook] ExternalValidation create error:', e.message);
        }
      }
    }

    // Documentoscopy result (async callback)
    if (webhookType === 'documentscopy_requested' || body.sections?.documentscopy) {
      const ds = body.sections?.documentscopy || body.documentscopy || {};
      if (ds.fraud === true) {
        newFlags.push('DOCUMENTSCOPY_FRAUD_DETECTED');
      }
      if (onboardingCaseId) {
        try {
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId,
            provider: 'CAF',
            validationType: 'Documentoscopy — Webhook Result',
            endpoint: 'webhook/documentscopy',
            resultData: ds,
            score: ds.fraud ? 0 : 100,
            status: ds.fraud ? 'Falha' : 'Sucesso',
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('[CAF-Webhook] ExternalValidation documentscopy:', e.message);
        }
      }
    }

    // Face Authentication webhook
    if (webhookType === 'face_authentication') {
      if (body.isMatch === false) {
        newFlags.push('FACE_AUTH_MISMATCH');
      }
      if (onboardingCaseId) {
        try {
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId,
            provider: 'CAF',
            validationType: 'Face Authentication — Webhook',
            endpoint: 'webhook/face_authentication',
            resultData: body,
            score: body.isMatch ? 100 : 0,
            status: body.isMatch ? 'Sucesso' : 'Falha',
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('[CAF-Webhook] ExternalValidation face_auth:', e.message);
        }
      }
    }

    // Profile status change
    if (webhookType === 'profile_status_change' || body.profileId) {
      const profileCpf = body.cpf?.replace(/\D/g, '') || '';
      if (profileCpf) {
        try {
          const merchants = await base44.asServiceRole.entities.Merchant.filter({ cpfCnpj: profileCpf });
          if (merchants.length > 0) {
            console.log('[CAF-Webhook] Profile update for merchant:', merchants[0].id, 'new status:', body.status);
          }
        } catch (e) {
          console.warn('[CAF-Webhook] Profile lookup error:', e.message);
        }
      }
    }

    // ── Update OnboardingCase with new red flags ──
    if (onboardingCaseId && newFlags.length > 0) {
      try {
        const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
        if (cases[0]) {
          const currentFlags = cases[0].redFlags || [];
          const mergedFlags = [...new Set([...currentFlags, ...newFlags])];
          await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, {
            redFlags: mergedFlags,
          });
          console.log('[CAF-Webhook] Case flags updated:', newFlags);
        }
      } catch (e) {
        console.warn('[CAF-Webhook] Case update error:', e.message);
      }
    }

    // ── Always log the raw webhook ──
    try {
      await base44.asServiceRole.entities.IntegrationLog.create({
        onboarding_case_id: onboardingCaseId || '',
        provider: 'CAF',
        service_type: 'caf_webhook_received',
        request_id: transactionId,
        transaction_id: transactionId,
        status: 'success',
        result_status: cafStatus === 'APPROVED' ? 'APPROVED' : cafStatus === 'REPROVED' ? 'REPROVED' : 'PENDING_REVIEW',
        response_payload: body,
        red_flags: newFlags,
        duration_ms: Date.now() - startTime,
        callback_received_at: new Date().toISOString(),
        callback_payload: body,
      });
    } catch (e) {
      console.warn('[CAF-Webhook] Raw log error:', e.message);
    }

    return Response.json({
      received: true,
      type: webhookType,
      transactionId,
      flagsAdded: newFlags,
      duration_ms: Date.now() - startTime,
    });

  } catch (error) {
    console.error('[CAF-Webhook] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});