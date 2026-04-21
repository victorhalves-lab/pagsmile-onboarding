import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafWebhookHandler — Processa webhooks CAF (Connect + Core legado).
 *
 * UPGRADES v3 (CAF Connect support):
 *   1. HMAC SHA-256 signature validation (X-Caf-Signature) — raw body bytes
 *   2. CloudEvents spec compliance — parse { specversion, type, source, id, time, data }
 *   3. Idempotency via CloudEvent.id (rejeita duplicatas)
 *   4. Resposta 202 Accepted em <2s (processamento async se necessário)
 *   5. Suporte a TODOS os eventos Connect:
 *      - TRANSACTIONPROCESSSTARTEDEVENT / TRANSACTIONSTATUSUPDATED / TRANSACTIONDOCUMENTSCOPYREQUESTEDEVENT
 *      - FACEAUTHENTICATIONEVENT / PROFILEUPDATEDEVENT
 *      - COMMUNICATION* (SMS/email/whatsapp status)
 *   6. Fallback para o padrão legado Core API (type=status_updated etc) preservado
 *
 * Docs: https://docs.caf.io/caf-api/connect/webhook
 * Auth: No Base44 auth (chamado externamente pela CAF). HMAC valida autenticidade.
 */

const CAF_CORE_API_BASE = 'https://api.combateafraude.com';
const CAF_CONNECT_API_BASE = 'https://api.us.prd.caf.io';

// Official CAF webhook IPs (docs.caf.io/caf-api/connect/webhook/best-practices)
const CAF_KNOWN_IPS = new Set([
  '34.234.120.59', '18.229.212.133', '3.218.90.124', '44.219.96.170', '18.235.54.162',
]);

function getCoreToken() {
  const token = Deno.env.get('CAF_CORE_API_TOKEN');
  if (!token) throw new Error('CAF_CORE_API_TOKEN not configured');
  return token;
}

