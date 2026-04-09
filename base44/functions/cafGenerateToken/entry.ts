import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { personName, personCpf, templateId } = await req.json();

    const CAF_CLIENT_ID = Deno.env.get('CAF_CLIENT_ID');
    const CAF_CLIENT_SECRET = Deno.env.get('CAF_CLIENT_SECRET');

    if (!CAF_CLIENT_ID || !CAF_CLIENT_SECRET) {
      return Response.json({ error: 'CAF credentials not configured' }, { status: 500 });
    }

    // Step 1: Authenticate with CAF (OAuth2 - form-urlencoded)
    const authBody = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CAF_CLIENT_ID,
      client_secret: CAF_CLIENT_SECRET,
    });

    const authResponse = await fetch('https://api.us.prd.caf.io/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: authBody.toString(),
    });

    if (!authResponse.ok) {
      const errText = await authResponse.text();
      console.error('[CAF] Auth failed:', authResponse.status, errText);
      return Response.json({ error: 'CAF authentication failed', status: authResponse.status, details: errText }, { status: 502 });
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    console.log('[CAF] Auth successful, token type:', authData.token_type);

    // Step 2: Create a transaction
    const txnBody = {
      templateId: templateId || 'default',
      attributes: {},
    };

    if (personCpf) txnBody.attributes.cpf = personCpf.replace(/\D/g, '');
    if (personName) txnBody.attributes.name = personName;

    const txnResponse = await fetch('https://api.us.prd.caf.io/v1/transactions?origin=TRUST', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(txnBody),
    });

    if (!txnResponse.ok) {
      const errText = await txnResponse.text();
      console.error('[CAF] Transaction creation failed:', txnResponse.status, errText);
      return Response.json({ error: 'CAF transaction creation failed', status: txnResponse.status, details: errText }, { status: 502 });
    }

    const txnData = await txnResponse.json();
    console.log('[CAF] Transaction created:', txnData.id, 'requestId:', txnData.requestId);

    return Response.json({
      transactionId: txnData.id,
      requestId: txnData.requestId,
      accessToken: accessToken,
    });

  } catch (error) {
    console.error('[CAF] Error generating token:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});