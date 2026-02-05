import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        const { selfieUrl, documentUrl, onboardingCaseId } = payload;
        
        console.log(`[BDC] Comparing Selfie vs Document`);

        // Endpoint: /app/biometria-facial (Comparação 1:1)
        
        await new Promise(resolve => setTimeout(resolve, 3000));

        const mockResponse = {
            match: true,
            similarity_score: 98.5,
            confidence: "HIGH"
        };

        await base44.asServiceRole.entities.IntegrationLog.create({
            onboarding_case_id: onboardingCaseId,
            provider: "BigDataCorp",
            service_type: "biometria_facial",
            request_id: `bdc_face_${Date.now()}`,
            status: "success",
            result_status: "APPROVED",
            score: mockResponse.similarity_score,
            duration_ms: 3000,
            response_payload: mockResponse
        });

        return Response.json(mockResponse);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});