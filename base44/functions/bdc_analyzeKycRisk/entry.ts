import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        const { cnpj, partners } = payload;

        console.log(`[BDC] Analyzing KYC Risk for CNPJ ${cnpj}`);

        // Endpoints reais:
        // /empresas/kyc
        // /empresas/owners_kyc
        
        await new Promise(resolve => setTimeout(resolve, 2500));

        const mockResponse = {
            company_risk: {
                score: 85, // 0-100, onde 100 é melhor/menos risco ou o inverso dependendo do provedor (assumindo score positivo aqui)
                level: "LOW",
                red_flags: []
            },
            partners_risk: partners ? partners.map(p => ({
                cpf: p.cpf,
                name: p.name,
                is_pep: false,
                has_media_adverse: false,
                score: 90
            })) : []
        };

        await base44.asServiceRole.entities.IntegrationLog.create({
            provider: "BigDataCorp",
            service_type: "empresas_kyc",
            request_id: `bdc_kyc_${Date.now()}`,
            status: "success",
            result_status: "APPROVED", // Mapeado do score
            duration_ms: 2500,
            score: mockResponse.company_risk.score,
            response_payload: mockResponse
        });

        return Response.json(mockResponse);

    } catch (error) {
        console.error("[BDC] Error analyzing KYC:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});