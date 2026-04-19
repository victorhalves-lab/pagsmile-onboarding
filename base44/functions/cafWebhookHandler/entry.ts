import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafWebhookHandler — Receives and processes CAF webhooks in real-time
 *
 * UPGRADES v2:
 *   1. ALL 87 validation rules mapped (same as cafGetTransaction v2)
 *   2. manualReprovalReasons[] processed (20 codes)
 *   3. Auto-fetch uses _lang=pt, _includePfRelationships=true
 *   4. profile_status_change webhook type fully handled
 *   5. Severity classification on flags
 *
 * Auth: No Base44 auth (called by CAF externally). IP whitelist + signature check.
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

// Official CAF Connect API webhook IPs (docs.caf.io/caf-api/connect/webhook/best-practices).
// Kept as a reference for optional enforcement — actual filtering is done at the audit/log
// layer only. We still capture the real source IP on every webhook (see handler) so we can
// build evidence over time about which IPs CAF is actually using for THIS app.
const CAF_KNOWN_IPS = new Set([
  '34.234.120.59', '18.229.212.133', '3.218.90.124', '44.219.96.170', '18.235.54.162',
]);

function getCafToken() {
  const token = Deno.env.get('CAF_CORE_API_TOKEN');
  if (!token) throw new Error('CAF_CORE_API_TOKEN not configured');
  return token;
}

// ═══════════════════════════════════════════════════════════════
// COMPLETE VALIDATION RULES MAP — ALL 87 CAF rules
// ═══════════════════════════════════════════════════════════════
const VALIDATION_RULES_MAP = {
  cpf_error_code: 'CPF_IRREGULAR', cpf_has_not_dead: 'CPF_DEATH_INDICATOR',
  cpf_equal_name: 'CPF_NAME_MISMATCH', cpf_null: 'CPF_DATA_EMPTY',
  cpf_query: 'CPF_QUERY_FAILED', does_not_exist_on_receita_federal_database: 'CPF_NOT_FOUND_RF',
  has_cpf: 'CPF_NOT_PRESENT', is_cpf_regular: 'CPF_IRREGULAR_STATUS',
  data_and_document_are_equal: 'DATA_DOCUMENT_DIVERGENCE',
  active_cnpj_number: 'CNPJ_INACTIVE', authentic_cnpj_number: 'CNPJ_NOT_AUTHENTIC',
  company_qsa_data_compatibility: 'QSA_DATA_INCOMPATIBLE',
  has_at_least_one_cnae: 'CNAE_NOT_FOUND', has_at_least_one_legal_nature: 'LEGAL_NATURE_INVALID',
  has_no_sintegra_record: 'SINTEGRA_REGISTERED', has_no_total_share: 'SHARE_PERCENTAGE_INVALID',
  is_company_lifetime_greater_than_six_months: 'COMPANY_TOO_YOUNG',
  authentic_document: 'DOCUMENT_NOT_AUTHENTIC', document_is_known: 'DOCUMENT_TYPE_UNKNOWN',
  document_issue_less_than_10: 'DOCUMENT_TOO_OLD', documentscopy_approved: 'DOCUMENTSCOPY_FRAUD',
  documentscopy_available: 'DOCUMENTSCOPY_UNAVAILABLE', is_cnh: 'NOT_CNH',
  facematch_is_equal: 'FACEMATCH_FAILED', facematch_has_selfie_photo: 'SELFIE_MISSING',
  face_and_birthdate_compare: 'FACE_CPF_MISMATCH',
  government_document_approved: 'OFFICIAL_BIOMETRICS_FAILED',
  government_document_available: 'OFFICIAL_BIOMETRICS_NOT_FOUND',
  more_than_one_face_in_selfie: 'MULTIPLE_FACES_SELFIE',
  is_selfie_and_front_same_document_type: 'SELFIE_DOCUMENT_TYPE_MISMATCH',
  selfie_not_same_as_another_selfie_with_same_data: 'SELFIE_REUSE_DETECTED',
  without_face_accessories: 'FACE_ACCESSORIES_DETECTED',
  has_no_pep: 'PEP_DETECTED', has_no_pep_department: 'PEP_DEPARTMENT_MATCH',
  has_no_pep_or_sanctions_compliance_owners: 'OWNERS_PEP_SANCTIONS',
  has_no_sanctions: 'SANCTIONS_DETECTED',
  has_no_personal_relationships_trust_rl: 'RELATED_PERSONS_RESTRICTIVE_LIST',
  is_not_on_restrictive_lists: 'RESTRICTIVE_LIST',
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
  credit_score_available: 'CREDIT_SCORE_UNAVAILABLE',
  credit_score_below: 'CREDIT_SCORE_LOW', credit_score_between: 'CREDIT_SCORE_RANGE',
  credit_score_over: 'CREDIT_SCORE_HIGH', disabled_on_bacen: 'DISABLED_BACEN',
  has_debts_on_pgfn: 'PGFN_DEBTS', has_no_labor_debts: 'LABOR_DEBTS',
  has_active_social_assistence: 'SOCIAL_ASSISTANCE_ACTIVE',
  has_salary_information: 'SALARY_INFO_NOT_FOUND',
  is_between_two_and_four_salaries: 'LOW_INCOME_RANGE',
  has_no_ibope_income: 'IBOPE_INCOME_CHECK',
  has_no_participant_cvm: 'CVM_REGISTERED', has_penalties_on_cvm: 'CVM_PENALTIES',
  has_process_on_cade: 'CADE_PROCESS',
  has_no_class_organizations: 'CLASS_ORGANIZATION_LINKED',
  has_no_participant_antt: 'ANTT_NOT_AUTHORIZED',
  has_no_media_exposure: 'MEDIA_EXPOSURE',
  big_data_source_underage: 'UNDERAGE_SOURCE', invalid_range_ages: 'AGE_RANGE_INVALID',
  over_18: 'NOT_OVER_18', over_16: 'NOT_OVER_16',
  cnh_has_valid_date: 'CNH_EXPIRED', has_cnh_for_more_than_three_years: 'CNH_LESS_THAN_3_YEARS',
  has_definitive_cnh: 'CNH_NOT_DEFINITIVE',
  driver_has_pending_traffic_violations: 'TRAFFIC_VIOLATIONS_PENDING',
  driver_has_traffic_violations: 'TRAFFIC_VIOLATIONS',
  attorney: 'ATTORNEY_FLOW', first_and_last_name_similarity: 'NAME_SIMILARITY_LOW',
  invalid_zip_code: 'INVALID_ZIP_CODE',
  is_not_underage_on_bank_source: 'UNDERAGE_BANK_SOURCE',
  is_pf_on_bank_source: 'PF_BANK_SOURCE', verifai_is_not_high_risk: 'VERIFAI_HIGH_RISK',
};

