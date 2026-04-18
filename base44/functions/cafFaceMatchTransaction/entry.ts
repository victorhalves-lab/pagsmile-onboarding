import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafFaceMatchTransaction — Face Match real via /v1/transactions
 *
 * Fluxo (funcionando 100% com nossas credenciais Bearer):
 *   1. Recebe selfie base64 + onboardingCaseId
 *   2. Busca CPF/nome via cafResolvePersonData (lastro completo)
 *   3. POST /v1/transactions com service peopleFaceAuthenticator + selfie
 *   4. Poll GET /v1/transactions/:id até status != PROCESSING (max 20s)
 *   5. Persiste em IntegrationLog com score + resultado
 *   6. Retorna { success, isMatch, similarity, status, transactionId }
 *
 * Essa é a API oficial da CAF que compara a selfie com a base oficial do CPF
 * (Receita/TSE). Substitui o performFaceAuthentication do SDK que exigia
 * /v1/persons + AWS Signature v4 (não disponível nas nossas credenciais).
 */

const CAF_API_BASE = 'https://api.combateafraude.com';
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 10; // 20s total

function stripDataUri(b64) {
  if (!b64) return '';
  // Remove data:image/png;base64, prefix if present — CAF expects raw base64
  return b64.replace(/^data:image\/[a-z]+;base64,/, '');
}

async function createTransaction(authToken, cpf, name, selfieB64) {
  const res = await fetch(`${CAF_API_BASE}/v1/transactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template: { services: ['peopleFaceAuthenticator'] },
      attributes: { cpf, name },
      images: { selfie: selfieB64 },
    }),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, ok: res.ok, data };
}

async function pollTransaction(authToken, transactionId) {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    const res = await fetch(`${CAF_API_BASE}/v1/transactions/${transactionId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    if (!res.ok) continue;
    const data = await res.json();
    if (data.status && data.status !== 'PROCESSING') {
      return { completed: true, data, attempts: i + 1 };
    }
  }
  return { completed: false, data: null, attempts: POLL_MAX_ATTEMPTS };
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { onboardingCaseId, docLinkToken, selfieBase64 } = body;

    if (!onboardingCaseId || !selfieBase64) {
      return Response.json({ error: 'onboardingCaseId and selfieBase64 required' }, { status: 400 });
    }

    // ── Auth: valida docLinkToken ──
    const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
    const theCase = cases[0];
    if (!theCase) return Response.json({ error: 'Case not found' }, { status: 404 });
    if (theCase.docLinkToken && theCase.docLinkToken !== docLinkToken) {
      return Response.json({ error: 'Invalid token' }, { status: 403 });
    }

    // ── Resolve CPF/nome via lastro ──
    const resolveRes = await base44.asServiceRole.functions.invoke('cafResolvePersonData', {
      onboardingCaseId,
      docLinkToken,
    });
    const resolved = resolveRes?.data || {};
    const cpf = resolved.cpf;
    const name = resolved.name || 'Representante Legal';

    if (!cpf) {
      await base44.asServiceRole.entities.IntegrationLog.create({
        onboarding_case_id: onboardingCaseId,
        provider: 'CAF',
        service_type: 'face_authentication',
        status: 'failed',
        result_status: 'PENDING_REVIEW',
        error_message: 'CPF não encontrado no lastro',
        response_payload: { resolvedSource: resolved.source, evidenceChain: resolved.evidenceChain },
        duration_ms: Date.now() - startTime,
      });
      return Response.json({
        success: false,
        error: 'CPF não foi encontrado. Verifique o cadastro do responsável legal.',
        needsManualReview: true,
      }, { status: 200 });
    }

    const authToken = Deno.env.get('CAF_CLIENT_SECRET');
    if (!authToken) throw new Error('CAF_CLIENT_SECRET not configured');

    // ── Cria transação com selfie ──
    const cleanB64 = stripDataUri(selfieBase64);
    const createResult = await createTransaction(authToken, cpf, name, cleanB64);

    if (!createResult.ok || !createResult.data?.id) {
      await base44.asServiceRole.entities.IntegrationLog.create({
        onboarding_case_id: onboardingCaseId,
        provider: 'CAF',
        service_type: 'face_authentication',
        status: 'failed',
        result_status: 'REPROVED',
        error_message: `CAF transaction create failed: ${createResult.data?.message || 'unknown'}`,
        request_payload: { cpf: cpf.substring(0, 3) + '***', name, service: 'peopleFaceAuthenticator' },
        response_payload: createResult.data,
        duration_ms: Date.now() - startTime,
      });
      return Response.json({
        success: false,
        error: 'Falha ao iniciar verificação facial. Tente novamente.',
        details: createResult.data?.message,
      }, { status: 200 });
    }

    const transactionId = createResult.data.id;

    // ── Poll resultado ──
    const pollResult = await pollTransaction(authToken, transactionId);

    // ── Extrai dados do resultado ──
    const txData = pollResult.data || {};
    const sections = txData.sections || {};
    const faceAuthSection = sections.peopleFaceAuthenticator || sections.faceAuthenticator || {};
    const faceData = faceAuthSection.data || {};
    const similarity = faceData.similarity ?? faceData.score ?? null;
    const isMatch = similarity !== null ? similarity >= 0.7 : (txData.status === 'APPROVED');
    const finalStatus = txData.status || 'TIMEOUT';

    // ── Persiste resultado completo ──
    await base44.asServiceRole.entities.IntegrationLog.create({
      onboarding_case_id: onboardingCaseId,
      provider: 'CAF',
      service_type: 'face_authentication',
      transaction_id: transactionId,
      status: pollResult.completed ? 'success' : 'timeout',
      result_status: finalStatus === 'APPROVED' ? 'APPROVED' : 
                     finalStatus === 'REPROVED' ? 'REPROVED' : 'PENDING_REVIEW',
      request_payload: {
        cpf: cpf.substring(0, 3) + '***',
        name,
        service: 'peopleFaceAuthenticator',
        resolvedSource: resolved.source,
      },
      response_payload: {
        transactionId,
        status: finalStatus,
        sections: Object.keys(sections),
        similarity,
        isMatch,
        pollAttempts: pollResult.attempts,
      },
      similarity: similarity ?? undefined,
      score: similarity ?? undefined,
      duration_ms: Date.now() - startTime,
    });

    return Response.json({
      success: true,
      transactionId,
      status: finalStatus,
      isMatch,
      similarity,
      completed: pollResult.completed,
    });
  } catch (error) {
    console.error('[cafFaceMatchTransaction] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});