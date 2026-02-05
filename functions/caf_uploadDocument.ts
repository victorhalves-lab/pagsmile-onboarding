import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Em um cenário real, validaríamos o usuário aqui
        // const user = await base44.auth.me();
        
        const payload = await req.json();
        const { file, documentType, onboardingCaseId } = payload;

        if (!file || !documentType || !onboardingCaseId) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log(`[CAF] Starting document upload for Case ${onboardingCaseId}, DocType: ${documentType}`);

        // Simulação de chamada à API da CAF
        // Endpoint real seria algo como: POST https://api.combateafraude.com/v1/documents
        
        // Simulando delay de rede
        await new Promise(resolve => setTimeout(resolve, 1500));

        const mockResponse = {
            id: `caf_doc_${Date.now()}`,
            status: "PROCESSING",
            message: "Document received successfully and is being analyzed.",
            trackingId: crypto.randomUUID()
        };

        // Log da integração
        await base44.asServiceRole.entities.IntegrationLog.create({
            onboarding_case_id: onboardingCaseId,
            provider: "CAF",
            service_type: "document_ocr",
            request_id: mockResponse.id,
            status: "success", // Status da CHAMADA, não da análise
            result_status: "PENDING_REVIEW",
            duration_ms: 1500,
            request_payload: { documentType },
            response_payload: mockResponse
        });

        // Atualizar status do documento no banco
        // await base44.asServiceRole.entities.DocumentUpload.update(...)

        return Response.json(mockResponse);

    } catch (error) {
        console.error("[CAF] Error uploading document:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});