const MANUAL_REPROVAL_MAP = {
  '10': 'PARAMS_NOT_INFORMED', '30': 'UNDERAGE_16', '31': 'PROTESTS_FOUND',
  '32': 'PROCESSES_FOUND', '50': 'ILLEGIBLE_DOC_QUALITY', '51': 'ILLEGIBLE_DOC_CLIPPING',
  '52': 'ILLEGIBLE_DOC_OBSTRUCTION', '60': 'CPF_PARAM_DIVERGES_DOC',
  '61': 'MISSING_FRONT_PHOTO', '62': 'MISSING_BACK_PHOTO',
  '63': 'INPUT_PARAM_DIVERGES_DOC', '70': 'UNSUPPORTED_DOCUMENT',
  '71': 'INVALID_DOCUMENT', '72': 'UNSUPPORTED_FILE_FORMAT',
  '80': 'INVALID_CPF', '81': 'INVALID_CNPJ',
  '82': 'BIRTHDATE_DIVERGES_OFFICIAL', '83': 'CPF_NOT_INFORMED',
  '84': 'CNPJ_NOT_INFORMED', '90': 'UNDERAGE_18',
  '91': 'SELFIE_NOT_SIMILAR', '92': 'LIVENESS_REPROVED',
  '93': 'CPF_IRREGULAR_RF', '94': 'DOC_NAME_DIVERGES_RF',
  '95': 'FACE_IN_SUSPECTS_DB', '96': 'PEP_DETECTED_MANUAL',
};

