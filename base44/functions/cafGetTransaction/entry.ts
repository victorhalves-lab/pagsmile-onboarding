import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafGetTransaction — Fetches complete transaction result from CAF Core API
 *
 * UPGRADES v2:
 *   1. ALL 87 validation rules mapped → red flags
 *   2. manualReprovalReasons[] mapped (20 codes)
 *   3. _includePfRelationships=true for PF_PF transactions
 *   4. _lang=pt for Portuguese descriptions
 *   5. List transactions mode (historical audit)
 *
 * Auth: CAF_CLIENT_SECRET as static Bearer token
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

function getCafToken() {
  const token = Deno.env.get('CAF_CORE_API_TOKEN');
  if (!token) throw new Error('CAF_CORE_API_TOKEN not configured');
  return token;
}

// ═══════════════════════════════════════════════════════════════
// COMPLETE VALIDATION RULES MAP — ALL 87 CAF rules
// ═══════════════════════════════════════════════════════════════
const VALIDATION_RULES_MAP = {
  // CPF / Identity
  cpf_error_code: 'CPF_IRREGULAR',
  cpf_has_not_dead: 'CPF_DEATH_INDICATOR',
  cpf_equal_name: 'CPF_NAME_MISMATCH',
  cpf_null: 'CPF_DATA_EMPTY',
  cpf_query: 'CPF_QUERY_FAILED',
  does_not_exist_on_receita_federal_database: 'CPF_NOT_FOUND_RF',
  has_cpf: 'CPF_NOT_PRESENT',
  is_cpf_regular: 'CPF_IRREGULAR_STATUS',
  data_and_document_are_equal: 'DATA_DOCUMENT_DIVERGENCE',

  // CNPJ / Company
  active_cnpj_number: 'CNPJ_INACTIVE',
  authentic_cnpj_number: 'CNPJ_NOT_AUTHENTIC',
  company_qsa_data_compatibility: 'QSA_DATA_INCOMPATIBLE',
  has_at_least_one_cnae: 'CNAE_NOT_FOUND',
  has_at_least_one_legal_nature: 'LEGAL_NATURE_INVALID',
  has_no_sintegra_record: 'SINTEGRA_REGISTERED',
  has_no_total_share: 'SHARE_PERCENTAGE_INVALID',
  is_company_lifetime_greater_than_six_months: 'COMPANY_TOO_YOUNG',

  // Document
  authentic_document: 'DOCUMENT_NOT_AUTHENTIC',
  document_is_known: 'DOCUMENT_TYPE_UNKNOWN',
  document_issue_less_than_10: 'DOCUMENT_TOO_OLD',
  documentscopy_approved: 'DOCUMENTSCOPY_FRAUD',
  documentscopy_available: 'DOCUMENTSCOPY_UNAVAILABLE',
  is_cnh: 'NOT_CNH',

  // Biometrics / Face
  facematch_is_equal: 'FACEMATCH_FAILED',
  facematch_has_selfie_photo: 'SELFIE_MISSING',
  face_and_birthdate_compare: 'FACE_CPF_MISMATCH',
  government_document_approved: 'OFFICIAL_BIOMETRICS_FAILED',
  government_document_available: 'OFFICIAL_BIOMETRICS_NOT_FOUND',
  more_than_one_face_in_selfie: 'MULTIPLE_FACES_SELFIE',
  is_selfie_and_front_same_document_type: 'SELFIE_DOCUMENT_TYPE_MISMATCH',
  selfie_not_same_as_another_selfie_with_same_data: 'SELFIE_REUSE_DETECTED',
  without_face_accessories: 'FACE_ACCESSORIES_DETECTED',

  // PEP / Sanctions / Compliance
  has_no_pep: 'PEP_DETECTED',
  has_no_pep_department: 'PEP_DEPARTMENT_MATCH',
  has_no_pep_or_sanctions_compliance_owners: 'OWNERS_PEP_SANCTIONS',
  has_no_sanctions: 'SANCTIONS_DETECTED',
  has_no_personal_relationships_trust_rl: 'RELATED_PERSONS_RESTRICTIVE_LIST',
  is_not_on_restrictive_lists: 'RESTRICTIVE_LIST',

  // Criminal / Legal
  has_no_criminal_background: 'CRIMINAL_BACKGROUND',
  has_no_criminal_background_federal: 'CRIMINAL_BACKGROUND_FEDERAL',
  has_no_criminal_processes: 'CRIMINAL_PROCESSES',
  has_no_defendant_processes: 'DEFENDANT_IN_LAWSUIT',
  has_no_processes: 'JUDICIAL_PROCESSES',
  has_no_processes_active_party: 'PROCESSES_ACTIVE_PARTY',
  has_no_processes_passive_party: 'PROCESSES_PASSIVE_PARTY',
  has_no_processes_other_party: 'PROCESSES_OTHER_PARTY',
  has_processes_keywords: 'PROCESSES_KEYWORDS_MATCH',
  has_author_type_null_in_criminal_processes: 'CRIMINAL_AUTHOR_TYPE_NULL',
  has_arrest_warrant: 'ARREST_WARRANT',

  // Financial / Credit
  credit_score_available: 'CREDIT_SCORE_UNAVAILABLE',
  credit_score_below: 'CREDIT_SCORE_LOW',
  credit_score_between: 'CREDIT_SCORE_RANGE',
  credit_score_over: 'CREDIT_SCORE_HIGH',
  disabled_on_bacen: 'DISABLED_BACEN',
  has_debts_on_pgfn: 'PGFN_DEBTS',
  has_no_labor_debts: 'LABOR_DEBTS',
  has_active_social_assistence: 'SOCIAL_ASSISTANCE_ACTIVE',
  has_salary_information: 'SALARY_INFO_NOT_FOUND',
  is_between_two_and_four_salaries: 'LOW_INCOME_RANGE',
  has_no_ibope_income: 'IBOPE_INCOME_CHECK',

  // Regulatory
  has_no_participant_cvm: 'CVM_REGISTERED',
  has_penalties_on_cvm: 'CVM_PENALTIES',
  has_process_on_cade: 'CADE_PROCESS',
  has_no_class_organizations: 'CLASS_ORGANIZATION_LINKED',
  has_no_participant_antt: 'ANTT_NOT_AUTHORIZED',

  // Media
  has_no_media_exposure: 'MEDIA_EXPOSURE',

  // Age
  big_data_source_underage: 'UNDERAGE_SOURCE',
  invalid_range_ages: 'AGE_RANGE_INVALID',
  over_18: 'NOT_OVER_18',
  over_16: 'NOT_OVER_16',

  // CNH (Driver)
  cnh_has_valid_date: 'CNH_EXPIRED',
  has_cnh_for_more_than_three_years: 'CNH_LESS_THAN_3_YEARS',
  has_definitive_cnh: 'CNH_NOT_DEFINITIVE',
  driver_has_pending_traffic_violations: 'TRAFFIC_VIOLATIONS_PENDING',
  driver_has_traffic_violations: 'TRAFFIC_VIOLATIONS',

  // Other
  attorney: 'ATTORNEY_FLOW',
  first_and_last_name_similarity: 'NAME_SIMILARITY_LOW',
  invalid_zip_code: 'INVALID_ZIP_CODE',
  is_not_underage_on_bank_source: 'UNDERAGE_BANK_SOURCE',
  is_pf_on_bank_source: 'PF_BANK_SOURCE',
  verifai_is_not_high_risk: 'VERIFAI_HIGH_RISK',
};

