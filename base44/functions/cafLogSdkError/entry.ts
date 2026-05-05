import { createClientFromRequest, createClient } from 'npm:@base44/sdk@0.8.25';

/**
 * cafLogSdkError — Registra TODO erro do SDK CAF (frontend) no IntegrationLog.
 * 
 * Permite monitorar:
 *  - Quais errors CAF são mais frequentes (CafFaceAuthenticationError, CafFaceLivenessError, etc)
 *  - Qual stage falhou (liveness, document_front, document_back)
 *  - Correlação token type × erro × taxa de sucesso
 * 
 * Uso (frontend):
 *   await base44.functions.invoke('cafLogSdkError', {
 *     onboardingCaseId,
 *     docLinkToken,
 *     stage: 'liveness',
 *     errorName: 'CafFaceAuthenticationError',
 *     errorMessage: 'Face picture match',
 *     attemptNumber: 2,
 *     tokenType: 'session' | 'fallback',
 *   });
 */

Deno.serve(async (req) => {
  try {
    // ── PUBLIC ENDPOINT ──
    // The onboarding flow runs unauthenticated. createClientFromRequest crashes with 401
    // for anonymous users (it tries to fetch /users/me to validate the bearer token,
    // which doesn't exist). We only need asServiceRole here, so use createClient
    // with requiresAuth:false and fall back to createClientFromRequest only if it
    // succeeds (so authenticated admin testing still works).
    let base44;
    try {
      base44 = createClientFromRequest(req);
    } catch {
      base44 = createClient({
        appId: Deno.env.get('BASE44_APP_ID'),
        requiresAuth: false,
      });
    }
    const body = await req.json();
    const { 
      onboardingCaseId, 
      docLinkToken,
      stage,          // 'liveness' | 'document_front' | 'document_back' | 'init'
      errorName,      // nome do erro do SDK CAF
      errorMessage,   // mensagem do erro
      attemptNumber,
      tokenType,      // 'session' | 'fallback' | 'unknown'
      extraContext,
    } = body;

    if (!onboardingCaseId) {
      return Response.json({ error: 'onboardingCaseId required' }, { status: 400 });
    }

    // Auth
    const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
    const theCase = cases[0];
    if (!theCase) return Response.json({ error: 'Case not found' }, { status: 404 });
    if (theCase.docLinkToken && theCase.docLinkToken !== docLinkToken) {
      return Response.json({ error: 'Invalid token' }, { status: 403 });
    }

    // Mapeia stage → service_type (usa valores existentes no enum)
    const serviceTypeMap = {
      'liveness': 'face_liveness',
      'document_front': 'document_detector_front',
      'document_back': 'document_detector_back',
      'init': 'sdk_token_generation',
    };

    const redFlags = [];
    if (errorName) redFlags.push(`CAF_SDK_ERROR_${errorName}`);
    if (tokenType === 'fallback') redFlags.push('CAF_TOKEN_FALLBACK');

    await base44.asServiceRole.entities.IntegrationLog.create({
      onboarding_case_id: onboardingCaseId,
      provider: 'CAF',
      service_type: serviceTypeMap[stage] || 'face_liveness',
      status: 'failed',
      result_status: 'REPROVED',
      error_message: errorMessage || null,
      error_code: errorName || null,
      red_flags: redFlags,
      request_payload: { stage, attemptNumber, tokenType, clientReportedError: true },
      response_payload: { errorName, errorMessage, extraContext: extraContext || null },
      duration_ms: 0,
    });

    return Response.json({ success: true, logged: true });
  } catch (error) {
    console.error('[cafLogSdkError] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});