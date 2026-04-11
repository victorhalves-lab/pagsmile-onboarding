import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * autoEnrichOnboarding — Orquestra AUTOMATICAMENTE todo o pipeline de risco
 * quando um OnboardingCase é criado ou muda para "Em Processamento".
 *
 * Pipeline:
 * 1. BDC Enrichment (bdcEnrichCase) → Score V4 + dados brutos
 * 2. SENTINEL IA Analysis (analyzeOnboarding) → Análise qualitativa profunda
 * 3. Risk Scoring V4 individual (inline) → Recalcula com dados BDC+CAF reais
 *
 * Triggado por automação entity em OnboardingCase [create].
 * O cliente NÃO vê nada — apenas o time interno recebe os resultados.
 */

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Extract case ID from automation payload
    let caseId = body.onboardingCaseId;
    if (!caseId && body.event?.entity_id) caseId = body.event.entity_id;
    if (!caseId && body.data?.id) caseId = body.data.id;

    if (!caseId) {
      console.log('[AutoEnrich] No caseId found in payload, skipping.');
      return Response.json({ skipped: true, reason: 'no_case_id' });
    }

    // Load case
    const [onboardingCase] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
    if (!onboardingCase) {
      console.log(`[AutoEnrich] Case ${caseId} not found.`);
      return Response.json({ skipped: true, reason: 'case_not_found' });
    }

    // Only run for new cases that have a merchant and template
    if (!onboardingCase.merchantId || !onboardingCase.questionnaireTemplateId) {
      console.log(`[AutoEnrich] Case ${caseId} missing merchantId or templateId, skipping.`);
      return Response.json({ skipped: true, reason: 'incomplete_case' });
    }

    // Don't re-process if BDC already ran
    if (onboardingCase.bigDataCorpCompleted && onboardingCase.riskScoreV4 != null) {
      console.log(`[AutoEnrich] Case ${caseId} already enriched (BDC+V4). Skipping.`);
      return Response.json({ skipped: true, reason: 'already_enriched' });
    }

    console.log(`[AutoEnrich] Starting full pipeline for case ${caseId}`);

    // Update status to "Em Processamento"
    await base44.asServiceRole.entities.OnboardingCase.update(caseId, {
      status: 'Em Processamento'
    });

    // ═══ STEP 1: BDC Enrichment ═══
    let bdcSuccess = false;
    try {
      console.log(`[AutoEnrich] Step 1: Running BDC enrichment...`);
      const bdcRes = await base44.asServiceRole.functions.invoke('bdcEnrichCase', {
        onboardingCaseId: caseId
      });
      bdcSuccess = bdcRes?.data?.success === true;
      console.log(`[AutoEnrich] BDC result: success=${bdcSuccess}, score=${bdcRes?.data?.analysis?.scoring?.finalScore}`);
    } catch (bdcErr) {
      console.warn(`[AutoEnrich] BDC enrichment failed (non-blocking): ${bdcErr.message}`);
    }

    // ═══ STEP 2: SENTINEL IA Analysis ═══
    let sentinelSuccess = false;
    try {
      console.log(`[AutoEnrich] Step 2: Running SENTINEL analysis...`);
      const sentinelRes = await base44.asServiceRole.functions.invoke('analyzeOnboarding', {
        onboardingCaseId: caseId
      });
      sentinelSuccess = sentinelRes?.data?.success === true;
      console.log(`[AutoEnrich] SENTINEL result: success=${sentinelSuccess}, recommendation=${sentinelRes?.data?.recomendacao}`);
    } catch (sentinelErr) {
      console.warn(`[AutoEnrich] SENTINEL analysis failed (non-blocking): ${sentinelErr.message}`);
    }

    const duration = Date.now() - startTime;
    console.log(`[AutoEnrich] Pipeline completed in ${duration}ms. BDC=${bdcSuccess}, SENTINEL=${sentinelSuccess}`);

    return Response.json({
      success: true,
      caseId,
      bdcSuccess,
      sentinelSuccess,
      duration_ms: duration
    });

  } catch (error) {
    console.error('[AutoEnrich] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});