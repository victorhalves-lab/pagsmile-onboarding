import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * bulkRevalidateAll — Revalida TODOS os casos de compliance.
 * 
 * Executa o pipeline por partes diretamente (sem chamar autoEnrichOnboarding):
 *   1. bdcEnrichCase (Score V4 + dados BDC)
 *   2. revalidateRiskScoring (Recálculo V4)
 * 
 * Payload:
 *   { statusFilter?: string[], limit?: number, dryRun?: boolean }
 */

Deno.serve(async (req) => {
  const startTime = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      statusFilter = ['Aprovado', 'Manual', 'Em Processamento', 'Pendente'],
      limit = 200,
      dryRun = false,
    } = body;

    // Load all cases
    const allCases = await base44.asServiceRole.entities.OnboardingCase.list('-created_date', 1000);
    const eligible = allCases.filter(c => statusFilter.includes(c.status));
    const batch = eligible.slice(0, limit);

    console.log(`[BulkRevalidate] Total: ${allCases.length}, eligible: ${eligible.length}, batch: ${batch.length}, dryRun: ${dryRun}`);

    if (dryRun) {
      return Response.json({
        success: true, dryRun: true,
        summary: { totalCases: allCases.length, eligible: eligible.length, wouldProcess: batch.length },
        cases: batch.map(c => ({
          id: c.id, merchantId: c.merchantId, status: c.status,
          subfaixa: c.subfaixa, riskScoreV4: c.riskScoreV4,
        })),
      });
    }

    // Step 1: Run BDC enrichment on all cases (this does BDC query + V4 scoring)
    const results = [];
    let bdcSucceeded = 0, bdcFailed = 0;

    for (let i = 0; i < batch.length; i++) {
      const caseItem = batch[i];
      try {
        console.log(`[BulkRevalidate] BDC ${i + 1}/${batch.length}: case ${caseItem.id}`);

        const res = await base44.functions.invoke('bdcEnrichCase', {
          onboardingCaseId: caseItem.id,
        });

        const data = res?.data || res;
        bdcSucceeded++;
        results.push({
          caseId: caseItem.id,
          bdcStatus: 'success',
          scoreFinal: data?.analysis?.scoring?.finalScore ?? null,
          subfaixa: data?.analysis?.scoring?.subfaixa ?? null,
        });

        // Throttle: 2s between BDC calls
        if (i < batch.length - 1) {
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (err) {
        bdcFailed++;
        results.push({ caseId: caseItem.id, bdcStatus: 'error', error: err.message });
        console.error(`[BulkRevalidate] BDC failed for ${caseItem.id}: ${err.message}`);
      }
    }

    // Step 2: Run V4 risk scoring recalculation on all cases
    let scoringSuccess = false;
    try {
      console.log(`[BulkRevalidate] Running V4 risk scoring recalculation...`);
      const scoringRes = await base44.functions.invoke('revalidateRiskScoring', { dryRun: false });
      scoringSuccess = scoringRes?.data?.success === true;
      console.log(`[BulkRevalidate] V4 scoring: ${scoringSuccess ? 'OK' : 'FAILED'}`);
    } catch (err) {
      console.error(`[BulkRevalidate] V4 scoring failed: ${err.message}`);
    }

    const elapsed = Date.now() - startTime;
    console.log(`[BulkRevalidate] ═══ Done: BDC ${bdcSucceeded}/${batch.length}, V4 scoring=${scoringSuccess}, ${elapsed}ms ═══`);

    return Response.json({
      success: true,
      summary: {
        totalCases: allCases.length,
        eligible: eligible.length,
        processed: batch.length,
        bdcSucceeded,
        bdcFailed,
        scoringRecalculated: scoringSuccess,
        elapsed_ms: elapsed,
      },
      results,
    });
  } catch (error) {
    console.error('[BulkRevalidate] Fatal:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});