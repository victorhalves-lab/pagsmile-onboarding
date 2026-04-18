import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafDiagnoseGap — Diagnóstico profundo de onde EXATAMENTE a CAF está falhando
 *
 * Testa em sequência:
 *   1. Autenticação (OAuth2 → fallback API key)
 *   2. Busca de person por CPF (GET /v1/persons)
 *   3. Criação de person (POST /v1/persons) — com payloads diferentes
 *   4. Geração de session token BFF
 *   5. Geração de SDK token
 *
 * Retorna o erro textual EXATO de cada etapa pra descobrir o que falta.
 */

const CAF_AUTH_URL = 'https://auth.combateafraude.com/oauth/token';
const CAF_API_BASE = 'https://api.combateafraude.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const testCpf = (body.cpf || '74123947891').replace(/\D/g, '');
    const testName = body.name || 'Alexandre Silva';

    const diagnosis = {
      cpf_tested: testCpf,
      steps: [],
    };

    const clientId = Deno.env.get('CAF_CLIENT_ID');
    const clientSecret = Deno.env.get('CAF_CLIENT_SECRET');

    diagnosis.credentials_present = {
      client_id: !!clientId,
      client_secret: !!clientSecret,
      client_id_preview: clientId ? `${clientId.substring(0, 8)}...` : null,
    };

    // ── STEP 1: OAuth2 authentication ──
    let authToken = null;
    let authStrategy = 'none';
    {
      const step = { name: '1_oauth2_auth', url: CAF_AUTH_URL };
      try {
        const res = await fetch(CAF_AUTH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
          }).toString(),
        });
        step.status_code = res.status;
        const text = await res.text();
        step.response_preview = text.substring(0, 500);
        if (res.ok) {
          try {
            const data = JSON.parse(text);
            authToken = data.access_token;
            step.ok = !!authToken;
            step.token_preview = authToken ? `${authToken.substring(0, 20)}...` : null;
            authStrategy = 'oauth2';
          } catch {
            step.ok = false;
            step.error = 'Invalid JSON response';
          }
        } else {
          step.ok = false;
        }
      } catch (e) {
        step.ok = false;
        step.error = e.message;
      }
      diagnosis.steps.push(step);
    }

    // Fallback to direct API key
    if (!authToken) {
      authToken = clientSecret;
      authStrategy = 'direct_api_key';
      diagnosis.steps.push({
        name: '1b_fallback_direct_apikey',
        ok: true,
        note: 'Using CAF_CLIENT_SECRET as bearer token directly',
      });
    }

    diagnosis.auth_strategy_used = authStrategy;

    // ── STEP 2: Search person by CPF (GET /v1/persons) ──
    {
      const step = { name: '2_search_person_by_cpf', url: `${CAF_API_BASE}/v1/persons?cpf=${testCpf}` };
      try {
        const res = await fetch(`${CAF_API_BASE}/v1/persons?cpf=${testCpf}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        step.status_code = res.status;
        const text = await res.text();
        step.response_preview = text.substring(0, 800);
        step.ok = res.ok;
      } catch (e) {
        step.ok = false;
        step.error = e.message;
      }
      diagnosis.steps.push(step);
    }

    // ── STEP 3A: Create person — minimal payload ──
    {
      const step = { name: '3a_create_person_minimal', url: `${CAF_API_BASE}/v1/persons`, payload: { cpf: testCpf } };
      try {
        const res = await fetch(`${CAF_API_BASE}/v1/persons`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cpf: testCpf }),
        });
        step.status_code = res.status;
        const text = await res.text();
        step.response_preview = text.substring(0, 800);
        step.ok = res.ok;
      } catch (e) {
        step.ok = false;
        step.error = e.message;
      }
      diagnosis.steps.push(step);
    }

    // ── STEP 3B: Create person — with name ──
    {
      const step = { name: '3b_create_person_with_name', payload: { cpf: testCpf, name: testName } };
      try {
        const res = await fetch(`${CAF_API_BASE}/v1/persons`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cpf: testCpf, name: testName }),
        });
        step.status_code = res.status;
        const text = await res.text();
        step.response_preview = text.substring(0, 800);
        step.ok = res.ok;
      } catch (e) {
        step.ok = false;
        step.error = e.message;
      }
      diagnosis.steps.push(step);
    }

    // ── STEP 3C: Create person — CAF "send" format (alternate API) ──
    {
      const step = { name: '3c_create_person_send_format', url: `${CAF_API_BASE}/v1/persons/send`, payload: { cpf: testCpf, name: testName } };
      try {
        const res = await fetch(`${CAF_API_BASE}/v1/persons/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cpf: testCpf, name: testName }),
        });
        step.status_code = res.status;
        const text = await res.text();
        step.response_preview = text.substring(0, 800);
        step.ok = res.ok;
      } catch (e) {
        step.ok = false;
        step.error = e.message;
      }
      diagnosis.steps.push(step);
    }

    // ── STEP 4: Test /trust endpoint (KYC endpoint that we know works — used in cafCpfValidation) ──
    {
      const step = { name: '4_trust_kyc_endpoint', url: `${CAF_API_BASE}/v1/trust` };
      try {
        const res = await fetch(`${CAF_API_BASE}/v1/trust`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ attributes: { cpf: testCpf } }),
        });
        step.status_code = res.status;
        const text = await res.text();
        step.response_preview = text.substring(0, 500);
        step.ok = res.ok;
      } catch (e) {
        step.ok = false;
        step.error = e.message;
      }
      diagnosis.steps.push(step);
    }

    // ── STEP 5: BFF session token ──
    {
      const step = { name: '5_bff_session_token', url: 'https://web.us.prd.combateafraude.com/bff/session-tokens' };
      try {
        const res = await fetch('https://web.us.prd.combateafraude.com/bff/session-tokens', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cpf: testCpf }),
        });
        step.status_code = res.status;
        const text = await res.text();
        step.response_preview = text.substring(0, 500);
        step.ok = res.ok;
      } catch (e) {
        step.ok = false;
        step.error = e.message;
      }
      diagnosis.steps.push(step);
    }

    // ── STEP 6: SDK tokens endpoint ──
    {
      const step = { name: '6_sdk_tokens_endpoint', url: `${CAF_API_BASE}/v1/sdk-tokens` };
      try {
        const res = await fetch(`${CAF_API_BASE}/v1/sdk-tokens`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cpf: testCpf }),
        });
        step.status_code = res.status;
        const text = await res.text();
        step.response_preview = text.substring(0, 500);
        step.ok = res.ok;
      } catch (e) {
        step.ok = false;
        step.error = e.message;
      }
      diagnosis.steps.push(step);
    }

    // ── Analysis ──
    const hasWorkingAuth = !!authToken;
    const canCreatePerson = diagnosis.steps.some(s => 
      (s.name.startsWith('3') && s.ok)
    );
    const canGetSessionToken = diagnosis.steps.some(s => 
      (s.name === '5_bff_session_token' || s.name === '6_sdk_tokens_endpoint') && s.ok
    );

    diagnosis.verdict = {
      auth_works: hasWorkingAuth,
      can_create_person: canCreatePerson,
      can_generate_session_token: canGetSessionToken,
      face_match_would_work: hasWorkingAuth && canCreatePerson && canGetSessionToken,
      primary_gap: !canCreatePerson 
        ? 'PERSON_CREATION_BLOCKED — endpoint /v1/persons is not accessible with current credentials'
        : !canGetSessionToken 
        ? 'SESSION_TOKEN_BLOCKED — no endpoint to generate SDK session token'
        : 'NO_GAP — face match should work',
      recommendation: !canCreatePerson 
        ? 'Contact CAF support to: (1) confirm endpoint URL for person creation, (2) verify our clientId has the "persons:write" scope, (3) check if persons are created via a different flow (e.g. transactions-based)'
        : null,
    };

    return Response.json(diagnosis);
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});