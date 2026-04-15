import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * bulkReprocessCompliance — Reset de análises + reprocessamento completo V5.
 *
 * O QUE FAZ:
 * 1. Lista todos os OnboardingCases
 * 2. Para cada caso: limpa campos de análise/score/decisão
 * 3. Deleta ComplianceScores antigos (serão recriados pelo pipeline)
 * 4. Chama autoEnrichOnboarding para reprocessar com pipeline V5 completo
 *
 * O QUE PRESERVA:
 * - QuestionnaireResponse (respostas do questionário)
 * - DocumentUpload (documentos enviados)
 * - IntegrationLog (audit trail)
 * - ExternalValidationResult (raw data de validações)
 * - Dados do Merchant (cadastro)
 * - manualReviewComments, manualReviewDate (comentários manuais)
 *
 * Parâmetros opcionais:
 * - dryRun: true → só lista o que faria, sem executar
 * - caseIds: ["id1","id2"] → reprocessar apenas esses IDs
 * - delayMs: tempo entre cada caso (default 3000ms)
 */

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);

    // Auth: admin-only
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const dryRun = body.dryRun === true;
    const filterCaseIds = body.caseIds || null; // null = all
    const delayMs = body.delayMs || 3000;

    console.log(`[BulkReprocess] ═══ Starting ${dryRun ? 'DRY RUN' : 'FULL REPROCESS'} ═══`);

    // ─── Load all cases ───
    let allCases = await base44.asServiceRole.entities.OnboardingCase.list('-created_date', 200);
    
    if (filterCaseIds && filterCaseIds.length > 0) {
      allCases = allCases.filter(c => filterCaseIds.includes(c.id));
    }

    // Skip cases without essential data
    const validCases = allCases.filter(c => c.merchantId && c.questionnaireTemplateId);
    const skippedCases = allCases.filter(c => !c.merchantId || !c.questionnaireTemplateId);

    console.log(`[BulkReprocess] Total cases: ${allCases.length}, Valid: ${validCases.length}, Skipped (incomplete): ${skippedCases.length}`);

    if (dryRun) {
      const preview = validCases.map(c => ({
        id: c.id,
        merchantId: c.merchantId,
        currentStatus: c.status,
        currentScore: c.riskScoreV4,
        currentSubfaixa: c.subfaixa,
        redFlagsCount: (c.redFlags || []).length,
        bdcCompleted: c.bigDataCorpCompleted,
        cafCompleted: c.cafCompleted,
        validationsCompleted: c.validationsCompleted,
      }));
      return Response.json({
        dryRun: true,
        totalCases: allCases.length,
        willProcess: validCases.length,
        willSkip: skippedCases.length,
        skippedIds: skippedCases.map(c => c.id),
        cases: preview,
      });
    }

    // ─── FASE 1: Delete old ComplianceScores ───
    console.log(`[BulkReprocess] FASE 1: Deleting old ComplianceScores...`);
    let deletedScores = 0;
    for (const c of validCases) {
      const scores = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: c.id });
      for (const s of scores) {
        await base44.asServiceRole.entities.ComplianceScore.delete(s.id);
        deletedScores++;
      }
    }
    console.log(`[BulkReprocess] FASE 1: Deleted ${deletedScores} ComplianceScores`);

    // ─── FASE 2: Reset analysis fields on each case + reprocess ───
    console.log(`[BulkReprocess] FASE 2: Resetting + reprocessing ${validCases.length} cases...`);

    const results = [];

    for (let i = 0; i < validCases.length; i++) {
      const c = validCases[i];
      const caseStart = Date.now();
      console.log(`[BulkReprocess] ──── Case ${i + 1}/${validCases.length}: ${c.id} ────`);

      // Reset analysis fields (preserve responses, docs, merchant, manual comments)
      await base44.asServiceRole.entities.OnboardingCase.update(c.id, {
        // Reset scores
        riskScore: null,
        riskScoreV4: null,
        subfaixa: null,
        subfaixaNome: null,
        // Reset decisions
        iaDecision: null,
        iaExplanation: null,
        redFlags: [],
        bloqueiosAtivos: [],
        // Reset conditions
        rollingReservePercent: 0,
        monitoramentoNivel: null,
        condicoesAutomaticas: [],
        // Reset completion flags (needed for autoEnrichOnboarding guard)
        bigDataCorpCompleted: false,
        cafCompleted: false,
        validationsCompleted: false,
        // Reset decision date (keep manual review comments!)
        finalDecisionDate: null,
        // Set processing status
        status: 'Em Processamento',
      });

      // Call the full pipeline
      let pipelineResult = null;
      try {
        const res = await base44.asServiceRole.functions.invoke('autoEnrichOnboarding', {
          onboardingCaseId: c.id
        });
        pipelineResult = res?.data || res;
        console.log(`[BulkReprocess] Case ${c.id}: Pipeline OK — decision=${pipelineResult?.decision?.finalDecision}, score=${pipelineResult?.pipeline?.bdcSuccess ? 'OK' : 'FAIL'}`);
      } catch (pipeErr) {
        pipelineResult = { error: pipeErr.message };
        console.error(`[BulkReprocess] Case ${c.id}: Pipeline FAILED — ${pipeErr.message}`);
      }

      results.push({
        caseId: c.id,
        merchantId: c.merchantId,
        previousStatus: c.status,
        previousScore: c.riskScoreV4,
        newDecision: pipelineResult?.decision?.finalDecision || pipelineResult?.error || 'unknown',
        success: !pipelineResult?.error,
        duration_ms: Date.now() - caseStart,
      });

      // Delay between cases to avoid API rate limits
      if (i < validCases.length - 1) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }

    // ─── FASE 3: Summary ───
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const totalDuration = Date.now() - startTime;

    console.log(`[BulkReprocess] ═══ COMPLETE: ${successCount}/${validCases.length} success, ${failCount} failed, ${totalDuration}ms total ═══`);

    // Slack summary
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
      const summaryLines = [
        `🔄 *Reprocessamento Completo de Compliance Finalizado*`,
        ``,
        `📊 *Resumo:*`,
        `  • Total de casos: ${validCases.length}`,
        `  • Sucesso: ${successCount} ✅`,
        failCount > 0 ? `  • Falhas: ${failCount} ❌` : '',
        `  • Scores antigos deletados: ${deletedScores}`,
        `  • Tempo total: ${Math.round(totalDuration / 1000)}s`,
        ``,
        `📋 *Resultados por caso:*`,
        ...results.map(r => 
          `  ${r.success ? '✅' : '❌'} ${r.caseId.slice(-6)} — ${r.previousStatus}→${r.newDecision} (${r.duration_ms}ms)`
        ),
      ].filter(Boolean).join('\n');

      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: '#compliance', text: summaryLines, unfurl_links: false }),
      });
    } catch (slackErr) {
      console.warn(`[BulkReprocess] Slack notification failed: ${slackErr.message}`);
    }

    return Response.json({
      success: true,
      summary: {
        totalCases: validCases.length,
        processed: successCount,
        failed: failCount,
        deletedScores,
        duration_ms: totalDuration,
      },
      results,
    });

  } catch (error) {
    console.error('[BulkReprocess] Fatal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});