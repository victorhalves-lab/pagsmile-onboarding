import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafCheckProfile — ITEM 5: Consulta perfil consolidado CAF antes do pipeline
 *
 * Verifica se o CPF/CNPJ já foi processado pela CAF anteriormente.
 * Detecta:
 *   - Perfis previamente REPROVED (red flag imediata)
 *   - Reuso de identidade entre merchants diferentes
 *   - Histórico de transações anteriores
 *
 * Chamado automaticamente pelo autoEnrichOnboarding (Step 0.5)
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

function getCafToken() {
  const token = Deno.env.get('CAF_CLIENT_SECRET');
  if (!token) throw new Error('CAF_CLIENT_SECRET not configured');
  return token;
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);

    // Auth: allow admin users AND service-role pipeline calls
    let isAuth = false;
    try { const u = await base44.auth.me(); if (u?.role === 'admin') isAuth = true; } catch {}
    if (!isAuth) { try { await base44.asServiceRole.entities.OnboardingCase.list('-created_date', 1); isAuth = true; } catch {} }
    if (!isAuth) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { cpf, cnpj, onboardingCaseId } = body;

    if (!cpf && !cnpj) return Response.json({ error: 'CPF ou CNPJ é obrigatório' }, { status: 400 });

    const authToken = getCafToken();
    const isPJ = !!cnpj;
    const document = (cnpj || cpf).replace(/\D/g, '');

    // Fetch consolidated profile from CAF
    let url;
    if (isPJ) {
      url = `${CAF_API_BASE}/v1/companies/${document}?_includeOnboardingQsa=true`;
    } else {
      url = `${CAF_API_BASE}/v1/people/${document}`;
    }

    console.log(`[CAF-Profile] Checking ${isPJ ? 'PJ' : 'PF'}: ***${document.slice(-4)}`);

    const cafResponse = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    // 404 or 400 = never processed before / invalid doc — not an error, just no history
    if (cafResponse.status === 404 || cafResponse.status === 400) {
      console.log(`[CAF-Profile] No previous profile found for ***${document.slice(-4)}`);

      if (onboardingCaseId) {
        try {
          await base44.asServiceRole.entities.IntegrationLog.create({
            onboarding_case_id: onboardingCaseId,
            provider: 'CAF',
            service_type: isPJ ? 'kyb_business_identity' : 'empresas_kyc',
            status: 'success',
            result_status: 'NOT_APPLICABLE',
            request_payload: { document: `***${document.slice(-4)}`, type: isPJ ? 'PJ' : 'PF', action: 'profile_check' },
            response_payload: { profileExists: false },
            duration_ms: Date.now() - startTime,
          });
        } catch { /* */ }
      }

      return Response.json({
        success: true,
        profileExists: false,
        type: isPJ ? 'PJ' : 'PF',
        redFlags: [],
        duration_ms: Date.now() - startTime,
      });
    }

    if (!cafResponse.ok) {
      console.warn(`[CAF-Profile] HTTP ${cafResponse.status}`);
      return Response.json({ success: false, error: `CAF HTTP ${cafResponse.status}` }, { status: 502 });
    }

    const cafText = await cafResponse.text();
    let cafResult;
    try { cafResult = JSON.parse(cafText); } catch { cafResult = null; }

    if (!cafResult) {
      return Response.json({ success: false, error: 'Invalid CAF response' }, { status: 502 });
    }

    const durationMs = Date.now() - startTime;
    const profileStatus = cafResult.status || 'UNKNOWN';
    const executions = cafResult.executions || [];
    const qsa = cafResult.qsa || null;
    const basicData = cafResult.basicData || null;
    const sources = cafResult.sources || {};

    // Analyze profile for red flags
    const redFlags = [];

    // Flag 1: Previously REPROVED profile
    if (profileStatus === 'REPROVED') {
      redFlags.push(`CAF_PROFILE_PREVIOUSLY_REPROVED: Perfil ${isPJ ? 'PJ' : 'PF'} foi REPROVADO anteriormente na CAF`);
    }

    // Flag 2: Multiple executions with mixed results (inconsistency)
    const approvedCount = executions.filter(e => e.status === 'APPROVED').length;
    const reprovedCount = executions.filter(e => e.status === 'REPROVED').length;
    if (approvedCount > 0 && reprovedCount > 0) {
      redFlags.push(`CAF_MIXED_HISTORY: ${approvedCount} aprovações e ${reprovedCount} reprovações anteriores — histórico inconsistente`);
    }

    // Flag 3: High number of executions (possible fraud attempt pattern)
    if (executions.length > 5) {
      redFlags.push(`CAF_HIGH_EXECUTION_COUNT: ${executions.length} transações anteriores para este documento — padrão atípico`);
    }

    // Flag 4: Recent reproval (last 90 days)
    const recentReprovals = executions.filter(e => {
      if (e.status !== 'REPROVED') return false;
      const execDate = new Date(e.createdAt || e.updatedAt || 0);
      return (Date.now() - execDate.getTime()) < 90 * 24 * 3600000;
    });
    if (recentReprovals.length > 0) {
      redFlags.push(`CAF_RECENT_REPROVAL: ${recentReprovals.length} reprovação(ões) nos últimos 90 dias`);
    }

    console.log(`[CAF-Profile] Profile: status=${profileStatus}, executions=${executions.length}, flags=${redFlags.length}`);

    // Save results
    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          provider: 'CAF',
          service_type: isPJ ? 'kyb_business_identity' : 'empresas_kyc',
          status: 'success',
          result_status: profileStatus === 'APPROVED' ? 'APPROVED' : profileStatus === 'REPROVED' ? 'REPROVED' : 'PENDING_REVIEW',
          request_payload: { document: `***${document.slice(-4)}`, type: isPJ ? 'PJ' : 'PF', action: 'profile_check' },
          response_payload: {
            profileStatus,
            executionsCount: executions.length,
            sourcesCount: Object.keys(sources).length,
            qsaCount: qsa?.items?.length || 0,
            redFlagsCount: redFlags.length,
          },
          red_flags: redFlags,
          duration_ms: durationMs,
        });
      } catch (e) { console.warn('[CAF-Profile] Log error:', e.message); }

      try {
        await base44.asServiceRole.entities.ExternalValidationResult.create({
          onboardingCaseId,
          provider: 'CAF',
          validationType: `Profile Check — ${isPJ ? 'PJ' : 'PF'} (${profileStatus})`,
          endpoint: isPJ ? `/v1/companies/${document}` : `/v1/people/${document}`,
          resultData: {
            profileStatus,
            basicData,
            executionsCount: executions.length,
            recentExecutions: executions.slice(0, 5).map(e => ({
              id: e.id, status: e.status, createdAt: e.createdAt,
            })),
            qsaCount: qsa?.items?.length || 0,
            sourcesCount: Object.keys(sources).length,
          },
          score: profileStatus === 'APPROVED' ? 100 : profileStatus === 'REPROVED' ? 0 : 50,
          status: profileStatus === 'APPROVED' ? 'Sucesso' : profileStatus === 'REPROVED' ? 'Falha' : 'Pendente',
          timestamp: new Date().toISOString(),
          responseTime: durationMs,
        });
      } catch (e) { console.warn('[CAF-Profile] ExternalValidation error:', e.message); }

      // Update case red flags
      if (redFlags.length > 0) {
        try {
          const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
          if (cases[0]) {
            const merged = [...new Set([...(cases[0].redFlags || []), ...redFlags])];
            await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, { redFlags: merged });
          }
        } catch (e) { console.warn('[CAF-Profile] Case update error:', e.message); }
      }
    }

    return Response.json({
      success: true,
      profileExists: true,
      type: isPJ ? 'PJ' : 'PF',
      profileStatus,
      executionsCount: executions.length,
      basicData,
      qsaCount: qsa?.items?.length || 0,
      redFlags,
      flagCount: redFlags.length,
      duration_ms: durationMs,
    });

  } catch (error) {
    console.error('[CAF-Profile] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});