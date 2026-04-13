import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafScreeningInternacional — PEPs + Sanctions + Warnings/Interpol via Core API
 *
 * Auth: CAF_CLIENT_SECRET as static Bearer token
 *
 * Services:
 *   - pfKycComplianceOwners (PEP, sanctions, COAF, INTERPOL, FBI, OFAC, EU, UN)
 *   - pjKycComplianceOwners (company + ALL owners screening)
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

function getCafToken() {
  const token = Deno.env.get('CAF_CLIENT_SECRET');
  if (!token) throw new Error('CAF_CLIENT_SECRET not configured');
  return token;
}

async function callCafTransaction(authToken, services, parameters) {
  const res = await fetch(`${CAF_API_BASE}/v1/transactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ template: { services }, parameters }),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text.substring(0, 500) }; }
  return { ok: res.ok, status: res.status, data };
}

function extractScreeningFlags(result, personName) {
  const flags = [];
  const sections = result?.sections || result || {};

  for (const [sectionName, sectionData] of Object.entries(sections)) {
    if (!sectionData || typeof sectionData !== 'object') continue;

    if (sectionData.isPep === true || sectionData.isPEP === true) {
      flags.push({ type: 'PEP_INTERNATIONAL', person: personName, detail: `PEP detected in ${sectionName}` });
    }

    const sanctions = sectionData.sanctions || sectionData.Sanctions || [];
    if (Array.isArray(sanctions) && sanctions.length > 0) {
      flags.push({ type: 'SANCTIONS_INTERNATIONAL', person: personName, detail: `${sanctions.length} sanction(s) in ${sectionName}: ${sanctions.map(s => s.source || s.listName || 'N/I').join(', ')}` });
    }

    const hits = sectionData.hits || sectionData.results || [];
    if (Array.isArray(hits) && hits.length > 0) {
      for (const hit of hits) {
        const hitType = hit.type || hit.category || sectionName;
        if (/pep/i.test(hitType)) {
          flags.push({ type: 'PEP_INTERNATIONAL', person: personName, detail: `PEP hit: ${hit.name || hit.matchName || 'N/I'}` });
        }
        if (/sanction/i.test(hitType)) {
          flags.push({ type: 'SANCTIONS_INTERNATIONAL', person: personName, detail: `Sanction hit: ${hit.name || hit.matchName || 'N/I'} (${hit.source || 'N/I'})` });
        }
        if (/interpol|warning/i.test(hitType)) {
          flags.push({ type: 'INTERPOL_WARNING', person: personName, detail: `Interpol/Warning hit: ${hit.name || hit.matchName || 'N/I'}` });
        }
      }
    }

    const owners = sectionData.owners || sectionData.relatedPersons || [];
    if (Array.isArray(owners)) {
      for (const owner of owners) {
        const ownerName = owner.name || owner.Name || 'N/I';
        if (owner.isPep || owner.isPEP) {
          flags.push({ type: 'PEP_INTERNATIONAL', person: ownerName, detail: `Owner PEP detected` });
        }
        const ownerSanctions = owner.sanctions || owner.Sanctions || [];
        if (Array.isArray(ownerSanctions) && ownerSanctions.length > 0) {
          flags.push({ type: 'SANCTIONS_INTERNATIONAL', person: ownerName, detail: `Owner sanction: ${ownerSanctions.map(s => s.source || 'N/I').join(', ')}` });
        }
      }
    }
  }

  return flags;
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { onboardingCaseId, cpf, cnpj, name } = body;

    const authToken = getCafToken();
    const allFlags = [];
    const results = {};

    let targetCpf = cpf;
    let targetCnpj = cnpj;
    let targetName = name || '';
    let merchant = null;

    if (onboardingCaseId) {
      try {
        const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
        if (cases[0]?.merchantId) {
          const merchants = await base44.asServiceRole.entities.Merchant.filter({ id: cases[0].merchantId });
          merchant = merchants[0];
          if (merchant) {
            const doc = merchant.cpfCnpj?.replace(/\D/g, '') || '';
            targetName = merchant.fullName || '';
            if (merchant.type === 'PF' || doc.length === 11) {
              targetCpf = doc;
            } else {
              targetCnpj = doc;
            }
          }
        }
      } catch (e) {
        console.warn('[Screening] Load merchant error:', e.message);
      }
    }

    if (targetCnpj) {
      console.log(`[Screening] PJ screening for CNPJ: ***${targetCnpj.slice(-4)}`);
      const pjResult = await callCafTransaction(authToken, ['pjKycComplianceOwners'], { cnpj: targetCnpj });
      results.pjKycComplianceOwners = pjResult.data;
      const pjFlags = extractScreeningFlags(pjResult.data, targetName);
      allFlags.push(...pjFlags);
      console.log(`[Screening] PJ result: HTTP=${pjResult.status}, flags=${pjFlags.length}`);
    }

    if (targetCpf) {
      console.log(`[Screening] PF screening for CPF: ***${targetCpf.slice(-4)}`);
      const pfParams = { cpf: targetCpf };
      if (targetName) pfParams.name = targetName;
      const pfResult = await callCafTransaction(authToken, ['pfKycComplianceOwners'], pfParams);
      results.pfKycComplianceOwners = pfResult.data;
      const pfFlags = extractScreeningFlags(pfResult.data, targetName);
      allFlags.push(...pfFlags);
      console.log(`[Screening] PF result: HTTP=${pfResult.status}, flags=${pfFlags.length}`);
    }

    // Cross-check with BDC
    if (onboardingCaseId && allFlags.length > 0) {
      try {
        const bdcLogs = await base44.asServiceRole.entities.IntegrationLog.filter({
          onboarding_case_id: onboardingCaseId,
          provider: 'BigDataCorp',
        });
        const bdcFoundSanctions = bdcLogs.some(l =>
          l.red_flags?.some(f => /sanç|sanction/i.test(f))
        );
        if (!bdcFoundSanctions) {
          allFlags.push({ type: 'CAF_FOUND_ISSUES_BDC_MISSED', person: targetName, detail: 'CAF found screening hits that BDC did not flag' });
        }
      } catch (e) {
        console.warn('[Screening] Cross-check error:', e.message);
      }
    }

    const durationMs = Date.now() - startTime;
    const flagStrings = allFlags.map(f => `${f.type}: ${f.person} — ${f.detail}`);

    if (onboardingCaseId) {
      const serviceTypes = [
        { type: 'pep_international', filter: f => f.type === 'PEP_INTERNATIONAL' },
        { type: 'sanctions_international', filter: f => f.type === 'SANCTIONS_INTERNATIONAL' },
        { type: 'warnings_interpol', filter: f => f.type === 'INTERPOL_WARNING' },
      ];
      for (const st of serviceTypes) {
        const stFlags = allFlags.filter(st.filter);
        try {
          await base44.asServiceRole.entities.IntegrationLog.create({
            onboarding_case_id: onboardingCaseId,
            merchant_id: merchant?.id || '',
            provider: 'CAF',
            service_type: st.type,
            status: 'success',
            result_status: stFlags.length > 0 ? 'PENDING_REVIEW' : 'APPROVED',
            response_payload: { hitsCount: stFlags.length, flags: stFlags.map(f => f.detail) },
            red_flags: stFlags.map(f => `${f.type}: ${f.person}`),
            duration_ms: durationMs,
          });
        } catch (e) { console.warn('[Screening] Log error:', e.message); }
      }

      if (allFlags.length > 0) {
        try {
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId,
            provider: 'CAF',
            validationType: 'Screening Internacional — PEPs + Sanctions + Interpol',
            endpoint: '/v1/transactions (pjKycComplianceOwners / pfKycComplianceOwners)',
            resultData: { results, flags: allFlags },
            score: allFlags.some(f => /SANCTIONS|INTERPOL/.test(f.type)) ? 0 : allFlags.length > 0 ? 25 : 100,
            status: allFlags.length > 0 ? 'Pendente' : 'Sucesso',
            timestamp: new Date().toISOString(),
            responseTime: durationMs,
          });
        } catch (e) { console.warn('[Screening] ExternalValidation error:', e.message); }
      }

      if (flagStrings.length > 0) {
        try {
          const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
          if (cases[0]) {
            const merged = [...new Set([...(cases[0].redFlags || []), ...flagStrings])];
            await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, { redFlags: merged });
          }
        } catch (e) { console.warn('[Screening] Case update error:', e.message); }
      }
    }

    const overallRisk = allFlags.some(f => /SANCTIONS|INTERPOL/.test(f.type)) ? 'CRITICAL'
      : allFlags.some(f => /PEP/.test(f.type)) ? 'HIGH'
      : allFlags.length > 0 ? 'MEDIUM' : 'OK';

    return Response.json({
      success: true,
      onboardingCaseId: onboardingCaseId || null,
      screening: {
        pjOwners: !!results.pjKycComplianceOwners,
        pfCompliance: !!results.pfKycComplianceOwners,
      },
      flags: allFlags,
      flagCount: allFlags.length,
      overallRisk,
      duration_ms: durationMs,
    });

  } catch (error) {
    console.error('[Screening] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});