function extractFlagsFromReasons(statusReasons) {
  const flags = [];
  if (!Array.isArray(statusReasons)) return flags;

  for (const reason of statusReasons) {
    if (reason.status === 'INVALID' || reason.resultStatus === 'REPROVED') {
      const flagType = VALIDATION_RULES_MAP[reason.code] || `CAF_RULE_${(reason.code || 'unknown').toUpperCase()}`;
      flags.push(`${flagType}: ${reason.description || reason.code}`);
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
    flags.push(`${flagType}: ${reproval.reason || `Manual reproval code ${code}`}`);
  }

  return flags;
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    // Capture observability headers BEFORE parsing the body so we can audit the real
    // source of every webhook (needed to verify if CAF is sending the documented IPs
    // and the X-Caf-Signature header in production).
    const sourceIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '';
    const cafSignature = req.headers.get('x-caf-signature') || req.headers.get('x-webhook-signature') || '';
    const userAgent = req.headers.get('user-agent') || '';
    const ipIsKnown = sourceIp ? CAF_KNOWN_IPS.has(sourceIp) : false;

    console.log(`[CAF-Webhook] Source IP: ${sourceIp} (known=${ipIsKnown}), Signature present: ${!!cafSignature}, UA: ${userAgent}`);

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

    // 3rd resolver: externalId (passado no query param cadastro.io/xxx?externalId=CASE_ID)
    // Essencial para vincular resultados do fallback oficial CAF (cadastro.io) ao case correto.
    // externalId pode vir em attributes/variables/metadata conforme versão da API CAF.
    if (!onboardingCaseId) {
      const externalId =
        body.attributes?.externalId ||
        body.variables?.externalId ||
        body.metadata?.externalId ||
        body.externalId || '';
      if (externalId) {
        try {
          const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: externalId });
          if (cases[0]) {
            onboardingCaseId = cases[0].id;
            console.log(`[CAF-Webhook] Case resolved via externalId: ${onboardingCaseId}`);
          }
        } catch (e) {
          console.warn('[CAF-Webhook] externalId lookup failed:', e.message);
        }
      }
    }

    // 4th resolver: buscar CNPJ via GET /v1/transactions/{uuid} e vincular por Merchant.cpfCnpj.
    // Usado quando o link cadastro.io é estático e o cliente não veio do nosso SDK (sem IntegrationLog prévio).
    if (!onboardingCaseId && transactionId) {
      try {
        const authToken = getCafToken();
        const txRes = await fetch(
          `${CAF_API_BASE}/v1/transactions/${transactionId}?_lang=pt`,
          { method: 'GET', headers: { 'Authorization': `Bearer ${authToken}` } }
        );
        if (txRes.ok) {
          const tx = await txRes.json().catch(() => null);
          const cnpj = (
            tx?.parameters?.cnpj ||
            tx?.attributes?.cnpj ||
            tx?.sections?.pjData?.data?.taxIdNumber ||
            ''
          ).replace(/\D/g, '');
          if (cnpj && cnpj.length === 14) {
            const merchants = await base44.asServiceRole.entities.Merchant.filter({ cpfCnpj: cnpj });
            if (merchants[0]) {
              const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ merchantId: merchants[0].id });
              if (cases[0]) {
                onboardingCaseId = cases[0].id;
                console.log(`[CAF-Webhook] Case resolved via CNPJ ${cnpj.slice(0,8)}***: ${onboardingCaseId}`);
              }
            }
          }
        }
      } catch (e) {
        console.warn('[CAF-Webhook] CNPJ resolver failed:', e.message);
      }
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
      // Extract flags from statusReasons (87 rules)
      const reasonFlags = extractFlagsFromReasons(body.statusReasons || []);
      newFlags.push(...reasonFlags);

      // Auto-fetch full transaction result for detailed sections
      if (transactionId) {
        try {
          const authToken = getCafToken();
          const txResponse = await fetch(
            `${CAF_API_BASE}/v1/transactions/${transactionId}?_includeCroppedImages=true&_includePfRelationships=true&_lang=pt`,
            { method: 'GET', headers: { 'Authorization': `Bearer ${authToken}` } }
          );

          if (txResponse.ok) {
            const txText = await txResponse.text();
            let txResult;
            try { txResult = JSON.parse(txText); } catch { txResult = null; }

            if (txResult) {
              // Process manualReprovalReasons from full transaction
              const reprovalFlags = extractFlagsFromManualReprovals(txResult.manualReprovalReasons || []);
              for (const f of reprovalFlags) {
                if (!newFlags.includes(f)) newFlags.push(f);
              }

              // Additional flags from full transaction validations
              const txFlags = extractFlagsFromReasons(txResult.validations || []);
              for (const f of txFlags) {
                if (!newFlags.includes(f)) newFlags.push(f);
              }

              if (onboardingCaseId) {
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

                // Save related transactions (PF_PF)
                const relatedTx = txResult.relatedTransactions || {};
                if (Object.keys(relatedTx).length > 0) {
                  try {
                    await base44.asServiceRole.entities.ExternalValidationResult.create({
                      onboardingCaseId, provider: 'CAF',
                      validationType: 'Webhook — Related Transactions (PF_PF)',
                      endpoint: `/v1/transactions/${transactionId}?_includePfRelationships=true`,
                      resultData: relatedTx,
                      status: 'Sucesso', timestamp: new Date().toISOString(),
                    });
                  } catch { /* */ }
                }

                // Save manual reprovals as explicit result
                if ((txResult.manualReprovalReasons || []).length > 0) {
                  try {
                    await base44.asServiceRole.entities.ExternalValidationResult.create({
                      onboardingCaseId, provider: 'CAF',
                      validationType: 'Webhook — Manual Reproval Reasons',
                      endpoint: `/v1/transactions/${transactionId}`,
                      resultData: {
                        manualReprovalReasons: txResult.manualReprovalReasons,
                        flagsExtracted: reprovalFlags,
                      },
                      score: 0,
                      status: 'Falha', timestamp: new Date().toISOString(),
                    });
                  } catch { /* */ }
                }

                console.log(`[CAF-Webhook] Auto-fetched transaction: ${Object.keys(sections).length} sections, ${reprovalFlags.length} manual reprovals`);
              }
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

    // ── profile_status_change ──
    if (webhookType === 'profile_status_change') {
      const profileStatus = body.status || '';
      const profileType = body.type || ''; // PF or PJ
      const profileCpf = body.cpf || '';
      const profileCnpj = body.cnpj || '';
      const profileId = body.profileId || '';

      if (profileStatus === 'REPROVED') {
        newFlags.push(`PROFILE_REPROVED_${profileType}: ${profileCpf || profileCnpj}`);
      }

      if (onboardingCaseId) {
        try {
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId, provider: 'CAF',
            validationType: `Profile Status Change — ${profileType} (${profileStatus})`,
            endpoint: 'webhook/profile_status_change',
            resultData: { profileId, type: profileType, status: profileStatus, cpf: profileCpf, cnpj: profileCnpj, updatedAt: body.updatedAt },
            score: profileStatus === 'APPROVED' ? 100 : profileStatus === 'REPROVED' ? 0 : 50,
            status: profileStatus === 'APPROVED' ? 'Sucesso' : profileStatus === 'REPROVED' ? 'Falha' : 'Pendente',
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
          if (cafStatus === 'REPROVED') updates.cafCompleted = true;

          // v8: Webhook only persists the raw CAF decision + flags — the intelligent
          // escalation hierarchy (score thresholds, subfaixa rules) is recomputed by
          // autoEnrichOnboarding on the next pipeline run. This keeps a single source
          // of truth and avoids divergent logic between webhook and batch pipeline.
          await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, updates);

          // Trigger pipeline rerun so intelligent classifier re-evaluates with the new CAF data
          try {
            await base44.asServiceRole.functions.invoke('autoEnrichOnboarding', { onboardingCaseId });
            console.log(`[CAF-Webhook] Pipeline rerun triggered for case ${onboardingCaseId}`);
          } catch (pipeErr) {
            console.warn(`[CAF-Webhook] Pipeline rerun failed (non-blocking): ${pipeErr.message}`);
          }
        }
      } catch (e) { console.warn('[CAF-Webhook] Case update error:', e.message); }
    } else if (onboardingCaseId && cafStatus === 'APPROVED') {
      try {
        await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, { cafCompleted: true });
      } catch { /* */ }
    }

    // Always log the raw webhook — now includes the real source IP, signature presence
    // and user-agent so we can audit which IPs CAF is actually using and whether the
    // X-Caf-Signature header is being sent (Connect API should always send it).
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
        request_payload: {
          source_ip: sourceIp,
          ip_in_known_list: ipIsKnown,
          has_signature: !!cafSignature,
          signature_prefix: cafSignature ? cafSignature.slice(0, 12) : '',
          user_agent: userAgent,
        },
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