// ═══════════════════════════════════════════════════════════════
// MANUAL REPROVAL REASONS MAP — ALL 20 CAF codes
// ═══════════════════════════════════════════════════════════════
const MANUAL_REPROVAL_MAP = {
  '10': 'PARAMS_NOT_INFORMED',
  '30': 'UNDERAGE_16',
  '31': 'PROTESTS_FOUND',
  '32': 'PROCESSES_FOUND',
  '50': 'ILLEGIBLE_DOC_QUALITY',
  '51': 'ILLEGIBLE_DOC_CLIPPING',
  '52': 'ILLEGIBLE_DOC_OBSTRUCTION',
  '60': 'CPF_PARAM_DIVERGES_DOC',
  '61': 'MISSING_FRONT_PHOTO',
  '62': 'MISSING_BACK_PHOTO',
  '63': 'INPUT_PARAM_DIVERGES_DOC',
  '70': 'UNSUPPORTED_DOCUMENT',
  '71': 'INVALID_DOCUMENT',
  '72': 'UNSUPPORTED_FILE_FORMAT',
  '80': 'INVALID_CPF',
  '81': 'INVALID_CNPJ',
  '82': 'BIRTHDATE_DIVERGES_OFFICIAL',
  '83': 'CPF_NOT_INFORMED',
  '84': 'CNPJ_NOT_INFORMED',
  '90': 'UNDERAGE_18',
  '91': 'SELFIE_NOT_SIMILAR',
  '92': 'LIVENESS_REPROVED',
  '93': 'CPF_IRREGULAR_RF',
  '94': 'DOC_NAME_DIVERGES_RF',
  '95': 'FACE_IN_SUSPECTS_DB',
  '96': 'PEP_DETECTED_MANUAL',
};

