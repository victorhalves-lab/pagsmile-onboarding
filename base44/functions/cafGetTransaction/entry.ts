import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafGetTransaction — Fetches complete transaction result from CAF Core API
 *
 * GET /v1/transactions/{transactionId} returns:
 *   - status (APPROVED, REPROVED, PENDING, PROCESSING)
 *   - sections: all service results (OCR, facematch, documentoscopy, etc.)
 *   - images: document + selfie images
 *   - statusReasons: array of validation rules with VALID/INVALID results
 *   - fraud indicators
 *
 * Auth: CAF_CLIENT_SECRET as static Bearer token
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

function getCafToken() {
  const token = Deno.env.get('CAF_CLIENT_SECRET');
  if (!token) throw new Error('CAF_CLIENT_SECRET not configured');
  return token;
}

// Map CAF validation rules to our red flags
function extractFlagsFromStatusReasons(statusReasons) {
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
    has_no_media_exposure: 'MEDIA_EXPOSURE',
    government_document_approved: 'OFFICIAL_BIOMETRICS_FAILED',
    has_no_arrest_warrant: 'ARREST_WARRANT',
    is_not_on_restrictive_lists: 'RESTRICTIVE_LIST',
    authentic_document: 'DOCUMENT_NOT_AUTHENTIC',
    active_cnpj_number: 'CNPJ_INACTIVE',
    has_no_pep_or_sanctions_compliance_owners: 'OWNERS_PEP_SANCTIONS',
    company_qsa_data_compatibility: 'QSA_DATA_INCOMPATIBLE',
  };

  for (const reason of statusReasons) {
    if (reason.status === 'INVALID' || reason.resultStatus === 'REPROVED') {
      const flagType = criticalRules[reason.code] || `CAF_RULE_${reason.code?.toUpperCase()}`;
      flags.push({
        rule: reason.code,
        type: flagType,
        category: reason.category,
        description: reason.description,
        resultStatus: reason.resultStatus,
      });
    }
  }

  return flags;
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { transactionId, onboardingCaseId, includeCroppedImages = true } = body;

    if (!transactionId) {
      return Response.json({ error: 'transactionId é obrigatório' }, { status: 400 });
    }

    const authToken = getCafToken();

    const queryParams = new URLSearchParams();
    if (includeCroppedImages) queryParams.set('_includeCroppedImages', 'true');

    console.log(`[CAF-GetTransaction] Fetching: ${transactionId}`);

    const cafResponse = await fetch(`${CAF_API_BASE}/v1/transactions/${transactionId}?${queryParams}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    const cafText = await cafResponse.text();
    let cafResult;
    try { cafResult = JSON.parse(cafText); } catch { cafResult = { raw: cafText.substring(0, 500) }; }

    const durationMs = Date.now() - startTime;

    console.log(`[CAF-GetTransaction] HTTP: ${cafResponse.status}, status: ${cafResult?.status}`);

    // Extract structured data
    const sections = cafResult?.sections || {};
    const images = cafResult?.images || {};
    const statusReasons = cafResult?.statusReasons || [];
    const validations = cafResult?.validations || [];
    const cafStatus = cafResult?.status || 'UNKNOWN';

    // Map validation rules to red flags
    const ruleFlags = extractFlagsFromStatusReasons([...statusReasons, ...validations]);

    // Save results if case-linked
    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          provider: 'CAF',
          service_type: 'transaction',
          transaction_id: transactionId,
          status: cafResponse.ok ? 'success' : 'failed',
          result_status: cafStatus === 'APPROVED' ? 'APPROVED' : cafStatus === 'REPROVED' ? 'REPROVED' : 'PENDING_REVIEW',
          request_payload: { transactionId },
          response_payload: {
            status: cafStatus,
            sectionsReturned: Object.keys(sections),
            validationRulesCount: statusReasons.length + validations.length,
            flagsDetected: ruleFlags.length,
          },
          red_flags: ruleFlags.map(f => `${f.type}: ${f.description || f.rule}`),
          duration_ms: durationMs,
        });
      } catch (e) { console.warn('[CAF-GetTransaction] Log error:', e.message); }

      // Save each section as individual ExternalValidationResult
      for (const [secName, secData] of Object.entries(sections)) {
        try {
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId,
            provider: 'CAF',
            validationType: `Transaction Section — ${secName}`,
            endpoint: `/v1/transactions/${transactionId} (${secName})`,
            resultData: secData,
            status: 'Sucesso',
            timestamp: new Date().toISOString(),
            responseTime: durationMs,
          });
        } catch { /* */ }
      }

      // Save validation rules summary
      if (ruleFlags.length > 0 || statusReasons.length > 0) {
        try {
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId,
            provider: 'CAF',
            validationType: 'Transaction Validation Rules',
            endpoint: `/v1/transactions/${transactionId}`,
            resultData: {
              transactionStatus: cafStatus,
              statusReasons,
              validations,
              flagsExtracted: ruleFlags,
            },
            score: cafStatus === 'APPROVED' ? 100 : cafStatus === 'REPROVED' ? 0 : 50,
            status: cafStatus === 'APPROVED' ? 'Sucesso' : cafStatus === 'REPROVED' ? 'Falha' : 'Pendente',
            timestamp: new Date().toISOString(),
            responseTime: durationMs,
          });
        } catch (e) { console.warn('[CAF-GetTransaction] ExternalValidation rules error:', e.message); }
      }

      // Update case with red flags
      if (ruleFlags.length > 0) {
        try {
          const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
          if (cases[0]) {
            const flagStrings = ruleFlags.map(f => `${f.type}: ${f.description || f.rule}`);
            const merged = [...new Set([...(cases[0].redFlags || []), ...flagStrings])];
            await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, { redFlags: merged });
          }
        } catch (e) { console.warn('[CAF-GetTransaction] Case update error:', e.message); }
      }
    }

    return Response.json({
      success: cafResponse.ok,
      transactionId,
      status: cafStatus,
      sections,
      sectionsReturned: Object.keys(sections),
      images,
      statusReasons,
      validations,
      flags: ruleFlags,
      flagCount: ruleFlags.length,
      duration_ms: durationMs,
    });

  } catch (error) {
    console.error('[CAF-GetTransaction] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});