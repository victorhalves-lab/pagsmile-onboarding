import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BDC_BASE_URL = 'https://plataforma.bigdatacorp.com.br';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { cpf, datasets } = await req.json();

    if (!cpf) {
      return Response.json({ error: 'CPF é obrigatório' }, { status: 400 });
    }

    // Clean CPF - remove formatting
    const cleanCpf = cpf.replace(/[^\d]/g, '');

    // Default datasets for person KYC
    const requestedDatasets = datasets || 'kyc';

    const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
    const tokenId = Deno.env.get('BDC_TOKEN_ID');

    if (!accessToken || !tokenId) {
      return Response.json({ error: 'BDC tokens not configured' }, { status: 500 });
    }

    const response = await fetch(`${BDC_BASE_URL}/pessoas`, {
      method: 'POST',
      headers: {
        'AccessToken': accessToken,
        'TokenId': tokenId,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Datasets: requestedDatasets,
        q: `doc{${cleanCpf}}`,
        Limit: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('BDC Person API Error:', response.status, errorText);
      return Response.json({ 
        error: `BDC API returned ${response.status}`, 
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();

    return Response.json({
      success: true,
      queryId: data.QueryId,
      elapsedMs: data.ElapsedMilliseconds,
      queryDate: data.QueryDate,
      status: data.Status,
      result: data.Result?.[0] || null,
      evidences: data.Evidences,
    });

  } catch (error) {
    console.error('BDC Person Query Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});