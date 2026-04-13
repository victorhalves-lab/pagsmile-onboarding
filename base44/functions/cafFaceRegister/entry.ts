import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafFaceRegister — Face Registration + Authentication via Core API
 * Auth: CAF_CLIENT_SECRET as static Bearer token
 *
 * Actions: register, authenticate, getAttempt
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

function getCafToken() {
  const token = Deno.env.get('CAF_CLIENT_SECRET');
  if (!token) throw new Error('CAF_CLIENT_SECRET not configured');
  return token;
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
    const { action, imageUrl, attemptId, onboardingCaseId } = body;
    const personId = body.personId || body.cpf;

    if (!action) return Response.json({ error: 'action é obrigatório (register|authenticate|getAttempt)' }, { status: 400 });

    const authToken = getCafToken();

    if (action === 'register') {
      if (!personId || !imageUrl) {
        return Response.json({ error: 'personId e imageUrl são obrigatórios para register' }, { status: 400 });
      }

      const res = await fetch(`${CAF_API_BASE}/v1/faces`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId, imageUrl }),
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

    if (action === 'authenticate') {
      if (!personId || !imageUrl) {
        return Response.json({ error: 'personId e imageUrl são obrigatórios para authenticate' }, { status: 400 });
      }

      const res = await fetch(`${CAF_API_BASE}/v1/faces/attempts/${attemptId || ''}`, {
        method: attemptId ? 'GET' : 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        ...(attemptId ? {} : { body: JSON.stringify({ personId, imageUrl }) }),
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
            similarity: data.similarity || data.confidence || null,
            duration_ms: Date.now() - startTime,
          });
        } catch (e) { console.warn('[FaceRegister] Log error:', e.message); }
      }

      return Response.json({
        success: res.ok, action: 'authenticate', personId,
        isMatch: data.isMatch, similarity: data.similarity,
        attemptId: data.attemptId || data.id || data.data?.id,
        result: data, duration_ms: Date.now() - startTime,
      });
    }

    if (action === 'getAttempt') {
      if (!attemptId) {
        return Response.json({ error: 'attemptId é obrigatório para getAttempt' }, { status: 400 });
      }

      const res = await fetch(`${CAF_API_BASE}/v1/faces/attempts/${attemptId}`, {
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