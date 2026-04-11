import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * autoEnrichOnboarding — Orquestra AUTOMATICAMENTE todo o pipeline de risco
 * quando um OnboardingCase é criado ou muda para "Em Processamento".
 *
 * Pipeline COMPLETO (atualizado com Fases CAF):
 *
 * Step 0: cafPostCaptureAnalysis → OCR + Documentoscopy + Doc Liveness + Deepfake + Biometria + Facesets
 * Step 1: bdcEnrichCase (já existe) → Score V4 + dados brutos BDC
 * Step 2: cafScreeningInternacional → PEPs + Sanctions + Interpol (por sócio, usando nomes do BDC)
 * Step 2.5: cafCpfValidation → Cross-check CPF CAF vs BDC
 * Step 3: analyzeOnboarding / SENTINEL → IA análise qualitativa com TODOS os dados
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

    // ═══ STEP 0: CAF Post-Capture Analysis (OCR + Documentoscopy + Deepfake + Biometria) ═══
    let cafPostCaptureSuccess = false;
    if (onboardingCase.cafCompleted) {
      try {
        console.log(`[AutoEnrich] Step 0: Running CAF post-capture analysis...`);
        const cafRes = await base44.asServiceRole.functions.invoke('cafPostCaptureAnalysis', {
          onboardingCaseId: caseId
        });
        cafPostCaptureSuccess = cafRes?.data?.success === true;
        console.log(`[AutoEnrich] CAF post-capture: success=${cafPostCaptureSuccess}`);
      } catch (cafErr) {
        console.warn(`[AutoEnrich] CAF post-capture failed (non-blocking): ${cafErr.message}`);
      }
    } else {
      console.log(`[AutoEnrich] Step 0: Skipped (cafCompleted=${onboardingCase.cafCompleted})`);
    }

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

    // ═══ STEP 2: CAF Screening Internacional (PEPs + Sanctions + Interpol) ═══
    let screeningSuccess = false;
    try {
      console.log(`[AutoEnrich] Step 2: Running CAF international screening...`);
      const screenRes = await base44.asServiceRole.functions.invoke('cafScreeningInternacional', {
        onboardingCaseId: caseId
      });
      screeningSuccess = screenRes?.data?.success === true;
      console.log(`[AutoEnrich] Screening: success=${screeningSuccess}, risk=${screenRes?.data?.overallRisk}, persons=${screenRes?.data?.personsScreened}`);
    } catch (screenErr) {
      console.warn(`[AutoEnrich] Screening failed (non-blocking): ${screenErr.message}`);
    }

    // ═══ STEP 2.5: CAF CPF Cross-Validation ═══
    let cpfValidationSuccess = false;
    const [merchant] = await base44.asServiceRole.entities.Merchant.filter({ id: onboardingCase.merchantId });
    const merchantCpf = merchant?.cpfCnpj?.replace(/\D/g, '');
    if (merchantCpf && (merchant?.type === 'PF' || merchantCpf.length === 11)) {
      try {
        console.log(`[AutoEnrich] Step 2.5: Running CPF cross-validation...`);
        const cpfRes = await base44.asServiceRole.functions.invoke('cafCpfValidation', {
          cpf: merchantCpf,
          onboardingCaseId: caseId
        });
        cpfValidationSuccess = cpfRes?.data?.success === true;
        console.log(`[AutoEnrich] CPF validation: success=${cpfValidationSuccess}, risk=${cpfRes?.data?.riskLevel}`);
      } catch (cpfErr) {
        console.warn(`[AutoEnrich] CPF validation failed (non-blocking): ${cpfErr.message}`);
      }
    } else {
      console.log(`[AutoEnrich] Step 2.5: Skipped (PJ or no CPF)`);
    }

    // ═══ STEP 3: SENTINEL IA Analysis ═══
    let sentinelSuccess = false;
    try {
      console.log(`[AutoEnrich] Step 3: Running SENTINEL analysis...`);
      const sentinelRes = await base44.asServiceRole.functions.invoke('analyzeOnboarding', {
        onboardingCaseId: caseId
      });
      sentinelSuccess = sentinelRes?.data?.success === true;
      console.log(`[AutoEnrich] SENTINEL result: success=${sentinelSuccess}, recommendation=${sentinelRes?.data?.recomendacao}`);
    } catch (sentinelErr) {
      console.warn(`[AutoEnrich] SENTINEL analysis failed (non-blocking): ${sentinelErr.message}`);
    }

    const duration = Date.now() - startTime;
    console.log(`[AutoEnrich] Pipeline completed in ${duration}ms. CAF=${cafPostCaptureSuccess}, BDC=${bdcSuccess}, Screening=${screeningSuccess}, CPF=${cpfValidationSuccess}, SENTINEL=${sentinelSuccess}`);

    return Response.json({
      success: true,
      caseId,
      cafPostCaptureSuccess,
      bdcSuccess,
      screeningSuccess,
      cpfValidationSuccess,
      sentinelSuccess,
      duration_ms: duration
    });

  } catch (error) {
    console.error('[AutoEnrich] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});