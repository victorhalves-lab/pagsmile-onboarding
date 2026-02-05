import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        
        console.log(`[BDC] Starting Liveness Process`);
        
        // A BDC usa SDK, geralmente o backend gera um token de acesso para o SDK

        await new Promise(resolve => setTimeout(resolve, 500));

        const mockResponse = {
            token: `bdc_sdk_token_${crypto.randomUUID()}`,
            config: {
                type: "liveness",
                instructions: "Position your face within the oval"
            }
        };

        return Response.json(mockResponse);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});