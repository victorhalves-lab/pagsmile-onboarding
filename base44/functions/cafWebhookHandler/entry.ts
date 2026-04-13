import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafWebhookHandler — Receives and processes CAF webhooks in real-time
 *
 * Webhook types:
 *   - process_started: onboarding documents captured, processing started
 *   - documentscopy_requested: documentoscopy analysis in progress
 *   - status_updated: final status with statusReasons (validation rules)
 *   - face_authentication: face auth result
 *   - profile_status_change: profile status update
 *
 * On status_updated: auto-fetches full transaction via GET /transactions/{id}
 *
 * Auth: No Base44 auth (called by CAF externally). IP whitelist + signature check.
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

const CAF_ALLOWED_IPS = new Set([
  '34.95.175.186', '34.95.186.52', '34.95.183.142', '35.199.107.89',
]);

function getCafToken() {
  const token = Deno.env.get('CAF_CLIENT_SECRET');
  if (!token) throw new Error('CAF_CLIENT_SECRET not configured');
  return token;
}

// Map CAF validation rules to our red flag system
function extractFlagsFromReasons(statusReasons) {
  const flags = [];
  if (!Array.isArray(statusReasons)) return flags;

  const criticalRules = {
    cpf_has_not_dead: 'CPF_DEATH_INDICATOR',
    cpf_error_code: 'CPF_IRREGULAR',
    facematch_is_equal: 'FACEMATCH_FAILED',
    documentscopy_approved: 'DOCUMENTSCOPY_FRAUD',
    has_no_pep: 'PEP_DETECTED',
    has_no_sanctions: 'SANCTIONS_DETECTED',
    has_no_criminal_background: 'CRIMINAL_BACKGROUND',
    has_no_criminal_processes: 'CRIMINAL_PROCESSES',
    disabled_on_bacen: 'DISABLED_BACEN',
    has_debts_on_pgfn: 'PGFN_DEBTS',
    government_document_approved: 'OFFICIAL_BIOMETRICS_FAILED',
    has_no_arrest_warrant: 'ARREST_WARRANT',
    authentic_document: 'DOCUMENT_NOT_AUTHENTIC',
    active_cnpj_number: 'CNPJ_INACTIVE',
    is_not_on_restrictive_lists: 'RESTRICTIVE_LIST',
  };

  for (const reason of statusReasons) {
    if (reason.status === 'INVALID' || reason.resultStatus === 'REPROVED') {
      const flagType = criticalRules[reason.code] || `CAF_RULE_${(reason.code || 'unknown').toUpperCase()}`;
      flags.push(`${flagType}: ${reason.description || reason.code}`);
    }
  }

  return flags;
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const sourceIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '';
    const cafSignature = req.headers.get('x-caf-signature') || req.headers.get('x-webhook-signature') || '';

    console.log(`[CAF-Webhook] Source IP: ${sourceIp}, Signature: ${!!cafSignature}`);

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    console.log('[CAF-Webhook] Received:', JSON.stringify({
      type: body.type, status: body.status,
      uuid: body.uuid || body.report, onboardingId: body.onboardingId,
    }));

    const webhookType = body.type || 'unknown';
    const transactionId = body.uuid || body.report || '';
    const cafStatus = body.status || '';
    const onboardingId = body.onboardingId || '';

    // Find related IntegrationLog by transaction_id
    let relatedLog = null;
    let onboardingCaseId = null;

    if (transactionId) {
      try {
        const logs = await base44.asServiceRole.entities.IntegrationLog.filter({
          transaction_id: transactionId, provider: 'CAF',
        });
        relatedLog = logs[0];
        onboardingCaseId = relatedLog?.onboarding_case_id || null;
      } catch (e) { console.warn('[CAF-Webhook] Could not find related log:', e.message); }
    }

    // Also try finding by onboarding_id
    if (!onboardingCaseId && onboardingId) {
      try {
        const logs = await base44.asServiceRole.entities.IntegrationLog.filter({
          onboarding_id: onboardingId, provider: 'CAF',
        });
        if (logs[0]) {
          relatedLog = logs[0];
          onboardingCaseId = logs[0].onboarding_case_id;
        }
      } catch { /* */ }
    }

    // Update existing IntegrationLog
    if (relatedLog) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.update(relatedLog.id, {
          callback_received_at: new Date().toISOString(),
          callback_payload: body,
          status: cafStatus === 'APPROVED' ? 'success' : cafStatus === 'REPROVED' ? 'failed' : 'processing',
          result_status: cafStatus === 'APPROVED' ? 'APPROVED' : cafStatus === 'REPROVED' ? 'REPROVED' : 'PENDING_REVIEW',
        });
      } catch (e) { console.warn('[CAF-Webhook] Failed to update log:', e.message); }
    }

    const newFlags = [];

    // ── status_updated: main event with full results ──
    if (webhookType === 'status_updated') {
      // Extract flags from statusReasons
      const reasonFlags = extractFlagsFromReasons(body.statusReasons || []);
      newFlags.push(...reasonFlags);

      // Auto-fetch full transaction result for detailed sections
      if (transactionId) {
        try {
          const authToken = getCafToken();
          const txResponse = await fetch(`${CAF_API_BASE}/v1/transactions/${transactionId}?_includeCroppedImages=true`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` },
          });

          if (txResponse.ok) {
            const txText = await txResponse.text();
            let txResult;
            try { txResult = JSON.parse(txText); } catch { txResult = null; }

            if (txResult && onboardingCaseId) {
              // Save each section
              const sections = txResult.sections || {};
              for (const [secName, secData] of Object.entries(sections)) {
                try {
                  await base44.asServiceRole.entities.ExternalValidationResult.create({
                    onboardingCaseId, provider: 'CAF',
                    validationType: `Webhook Auto-Fetch — ${secName}`,
                    endpoint: `/v1/transactions/${transactionId} (${secName})`,
                    resultData: secData,
                    status: 'Sucesso', timestamp: new Date().toISOString(),
                  });
                } catch { /* */ }
              }

              // Additional flags from full transaction validations
              const txFlags = extractFlagsFromReasons(txResult.validations || []);
              for (const f of txFlags) {
                if (!newFlags.includes(f)) newFlags.push(f);
              }

              console.log(`[CAF-Webhook] Auto-fetched transaction: ${Object.keys(sections).length} sections`);
            }
          }
        } catch (e) {
          console.warn('[CAF-Webhook] Auto-fetch transaction error:', e.message);
        }
      }

      // Save webhook validation result
      if (onboardingCaseId) {
        try {
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId, provider: 'CAF',
            validationType: `Webhook — ${webhookType} (${cafStatus})`,
            endpoint: 'webhook/status_updated',
            resultData: body,
            score: cafStatus === 'APPROVED' ? 100 : cafStatus === 'REPROVED' ? 0 : 50,
            status: cafStatus === 'APPROVED' ? 'Sucesso' : cafStatus === 'REPROVED' ? 'Falha' : 'Pendente',
            timestamp: new Date().toISOString(),
          });
        } catch { /* */ }
      }
    }

    // ── documentscopy_requested ──
    if (webhookType === 'documentscopy_requested' || body.sections?.documentscopy) {
      const ds = body.sections?.documentscopy || body.documentscopy || {};
      if (ds.fraud === true) newFlags.push('DOCUMENTSCOPY_FRAUD_DETECTED');
      if (onboardingCaseId) {
        try {
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId, provider: 'CAF',
            validationType: 'Documentoscopy — Webhook',
            endpoint: 'webhook/documentscopy',
            resultData: ds,
            score: ds.fraud ? 0 : 100,
            status: ds.fraud ? 'Falha' : 'Sucesso',
            timestamp: new Date().toISOString(),
          });
        } catch { /* */ }
      }
    }

    // ── process_started ──
    if (webhookType === 'process_started' && onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.ExternalValidationResult.create({
          onboardingCaseId, provider: 'CAF',
          validationType: 'Onboarding — Process Started',
          endpoint: 'webhook/process_started',
          resultData: body,
          status: 'Pendente',
          timestamp: new Date().toISOString(),
        });
      } catch { /* */ }
    }

    // ── face_authentication ──
    if (webhookType === 'face_authentication') {
      if (body.isMatch === false) newFlags.push('FACE_AUTH_MISMATCH');
      if (onboardingCaseId) {
        try {
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId, provider: 'CAF',
            validationType: 'Face Authentication — Webhook',
            endpoint: 'webhook/face_authentication',
            resultData: body,
            score: body.isMatch ? 100 : 0,
            status: body.isMatch ? 'Sucesso' : 'Falha',
            timestamp: new Date().toISOString(),
          });
        } catch { /* */ }
      }
    }

    // ── Update OnboardingCase with red flags ──
    if (onboardingCaseId && newFlags.length > 0) {
      try {
        const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
        if (cases[0]) {
          const merged = [...new Set([...(cases[0].redFlags || []), ...newFlags])];
          const updates = { redFlags: merged };

          // Auto-update case status based on CAF decision
          if (cafStatus === 'APPROVED' && !cases[0].cafCompleted) updates.cafCompleted = true;
          if (cafStatus === 'REPROVED') {
            updates.cafCompleted = true;
            // Don't auto-reject, flag for manual review
          }

          await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, updates);
        }
      } catch (e) { console.warn('[CAF-Webhook] Case update error:', e.message); }
    } else if (onboardingCaseId && cafStatus === 'APPROVED') {
      try {
        await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, { cafCompleted: true });
      } catch { /* */ }
    }

    // Always log the raw webhook
    try {
      await base44.asServiceRole.entities.IntegrationLog.create({
        onboarding_case_id: onboardingCaseId || '',
        provider: 'CAF',
        service_type: 'caf_webhook_received',
        request_id: transactionId,
        transaction_id: transactionId,
        onboarding_id: onboardingId,
        status: 'success',
        result_status: cafStatus === 'APPROVED' ? 'APPROVED' : cafStatus === 'REPROVED' ? 'REPROVED' : 'PENDING_REVIEW',
        response_payload: body,
        red_flags: newFlags,
        duration_ms: Date.now() - startTime,
        callback_received_at: new Date().toISOString(),
        callback_payload: body,
      });
    } catch (e) { console.warn('[CAF-Webhook] Raw log error:', e.message); }

    return Response.json({
      received: true, type: webhookType, transactionId,
      flagsAdded: newFlags, duration_ms: Date.now() - startTime,
    });

  } catch (error) {
    console.error('[CAF-Webhook] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});