// ─────────────────────────────────────────────────────────────────────
// reprocessV4AsV5_2 — Admin-only: cria um caso V5.2 paralelo a partir
// de um caso V4 existente para validar o novo framework em produção
// sem afetar o histórico V4 original.
//
// REGRAS DURAS:
//   - Só admin pode chamar.
//   - Não altera o OnboardingCase V4 original (DNA imutável).
//   - Cria NOVO OnboardingCase com framework_version='v5.2' + legacyV4CaseId.
//   - Reusa o mesmo merchantId (cliente é o mesmo).
//   - Copia QuestionnaireResponse do caso V4 para o caso V5.2.
//   - Dispara autoEnrichOnboardingV5_2 (cross-deployment para evitar loop).
// ─────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const t0 = Date.now();
  try {
    const base44 = createClientFromRequest(req);

    // ── Auth: admin only ──
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const legacyV4CaseId = body.legacyV4CaseId;
    if (!legacyV4CaseId) {
      return Response.json({ error: 'legacyV4CaseId is required' }, { status: 400 });
    }

    // ── Fetch o caso V4 original ──
    const [legacyCase] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: legacyV4CaseId });
    if (!legacyCase) {
      return Response.json({ error: 'Legacy case not found' }, { status: 404 });
    }
    const legacyFv = legacyCase.framework_version || 'v4.0';
    if (legacyFv === 'v5.2') {
      return Response.json({ error: 'Case is already V5.2', alreadyV5_2: true }, { status: 400 });
    }

    // ── Verificar se já existe um V5.2 espelho para este caso ──
    const existingMirror = await base44.asServiceRole.entities.OnboardingCase.filter({ legacyV4CaseId });
    if (existingMirror.length > 0) {
      const mirror = existingMirror[0];
      console.log(`[reprocessV4AsV5_2] Mirror already exists: ${mirror.id}`);
      return Response.json({
        success: true,
        alreadyExists: true,
        newCaseId: mirror.id,
        merchantId: mirror.merchantId,
        message: 'Já existe um caso V5.2 espelho para este caso V4.',
      });
    }

    // ── Criar o novo OnboardingCase V5.2 espelho ──
    const newCasePayload = {
      merchantId: legacyCase.merchantId,
      questionnaireTemplateId: legacyCase.questionnaireTemplateId,
      submissionDate: new Date().toISOString(),
      status: 'Em Processamento',
      framework_version: 'v5.2',
      framework_version_at_start: 'v5.2',
      framework_version_at_submit: 'v5.2',
      legacyV4CaseId,
      priority: legacyCase.priority || 'medium',
      // Não copiamos scores/decisões — o V5.2 vai recalcular do zero.
      // Não copiamos representantes/CAF — sandbox de scoring puro.
    };

    const newCase = await base44.asServiceRole.entities.OnboardingCase.create(newCasePayload);
    console.log(`[reprocessV4AsV5_2] Created V5.2 mirror case ${newCase.id} from V4 ${legacyV4CaseId}`);

    // ── Copiar QuestionnaireResponse do V4 para o V5.2 ──
    const v4Responses = await base44.asServiceRole.entities.QuestionnaireResponse.filter({
      onboardingCaseId: legacyV4CaseId,
    });

    if (v4Responses.length > 0) {
      const responsesToCreate = v4Responses.map((r) => ({
        onboardingCaseId: newCase.id,
        questionId: r.questionId,
        valueText: r.valueText,
        valueNumber: r.valueNumber,
        valueBoolean: r.valueBoolean,
        valueArray: r.valueArray,
        questionText: r.questionText,
        questionType: r.questionType,
      }));
      await base44.asServiceRole.entities.QuestionnaireResponse.bulkCreate(responsesToCreate);
      console.log(`[reprocessV4AsV5_2] Copied ${v4Responses.length} responses`);
    }

    // ── AuditLog (best-effort) ──
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        entityId: newCase.id,
        entityType: 'OnboardingCase',
        action: 'reprocess_v4_to_v5_2',
        userId: user.id,
        userEmail: user.email,
        details: {
          legacyV4CaseId,
          merchantId: legacyCase.merchantId,
          responsesCopied: v4Responses.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (auditErr) {
      console.warn(`[reprocessV4AsV5_2] AuditLog failed (non-blocking): ${auditErr.message}`);
    }

    // ── Disparar autoEnrichOnboardingV5_2 (cross-deployment para evitar loop) ──
    try {
      const appId = Deno.env.get('BASE44_APP_ID');
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
      const fnUrl = `https://base44.app/api/apps/${appId}/functions/autoEnrichOnboardingV5_2`;
      // Fire-and-forget — não bloqueamos a resposta ao admin
      fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify({ onboardingCaseId: newCase.id }),
      }).catch((err) => console.warn(`[reprocessV4AsV5_2] autoEnrichV5_2 dispatch error: ${err.message}`));
      console.log(`[reprocessV4AsV5_2] Dispatched autoEnrichOnboardingV5_2 for ${newCase.id}`);
    } catch (e) {
      console.warn(`[reprocessV4AsV5_2] Dispatch failed (non-blocking): ${e.message}`);
    }

    const elapsed = Date.now() - t0;
    return Response.json({
      success: true,
      newCaseId: newCase.id,
      merchantId: legacyCase.merchantId,
      legacyV4CaseId,
      responsesCopied: v4Responses.length,
      duration_ms: elapsed,
    });
  } catch (e) {
    console.error('[reprocessV4AsV5_2] ERROR:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
});