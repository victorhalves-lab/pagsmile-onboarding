import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// DEPRECATED: Document upload is now handled natively via the CAF SDK flow.
// This function is kept for backward compatibility.

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        const { documentType, onboardingCaseId } = payload;

        if (!documentType || !onboardingCaseId) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log(`[CAF] Legacy document upload for Case ${onboardingCaseId}, DocType: ${documentType}`);

        // Log the integration call
        const logEntry = {
            onboarding_case_id: onboardingCaseId,
            provider: "CAF",
            service_type: "document_ocr",
            request_id: `legacy_${Date.now()}`,
            status: "success",
            result_status: "PENDING_REVIEW",
            duration_ms: 0,
            request_payload: { documentType },
        };

        await base44.asServiceRole.entities.IntegrationLog.create(logEntry);

        return Response.json({
            id: logEntry.request_id,
            status: "PROCESSING",
            message: "Document received. Use the new CAF native flow for better results.",
        });

    } catch (error) {
        console.error("[CAF] Error uploading document:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});