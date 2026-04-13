import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafFullEnrichment — Single CAF transaction with ALL available services
 *
 * UPGRADES v2:
 *   1. _callbackUrl added to every transaction → garante receber webhook
 *   2. Accepts optional templateId for Trust-configured templates
 *   3. metadata includes onboardingCaseId for webhook correlation
 *
 * PJ: pjData + pjPublicData + pjSimples + pjKycCompliance + pjKycComplianceOwners + pjCreditProfileDetails
 * PF: pfBasicData + pfData + pfKycCompliance + pfKycComplianceOwners + pfCreditProfileDetails + pfAddresses + pfMediaProfileAndExposure
 *
 * Auth: CAF_CLIENT_SECRET as static Bearer token
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

function getCafToken() {
  const token = Deno.env.get('CAF_CLIENT_SECRET');
  if (!token) throw new Error('CAF_CLIENT_SECRET not configured');
  return token;
}

function extractRedFlags(sections) {
  const flags = [];

  for (const [secName, secData] of Object.entries(sections)) {
    if (!secData || typeof secData !== 'object') continue;

    // PEP checks
    if (secData.isPep || secData.isPEP) flags.push(`PEP_DETECTED_${secName}`);

    // Sanctions
    const sanctions = secData.sanctions || secData.Sanctions || [];
    if (Array.isArray(sanctions) && sanctions.length > 0) {
      flags.push(`SANCTIONS_${secName}: ${sanctions.length} hit(s)`);
    }

    // Death / irregular status
    if (secData.deathIndicator || secData.isDeceased) flags.push('CPF_DEATH_INDICATOR');
    if (secData.status && typeof secData.status === 'string' && !secData.status.toUpperCase().includes('ATIVA') && !secData.status.toUpperCase().includes('REGULAR') && secData.status !== '') {
      if (/inapt|suspend|cancel|baixa/i.test(secData.status)) {
        flags.push(`STATUS_IRREGULAR_${secName}: ${secData.status}`);
      }
    }

    // Owner screening
    const owners = secData.owners || secData.relatedPersons || [];
    if (Array.isArray(owners)) {
      for (const owner of owners) {
        if (owner.isPep || owner.isPEP) flags.push(`OWNER_PEP: ${owner.name || 'N/I'}`);
        const ownerSanctions = owner.sanctions || [];
        if (Array.isArray(ownerSanctions) && ownerSanctions.length > 0) {
          flags.push(`OWNER_SANCTIONS: ${owner.name || 'N/I'}`);
        }
      }
    }

    // Media exposure
    if (secName.includes('Media') && secData.hasExposure) flags.push('MEDIA_EXPOSURE_DETECTED');

    // Credit issues
    if (secName.includes('credit') || secName.includes('Credit')) {
      if (secData.score != null && secData.score < 300) flags.push(`LOW_CREDIT_SCORE: ${secData.score}`);
      if (secData.debts?.length > 0) flags.push(`CREDIT_DEBTS: ${secData.debts.length}`);
      if (secData.protests?.length > 0) flags.push(`CREDIT_PROTESTS: ${secData.protests.length}`);
    }
  }

  return [...new Set(flags)];
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
    const { cpf, cnpj, onboardingCaseId, includeCredit = false, templateId, callbackUrl } = body;

    if (!cpf && !cnpj) return Response.json({ error: 'CPF ou CNPJ é obrigatório' }, { status: 400 });

    const authToken = getCafToken();
    const isPJ = !!cnpj;
    const document = (cnpj || cpf).replace(/\D/g, '');

    // Build comprehensive service list
    let services;
    if (isPJ) {
      services = ['pjData', 'pjPublicData', 'pjSimples', 'pjKycCompliance', 'pjKycComplianceOwners'];
      if (includeCredit) services.push('pjCreditProfileDetails');
    } else {
      services = ['pfBasicData', 'pfData', 'pfKycCompliance', 'pfKycComplianceOwners', 'pfAddresses', 'pfMediaProfileAndExposure'];
      if (includeCredit) services.push('pfCreditProfileDetails');
    }

    console.log(`[CAF-FullEnrich] ${isPJ ? 'PJ' : 'PF'}: ***${document.slice(-4)}, services: ${services.length}`);

    // Build payload — support both templateId and inline services
    const cafPayload = {
      parameters: isPJ ? { cnpj: document } : { cpf: document },
      metadata: { onboardingCaseId: onboardingCaseId || '', source: 'pagsmile_full_enrichment' },
    };

    if (templateId) {
      // Use Trust-configured template (has pre-configured rules + services)
      cafPayload.templateId = templateId;
    } else {
      // Inline services
      cafPayload.template = { services };
    }

    // Always include _callbackUrl to guarantee webhook delivery
    if (callbackUrl) {
      cafPayload._callbackUrl = callbackUrl;
    }

    const cafResponse = await fetch(`${CAF_API_BASE}/v1/transactions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cafPayload),
    });

    const cafText = await cafResponse.text();
    let cafResult;
    try { cafResult = JSON.parse(cafText); } catch { cafResult = { raw: cafText.substring(0, 500) }; }

    const sections = cafResult?.sections || {};
    const durationMs = Date.now() - startTime;
    const redFlags = extractRedFlags(sections);

    console.log(`[CAF-FullEnrich] HTTP: ${cafResponse.status}, sections: ${Object.keys(sections).length}, flags: ${redFlags.length}`);

    // Save results
    if (onboardingCaseId) {
      // IntegrationLog
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          provider: 'CAF',
          service_type: isPJ ? 'kyb_business_identity' : 'empresas_kyc_real',
          transaction_id: cafResult?.uuid || '',
          status: cafResponse.ok ? 'success' : 'failed',
          request_payload: { document: `***${document.slice(-4)}`, servicesCount: services.length, templateId: templateId || null },
          response_payload: { sectionsReturned: Object.keys(sections), flagsCount: redFlags.length },
          red_flags: redFlags,
          duration_ms: durationMs,
        });
      } catch (e) { console.warn('[CAF-FullEnrich] Log error:', e.message); }

      // Save each section as ExternalValidationResult
      for (const [secName, secData] of Object.entries(sections)) {
        try {
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId,
            provider: 'CAF',
            validationType: `Full Enrichment — ${secName}`,
            endpoint: `/v1/transactions (${secName})`,
            resultData: secData,
            status: 'Sucesso',
            timestamp: new Date().toISOString(),
            responseTime: durationMs,
          });
        } catch { /* */ }
      }

      // Update case flags
      if (redFlags.length > 0) {
        try {
          const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
          if (cases[0]) {
            const merged = [...new Set([...(cases[0].redFlags || []), ...redFlags])];
            await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, { redFlags: merged, cafCompleted: true });
          }
        } catch (e) { console.warn('[CAF-FullEnrich] Case update error:', e.message); }
      } else {
        try {
          await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, { cafCompleted: true });
        } catch { /* */ }
      }
    }

    return Response.json({
      success: cafResponse.ok,
      type: isPJ ? 'PJ' : 'PF',
      transactionId: cafResult?.uuid || null,
      sections,
      sectionsReturned: Object.keys(sections),
      redFlags,
      flagCount: redFlags.length,
      overallRisk: redFlags.some(f => /SANCTIONS|DEATH|ARREST/.test(f)) ? 'CRITICAL'
        : redFlags.some(f => /PEP|CRIMINAL/.test(f)) ? 'HIGH'
        : redFlags.length > 0 ? 'MEDIUM' : 'OK',
      duration_ms: durationMs,
    });

  } catch (error) {
    console.error('[CAF-FullEnrich] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});