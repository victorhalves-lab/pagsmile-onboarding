import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { encodeBase64 } from 'https://deno.land/std@0.220.0/encoding/base64.ts';

/**
 * cafKybSearch — Fase 5: KYB Internacional via Core API Transaction
 *
 * Busca empresas usando services da Core API:
 *   - pjData / pjPublicData — dados cadastrais via CAF
 *   - pjKycCompliance — screening da empresa
 *   - pjKycComplianceOwners — screening de todos os sócios
 *
 * Para KYB internacional real (kybCompanySearch, kybBusinessIdentity, kybCreditReport),
 * é necessário configurar credenciais separadas da Connect API.
 * Esta versão usa a Core API que já está autenticada.
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

function base64UrlEncode(data) {
  const b64 = encodeBase64(data);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createCafAuthToken() {
  const clientId = Deno.env.get('CAF_CLIENT_ID');
  const clientSecret = Deno.env.get('CAF_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('CAF credentials not configured');
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: clientId, exp: now + 300 };
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(clientSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  return `${headerB64}.${payloadB64}.${base64UrlEncode(new Uint8Array(signature))}`;
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { cnpj, cpf, onboardingCaseId, services } = body;

    if (!cnpj && !cpf) {
      return Response.json({ error: 'CNPJ ou CPF é obrigatório' }, { status: 400 });
    }

    const authToken = await createCafAuthToken();
    const isPJ = !!cnpj;
    const document = (cnpj || cpf).replace(/\D/g, '');

    // Determine services to request
    const requestServices = services || (isPJ
      ? ['pjData', 'pjKycCompliance', 'pjKycComplianceOwners']
      : ['pfData', 'pfKycCompliance']);

    console.log(`[KYB] Querying ${isPJ ? 'PJ' : 'PF'}: ***${document.slice(-4)}, services: ${requestServices.join(', ')}`);

    const cafPayload = {
      template: { services: requestServices },
      parameters: isPJ ? { cnpj: document } : { cpf: document },
    };

    const cafResponse = await fetch(`${CAF_API_BASE}/v1/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cafPayload),
    });

    const cafText = await cafResponse.text();
    let cafResult;
    try { cafResult = JSON.parse(cafText); } catch { cafResult = { raw: cafText.substring(0, 500) }; }

    const sections = cafResult?.sections || {};
    const durationMs = Date.now() - startTime;

    console.log(`[KYB] CAF HTTP: ${cafResponse.status}, sections: ${Object.keys(sections).join(', ')}`);

    // Log and save if case-based
    if (onboardingCaseId) {
      for (const st of ['kyb_company_search', 'kyb_business_identity']) {
        try {
          await base44.asServiceRole.entities.IntegrationLog.create({
            onboarding_case_id: onboardingCaseId,
            provider: 'CAF',
            service_type: st,
            status: cafResponse.ok ? 'success' : 'failed',
            request_payload: { document: `***${document.slice(-4)}`, services: requestServices },
            response_payload: { sectionsReturned: Object.keys(sections) },
            duration_ms: durationMs,
          });
        } catch (e) { console.warn('[KYB] Log error:', e.message); }
      }

      try {
        await base44.asServiceRole.entities.ExternalValidationResult.create({
          onboardingCaseId,
          provider: 'CAF',
          validationType: `KYB — ${isPJ ? 'PJ' : 'PF'} Data + KYC + Owners`,
          endpoint: '/v1/transactions (pjData/pjKycCompliance/pjKycComplianceOwners)',
          resultData: sections,
          status: cafResponse.ok ? 'Sucesso' : 'Erro',
          timestamp: new Date().toISOString(),
          responseTime: durationMs,
        });
      } catch (e) { console.warn('[KYB] ExternalValidation error:', e.message); }
    }

    return Response.json({
      success: cafResponse.ok,
      type: isPJ ? 'PJ' : 'PF',
      transactionId: cafResult?.uuid || null,
      sections,
      sectionsReturned: Object.keys(sections),
      duration_ms: durationMs,
    });

  } catch (error) {
    console.error('[KYB] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});