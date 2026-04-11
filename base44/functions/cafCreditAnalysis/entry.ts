import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { encodeBase64 } from 'https://deno.land/std@0.220.0/encoding/base64.ts';

/**
 * cafCreditAnalysis — Fase 6: Análise de crédito profunda PF/PJ via Core API
 *
 * Mais profundo que BDC para crédito: dívidas, protestos, cheques devolvidos,
 * ações civis, histórico bancário, score com decomposição, falências, recuperações judiciais.
 *
 * Services:
 *   PF: pfCreditProfileDetails
 *   PJ: pjCreditProfileDetails
 *
 * Uso: sob demanda para merchants com alto TPV.
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
    const { cpf, cnpj, onboardingCaseId } = body;

    if (!cpf && !cnpj) return Response.json({ error: 'CPF ou CNPJ é obrigatório' }, { status: 400 });

    const isPF = !!cpf;
    const service = isPF ? 'pfCreditProfileDetails' : 'pjCreditProfileDetails';
    const document = (cpf || cnpj).replace(/\D/g, '');

    const authToken = await createCafAuthToken();

    const cafPayload = {
      template: { services: [service] },
      parameters: isPF ? { cpf: document } : { cnpj: document },
    };

    const cafResponse = await fetch(`${CAF_API_BASE}/v1/transactions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cafPayload),
    });

    const cafText = await cafResponse.text();
    let cafResult;
    try { cafResult = JSON.parse(cafText); } catch { cafResult = { raw: cafText.substring(0, 500) }; }

    const creditSection = cafResult?.sections?.[service] || cafResult?.sections?.creditProfile || null;
    const durationMs = Date.now() - startTime;

    // Log
    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          provider: 'CAF',
          service_type: isPF ? 'pf_credit_profile' : 'pj_credit_profile',
          status: cafResponse.ok ? 'success' : 'failed',
          request_payload: { document: `***${document.slice(-4)}`, service },
          response_payload: { hasCreditData: !!creditSection },
          score: creditSection?.score || null,
          duration_ms: durationMs,
        });
      } catch (e) { console.warn('[Credit] Log error:', e.message); }

      try {
        await base44.asServiceRole.entities.ExternalValidationResult.create({
          onboardingCaseId,
          provider: 'CAF',
          validationType: `Credit Profile — ${isPF ? 'PF' : 'PJ'}`,
          endpoint: `/v1/transactions (${service})`,
          resultData: creditSection || cafResult,
          score: creditSection?.score || null,
          status: cafResponse.ok ? 'Sucesso' : 'Erro',
          timestamp: new Date().toISOString(),
          responseTime: durationMs,
        });
      } catch (e) { console.warn('[Credit] ExternalValidation error:', e.message); }
    }

    return Response.json({
      success: true,
      type: isPF ? 'PF' : 'PJ',
      creditProfile: creditSection,
      transactionId: cafResult?.uuid || null,
      duration_ms: durationMs,
    });

  } catch (error) {
    console.error('[Credit] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});