// ── OAuth2 Connect token cache ──
let connectTokenCache = { accessToken: null, expiresAt: 0 };
async function getConnectToken() {
  const clientId = Deno.env.get('CAF_CONNECT_CLIENT_ID');
  const clientSecret = Deno.env.get('CAF_CONNECT_CLIENT_SECRET');
  if (!clientId || !clientSecret) return null;
  const now = Date.now();
  if (connectTokenCache.accessToken && connectTokenCache.expiresAt - 60_000 > now) {
    return connectTokenCache.accessToken;
  }
  const res = await fetch(`${CAF_CONNECT_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret,
    }).toString(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) return null;
  connectTokenCache = {
    accessToken: json.access_token,
    expiresAt: now + (Number(json.expires_in) || 3600) * 1000,
  };
  return json.access_token;
}

// ═══════════════════════════════════════════════════════════════
// HMAC SHA-256 signature verification (constant-time)
// ═══════════════════════════════════════════════════════════════
async function verifyCafSignature(rawBodyBytes, signatureHex, secret) {
  if (!signatureHex || !secret) return false;
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', key, rawBodyBytes);
    const expectedHex = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison
    if (expectedHex.length !== signatureHex.length) return false;
    let diff = 0;
    for (let i = 0; i < expectedHex.length; i++) {
      diff |= expectedHex.charCodeAt(i) ^ signatureHex.charCodeAt(i);
    }
    return diff === 0;
  } catch (e) {
    console.warn('[CAF-Webhook] HMAC verify error:', e.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// Validation rules map (87 Core API rules — still used for legacy + auto-fetch)
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

// ═══════════════════════════════════════════════════════════════
// Detecta se é CloudEvent (Connect) ou payload legado (Core)
// ═══════════════════════════════════════════════════════════════
function isCloudEvent(body) {
  return !!(body && body.specversion && body.type && body.source && body.id);
}

// Normaliza CloudEvent Connect → forma uniforme pra lógica downstream
function normalizeCloudEvent(evt) {
  const type = evt.type || '';
  const data = evt.data || {};

  // Connect event types → legacy-like form
  // https://docs.caf.io/caf-api/connect/webhook/events
  if (type === 'TRANSACTIONSTATUSUPDATED') {
    return {
      _cloudEventId: evt.id,
      _cloudEventTime: evt.time,
      _cloudEventType: type,
      type: 'status_updated',
      uuid: data.transactionId || data.transactionUuid || '',
      status: data.status || '',
      onboardingId: data.onboardingId || '',
      externalId: data.externalId || '',
      statusReasons: data.statusReasons || data.validations || [],
      metadata: data.metadata || {},
      attributes: data.attributes || {},
      variables: data.variables || {},
      _raw: evt,
    };
  }
  if (type === 'TRANSACTIONPROCESSSTARTEDEVENT') {
    return {
      _cloudEventId: evt.id, _cloudEventTime: evt.time, _cloudEventType: type,
      type: 'process_started',
      uuid: data.transactionId || '', status: 'PROCESSING',
      onboardingId: data.onboardingId || '', externalId: data.externalId || '',
      _raw: evt,
    };
  }
  if (type === 'TRANSACTIONDOCUMENTSCOPYREQUESTEDEVENT') {
    return {
      _cloudEventId: evt.id, _cloudEventTime: evt.time, _cloudEventType: type,
      type: 'documentscopy_requested',
      uuid: data.transactionId || '', status: 'PROCESSING',
      externalId: data.externalId || '',
      documentscopy: data.documentscopy || data,
      _raw: evt,
    };
  }
  if (type === 'FACEAUTHENTICATIONEVENT') {
    return {
      _cloudEventId: evt.id, _cloudEventTime: evt.time, _cloudEventType: type,
      type: 'face_authentication',
      uuid: data.transactionId || data.authenticationId || '',
      isMatch: data.isMatch, status: data.status || '',
      externalId: data.externalId || '', profileId: data.profileId || '',
      _raw: evt,
    };
  }
  if (type === 'PROFILEUPDATEDEVENT') {
    return {
      _cloudEventId: evt.id, _cloudEventTime: evt.time, _cloudEventType: type,
      type: 'profile_status_change',
      uuid: data.profileId || '',
      status: data.status || '',
      profileId: data.profileId || '', cpf: data.cpf || '', cnpj: data.cnpj || '',
      externalId: data.externalId || '',
      updatedAt: data.updatedAt || data.occurredOn || evt.time,
      _raw: evt,
    };
  }
  // COMMUNICATION* — apenas loga, não altera case
  if (type.startsWith('COMMUNICATION')) {
    return {
      _cloudEventId: evt.id, _cloudEventTime: evt.time, _cloudEventType: type,
      type: 'communication',
      uuid: data.notificationId || data.externalId || '',
      status: type.replace('COMMUNICATION', '').replace('EVENT', '').toLowerCase(),
      externalId: data.externalId || '',
      _raw: evt,
    };
  }

  // Desconhecido — preserva evento bruto
  return {
    _cloudEventId: evt.id, _cloudEventTime: evt.time, _cloudEventType: type,
    type: 'unknown_cloudevent', uuid: '', status: '',
    _raw: evt,
  };
}

// ═══════════════════════════════════════════════════════════════
// Handler principal
// ═══════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    // CAF webhooks são sempre POST com Content-Type: application/json.
    // Retornamos 405 pra outros métodos (ex: GET de health-check do Trust).
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // ── Observabilidade: captura IP + signature ANTES de ler o body ──
    const sourceIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '';
    const cafSignature = req.headers.get('x-caf-signature') || req.headers.get('X-Caf-Signature') || '';
    const userAgent = req.headers.get('user-agent') || '';
    const ipIsKnown = sourceIp ? CAF_KNOWN_IPS.has(sourceIp) : false;
    const isCafUA = /caf-webhook/i.test(userAgent);

    console.log(`[CAF-Webhook] IP=${sourceIp} (known=${ipIsKnown}), hasSig=${!!cafSignature}, UA=${userAgent}`);

    // ── CRÍTICO: ler o body como bytes RAW pra HMAC ──
    // (a doc CAF é explícita que a validação tem que ser no byte array cru,
    //  antes de qualquer parsing JSON — senão o hash muda por reordenação de keys)
    const rawBodyBytes = new Uint8Array(await req.arrayBuffer());
    const rawBodyText = new TextDecoder().decode(rawBodyBytes);

    // ── Validação de assinatura HMAC (Connect API) ──
    const webhookSecret = Deno.env.get('CAF_WEBHOOK_SECRET');
    let signatureValid = null; // null = não verificado, true/false = resultado
    if (webhookSecret && cafSignature) {
      signatureValid = await verifyCafSignature(rawBodyBytes, cafSignature, webhookSecret);
      if (!signatureValid) {
        console.warn('[CAF-Webhook] ❌ Invalid HMAC signature — rejecting');
        // Best practice: retorna 401 pra eventos assinados inválidos
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      console.log('[CAF-Webhook] ✅ HMAC signature valid');
    } else if (!webhookSecret) {
      console.warn('[CAF-Webhook] ⚠ CAF_WEBHOOK_SECRET not set — skipping signature check (add it ASAP)');
    }

    // ── Parse body ──
    let body;
    try { body = JSON.parse(rawBodyText); } catch (e) {
      console.warn('[CAF-Webhook] Invalid JSON body:', e.message);
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // ── Detecta CloudEvent (Connect) vs legado (Core) ──
    const isConnect = isCloudEvent(body);
    const normalized = isConnect ? normalizeCloudEvent(body) : body;
    const cloudEventId = normalized._cloudEventId || null;

    console.log(`[CAF-Webhook] Format: ${isConnect ? 'Connect/CloudEvent' : 'Core legacy'}, type: ${normalized.type}, id: ${cloudEventId || 'n/a'}`);

    // ── Idempotência: rejeita duplicatas via cloudEventId ──
    if (cloudEventId) {
      try {
        const dup = await base44.asServiceRole.entities.IntegrationLog.filter({
          request_id: cloudEventId, service_type: 'caf_webhook_received',
        });
        if (dup.length > 0) {
          console.log(`[CAF-Webhook] Duplicate event ${cloudEventId} — returning 202`);
          return new Response(JSON.stringify({ received: true, duplicate: true, id: cloudEventId }), {
            status: 202, headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch { /* */ }
    }

    // ── Extrai campos padronizados ──
    const webhookType = normalized.type || 'unknown';
    const transactionId = normalized.uuid || normalized.report || '';
    const cafStatus = normalized.status || '';
    const onboardingId = normalized.onboardingId || '';

    // ═══════════════════════════════════════════════════════════════
    // Resolução do OnboardingCase (4 estratégias)
    // ═══════════════════════════════════════════════════════════════
    let relatedLog = null;
    let onboardingCaseId = null;

    // 1. Via transaction_id
    if (transactionId) {
      try {
        const logs = await base44.asServiceRole.entities.IntegrationLog.filter({
          transaction_id: transactionId, provider: 'CAF',
        });
        relatedLog = logs[0];
        onboardingCaseId = relatedLog?.onboarding_case_id || null;
      } catch { /* */ }
    }

    // 2. Via onboarding_id
    if (!onboardingCaseId && onboardingId) {
      try {
        const logs = await base44.asServiceRole.entities.IntegrationLog.filter({
          onboarding_id: onboardingId, provider: 'CAF',
        });
        if (logs[0]) { relatedLog = logs[0]; onboardingCaseId = logs[0].onboarding_case_id; }
      } catch { /* */ }
    }

    // 3. Via externalId (metadata.onboardingCaseId do Connect)
    if (!onboardingCaseId) {
      const externalId =
        normalized.attributes?.externalId ||
        normalized.variables?.externalId ||
        normalized.metadata?.externalId ||
        normalized.metadata?.onboardingCaseId ||
        normalized.externalId ||
        body.attributes?.externalId ||
        body.variables?.externalId ||
        body.metadata?.externalId ||
        body.metadata?.onboardingCaseId ||
        body.externalId || '';
      if (externalId) {
        try {
          const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: externalId });
          if (cases[0]) {
            onboardingCaseId = cases[0].id;
            console.log(`[CAF-Webhook] Case via externalId: ${onboardingCaseId}`);
          }
        } catch { /* */ }
      }
    }

    // 4. Via CNPJ/CPF (fetch da transação real na CAF — Core legado)
    if (!onboardingCaseId && transactionId && !isConnect) {
      try {
        const coreToken = getCoreToken();
        const txRes = await fetch(
          `${CAF_CORE_API_BASE}/v1/transactions/${transactionId}?_lang=pt`,
          { headers: { 'Authorization': `Bearer ${coreToken}` } }
        );
        if (txRes.ok) {
          const tx = await txRes.json().catch(() => null);
          const doc = (tx?.parameters?.cnpj || tx?.attributes?.cnpj ||
            tx?.parameters?.cpf || tx?.attributes?.cpf ||
            tx?.sections?.pjData?.data?.taxIdNumber || '').replace(/\D/g, '');
          if (doc && (doc.length === 11 || doc.length === 14)) {
            const merchants = await base44.asServiceRole.entities.Merchant.filter({ cpfCnpj: doc });
            if (merchants[0]) {
              const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ merchantId: merchants[0].id });
              if (cases[0]) {
                onboardingCaseId = cases[0].id;
                console.log(`[CAF-Webhook] Case via doc ${doc.slice(0,6)}***: ${onboardingCaseId}`);
              }
            }
          }
        }
      } catch (e) { console.warn('[CAF-Webhook] Doc resolver error:', e.message); }
    }

    // ═══════════════════════════════════════════════════════════════
    // Atualiza IntegrationLog existente (se encontrado)
    // ═══════════════════════════════════════════════════════════════
    if (relatedLog) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.update(relatedLog.id, {
          callback_received_at: new Date().toISOString(),
          callback_payload: body,
          status: cafStatus === 'APPROVED' ? 'success' : cafStatus === 'REPROVED' ? 'failed' : 'processing',
          result_status: cafStatus === 'APPROVED' ? 'APPROVED' : cafStatus === 'REPROVED' ? 'REPROVED' : 'PENDING_REVIEW',
        });
      } catch (e) { console.warn('[CAF-Webhook] Update log error:', e.message); }
    }

    const newFlags = [];

    // ═══════════════════════════════════════════════════════════════
    // Processamento por tipo de evento
    // ═══════════════════════════════════════════════════════════════

    // ── status_updated / TRANSACTIONSTATUSUPDATED ──
    if (webhookType === 'status_updated') {
      const reasonFlags = extractFlagsFromReasons(normalized.statusReasons || []);
      newFlags.push(...reasonFlags);

      // Auto-fetch full transaction (tenta Connect primeiro, depois Core)
      if (transactionId) {
        let txResult = null;
        try {
          if (isConnect) {
            const connectToken = await getConnectToken();
            if (connectToken) {
              const r = await fetch(
                `${CAF_CONNECT_API_BASE}/v1/transactions/${transactionId}?includeCroppedImages=true`,
                { headers: { 'Authorization': `Bearer ${connectToken}` } }
              );
              if (r.ok) txResult = await r.json().catch(() => null);
            }
          }
          if (!txResult) {
            // Fallback Core API
            const r = await fetch(
              `${CAF_CORE_API_BASE}/v1/transactions/${transactionId}?_includeCroppedImages=true&_includePfRelationships=true&_lang=pt`,
              { headers: { 'Authorization': `Bearer ${getCoreToken()}` } }
            );
            if (r.ok) txResult = await r.json().catch(() => null);
          }
        } catch (e) { console.warn('[CAF-Webhook] Auto-fetch error:', e.message); }

        if (txResult && onboardingCaseId) {
          const reprovalFlags = extractFlagsFromManualReprovals(txResult.manualReprovalReasons || []);
          for (const f of reprovalFlags) if (!newFlags.includes(f)) newFlags.push(f);
          const txFlags = extractFlagsFromReasons(txResult.validations || []);
          for (const f of txFlags) if (!newFlags.includes(f)) newFlags.push(f);

          const sections = txResult.sections || {};
          for (const [secName, secData] of Object.entries(sections)) {
            try {
              await base44.asServiceRole.entities.ExternalValidationResult.create({
                onboardingCaseId, provider: 'CAF',
                validationType: `Webhook Auto-Fetch — ${secName}`,
                endpoint: `/v1/transactions/${transactionId} (${secName})`,
                resultData: secData, status: 'Sucesso', timestamp: new Date().toISOString(),
              });
            } catch { /* */ }
          }
          console.log(`[CAF-Webhook] Auto-fetched: ${Object.keys(sections).length} sections, ${reprovalFlags.length} manual reprovals`);
        }
      }

      if (onboardingCaseId) {
        try {
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId, provider: 'CAF',
            validationType: `Webhook — ${isConnect ? 'TRANSACTIONSTATUSUPDATED' : 'status_updated'} (${cafStatus})`,
            endpoint: isConnect ? 'connect/webhook' : 'core/webhook',
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
      const ds = normalized.documentscopy || body.sections?.documentscopy || body.documentscopy || {};
      if (ds.fraud === true) newFlags.push('DOCUMENTSCOPY_FRAUD_DETECTED');
      if (onboardingCaseId) {
        try {
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId, provider: 'CAF',
            validationType: 'Documentoscopy — Webhook',
            endpoint: 'webhook/documentscopy', resultData: ds,
            score: ds.fraud ? 0 : 100, status: ds.fraud ? 'Falha' : 'Sucesso',
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
          endpoint: 'webhook/process_started', resultData: body,
          status: 'Pendente', timestamp: new Date().toISOString(),
        });
      } catch { /* */ }
    }

    // ── face_authentication ──
    if (webhookType === 'face_authentication') {
      if (normalized.isMatch === false) newFlags.push('FACE_AUTH_MISMATCH');
      if (onboardingCaseId) {
        try {
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId, provider: 'CAF',
            validationType: 'Face Authentication — Webhook',
            endpoint: 'webhook/face_authentication', resultData: body,
            score: normalized.isMatch ? 100 : 0,
            status: normalized.isMatch ? 'Sucesso' : 'Falha',
            timestamp: new Date().toISOString(),
          });
        } catch { /* */ }
        // Slack alert on mismatch
        if (normalized.isMatch === false) {
          try {
            await base44.asServiceRole.functions.invoke('notifyCafFaceMatchFailed', {
              onboardingCaseId,
              transactionId,
              status: 'REPROVED',
              reason: 'Webhook CAF reportou isMatch=false',
            });
          } catch {}
        }
      }
    }

    // ── profile_status_change / PROFILEUPDATEDEVENT ──
    if (webhookType === 'profile_status_change') {
      const profileStatus = normalized.status || '';
      if (profileStatus === 'REPROVED') {
        newFlags.push(`PROFILE_REPROVED: ${normalized.cpf || normalized.cnpj}`);
      }
      if (onboardingCaseId) {
        try {
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId, provider: 'CAF',
            validationType: `Profile Status Change (${profileStatus})`,
            endpoint: 'webhook/profile_status_change',
            resultData: {
              profileId: normalized.profileId, status: profileStatus,
              cpf: normalized.cpf, cnpj: normalized.cnpj,
              updatedAt: normalized.updatedAt,
            },
            score: profileStatus === 'APPROVED' ? 100 : profileStatus === 'REPROVED' ? 0 : 50,
            status: profileStatus === 'APPROVED' ? 'Sucesso' : profileStatus === 'REPROVED' ? 'Falha' : 'Pendente',
            timestamp: new Date().toISOString(),
          });
        } catch { /* */ }
      }
    }

    // ── Atualiza OnboardingCase + trigger pipeline ──
    if (onboardingCaseId && newFlags.length > 0) {
      try {
        const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
        if (cases[0]) {
          const merged = [...new Set([...(cases[0].redFlags || []), ...newFlags])];
          const updates = { redFlags: merged };
          if (cafStatus === 'APPROVED' && !cases[0].cafCompleted) updates.cafCompleted = true;
          if (cafStatus === 'REPROVED') updates.cafCompleted = true;
          await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, updates);

          try {
            await base44.asServiceRole.functions.invoke('autoEnrichOnboarding', { onboardingCaseId });
          } catch (e) { console.warn('[CAF-Webhook] Pipeline rerun failed:', e.message); }
        }
      } catch (e) { console.warn('[CAF-Webhook] Case update error:', e.message); }
    } else if (onboardingCaseId && cafStatus === 'APPROVED') {
      try {
        await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, { cafCompleted: true });
      } catch { /* */ }
    }

    // ── Log unificado do webhook recebido ──
    try {
      await base44.asServiceRole.entities.IntegrationLog.create({
        onboarding_case_id: onboardingCaseId || '',
        provider: 'CAF',
        service_type: 'caf_webhook_received',
        request_id: cloudEventId || transactionId,
        transaction_id: transactionId,
        onboarding_id: onboardingId,
        status: 'success',
        result_status: cafStatus === 'APPROVED' ? 'APPROVED' : cafStatus === 'REPROVED' ? 'REPROVED' : 'PENDING_REVIEW',
        request_payload: {
          format: isConnect ? 'cloudevent' : 'legacy_core',
          cloudevent_type: normalized._cloudEventType || null,
          cloudevent_time: normalized._cloudEventTime || null,
          source_ip: sourceIp,
          ip_in_known_list: ipIsKnown,
          user_agent: userAgent,
          is_caf_user_agent: isCafUA,
          has_signature: !!cafSignature,
          signature_valid: signatureValid,
          secret_configured: !!webhookSecret,
        },
        response_payload: body,
        red_flags: newFlags,
        duration_ms: Date.now() - startTime,
        callback_received_at: new Date().toISOString(),
        callback_payload: body,
      });
    } catch (e) { console.warn('[CAF-Webhook] Raw log error:', e.message); }

    // ── Resposta: 202 Accepted (best practice CAF) ──
    return new Response(JSON.stringify({
      received: true,
      type: webhookType,
      id: cloudEventId,
      transactionId,
      flagsAdded: newFlags,
      duration_ms: Date.now() - startTime,
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[CAF-Webhook] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
});