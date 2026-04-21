import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * bulkReprocessCompliance
 * 
 * Actions:
 * - "list"  → Lista todos os cases com dados do merchant (para a UI de seleção)
 * - "clean" → Limpa análises antigas dos caseIds fornecidos
 * 
 * A FASE 2 (reprocessamento) é feita pelo frontend chamando autoEnrichOnboarding
 * caso a caso com o token do admin logado.
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
    const action = body.action || 'list';
    const filterCaseIds = body.caseIds || null;

    // Load cases
    let allCases = await base44.asServiceRole.entities.OnboardingCase.list('-created_date', 200);
    const validCases = allCases.filter(c => c.merchantId && c.questionnaireTemplateId);

    if (action === 'list') {
      // Load merchants for display
      const merchantIds = [...new Set(validCases.map(c => c.merchantId))];
      const allMerchants = await base44.asServiceRole.entities.Merchant.list('-created_date', 200);
      const merchantMap = {};
      for (const m of allMerchants) merchantMap[m.id] = m;

      const cases = validCases.map(c => {
        const m = merchantMap[c.merchantId];
        return {
          id: c.id,
          merchantId: c.merchantId,
          merchantName: m?.fullName || m?.companyName || 'N/D',
          merchantCpfCnpj: m?.cpfCnpj || '',
          merchantType: m?.type || '',
          status: c.status,
          score: c.riskScoreV4,
          subfaixa: c.subfaixa,
          subfaixaNome: c.subfaixaNome,
          iaDecision: c.iaDecision,
          bdcDone: !!c.bigDataCorpCompleted,
          cafDone: !!c.cafCompleted,
          validationsDone: !!c.validationsCompleted,
          redFlagsCount: (c.redFlags || []).length,
          createdDate: c.created_date,
        };
      });

      return Response.json({ success: true, cases });
    }

    // ─── ACTION: CLEAN ───
    if (action === 'clean') {
      const targetCases = filterCaseIds?.length
        ? validCases.filter(c => filterCaseIds.includes(c.id))
        : validCases;

      console.log(`[BulkClean] Cleaning ${targetCases.length} cases...`);

      let deletedScores = 0;
      for (const c of targetCases) {
        const scores = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: c.id });
        for (const s of scores) {
          await base44.asServiceRole.entities.ComplianceScore.delete(s.id);
          deletedScores++;
        }
      }

      let resetCount = 0;
      for (const c of targetCases) {
        await base44.asServiceRole.entities.OnboardingCase.update(c.id, {
          riskScore: null, riskScoreV4: null, subfaixa: null, subfaixaNome: null,
          iaDecision: null, iaExplanation: null, redFlags: [], bloqueiosAtivos: [],
          rollingReservePercent: 0, monitoramentoNivel: null, condicoesAutomaticas: [],
          bigDataCorpCompleted: false, cafCompleted: false, validationsCompleted: false,
          finalDecisionDate: null, status: 'Em Processamento',
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
        caseIds: targetCases.map(c => c.id),
        duration_ms: duration,
      });
    }

    return Response.json({ error: 'Invalid action. Use "list" or "clean".' }, { status: 400 });

  } catch (error) {
    console.error('[BulkReprocess] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});