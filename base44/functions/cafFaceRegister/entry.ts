import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { encodeBase64 } from 'https://deno.land/std@0.220.0/encoding/base64.ts';

/**
 * cafFaceRegister — Fase 7: Registro de face para re-autenticação futura
 *
 * Registra a face do merchant vinculada ao CPF para:
 *   - Revalidações periódicas (sem refazer SDK inteiro)
 *   - Login biométrico
 *   - Re-autenticação em operações sensíveis
 *
 * Ações:
 *   - register: Registra face (POST /v1/faces)
 *   - authenticate: Tenta autenticação (POST /v1/faces/{personId}/attempts)
 *   - getAttempt: Consulta resultado (GET /v1/faces/{personId}/attempts/{attemptId})
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
    const { action, personId, imageUrl, attemptId, onboardingCaseId } = body;

    if (!action) return Response.json({ error: 'action é obrigatório (register|authenticate|getAttempt)' }, { status: 400 });

    const authToken = await createCafAuthToken();

    // ── Register face ──
    if (action === 'register') {
      if (!personId || !imageUrl) {
        return Response.json({ error: 'personId e imageUrl são obrigatórios para register' }, { status: 400 });
      }

      const res = await fetch(`${CAF_API_BASE}/v1/faces`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId, image: imageUrl }),
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text.substring(0, 500) }; }

      if (onboardingCaseId) {
        try {
          await base44.asServiceRole.entities.IntegrationLog.create({
            onboarding_case_id: onboardingCaseId,
            provider: 'CAF',
            service_type: 'face_register',
            status: res.ok ? 'success' : 'failed',
            request_payload: { action: 'register', personId },
            response_payload: data,
            duration_ms: Date.now() - startTime,
          });
        } catch (e) { console.warn('[FaceRegister] Log error:', e.message); }
      }

      return Response.json({ success: res.ok, action: 'register', personId, result: data, duration_ms: Date.now() - startTime });
    }

    // ── Authenticate face ──
    if (action === 'authenticate') {
      if (!personId || !imageUrl) {
        return Response.json({ error: 'personId e imageUrl são obrigatórios para authenticate' }, { status: 400 });
      }

      const res = await fetch(`${CAF_API_BASE}/v1/faces/${personId}/attempts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl }),
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text.substring(0, 500) }; }

      if (onboardingCaseId) {
        try {
          await base44.asServiceRole.entities.IntegrationLog.create({
            onboarding_case_id: onboardingCaseId,
            provider: 'CAF',
            service_type: 'face_authentication',
            status: res.ok ? 'success' : 'failed',
            result_status: data.isMatch ? 'APPROVED' : 'REPROVED',
            request_payload: { action: 'authenticate', personId },
            response_payload: data,
            similarity: data.confidence || null,
            duration_ms: Date.now() - startTime,
          });
        } catch (e) { console.warn('[FaceRegister] Log error:', e.message); }
      }

      return Response.json({
        success: res.ok,
        action: 'authenticate',
        personId,
        isMatch: data.isMatch,
        confidence: data.confidence,
        attemptId: data.attemptId || data.id,
        result: data,
        duration_ms: Date.now() - startTime,
      });
    }

    // ── Get attempt result ──
    if (action === 'getAttempt') {
      if (!personId || !attemptId) {
        return Response.json({ error: 'personId e attemptId são obrigatórios para getAttempt' }, { status: 400 });
      }

      const res = await fetch(`${CAF_API_BASE}/v1/faces/${personId}/attempts/${attemptId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text.substring(0, 500) }; }

      return Response.json({ success: res.ok, action: 'getAttempt', result: data, duration_ms: Date.now() - startTime });
    }

    return Response.json({ error: `Ação '${action}' não reconhecida` }, { status: 400 });

  } catch (error) {
    console.error('[FaceRegister] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});