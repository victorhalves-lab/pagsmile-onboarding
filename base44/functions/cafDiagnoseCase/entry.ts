import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafDiagnoseCase — Diagnóstico completo de um caso CAF.
 *
 * Retorna um snapshot com TUDO que importa para debugar:
 *   - credencial CAF ok?
 *   - /v1/sdk-tokens funciona AGORA? (testa de verdade)
 *   - CPF/nome resolvidos pelo lastro?
 *   - quantos IntegrationLogs CAF existem e qual o último?
 *   - selfie foi capturada?
 *   - facematch já rodou? resultado?
 *   - docCompleted/cafCompleted no case?
 *
 * Admin-only.
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { onboardingCaseId } = await req.json();
    if (!onboardingCaseId) {
      return Response.json({ error: 'onboardingCaseId required' }, { status: 400 });
    }

    const clientSecret = Deno.env.get('CAF_CLIENT_SECRET');

    // 1. Caso e merchant
    const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
    const theCase = cases[0];
    if (!theCase) return Response.json({ error: 'Case not found' }, { status: 404 });

    // 2. Responses (para achar CPF)
    const responses = await base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId });
    let cpf = null, name = null, cpfSource = 'none';
    const isValidCpf = (s) => s && String(s).replace(/\D/g, '').length === 11;
    for (const r of responses) {
      const t = (r.questionText || '').toLowerCase();
      if (!cpf && r.valueText && isValidCpf(r.valueText) && t.includes('cpf')) {
        cpf = String(r.valueText).replace(/\D/g, '');
        cpfSource = t.includes('representante') ? 'representante_legal' : 'other_question';
      }
      if (!name && r.valueText && t.includes('nome') && r.valueText.length > 3) {
        name = r.valueText.trim();
      }
    }
    if (!cpf) {
      const leads = await base44.asServiceRole.entities.Lead.filter({ onboardingCaseId });
      if (leads[0]?.cpfCnpj && isValidCpf(leads[0].cpfCnpj)) {
        cpf = String(leads[0].cpfCnpj).replace(/\D/g, '');
        cpfSource = 'lead';
        name = name || leads[0].fullName;
      }
    }

    // 3. Logs CAF recentes
    const allLogs = await base44.asServiceRole.entities.IntegrationLog.filter(
      { onboarding_case_id: onboardingCaseId, provider: 'CAF' },
      '-created_date',
      30
    );
    const logSummary = allLogs.map(l => ({
      service: l.service_type,
      status: l.status,
      result: l.result_status,
      hasTransactionId: !!l.transaction_id,
      similarity: l.similarity,
      isAlive: l.is_alive,
      errorMessage: l.error_message,
      httpStatus: l.response_payload?.httpStatus,
      cafMessage: l.response_payload?.cafMessage,
      when: l.created_date,
    }));

    // 4. Teste AO VIVO do /v1/sdk-tokens com o CPF deste caso
    let liveTest = null;
    if (clientSecret) {
      const start = Date.now();
      try {
        const res = await fetch(`${CAF_API_BASE}/v1/sdk-tokens`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${clientSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cpf ? { personId: cpf } : {}),
        });
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { raw: text.substring(0, 500) }; }
        liveTest = {
          httpStatus: res.status,
          ok: res.ok,
          latency_ms: Date.now() - start,
          tokenGenerated: !!(data?.token || data?.sessionToken),
          cafMessage: data?.message || null,
          cafRequestId: data?.requestId || null,
          bodyPreview: res.ok
            ? `token_length=${String(data?.token || data?.sessionToken || '').length}`
            : JSON.stringify(data).substring(0, 300),
        };
      } catch (e) {
        liveTest = { error: e.message, latency_ms: Date.now() - start };
      }
    }

    // 5. Selfie persistida?
    const livenessLog = allLogs.find(l => l.service_type === 'face_liveness' || l.service_type === 'liveness');
    const faceAuthLog = allLogs.find(l => l.service_type === 'face_authentication');

    return Response.json({
      case: {
        id: theCase.id,
        merchantId: theCase.merchantId,
        status: theCase.status,
        cafCompleted: theCase.cafCompleted,
        docCompleted: theCase.docCompleted,
      },
      credential: {
        hasClientSecret: !!clientSecret,
        clientSecretLength: clientSecret?.length || 0,
      },
      person: {
        cpf: cpf ? `${cpf.substring(0, 3)}***${cpf.substring(8)}` : null,
        name: name || null,
        cpfSource,
        cpfFullyResolved: !!cpf,
      },
      liveCafTest: liveTest,
      logs: {
        totalLogs: allLogs.length,
        byService: logSummary.reduce((acc, l) => {
          acc[l.service] = (acc[l.service] || 0) + 1;
          return acc;
        }, {}),
        lastFiveLogs: logSummary.slice(0, 5),
      },
      liveness: livenessLog ? {
        status: livenessLog.status,
        result: livenessLog.result_status,
        isAlive: livenessLog.is_alive,
        hasImageUrls: (livenessLog.image_urls || []).length > 0,
        when: livenessLog.created_date,
      } : null,
      faceMatch: faceAuthLog ? {
        status: faceAuthLog.status,
        result: faceAuthLog.result_status,
        similarity: faceAuthLog.similarity,
        transactionId: faceAuthLog.transaction_id,
        error: faceAuthLog.error_message,
        when: faceAuthLog.created_date,
      } : null,
      recommendation: !clientSecret ? 'CONFIGURE CAF_CLIENT_SECRET'
        : !liveTest?.ok ? `CAF API falhando HTTP ${liveTest?.httpStatus} — ${liveTest?.cafMessage}`
        : !cpf ? 'CPF não resolvido — cliente precisa preencher representante legal'
        : !livenessLog ? 'Cliente ainda não fez liveness — link deve estar acessível'
        : !faceAuthLog ? 'Liveness OK mas facematch nunca rodou — chame cafFaceMatchTransaction'
        : faceAuthLog.status === 'timeout' ? 'Facematch timeout — rerun necessário'
        : 'Fluxo completo — verificar resultado manualmente',
    });
  } catch (error) {
    console.error('[cafDiagnoseCase] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});