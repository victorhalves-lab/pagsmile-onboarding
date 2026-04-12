import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { encodeBase64 } from 'https://deno.land/std@0.220.0/encoding/base64.ts';

/**
 * Generates a CAF Mobile Token (Session Token) for the Web SDKs.
 * 
 * Flow per CAF docs:
 * 1. Sign a JWT with client_id (iss) + client_secret (HMAC-SHA256)
 * 2. Exchange JWT for sessionToken via GET /bff/session-tokens
 * 3. Return sessionToken to frontend for SDK initialization
 */

function base64UrlEncode(data) {
  const b64 = encodeBase64(data);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createSignedJwt(clientId, clientSecret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));

  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: clientId, exp: now + 900 }; // FIX C03: 15 min to cover full flow (doc + liveness)
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));

  const signingInput = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(clientSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { personCpf, onboardingCaseId } = body;

    const CAF_CLIENT_ID = Deno.env.get('CAF_CLIENT_ID');
    const CAF_CLIENT_SECRET = Deno.env.get('CAF_CLIENT_SECRET');

    if (!CAF_CLIENT_ID || !CAF_CLIENT_SECRET) {
      return Response.json({ error: 'CAF credentials not configured' }, { status: 500 });
    }

    // Step 1: Create signed JWT (Authentication Token)
    const authToken = await createSignedJwt(CAF_CLIENT_ID, CAF_CLIENT_SECRET);
    console.log('[CAF] JWT created for client:', CAF_CLIENT_ID);

    // Step 2: Exchange JWT for Mobile Token (Session Token)
    const sessionResponse = await fetch('https://web.us.prd.caf.io/bff/session-tokens', {
      method: 'GET',
      headers: { 'Authorization': authToken },
    });

    if (!sessionResponse.ok) {
      const errText = await sessionResponse.text();
      console.error('[CAF] Session token exchange failed:', sessionResponse.status, errText);
      return Response.json({ 
        error: 'CAF session token exchange failed', 
        status: sessionResponse.status, 
        details: errText 
      }, { status: 502 });
    }

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData.sessionToken;
    console.log('[CAF] Session token obtained, requestId:', sessionData.requestId);

    const personId = personCpf ? personCpf.replace(/\D/g, '') : `person_${Date.now()}`;

    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          provider: 'CAF',
          service_type: 'sdk_token_generation',
          request_id: sessionData.requestId || '',
          status: 'success',
          response_payload: { requestId: sessionData.requestId, personId },
        });
      } catch (logErr) {
        console.warn('[CAF] Failed to log token generation:', logErr.message);
      }
    }

    return Response.json({
      sdkToken: sessionToken,
      personId: personId,
      requestId: sessionData.requestId,
    });

  } catch (error) {
    console.error('[CAF] Error generating token:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});