import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BDC_BASE_URL = 'https://plataforma.bigdatacorp.com.br';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { cnpj, datasets } = await req.json();

    if (!cnpj) {
      return Response.json({ error: 'CNPJ é obrigatório' }, { status: 400 });
    }

    // Clean CNPJ - remove formatting
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');

    // Default datasets for a comprehensive company query
    const requestedDatasets = datasets || 'registration_data';

    const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
    const tokenId = Deno.env.get('BDC_TOKEN_ID');

    if (!accessToken || !tokenId) {
      return Response.json({ error: 'BDC tokens not configured' }, { status: 500 });
    }

    const response = await fetch(`${BDC_BASE_URL}/empresas`, {
      method: 'POST',
      headers: {
        'AccessToken': accessToken,
        'TokenId': tokenId,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Datasets: requestedDatasets,
        q: `doc{${cleanCnpj}}`,
        Limit: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('BDC API Error:', response.status, errorText);
      return Response.json({ 
        error: `BDC API returned ${response.status}`, 
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();

    // Check for API-level errors in Status
    if (data.Status) {
      const datasetStatuses = Object.entries(data.Status);
      const errors = datasetStatuses.filter(([_, statuses]) => 
        Array.isArray(statuses) && statuses.some(s => s.Code !== 0)
      );
      if (errors.length > 0) {
        console.warn('BDC Dataset errors:', JSON.stringify(errors));
      }
    }

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
    console.error('BDC Query Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});