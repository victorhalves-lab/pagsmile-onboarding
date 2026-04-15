import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * bulkReprocessCompliance — FASE 1: Limpa dados de análise + deleta ComplianceScores antigos.
 * 
 * A FASE 2 (reprocessamento) é feita pelo frontend que chama autoEnrichOnboarding
 * caso a caso, usando o token do admin logado (evita 403 de function-to-function).
 * 
 * Parâmetros:
 * - action: "clean" (limpa) | "status" (verifica status)
 * - caseIds: ["id1","id2"] → operar apenas nesses IDs (null = todos)
 */

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const action = body.action || 'clean';
    const filterCaseIds = body.caseIds || null;

    // Load all cases
    let allCases = await base44.asServiceRole.entities.OnboardingCase.list('-created_date', 200);
    if (filterCaseIds && filterCaseIds.length > 0) {
      allCases = allCases.filter(c => filterCaseIds.includes(c.id));
    }
    const validCases = allCases.filter(c => c.merchantId && c.questionnaireTemplateId);

    if (action === 'status') {
      // Return current status of all cases (for monitoring progress)
      const cases = validCases.map(c => ({
        id: c.id, merchantId: c.merchantId, status: c.status,
        score: c.riskScoreV4, subfaixa: c.subfaixa,
        bdcDone: c.bigDataCorpCompleted, cafDone: c.cafCompleted,
        validationsDone: c.validationsCompleted,
        redFlagsCount: (c.redFlags || []).length,
      }));
      const done = cases.filter(c => c.validationsDone).length;
      const pending = cases.filter(c => c.status === 'Em Processamento' && !c.validationsDone).length;
      return Response.json({ total: cases.length, done, pending, cases });
    }

    // ─── ACTION: CLEAN ───
    console.log(`[BulkClean] Cleaning ${validCases.length} cases...`);

    // Delete old ComplianceScores
    let deletedScores = 0;
    for (const c of validCases) {
      const scores = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: c.id });
      for (const s of scores) {
        await base44.asServiceRole.entities.ComplianceScore.delete(s.id);
        deletedScores++;
      }
    }

    // Reset analysis fields on each case
    let resetCount = 0;
    for (const c of validCases) {
      await base44.asServiceRole.entities.OnboardingCase.update(c.id, {
        riskScore: null, riskScoreV4: null, subfaixa: null, subfaixaNome: null,
        iaDecision: null, iaExplanation: null, redFlags: [], bloqueiosAtivos: [],
        rollingReservePercent: 0, monitoramentoNivel: null, condicoesAutomaticas: [],
        bigDataCorpCompleted: false, cafCompleted: false, validationsCompleted: false,
        finalDecisionDate: null, status: 'Pendente',
      });
      resetCount++;
    }

    const duration = Date.now() - startTime;
    console.log(`[BulkClean] Done: ${resetCount} cases reset, ${deletedScores} scores deleted (${duration}ms)`);

    return Response.json({
      success: true,
      action: 'clean',
      casesReset: resetCount,
      scoresDeleted: deletedScores,
      caseIds: validCases.map(c => c.id),
      duration_ms: duration,
    });

  } catch (error) {
    console.error('[BulkClean] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});