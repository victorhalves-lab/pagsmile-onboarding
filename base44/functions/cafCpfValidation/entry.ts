import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafCpfValidation — Cross-check CPF via Core API vs BDC
 * Auth: CAF_CLIENT_SECRET as static Bearer token
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

function getCafToken() {
  const token = Deno.env.get('CAF_CORE_API_TOKEN');
  if (!token) throw new Error('CAF_CORE_API_TOKEN not configured');
  return token;
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { cpf, onboardingCaseId } = body;

    if (!cpf) return Response.json({ error: 'CPF é obrigatório' }, { status: 400 });
    const cleanCpf = cpf.replace(/\D/g, '');

    const authToken = getCafToken();

    const cafResponse = await fetch(`${CAF_API_BASE}/v1/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template: { services: ['pfBasicData'] },
        parameters: { cpf: cleanCpf },
      }),
    });

    const cafText = await cafResponse.text();
    let cafResult;
    try { cafResult = JSON.parse(cafText); } catch { cafResult = { raw: cafText.substring(0, 500) }; }

    console.log('[CPF-Validation] CAF HTTP:', cafResponse.status);

    const cafSection = cafResult?.sections?.pfBasicData || cafResult?.sections?.pf_basic_data || {};
    const cafName = (cafSection.name || cafSection.nome || cafSection.fullName || '').toUpperCase().trim();
    const cafBirth = cafSection.birthDate || cafSection.dataNascimento || '';
    const cafMother = (cafSection.motherName || cafSection.nomeMae || '').toUpperCase().trim();
    const cafFather = (cafSection.fatherName || cafSection.nomePai || '').toUpperCase().trim();
    const cafStatus = cafSection.status || cafSection.situacao || cafSection.cpfStatus || '';
    const cafDeath = cafSection.deathIndicator || cafSection.indicadorObito || cafSection.isDeceased || false;

    const crossCheckFlags = [];
    let bdcData = null;

    if (onboardingCaseId) {
      try {
        const validations = await base44.asServiceRole.entities.ExternalValidationResult.filter({
          onboardingCaseId,
          provider: 'BigDataCorp',
        });
        for (const v of validations) {
          const bd = v.resultData?.BasicData || v.resultData?.basic_data;
          if (bd) {
            bdcData = Array.isArray(bd) ? bd[0] : bd;
            break;
          }
        }
      } catch (e) {
        console.warn('[CPF-Validation] BDC data load error:', e.message);
      }

      if (bdcData && cafName) {
        const bdcName = (bdcData.Name || bdcData.PersonalName || bdcData.FullName || '').toUpperCase().trim();
        const bdcMother = (bdcData.MotherName || '').toUpperCase().trim();

        if (bdcName && cafName !== bdcName && !cafName.includes(bdcName) && !bdcName.includes(cafName)) {
          crossCheckFlags.push(`CPF_NAME_MISMATCH_CAF_VS_BDC: CAF="${cafName}" vs BDC="${bdcName}"`);
        }
        if (cafMother && bdcMother && cafMother !== bdcMother && !cafMother.includes(bdcMother) && !bdcMother.includes(cafMother)) {
          crossCheckFlags.push(`CPF_MOTHER_MISMATCH_CAF_VS_BDC: CAF="${cafMother}" vs BDC="${bdcMother}"`);
        }
      }

      if (cafDeath === true) {
        crossCheckFlags.push('CPF_DEATH_INDICATOR_ACTIVE');
      }
      if (cafStatus && !String(cafStatus).toUpperCase().includes('REGULAR') && cafStatus !== '') {
        crossCheckFlags.push(`CPF_STATUS_IRREGULAR: ${cafStatus}`);
      }
    }

    const durationMs = Date.now() - startTime;

    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          provider: 'CAF',
          service_type: 'cpf_cross_validation',
          transaction_id: cafResult?.uuid || '',
          status: cafResponse.ok ? 'success' : 'failed',
          result_status: crossCheckFlags.length > 0 ? 'PENDING_REVIEW' : 'APPROVED',
          request_payload: { cpf: `***${cleanCpf.slice(-4)}` },
          response_payload: { name: cafName, status: cafStatus, deathIndicator: cafDeath, crossCheckFlags },
          red_flags: crossCheckFlags,
          duration_ms: durationMs,
        });
      } catch (e) { console.warn('[CPF-Validation] Log error:', e.message); }

      try {
        await base44.asServiceRole.entities.ExternalValidationResult.create({
          onboardingCaseId,
          provider: 'CAF',
          validationType: 'CPF Cross-Validation — CAF vs BDC',
          endpoint: '/v1/transactions (pfBasicData)',
          resultData: {
            cafData: { name: cafName, birthDate: cafBirth, motherName: cafMother, fatherName: cafFather, status: cafStatus, deathIndicator: cafDeath },
            bdcData: bdcData ? { name: bdcData.Name || bdcData.PersonalName, motherName: bdcData.MotherName } : null,
            crossCheckFlags,
          },
          score: crossCheckFlags.length === 0 ? 100 : Math.max(0, 100 - crossCheckFlags.length * 25),
          status: crossCheckFlags.length > 0 ? 'Pendente' : 'Sucesso',
          timestamp: new Date().toISOString(),
          responseTime: durationMs,
        });
      } catch (e) { console.warn('[CPF-Validation] ExternalValidation error:', e.message); }

      if (crossCheckFlags.length > 0) {
        try {
          const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
          if (cases[0]) {
            const merged = [...new Set([...(cases[0].redFlags || []), ...crossCheckFlags])];
            await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, { redFlags: merged });
          }
        } catch (e) { console.warn('[CPF-Validation] Case update error:', e.message); }
      }
    }

    return Response.json({
      success: true,
      cpf: `***${cleanCpf.slice(-4)}`,
      cafData: { name: cafName, birthDate: cafBirth, motherName: cafMother, fatherName: cafFather, status: cafStatus, deathIndicator: cafDeath },
      crossCheckFlags,
      riskLevel: crossCheckFlags.length === 0 ? 'OK' : crossCheckFlags.some(f => /DEATH|IRREGULAR/.test(f)) ? 'CRITICAL' : 'HIGH',
      duration_ms: durationMs,
    });

  } catch (error) {
    console.error('[CPF-Validation] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});