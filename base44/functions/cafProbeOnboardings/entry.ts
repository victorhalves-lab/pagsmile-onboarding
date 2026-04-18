import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafProbeOnboardings — Testa o endpoint /v1/onboardings que já sabemos aceitar Bearer
 *
 * Objetivo: descobrir quais parâmetros mínimos a API aceita sem templateId,
 * e se retorna uma URL funcional + token SDK.
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const authToken = Deno.env.get('CAF_CLIENT_SECRET');
    const body = await req.json().catch(() => ({}));
    const cpf = (body.cpf || '74123947891').replace(/\D/g, '');
    const name = body.name || 'Alexandre Silva';

    const attempts = [];

    // Tentativa 1: POST /v1/onboardings sem templateId (descobrir erro específico)
    {
      const a = { name: '1_onboarding_no_template', url: `${CAF_API_BASE}/v1/onboardings?origin=TRUST` };
      try {
        const res = await fetch(`${CAF_API_BASE}/v1/onboardings?origin=TRUST`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'PF', attributes: { cpf, name } }),
        });
        a.status = res.status;
        const t = await res.text();
        a.response_preview = t.substring(0, 1500);
        a.ok = res.ok;
      } catch (e) { a.error = e.message; }
      attempts.push(a);
    }

    // Tentativa 2: GET /v1/onboardings (listar onboardings existentes → vemos IDs que funcionam)
    {
      const a = { name: '2_list_onboardings', url: `${CAF_API_BASE}/v1/onboardings?limit=5` };
      try {
        const res = await fetch(`${CAF_API_BASE}/v1/onboardings?limit=5`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        a.status = res.status;
        const t = await res.text();
        a.response_preview = t.substring(0, 2500);
        a.ok = res.ok;
      } catch (e) { a.error = e.message; }
      attempts.push(a);
    }

    // Tentativa 3: POST /v1/transactions com peopleFaceAuthenticator (face match via transactions)
    {
      const a = { name: '3_transaction_face_auth', url: `${CAF_API_BASE}/v1/transactions` };
      try {
        const res = await fetch(`${CAF_API_BASE}/v1/transactions`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template: { services: ['peopleFaceAuthenticator'] },
            attributes: { cpf, name },
          }),
        });
        a.status = res.status;
        const t = await res.text();
        a.response_preview = t.substring(0, 1500);
        a.ok = res.ok;
      } catch (e) { a.error = e.message; }
      attempts.push(a);
    }

    // Tentativa 4: POST /v1/transactions com peopleFaceLiveness 
    {
      const a = { name: '4_transaction_face_liveness', url: `${CAF_API_BASE}/v1/transactions` };
      try {
        const res = await fetch(`${CAF_API_BASE}/v1/transactions`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template: { services: ['peopleFaceLiveness'] },
            attributes: { cpf, name },
          }),
        });
        a.status = res.status;
        const t = await res.text();
        a.response_preview = t.substring(0, 1500);
        a.ok = res.ok;
      } catch (e) { a.error = e.message; }
      attempts.push(a);
    }

    // Tentativa 5: POST /v1/onboardings SEM origin=TRUST e sem template
    {
      const a = { name: '5_onboarding_no_origin', url: `${CAF_API_BASE}/v1/onboardings` };
      try {
        const res = await fetch(`${CAF_API_BASE}/v1/onboardings`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'PF', attributes: { cpf, name } }),
        });
        a.status = res.status;
        const t = await res.text();
        a.response_preview = t.substring(0, 1500);
        a.ok = res.ok;
      } catch (e) { a.error = e.message; }
      attempts.push(a);
    }

    // Tentativa 6: GET /v1/profile-templates (endpoint alternativo pra descobrir templates)
    {
      const a = { name: '6_profile_templates', url: `${CAF_API_BASE}/v1/profile-templates` };
      try {
        const res = await fetch(`${CAF_API_BASE}/v1/profile-templates`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        a.status = res.status;
        const t = await res.text();
        a.response_preview = t.substring(0, 2500);
        a.ok = res.ok;
      } catch (e) { a.error = e.message; }
      attempts.push(a);
    }

    return Response.json({ attempts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});