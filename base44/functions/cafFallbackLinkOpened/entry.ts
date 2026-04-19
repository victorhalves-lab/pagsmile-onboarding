import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafFallbackLinkOpened — Registra que o cliente abriu o link de Onboarding CAF
 * (cadastro.io) como fallback depois de falhar no SDK embarcado.
 *
 * Chamado pelo frontend quando o cliente clica no botão "Fazer direto no onboarding
 * oficial CAF" que aparece após a 2ª falha no Liveness/FaceMatch.
 *
 * Público (sem auth) — autenticado via docLinkToken do OnboardingCase.
 *
 * Rastreio:
 *   - IntegrationLog { service_type: 'caf_fallback_link_opened' }
 *   - ExternalValidationResult (para aparecer no painel de análise do caso)
 */
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    const body = await req.json().catch(() => ({}));
    const {
      onboardingCaseId,
      docLinkToken,
      complianceModel,
      fallbackUrl,
      attemptCount,
      errorName,
      errorMessage,
    } = body;

    if (!onboardingCaseId) {
      return Response.json({ error: 'onboardingCaseId required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Validate docLinkToken matches the case (prevents anonymous spam)
    if (docLinkToken) {
      const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
      const c = cases[0];
      if (!c || c.docLinkToken !== docLinkToken) {
        return Response.json({ error: 'Invalid docLinkToken' }, { status: 403 });
      }
    }

    const now = new Date().toISOString();

    // Log completo em IntegrationLog
    try {
      await base44.asServiceRole.entities.IntegrationLog.create({
        onboarding_case_id: onboardingCaseId,
        provider: 'CAF',
        service_type: 'caf_fallback_link_opened',
        status: 'success',
        request_payload: {
          complianceModel: complianceModel || '',
          fallbackUrl: fallbackUrl || '',
          attemptCount: attemptCount || 1,
          errorName: errorName || '',
          errorMessage: errorMessage || '',
          triggeredAt: now,
        },
        response_payload: { acknowledged: true },
      });
    } catch (e) {
      console.warn('[CAF-FallbackLink] IntegrationLog error:', e.message);
    }

    // Aparece também no painel de análise do caso
    try {
      await base44.asServiceRole.entities.ExternalValidationResult.create({
        onboardingCaseId,
        provider: 'CAF',
        validationType: 'Fallback Link Aberto — Onboarding Web (cadastro.io)',
        endpoint: 'frontend/cafFallbackLink',
        resultData: {
          complianceModel: complianceModel || '',
          fallbackUrl: fallbackUrl || '',
          attemptCount: attemptCount || 1,
          errorName: errorName || '',
          errorMessage: errorMessage || '',
        },
        status: 'Pendente',
        timestamp: now,
      });
    } catch (e) {
      console.warn('[CAF-FallbackLink] ExternalValidationResult error:', e.message);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[CAF-FallbackLink] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});