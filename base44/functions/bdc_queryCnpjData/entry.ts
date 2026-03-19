import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        const { cnpj } = payload;

        if (!cnpj) {
            return Response.json({ error: 'CNPJ is required' }, { status: 400 });
        }

        console.log(`[BDC] Querying Data for CNPJ ${cnpj}`);

        // Endpoints reais: 
        // /empresas/basic_data
        // /empresas/addresses_extended
        // /empresas/merchant_category_data
        
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock Data baseado na estrutura da BigDataCorp
        const mockResponse = {
            basic_data: {
                tax_id: cnpj,
                legal_name: "EMPRESA EXEMPLO LTDA",
                trade_name: "EXEMPLO TECNOLOGIA",
                status: "ACTIVE",
                foundation_date: "2020-01-15"
            },
            address: {
                street: "AVENIDA PAULISTA",
                number: "1000",
                complement: "CJ 101",
                neighborhood: "BELA VISTA",
                city: "SAO PAULO",
                state: "SP",
                zip_code: "01310-100"
            },
            mcc: {
                code: "7372",
                description: "Computer Programming, Data Processing, and Integrated Systems Design Services"
            },
            domains: ["exemplo.com.br"]
        };

        // Log genérico, sem case ID atrelado necessariamente (pode ser pré-onboarding)
        await base44.asServiceRole.entities.IntegrationLog.create({
            provider: "BigDataCorp",
            service_type: "empresas_basic_data", // Simplificado
            request_id: `bdc_req_${Date.now()}`,
            status: "success",
            result_status: "APPROVED",
            duration_ms: 2000,
            request_payload: { cnpj },
            response_payload: mockResponse
        });

        return Response.json(mockResponse);

    } catch (error) {
        console.error("[BDC] Error querying CNPJ:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});