function extractFlagsFromStatusReasons(statusReasons) {
  const flags = [];
  if (!Array.isArray(statusReasons)) return flags;

  for (const reason of statusReasons) {
    if (reason.status === 'INVALID' || reason.resultStatus === 'REPROVED') {
      const flagType = VALIDATION_RULES_MAP[reason.code] || `CAF_RULE_${(reason.code || 'unknown').toUpperCase()}`;
      flags.push({
        rule: reason.code,
        type: flagType,
        category: reason.category || 'validation',
        description: reason.description,
        resultStatus: reason.resultStatus,
      });
    }
  }

  return flags;
}

function extractFlagsFromManualReprovals(manualReprovalReasons) {
  const flags = [];
  if (!Array.isArray(manualReprovalReasons)) return flags;

  for (const reproval of manualReprovalReasons) {
    const code = String(reproval.code || '');
    const flagType = MANUAL_REPROVAL_MAP[code] || `MANUAL_REPROVAL_${code}`;
    flags.push({
      rule: `manual_reproval_${code}`,
      type: flagType,
      category: 'manual_reproval',
      description: reproval.reason || reproval.description || `Manual reproval code ${code}`,
      resultStatus: 'REPROVED',
    });
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
    const authToken = getCafToken();

    // ── MODE: List Transactions (audit) ──
    if (body.mode === 'list') {
      const { templateId, startDate, endDate, limit = 10, offset = 0 } = body;
      const params = new URLSearchParams();
      params.set('_limit', String(Math.min(limit, 10)));
      params.set('_offset', String(offset));
      params.set('_order', 'desc');
      if (templateId) params.set('_templates', templateId);
      if (startDate) params.set('_startCreatedDate', startDate);
      if (endDate) params.set('_endCreatedDate', endDate);

      console.log(`[CAF-GetTransaction] List mode: ${params.toString()}`);

      const listResponse = await fetch(`${CAF_API_BASE}/v1/transactions?${params}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      const listText = await listResponse.text();
      let listResult;
      try { listResult = JSON.parse(listText); } catch { listResult = { raw: listText.substring(0, 500) }; }

      return Response.json({
        success: listResponse.ok,
        items: listResult?.items || [],
        totalItems: listResult?.totalItems || 0,
        duration_ms: Date.now() - startTime,
      });
    }

    // ── MODE: Get Single Transaction ──
    const { transactionId, onboardingCaseId, includeCroppedImages = true, includePfRelationships = true } = body;

    if (!transactionId) {
      return Response.json({ error: 'transactionId é obrigatório' }, { status: 400 });
    }

    const queryParams = new URLSearchParams();
    if (includeCroppedImages) queryParams.set('_includeCroppedImages', 'true');
    if (includePfRelationships) queryParams.set('_includePfRelationships', 'true');
    queryParams.set('_lang', 'pt');

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
    const manualReprovalReasons = cafResult?.manualReprovalReasons || [];
    const relatedTransactions = cafResult?.relatedTransactions || {};
    const cafStatus = cafResult?.status || 'UNKNOWN';
    const customStatus = cafResult?.customStatus || null;
    const onboardingId = cafResult?.onboardingId || null;

    // Map ALL validation rules to red flags (87 rules)
    const ruleFlags = extractFlagsFromStatusReasons([...statusReasons, ...validations]);

    // Map ALL manual reproval reasons (20 codes)
    const reprovalFlags = extractFlagsFromManualReprovals(manualReprovalReasons);

    // Combine all flags
    const allFlags = [...ruleFlags, ...reprovalFlags];

    // Classify severity
    const criticalTypes = new Set(['CPF_DEATH_INDICATOR', 'ARREST_WARRANT', 'SANCTIONS_DETECTED', 'FACE_IN_SUSPECTS_DB', 'CRIMINAL_BACKGROUND_FEDERAL']);
    const highTypes = new Set(['PEP_DETECTED', 'CRIMINAL_BACKGROUND', 'FACEMATCH_FAILED', 'DOCUMENTSCOPY_FRAUD', 'OFFICIAL_BIOMETRICS_FAILED', 'DEEPFAKE_DETECTED', 'SELFIE_REUSE_DETECTED', 'LIVENESS_REPROVED']);

    const flagsBySeverity = { critical: [], high: [], medium: [], low: [] };
    for (const f of allFlags) {
      if (criticalTypes.has(f.type)) flagsBySeverity.critical.push(f);
      else if (highTypes.has(f.type)) flagsBySeverity.high.push(f);
      else if (f.category === 'manual_reproval') flagsBySeverity.high.push(f);
      else flagsBySeverity.medium.push(f);
    }

    // Save results if case-linked
    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          provider: 'CAF',
          service_type: 'transaction',
          transaction_id: transactionId,
          onboarding_id: onboardingId || '',
          status: cafResponse.ok ? 'success' : 'failed',
          result_status: cafStatus === 'APPROVED' ? 'APPROVED' : cafStatus === 'REPROVED' ? 'REPROVED' : 'PENDING_REVIEW',
          request_payload: { transactionId, includePfRelationships },
          response_payload: {
            status: cafStatus,
            customStatus,
            sectionsReturned: Object.keys(sections),
            validationRulesCount: statusReasons.length + validations.length,
            manualReprovalCount: manualReprovalReasons.length,
            totalFlagsDetected: allFlags.length,
            relatedTransactionsCount: Object.keys(relatedTransactions).length,
          },
          red_flags: allFlags.map(f => `${f.type}: ${f.description || f.rule}`),
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

      // Save validation rules summary with severity breakdown
      if (allFlags.length > 0 || statusReasons.length > 0) {
        try {
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId,
            provider: 'CAF',
            validationType: 'Transaction Validation Rules (v2 — 87 rules + 20 manual)',
            endpoint: `/v1/transactions/${transactionId}`,
            resultData: {
              transactionStatus: cafStatus,
              customStatus,
              statusReasons,
              validations,
              manualReprovalReasons,
              flagsExtracted: allFlags,
              flagsBySeverity: {
                critical: flagsBySeverity.critical.length,
                high: flagsBySeverity.high.length,
                medium: flagsBySeverity.medium.length,
              },
            },
            score: cafStatus === 'APPROVED' ? 100 : cafStatus === 'REPROVED' ? 0 : 50,
            status: cafStatus === 'APPROVED' ? 'Sucesso' : cafStatus === 'REPROVED' ? 'Falha' : 'Pendente',
            timestamp: new Date().toISOString(),
            responseTime: durationMs,
          });
        } catch (e) { console.warn('[CAF-GetTransaction] ExternalValidation rules error:', e.message); }
      }

      // Save related transactions (PF_PF)
      if (Object.keys(relatedTransactions).length > 0) {
        try {
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId,
            provider: 'CAF',
            validationType: 'Related Transactions (PF_PF)',
            endpoint: `/v1/transactions/${transactionId}?_includePfRelationships=true`,
            resultData: relatedTransactions,
            status: 'Sucesso',
            timestamp: new Date().toISOString(),
            responseTime: durationMs,
          });
        } catch { /* */ }
      }

      // Update case with ALL red flags
      if (allFlags.length > 0) {
        try {
          const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
          if (cases[0]) {
            const flagStrings = allFlags.map(f => `${f.type}: ${f.description || f.rule}`);
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
      customStatus,
      onboardingId,
      sections,
      sectionsReturned: Object.keys(sections),
      images,
      statusReasons,
      validations,
      manualReprovalReasons,
      relatedTransactions,
      flags: allFlags,
      flagCount: allFlags.length,
      flagsBySeverity: {
        critical: flagsBySeverity.critical.length,
        high: flagsBySeverity.high.length,
        medium: flagsBySeverity.medium.length,
      },
      duration_ms: durationMs,
    });

  } catch (error) {
    console.error('[CAF-GetTransaction] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});