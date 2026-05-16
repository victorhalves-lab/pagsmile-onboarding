import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Revalidação BDC — Unitária ou em Massa
 * 
 * Modes:
 *   - Single: { caseId: "abc123" }
 *   - Bulk:   { bulk: true, statusFilter: "Aprovado" }  (default: all non-Recusado)
 *   - dryRun: { bulk: true, dryRun: true } — simula sem salvar
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
    const { caseId, bulk, dryRun, statusFilter, limit } = body;

    if (!caseId && !bulk) {
      return Response.json({ error: 'Informe caseId (unitário) ou bulk: true (em massa)' }, { status: 400 });
    }

    // ── Single case revalidation ──
    if (caseId && !bulk) {
      const result = await revalidateSingleCase(base44, caseId, dryRun);
      return Response.json({ success: true, mode: 'single', dryRun: !!dryRun, result, elapsed: Date.now() - startTime });
    }

    // ── Bulk revalidation ──
    const allCases = await base44.asServiceRole.entities.OnboardingCase.list('-created_date', 1000);
    const validStatuses = statusFilter 
      ? [statusFilter] 
      : ['Aprovado', 'Manual', 'Em Processamento', 'Pendente'];
    
    const casesToProcess = allCases.filter(c => validStatuses.includes(c.status));
    const maxCases = limit || 50; // Rate limit safety
    const batch = casesToProcess.slice(0, maxCases);
    
    console.log(`[RevalidateBDC] Bulk: ${batch.length}/${casesToProcess.length} cases (limit=${maxCases}, filter=${validStatuses.join(',')})`);

    const results = [];
    let succeeded = 0, failed = 0, skipped = 0;

    for (const caseItem of batch) {
      try {
        // Throttle: 1.5s between calls to respect BDC rate limits
        if (results.length > 0) {
          await new Promise(r => setTimeout(r, 1500));
        }
        const r = await revalidateSingleCase(base44, caseItem.id, dryRun);
        results.push(r);
        if (r.status === 'success') succeeded++;
        else if (r.status === 'skipped') skipped++;
        else failed++;
      } catch (err) {
        failed++;
        results.push({ caseId: caseItem.id, status: 'error', error: err.message });
      }
    }

    return Response.json({
      success: true,
      mode: 'bulk',
      dryRun: !!dryRun,
      summary: {
        totalEligible: casesToProcess.length,
        processed: batch.length,
        succeeded,
        failed,
        skipped,
      },
      results,
      elapsed: Date.now() - startTime,
    });
  } catch (error) {
    console.error('[RevalidateBDC] Fatal:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ══════════════════════════════════════════════════════════════════
// QUICK RISK CHECK — lightweight assessment from BDC raw data
// ══════════════════════════════════════════════════════════════════
function quickRiskCheck(bdcResult, isPF) {
  let score = 80; // base
  const flags = [];

  if (isPF) {
    const bd = bdcResult?.BasicData || bdcResult?.basic_data;
    const first = Array.isArray(bd) ? bd[0] : bd;
    const status = first?.TaxIdStatus || first?.TaxIdStatusDescription || '';
    if (status && !String(status).toUpperCase().includes('REGULAR')) {
      score += 200;
      flags.push('CPF irregular');
    }
    const kyc = bdcResult?.Kyc || bdcResult?.kyc;
    if (kyc) {
      const items = Array.isArray(kyc) ? kyc : [kyc];
      for (const item of items) {
        if (item?.IsPEP || item?.IsPep) { score += 80; flags.push('PEP'); }
        if ((item?.Sanctions || []).length > 0) { score = 850; flags.push('Sancionado'); }
      }
    }
  } else {
    const bd = bdcResult?.BasicData || bdcResult?.basic_data;
    const first = Array.isArray(bd) ? bd[0] : bd;
    const status = first?.TaxIdStatus || first?.TaxIdStatusDescription || '';
    if (status && !String(status).toUpperCase().includes('ATIV')) {
      score = 850;
      flags.push('CNPJ inativo');
    }
    // Company age
    const founded = first?.FoundedDate || first?.Age?.FoundedDate;
    if (founded) {
      const months = (Date.now() - new Date(founded).getTime()) / (30.44 * 24 * 3600 * 1000);
      if (months < 6) { score += 30; flags.push('Empresa < 6 meses'); }
    }
    // Shell company
    const ai = bdcResult?.ActivityIndicators || bdcResult?.activity_indicators;
    if (ai) {
      const items = Array.isArray(ai) ? ai : [ai];
      for (const item of items) {
        const shell = item?.ShellCompanyLikelyhood ?? item?.ShellCompanyLikelihood;
        if (shell != null && Number(shell) > 0.8) { score = 850; flags.push('Shell Company'); }
      }
    }
    // Sanctions
    const kyc = bdcResult?.Kyc || bdcResult?.kyc;
    if (kyc) {
      const items = Array.isArray(kyc) ? kyc : [kyc];
      for (const item of items) {
        if ((item?.Sanctions || []).length > 0) { score = 850; flags.push('Sancionado'); }
      }
    }
    // Debt
    const debtors = bdcResult?.GovernmentDebtors || bdcResult?.government_debtors;
    if (debtors) {
      const items = Array.isArray(debtors) ? debtors : [debtors];
      let total = 0;
      for (const item of items) total += Number(item?.TotalValue || item?.Value || 0);
      if (total > 500000) { score += 80; flags.push(`D\u00edvida R$${(total/1000).toFixed(0)}k`); }
      else if (total > 100000) { score += 40; flags.push(`D\u00edvida R$${(total/1000).toFixed(0)}k`); }
    }
    // Processes
    const proc = bdcResult?.Processes || bdcResult?.processes;
    if (proc) {
      const items = Array.isArray(proc) ? proc : [proc];
      let total = 0;
      for (const item of items) total += Number(item?.TotalLawsuits || item?.NumberOfLawsuits || 0);
      if (total > 20) { score += 25; flags.push(`${total} processos`); }
      else if (total > 0) { score += 10; flags.push(`${total} processo(s)`); }
    }
    // PEP owners
    const ownersKyc = bdcResult?.OwnersKyc || bdcResult?.owners_kyc;
    if (ownersKyc) {
      const items = Array.isArray(ownersKyc) ? ownersKyc : [ownersKyc];
      for (const item of items) {
        if (item?.IsPEP || item?.IsPep) { score += 40; flags.push('S\u00f3cio PEP'); break; }
      }
    }
  }

  const finalScore = Math.min(score, 1000);
  const subfaixa = finalScore <= 99 ? '1A' : finalScore <= 199 ? '1B' : finalScore <= 299 ? '2A' : finalScore <= 399 ? '2B' : finalScore <= 499 ? '3A' : finalScore <= 599 ? '3B' : finalScore <= 849 ? '4' : '5';
  const subfaixaNames = { '1A': 'VERDE EXPRESS', '1B': 'VERDE', '2A': 'AZUL LEVE', '2B': 'AZUL', '3A': 'AMARELO', '3B': 'LARANJA', '4': 'VERMELHO', '5': 'BLOQUEIO' };

  return {
    estimatedScore: finalScore,
    estimatedSubfaixa: subfaixa,
    subfaixaNome: subfaixaNames[subfaixa],
    flags,
    summary: `Score estimado ${finalScore} (${subfaixaNames[subfaixa]})${flags.length > 0 ? ' — ' + flags.join(', ') : ''}`,
  };
}

// ══════════════════════════════════════════════════════════════════
// SINGLE CASE REVALIDATION
// ══════════════════════════════════════════════════════════════════
async function revalidateSingleCase(base44, caseId, dryRun) {
  const BDC_BASE_URL = 'https://plataforma.bigdatacorp.com.br';
  const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
  const tokenId = Deno.env.get('BDC_TOKEN_ID');

  if (!accessToken || !tokenId) {
    return { caseId, status: 'error', error: 'BDC tokens not configured' };
  }

  // Load case
  const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
  const onboardingCase = cases[0];
  if (!onboardingCase) return { caseId, status: 'error', error: 'Case not found' };

  // Load merchant
  const merchants = await base44.asServiceRole.entities.Merchant.filter({ id: onboardingCase.merchantId });
  const merchant = merchants[0];
  if (!merchant) return { caseId, status: 'error', error: 'Merchant not found' };

  const doc = merchant.cpfCnpj?.replace(/\D/g, '');
  if (!doc) return { caseId, status: 'skipped', reason: 'No CPF/CNPJ' };

  const isPF = merchant.type === 'PF' || doc.length === 11;
  const endpoint = isPF ? '/pessoas' : '/empresas';

  // Load existing score for comparison
  const existingScores = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: caseId });
  const existingScore = existingScores[0] || null;
  const oldScoreFinal = existingScore?.score_final ?? null;
  const oldSubfaixa = existingScore?.subfaixa ?? null;

  // Determine datasets (v3 — 2026-05-16: inclui novos datasets dos GAPs 3, 5, 7, 8, 9 + internos)
  const datasets = isPF 
    ? 'basic_data,kyc,processes,collections,media_profile_and_exposure,online_presence,first_level_family_kyc,first_level_relatives_kyc,bets_ownership,flags_and_features,financial_data,judicial_assets,related_people_phones,related_people_emails,related_people_addresses'
    : 'basic_data,registration_data,history_basic_data,company_evolution,phones_extended,emails_extended,addresses_extended,kyc,owners_kyc,economic_group_kyc,political_involvement,government_debtors,processes,lawsuits_distribution_data,owners_lawsuits,owners_lawsuits_distribution,media_profile_and_exposure,relationships,owners_influence,owners_electoral_donors,configurable_recency_qsa,company_group_owners,related_people_phones,related_people_emails,related_people_addresses,domains,passages,reputations_and_reviews,activity_indicators,marketplace_data,collections,merchant_category_data,licenses_and_authorizations,flags_and_features,companies_statistics,financial_data,default_business_data,corporate_chain,esg_and_compliance';

  console.log(`[RevalidateBDC] Querying ${doc} (${isPF ? 'PF' : 'PJ'}) for case ${caseId}`);

  // Query BDC
  const bdcResponse = await fetch(`${BDC_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'AccessToken': accessToken,
      'TokenId': tokenId,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Datasets: datasets,
      q: `doc{${doc}}`,
      Limit: 1,
    }),
  });

  const rawText = await bdcResponse.text();
  let bdcData;
  try { bdcData = JSON.parse(rawText); } catch {
    return { caseId, status: 'error', error: 'BDC parse error', raw: rawText.substring(0, 200) };
  }

  const bdcResult = bdcData.Result?.[0] || {};

  // Save BDC result and compute quick risk summary
  let newScoreFinal = null;
  let newSubfaixa = null;

  if (!dryRun) {
    try {
      // Save BDC raw data as ExternalValidationResult
      await base44.asServiceRole.entities.ExternalValidationResult.create({
        onboardingCaseId: caseId,
        provider: 'BigDataCorp',
        validationType: 'Revalidação BDC',
        endpoint: `${BDC_BASE_URL}${endpoint}`,
        resultData: bdcResult,
        status: 'Sucesso',
        timestamp: new Date().toISOString(),
        responseTime: bdcData.ElapsedMilliseconds || 0,
      });

      // Mark case as BDC completed
      await base44.asServiceRole.entities.OnboardingCase.update(caseId, {
        bigDataCorpCompleted: true,
      });

      console.log(`[RevalidateBDC] BDC data saved for case ${caseId}`);
    } catch (e) {
      console.warn('[RevalidateBDC] Save error:', e.message);
    }
  }

  // Quick risk assessment from BDC result for immediate feedback
  const quickAssessment = quickRiskCheck(bdcResult, isPF);
  newScoreFinal = quickAssessment.estimatedScore;
  newSubfaixa = quickAssessment.estimatedSubfaixa;
  
  // Last resort: check OnboardingCase
  if (newScoreFinal === null && !dryRun) {
    try {
      const updatedCases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
      if (updatedCases[0]?.riskScoreV4 != null) {
        newScoreFinal = updatedCases[0].riskScoreV4;
        newSubfaixa = updatedCases[0].subfaixa;
      }
    } catch (e) { /* ok */ }
  }

  // Determine if score changed
  const scoreChanged = oldScoreFinal !== null && newScoreFinal !== null && oldScoreFinal !== newScoreFinal;
  const scoreDelta = (oldScoreFinal != null && newScoreFinal != null) ? (newScoreFinal - oldScoreFinal) : 0;
  const subfaixaChanged = oldSubfaixa !== null && newSubfaixa !== null && oldSubfaixa !== newSubfaixa;

  // Update RevalidationSchedule if exists
  if (!dryRun) {
    try {
      const schedules = await base44.asServiceRole.entities.RevalidationSchedule.filter({ merchantId: onboardingCase.merchantId, status: 'pending' });
      for (const sched of schedules) {
        await base44.asServiceRole.entities.RevalidationSchedule.update(sched.id, {
          status: 'completed',
          lastRevalidationDate: new Date().toISOString(),
          onboardingCaseId: caseId,
          notes: `Revalidação BDC: ${quickAssessment.summary}`,
        });
      }
    } catch (logErr) {
      console.warn('[RevalidateBDC] Schedule update error:', logErr.message);
    }
  }

  return {
    caseId,
    merchantId: onboardingCase.merchantId,
    merchantName: merchant.fullName,
    document: doc,
    type: isPF ? 'PF' : 'PJ',
    status: 'success',
    oldScore: oldScoreFinal,
    newScore: newScoreFinal,
    scoreDelta,
    oldSubfaixa,
    newSubfaixa,
    subfaixaChanged,
    scoreWorsened: scoreDelta > 0,
    alert: scoreDelta > 50 ? 'CRITICAL' : scoreDelta > 20 ? 'WARNING' : subfaixaChanged ? 'INFO' : null,
  };
}