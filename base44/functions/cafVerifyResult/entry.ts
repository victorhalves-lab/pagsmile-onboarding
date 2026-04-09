import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { transactionId, onboardingCaseId } = await req.json();

    if (!transactionId) {
      return Response.json({ error: 'transactionId is required' }, { status: 400 });
    }

    const CAF_CLIENT_ID = Deno.env.get('CAF_CLIENT_ID');
    const CAF_CLIENT_SECRET = Deno.env.get('CAF_CLIENT_SECRET');

    if (!CAF_CLIENT_ID || !CAF_CLIENT_SECRET) {
      return Response.json({ error: 'CAF credentials not configured' }, { status: 500 });
    }

    // Step 1: Authenticate
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
      return Response.json({ error: 'CAF authentication failed' }, { status: 502 });
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Step 2: Get transaction result
    const resultResponse = await fetch(
      `https://api.us.prd.caf.io/v1/transactions/${transactionId}?_includeExecutionDetails=true`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!resultResponse.ok) {
      const errText = await resultResponse.text();
      console.error('[CAF] Transaction result fetch failed:', resultResponse.status, errText);
      return Response.json({ error: 'Failed to fetch transaction result', details: errText }, { status: 502 });
    }

    const result = await resultResponse.json();
    console.log('[CAF] Transaction result:', result.id, 'status:', result.status);

    // Normalize status
    const status = (result.status || '').toUpperCase();
    const isApproved = status === 'APPROVED';
    const isPending = ['PENDING', 'PROCESSING', 'IN_PROGRESS'].includes(status);

    // Step 3: Log integration result
    if (onboardingCaseId) {
      await base44.asServiceRole.entities.IntegrationLog.create({
        onboarding_case_id: onboardingCaseId,
        provider: 'CAF',
        service_type: 'identity_verification',
        request_id: transactionId,
        status: isApproved ? 'success' : isPending ? 'pending' : 'failed',
        result_status: status,
        response_payload: {
          transactionId: result.id,
          status: result.status,
          services: result.services,
          data: result.data,
        },
      });

      // Update OnboardingCase CAF status
      if (isApproved) {
        await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, {
          cafCompleted: true,
        });
      }
    }

    return Response.json({
      transactionId: result.id,
      status: result.status,
      approved: isApproved,
      pending: isPending,
      data: result.data || {},
      services: result.services || [],
    });

  } catch (error) {
    console.error('[CAF] Error verifying result:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});