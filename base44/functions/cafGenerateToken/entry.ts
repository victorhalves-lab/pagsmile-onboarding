import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafGenerateToken — Generates CAF SDK session tokens for Web SDK
 *
 * Uses CAF_CLIENT_ID + CAF_CLIENT_SECRET to authenticate with the CAF
 * authentication endpoint, then generates a session token for the Web SDK
 * (DocumentDetector + FaceLiveness).
 *
 * Flow:
 *   1. Authenticate with CAF → get bearer token
 *   2. Create a person (or reuse) in CAF with CPF
 *   3. Generate SDK session token for that person
 *   4. Return { sdkToken, personId } to the frontend
 */

const CAF_AUTH_URL = 'https://auth.caf.io/oauth/token';
const CAF_API_BASE = 'https://api.caf.io';

async function getCafAuthToken() {
  const clientId = Deno.env.get('CAF_CLIENT_ID');
  const clientSecret = Deno.env.get('CAF_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('CAF_CLIENT_ID e/ou CAF_CLIENT_SECRET não configurados');
  }

  // Try multiple auth strategies since CAF has different auth endpoints
  // Strategy 1: OAuth2 client_credentials
  try {
    const authRes = await fetch(CAF_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });
    
    if (authRes.ok) {
      const authData = await authRes.json();
      if (authData.access_token) {
        console.log('[CAF-Token] OAuth2 auth successful');
        return authData.access_token;
      }
    }
    console.log('[CAF-Token] OAuth2 auth failed, status:', authRes.status);
  } catch (e) {
    console.log('[CAF-Token] OAuth2 auth error:', e.message);
  }

  // Strategy 2: Direct API key (CAF_CLIENT_SECRET may be a static API token)
  // In this case, the secret IS the bearer token
  console.log('[CAF-Token] Falling back to direct API key auth');
  return clientSecret;
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { personCpf, onboardingCaseId } = body;

    const authToken = await getCafAuthToken();

    // Step 1: Create or find person in CAF
    let personId = null;
    let personCreationFailed = false;
    const cleanCpf = (personCpf || '').replace(/\D/g, '');
    console.log('[CAF-Token] Input CPF:', cleanCpf ? `${cleanCpf.substring(0, 3)}***${cleanCpf.substring(8)}` : 'EMPTY — face authentication will not work');

    if (cleanCpf && cleanCpf.length === 11) {
      // Try to find existing person by CPF
      try {
        const searchRes = await fetch(`${CAF_API_BASE}/v1/persons?cpf=${cleanCpf}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const persons = searchData?.items || searchData?.data || (Array.isArray(searchData) ? searchData : []);
          if (persons.length > 0) {
            personId = persons[0].id || persons[0]._id;
            console.log('[CAF-Token] Found existing person:', personId);
          }
        }
      } catch (e) {
        console.log('[CAF-Token] Person search failed:', e.message);
      }

      // Create new person if not found
      if (!personId) {
        try {
          const createRes = await fetch(`${CAF_API_BASE}/v1/persons`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cpf: cleanCpf }),
          });
          if (createRes.ok) {
            const createData = await createRes.json();
            personId = createData.id || createData._id || createData.personId;
            console.log('[CAF-Token] Created new person:', personId);
          } else {
            personCreationFailed = true;
            console.log('[CAF-Token] Person creation failed:', createRes.status, await createRes.text());
          }
        } catch (e) {
          personCreationFailed = true;
          console.log('[CAF-Token] Person creation error:', e.message);
        }
      }
    } else {
      // CPF ausente/inválido — personId nunca será criado
      personCreationFailed = true;
    }

    // Step 2: Generate SDK session token
    // Try CAF BFF session token endpoint first
    let sdkToken = null;
    let tokenStrategy = 'none';

    // Strategy A: BFF session-tokens endpoint (for newer CAF SDK)
    try {
      const tokenRes = await fetch('https://web.us.prd.caf.io/bff/session-tokens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(personId ? { personId } : {}),
          ...(cleanCpf ? { cpf: cleanCpf } : {}),
        }),
      });
      
      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        sdkToken = tokenData.token || tokenData.sessionToken || tokenData.access_token;
        if (sdkToken) tokenStrategy = 'bff_session';
        console.log('[CAF-Token] BFF token generated successfully');
      } else {
        console.log('[CAF-Token] BFF token failed:', tokenRes.status);
      }
    } catch (e) {
      console.log('[CAF-Token] BFF token error:', e.message);
    }

    // Strategy B: SDK token endpoint (alternative)
    if (!sdkToken) {
      try {
        const tokenRes = await fetch(`${CAF_API_BASE}/v1/sdk-tokens`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...(personId ? { personId } : {}),
            ...(cleanCpf ? { cpf: cleanCpf } : {}),
          }),
        });
        
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          sdkToken = tokenData.token || tokenData.sessionToken;
          if (sdkToken) tokenStrategy = 'sdk_tokens';
          console.log('[CAF-Token] SDK token generated successfully');
        } else {
          console.log('[CAF-Token] SDK token failed:', tokenRes.status, await tokenRes.text());
        }
      } catch (e) {
        console.log('[CAF-Token] SDK token error:', e.message);
      }
    }

    // Strategy C: Use the auth token directly as SDK token (FALLBACK)
    // This works for DocumentDetector but NOT for FaceLiveness with performFaceAuthentication=true
    if (!sdkToken) {
      const clientId = Deno.env.get('CAF_CLIENT_ID');
      sdkToken = clientId || authToken;
      tokenStrategy = 'fallback_clientid';
      console.log('[CAF-Token] Using clientId/authToken as SDK token (fallback — face auth will be disabled)');
    }

    // tokenType: 'session' = completo, 'fallback' = face auth não vai funcionar confiavelmente
    const tokenType = (tokenStrategy === 'bff_session' || tokenStrategy === 'sdk_tokens') ? 'session' : 'fallback';
    // Face auth só funciona se: token é session + person foi criado + CPF válido
    const canUseFaceAuth = tokenType === 'session' && !!personId && !personCreationFailed;

    // Log the token generation
    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          provider: 'CAF',
          service_type: 'sdk_token_generation',
          status: sdkToken ? 'success' : 'failed',
          result_status: canUseFaceAuth ? 'APPROVED' : 'PENDING_REVIEW',
          request_payload: { hasCpf: !!cleanCpf, hasPersonId: !!personId },
          response_payload: { 
            tokenGenerated: !!sdkToken, 
            personId, 
            tokenType, 
            tokenStrategy,
            canUseFaceAuth,
            personCreationFailed,
          },
          red_flags: !canUseFaceAuth ? ['CAF_TOKEN_WITHOUT_FACE_AUTH'] : [],
          duration_ms: Date.now() - startTime,
        });
      } catch (e) {
        console.warn('[CAF-Token] Log error:', e.message);
      }
    }

    if (!sdkToken) {
      return Response.json({
        error: 'Não foi possível gerar token do SDK CAF',
        details: 'Verifique CAF_CLIENT_ID e CAF_CLIENT_SECRET no painel de configurações.',
      }, { status: 500 });
    }

    const durationMs = Date.now() - startTime;
    console.log(`[CAF-Token] Token generated in ${durationMs}ms, personId: ${personId}, tokenType: ${tokenType}, canUseFaceAuth: ${canUseFaceAuth}`);

    return Response.json({
      sdkToken,
      personId: personId || cleanCpf || 'anonymous',
      tokenType,             // 'session' | 'fallback' — frontend usa isso pra decidir
      tokenStrategy,         // debug
      canUseFaceAuth,        // se false, frontend DESABILITA performFaceAuthentication
      personCreationFailed,  // debug
      duration_ms: durationMs,
    });

  } catch (error) {
    console.error('[CAF-Token] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});