import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafLogSdkEvent — Registra eventos ENGAJAMENTO do SDK CAF (abertura/abandono),
 * distintos de falhas técnicas (que são logadas via cafLogSdkError).
 *
 * Eventos suportados:
 *  - 'sdk_opened'     → cliente iniciou a captura (incrementa contador de abertura)
 *  - 'sdk_abandoned'  → cliente fechou a aba/janela sem capturar nada (beforeunload)
 *
 * Por que separar de cafLogSdkError?
 *  - Falha TÉCNICA (error) = cliente TENTOU e o SDK reprovou/errou. Conta como tentativa.
 *  - ABANDONO (este) = cliente abriu e saiu sem tentar. NÃO conta como tentativa.
 *  - Queremos distinguir estes perfis nos cards de compliance para o analista avaliar engajamento.
 *
 * Público (sem auth) — autenticado via docLinkToken do OnboardingCase.
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
      eventType,     // 'sdk_opened' | 'sdk_abandoned'
      stage,         // phase do SDK quando o evento ocorreu
      attemptNumber, // n° da abertura
      extraContext,
    } = body;

    if (!onboardingCaseId) {
      return Response.json({ error: 'onboardingCaseId required' }, { status: 400 });
    }
    if (!['sdk_opened', 'sdk_abandoned'].includes(eventType)) {
      return Response.json({ error: 'Invalid eventType' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Auth via docLinkToken (mesma regra das demais funções públicas CAF)
    const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
    const theCase = cases[0];
    if (!theCase) return Response.json({ error: 'Case not found' }, { status: 404 });
    if (theCase.docLinkToken && docLinkToken && theCase.docLinkToken !== docLinkToken) {
      return Response.json({ error: 'Invalid token' }, { status: 403 });
    }

    const redFlags = [];
    if (eventType === 'sdk_abandoned') {
      redFlags.push('CAF_SDK_ABANDONED');
    } else {
      redFlags.push('CAF_SDK_OPENED');
    }

    await base44.asServiceRole.entities.IntegrationLog.create({
      onboarding_case_id: onboardingCaseId,
      provider: 'CAF',
      service_type: 'onboarding_web', // evento de engajamento do fluxo web
      status: eventType === 'sdk_abandoned' ? 'cancelled' : 'processing',
      result_status: 'NOT_APPLICABLE',
      red_flags: redFlags,
      request_payload: {
        eventType,
        stage: stage || 'unknown',
        attemptNumber: attemptNumber || 1,
        clientReportedEvent: true,
      },
      response_payload: {
        eventType,
        extraContext: extraContext || null,
        triggeredAt: new Date().toISOString(),
      },
      duration_ms: 0,
    });

    return Response.json({ success: true, logged: true, eventType });
  } catch (error) {
    console.error('[cafLogSdkEvent] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});