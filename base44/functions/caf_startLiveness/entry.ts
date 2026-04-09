import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// DEPRECATED: Use cafGenerateToken instead for the new native CAF flow.
// This function is kept for backward compatibility with older flows.

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        const { onboardingCaseId, partnerEmail } = payload;

        console.log(`[CAF] Legacy liveness endpoint called for Case ${onboardingCaseId}`);

        // Forward to the new cafGenerateToken flow
        const result = await base44.functions.invoke('cafGenerateToken', {
            personName: '',
            personCpf: '',
        });

        await base44.asServiceRole.entities.IntegrationLog.create({
            onboarding_case_id: onboardingCaseId,
            provider: "CAF",
            service_type: "liveness",
            request_id: result.data?.transactionId || 'unknown',
            status: "success",
            result_status: "PENDING_REVIEW",
            duration_ms: 0,
            response_payload: result.data
        });

        return Response.json({
            sessionId: result.data?.transactionId,
            transactionId: result.data?.transactionId,
            mobileToken: result.data?.mobileToken,
        });

    } catch (error) {
        console.error("[CAF] Error starting liveness:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});