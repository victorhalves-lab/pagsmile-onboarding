import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        const { onboardingCaseId, partnerEmail } = payload;

        console.log(`[CAF] Starting Liveness Session for Case ${onboardingCaseId}`);

        // Endpoint real: POST https://api.combateafraude.com/v1/liveness/sessions
        // Necessário token de API

        await new Promise(resolve => setTimeout(resolve, 800));

        const mockResponse = {
            sessionId: `caf_session_${crypto.randomUUID()}`,
            webUrl: `https://liveness.caf.io/verify?token=mock_token_${Date.now()}`,
            expiration: new Date(Date.now() + 3600000).toISOString()
        };

        await base44.asServiceRole.entities.IntegrationLog.create({
            onboarding_case_id: onboardingCaseId,
            provider: "CAF",
            service_type: "liveness",
            request_id: mockResponse.sessionId,
            status: "success",
            result_status: "PENDING_REVIEW",
            duration_ms: 800,
            response_payload: mockResponse
        });

        return Response.json(mockResponse);

    } catch (error) {
        console.error("[CAF] Error starting liveness:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});