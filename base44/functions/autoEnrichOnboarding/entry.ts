import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * autoEnrichOnboarding — Orquestrador UNIFICADO do pipeline de risco.
 *
 * ARQUITETURA DATA-FIRST v7.0:
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │ Step 0:   CAF Post-Capture (OCR, Documentoscopy, Biometria)│
 * │ Step 0.5: CAF Profile Check (histórico cross-merchant)     │
 * │ Step 1:   BDC Enrichment → Score V4 DETERMINÍSTICO         │
 * │ Step 1.5: CAF Full Enrichment (KYC/KYB completo)           │
 * │ Step 1.7: CAF Credit Analysis (segunda fonte crédito)      │
 * │ Step 2:   CAF Screening Internacional (PEP/Sanctions)      │
 * │ Step 2.5: CAF CPF Cross-Validation                         │
 * │ Step 2.7: VerifAI Docs (documentos pendentes)              │
 * │ Step 3:   SENTINEL IA → Relatório qualitativo (SEM DECISÃO)│
 * │ Step 4:   DECISÃO 100% DETERMINÍSTICA (subfaixa V4 + CAF)  │
 * │ Step 5:   Slack Notification                                │
 * └─────────────────────────────────────────────────────────────┘
 *
 * REGRA DE OURO v7:
 * - V4 (bdcEnrichCase) = DECISOR ABSOLUTO: score, subfaixa, bloqueios
 * - SENTINEL (analyzeOnboarding) = RELATOR APENAS: narrativa, dossiê,
 *   cross-validation, parecer (NÃO afeta decisão)
 * - DECISÃO FINAL = 100% determinística: subfaixa V4 + bloqueios + CAF fraud
 * - SENTINEL NUNCA escala, NUNCA veta, NUNCA muda status
 * - Subfaixas 1A→3B = APROVAÇÃO AUTOMÁTICA (com condições progressivas)
 * - Subfaixa 4 = único caso de Revisão Manual
 * - Subfaixa 5 = Recusado (bloqueios V4 ativos)
 */

function hasObjectiveBlocksEarly(caseObj) {
  return Array.isArray(caseObj?.bloqueiosAtivos) && caseObj.bloqueiosAtivos.length > 0;
}

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

    if (!onboardingCase.merchantId || !onboardingCase.questionnaireTemplateId) {
      console.log(`[AutoEnrich] Case ${caseId} missing merchantId or templateId, skipping.`);
      return Response.json({ skipped: true, reason: 'incomplete_case' });
    }

    // Don't re-process if already fully enriched
    if (onboardingCase.bigDataCorpCompleted && onboardingCase.validationsCompleted) {
      console.log(`[AutoEnrich] Case ${caseId} already fully enriched. Skipping.`);
      return Response.json({ skipped: true, reason: 'already_enriched' });
    }

    console.log(`[AutoEnrich] ═══ Starting UNIFIED pipeline for case ${caseId} ═══`);

    await base44.asServiceRole.entities.OnboardingCase.update(caseId, { status: 'Em Processamento' });

    // Load merchant data early — needed by multiple steps
    const [merchant] = await base44.asServiceRole.entities.Merchant.filter({ id: onboardingCase.merchantId });
    const merchantCpf = merchant?.cpfCnpj?.replace(/\D/g, '');

    // ═══ PRE-EXTRACTION: Representante Legal CPF/Name ═══
    // Extracted from questionnaire BEFORE BDC runs (for Step 0 CAF).
    // AFTER BDC runs (Step 1), we'll enrich with BDC sócios data (P5 — highest priority).
    //
    // Priority chain (ascending — higher number wins):
    //   P1: Any 11-digit CPF / "Nome completo" generic in questionnaire
    //   P2: First sócio from ComplianceSession.formData.socios
    //   P3: "CPF/Nome do Responsável Legal" question response
    //   P4: "CPF/Nome do Representante Legal" question response
    //   P5: BDC Relationships (QSA) — first sócio from official Receita Federal data (post-Step 1)
    let representanteCpf = null;
    let representanteNome = null;
    let repCpfPriority = 0;
    let repNamePriority = 0;

    if (merchant?.type === 'PJ' || (merchantCpf && merchantCpf.length === 14)) {
      try {
        const responses = await base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId: caseId });
        for (const r of responses) {
          const t = (r.questionText || '').toLowerCase();
          const val = r.valueText || '';
          const cleanVal = val.replace(/\D/g, '');

          if (cleanVal.length === 11 && t.includes('cpf') && t.includes('representante') && t.includes('legal') && repCpfPriority < 4) {
            representanteCpf = cleanVal; repCpfPriority = 4;
          }
          if (cleanVal.length === 11 && t.includes('cpf') && (t.includes('responsável') || t.includes('responsavel')) && repCpfPriority < 3) {
            representanteCpf = cleanVal; repCpfPriority = 3;
          }
          if (cleanVal.length === 11 && repCpfPriority < 1) {
            representanteCpf = cleanVal; repCpfPriority = 1;
          }

          if (t.includes('representante legal') && t.includes('nome') && val.length > 3 && repNamePriority < 4) {
            representanteNome = val; repNamePriority = 4;
          }
          if ((t.includes('responsável legal') || (t.includes('nome') && t.includes('responsável'))) && val.length > 3 && repNamePriority < 3) {
            representanteNome = val; repNamePriority = 3;
          }
          if (t.includes('nome completo') && val.length > 3 && repNamePriority < 1) {
            representanteNome = val; repNamePriority = 1;
          }
        }

        // Source 2: ComplianceSession.formData.socios
        if ((repCpfPriority < 2 || repNamePriority < 2) && onboardingCase.onboardingLinkCode) {
          try {
            const sessions = await base44.asServiceRole.entities.ComplianceSession.filter({
              status: 'completed',
              linkCode: onboardingCase.onboardingLinkCode,
            });
            const sessionFormData = sessions[0]?.formData || null;
            const socios = sessionFormData?.socios || [];
            if (Array.isArray(socios) && socios.length > 0) {
              for (const socio of socios) {
                const socioCpf = (socio.cpf || '').replace(/\D/g, '');
                const socioNome = (socio.nome || '').trim();
                if (socioCpf.length === 11 && repCpfPriority < 2) { representanteCpf = socioCpf; repCpfPriority = 2; }
                if (socioNome.length > 3 && socioNome.includes(' ') && repNamePriority < 2) { representanteNome = socioNome; repNamePriority = 2; }
                if (repCpfPriority >= 2 && repNamePriority >= 2) break;
              }
              console.log(`[AutoEnrich] Found ${socios.length} sócios in ComplianceSession`);
            }
          } catch (sessErr) { console.warn('[AutoEnrich] ComplianceSession socios:', sessErr.message); }
        }

        console.log(`[AutoEnrich] Pre-BDC Representante: CPF=${representanteCpf ? representanteCpf.substring(0, 3) + '***' + representanteCpf.substring(8) : 'EMPTY'} (P${repCpfPriority}), Name=${representanteNome || 'EMPTY'} (P${repNamePriority})`);
      } catch (e) { console.warn('[AutoEnrich] Could not extract representante CPF:', e.message); }
    }

    // ═══ STEP 0: CAF Post-Capture Analysis ═══
    // ITEM 1 FIX: Now passes callbackUrl so async results (documentscopy, deepfake, etc.) return via webhook
    let cafPostCaptureSuccess = false;
    if (onboardingCase.docCompleted || onboardingCase.cafCompleted) {
      try {
        console.log(`[AutoEnrich] Step 0: CAF post-capture...`);
        const cafRes = await base44.asServiceRole.functions.invoke('cafPostCaptureAnalysis', { 
          onboardingCaseId: caseId,
          cpf: representanteCpf || (merchantCpf?.length === 11 ? merchantCpf : undefined),
          name: representanteNome || merchant?.fullName || undefined,
        });
        cafPostCaptureSuccess = cafRes?.data?.success === true;
        console.log(`[AutoEnrich] Step 0: ${cafPostCaptureSuccess ? 'OK' : 'FAILED'}`);
      } catch (cafErr) {
        console.warn(`[AutoEnrich] Step 0 failed (non-blocking): ${cafErr.message}`);
      }
    }

    // ═══ STEP 0.5: CAF Profile Check (ITEM 5 — cross-merchant history) ═══
    // For PJ: check profile of the representante legal (person), not just the company
    let profileCheckSuccess = false;
    try {
      console.log(`[AutoEnrich] Step 0.5: CAF profile check...`);
      const profileParams = { onboardingCaseId: caseId };
      if (merchantCpf && (merchant?.type === 'PF' || merchantCpf.length === 11)) {
        profileParams.cpf = merchantCpf;
      } else if (merchant?.cpfCnpj) {
        const doc = merchant.cpfCnpj.replace(/\D/g, '');
        if (doc.length === 14) {
          profileParams.cnpj = doc;
          // Also check representante legal profile for PJ
          if (representanteCpf) profileParams.cpf = representanteCpf;
        } else {
          profileParams.cpf = doc;
        }
      }
      if (profileParams.cpf || profileParams.cnpj) {
        const profileRes = await base44.asServiceRole.functions.invoke('cafCheckProfile', profileParams);
        profileCheckSuccess = profileRes?.data?.success === true;
        console.log(`[AutoEnrich] Step 0.5: ${profileCheckSuccess ? 'OK' : 'FAILED'} — profileExists=${profileRes?.data?.profileExists}, flags=${profileRes?.data?.flagCount || 0}`);
      } else {
        console.log(`[AutoEnrich] Step 0.5: Skipped — no CPF/CNPJ available`);
      }
    } catch (profileErr) {
      console.warn(`[AutoEnrich] Step 0.5 failed (non-blocking): ${profileErr.message}`);
    }

    // ═══ STEP 1: BDC Enrichment → Score V4 (DETERMINÍSTICO) ═══
    // v8: BDC agora tem retry em queue persistente. Se lotes CRÍTICOS falharem,
    // bdcEnrichCase retorna 202 + enfileira retry — pipeline PARA aqui até BDC voltar.
    //
    // v9 (2026-04-19): Se o caso JÁ está com bigDataCorpCompleted=true (ex: BDC rodou
    // via outra rota — bdcRetryWorker, admin manual, fluxo client-side), pulamos o
    // Step 1 para evitar re-consumo de créditos + contornar o bug conhecido de
    // `asServiceRole.functions.invoke` retornar 403 em cadeia de funções.
    let bdcSuccess = false;
    let bdcEnqueued = false;
    let bdcSkipped = false;

    // v10 (2026-04-21): Re-executa BDC se queue completou APÓS o último score.
    // Isso garante que quando bdcRetryWorker completa lotes non-critical, o score
    // V4 é recalculado com todos os 13 analyzers populados.
    let shouldSkipBdc = false;
    if (onboardingCase.bigDataCorpCompleted === true && onboardingCase.riskScoreV4 != null) {
      try {
        const queues = await base44.asServiceRole.entities.BdcRetryQueue.filter({ onboarding_case_id: caseId });
        // v11 (2026-04-21): Se não há BdcRetryQueue, é estado residual de run antigo
        // (provavelmente após clean via bulkReprocessCompliance). Força re-execução.
        if (queues.length === 0) {
          console.log(`[AutoEnrich] Step 1: No BdcRetryQueue found — treating as fresh run, BDC will re-execute`);
          shouldSkipBdc = false;
        } else {
          const queue = queues[0];
          const existingScores = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: caseId });
          const existingScore = existingScores[0];
          const queueSuccessAt = queue?.last_success_at ? new Date(queue.last_success_at).getTime() : 0;
          const lastScoreAt = existingScore?.data_analise_fase_2 ? new Date(existingScore.data_analise_fase_2).getTime() : 0;
          const queueCompletedAfterScore = queueSuccessAt > 0 && queueSuccessAt > lastScoreAt;
          if (!queueCompletedAfterScore) shouldSkipBdc = true;
          else console.log(`[AutoEnrich] Step 1: Re-running BDC — queue completed (${new Date(queueSuccessAt).toISOString()}) after last score (${new Date(lastScoreAt).toISOString()})`);
        }
      } catch (e) {
        shouldSkipBdc = true; // fallback: comportamento antigo
      }
    }

    if (shouldSkipBdc) {
      console.log(`[AutoEnrich] Step 1: SKIPPED — BDC já completo (score V4=${onboardingCase.riskScoreV4}, subfaixa=${onboardingCase.subfaixa})`);
      bdcSuccess = true;
      bdcSkipped = true;
    } else {
      try {
        console.log(`[AutoEnrich] Step 1: BDC enrichment (V4 scoring)...`);
        const bdcRes = await base44.asServiceRole.functions.invoke('bdcEnrichCase', { onboardingCaseId: caseId });
        bdcSuccess = bdcRes?.data?.success === true;
        const enqueueReason = bdcRes?.data?.reason;
        bdcEnqueued = enqueueReason === 'critical_batches_failed_enqueued' || enqueueReason === 'non_critical_batches_failed_enqueued';

        if (bdcEnqueued) {
          console.warn(`[AutoEnrich] ⏸️  Step 1: Batches failed (${enqueueReason}) — BDC enqueued for retry. BLOCKING pipeline.`);
          console.warn(`[AutoEnrich] Failed batches: ${(bdcRes?.data?.failedBatches || []).join(', ')}`);
          return Response.json({
            success: false, blocked: true, reason: enqueueReason,
            failedBatches: bdcRes?.data?.failedBatches,
            message: 'Pipeline bloqueado — aguardando BDC completar todos os lotes. Retry automático em andamento.',
          });
        }
        console.log(`[AutoEnrich] Step 1: ${bdcSuccess ? 'OK' : 'FAILED'} — V4 score=${bdcRes?.data?.analysis?.scoring?.finalScore}`);
      } catch (bdcErr) {
        console.error(`[AutoEnrich] Step 1 ERROR (non-blocking): ${bdcErr.message}`);
        // v9: Falha NÃO bloqueia mais o pipeline. Re-verificamos o estado do caso:
        // se BDC completou por outra rota (webhook BDC, admin manual), continuamos.
        const [recheckCase] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
        if (recheckCase?.bigDataCorpCompleted === true && recheckCase?.riskScoreV4 != null) {
          console.log(`[AutoEnrich] Step 1: Recovered — BDC completou por outra rota (score=${recheckCase.riskScoreV4})`);
          bdcSuccess = true;
          bdcSkipped = true;
        } else {
          console.warn(`[AutoEnrich] Step 1: BDC não executou e não há dados prévios. Pipeline segue degradado — SENTINEL rodará sem BDC.`);
        }
      }
    }

    // ═══ POST-BDC: Enrich representante legal from BDC sócios data (P5) ═══
    // BDC returns official Receita Federal QSA via `Relationships` dataset.
    // This is the MOST RELIABLE source of sócio data — overrides questionnaire answers.
    if (bdcSuccess && (merchant?.type === 'PJ' || (merchantCpf && merchantCpf.length === 14))) {
      try {
        // Read BDC result from ExternalValidationResult (saved by bdcEnrichCase)
        const bdcResults = await base44.asServiceRole.entities.ExternalValidationResult.filter({
          onboardingCaseId: caseId, provider: 'BigDataCorp'
        });
        const bdcResult = bdcResults.find(r => r.validationType?.includes('PJ'))?.resultData;
        if (bdcResult) {
          // Extract sócios from Relationships (QSA — official Receita Federal data)
          const rels = bdcResult?.Relationships || bdcResult?.relationships;
          const relEntries = rels?.Relationships || (Array.isArray(rels) ? rels : []);
          const bdcSocios = [];
          if (Array.isArray(relEntries)) {
            for (const e of relEntries) {
              const doc = (e.RelatedEntityTaxIdNumber || e.TaxIdNumber || '').replace(/\D/g, '');
              const name = e.RelatedEntityName || e.Name || '';
              const role = e.RelationshipName || e.Qualification || e.Role || '';
              if (doc.length === 11 && name.length > 3) {
                bdcSocios.push({ cpf: doc, nome: name, cargo: role });
              }
            }
          }

          // Also check OwnersKyc for additional detail
          const ownersKyc = bdcResult?.OwnersKyc || bdcResult?.owners_kyc;
          if (ownersKyc) {
            const kycItems = Array.isArray(ownersKyc) ? ownersKyc : [ownersKyc];
            for (const item of kycItems) {
              if (item?.MatchKeys) continue;
              const doc = (item?.TaxIdNumber || item?.CPF || '').replace(/\D/g, '');
              const name = item?.Name || item?.RelatedPersonName || '';
              if (doc.length === 11 && name.length > 3) {
                // Only add if not already in bdcSocios
                if (!bdcSocios.some(s => s.cpf === doc)) {
                  bdcSocios.push({ cpf: doc, nome: name, cargo: 'sócio (kyc)' });
                }
              }
            }
          }

          if (bdcSocios.length > 0) {
            console.log(`[AutoEnrich] BDC returned ${bdcSocios.length} sócios from official QSA: ${bdcSocios.map(s => s.nome.split(' ')[0]).join(', ')}`);
            // P5: BDC QSA data overrides all questionnaire sources
            const firstSocio = bdcSocios[0];
            if (firstSocio.cpf && repCpfPriority < 5) {
              representanteCpf = firstSocio.cpf; repCpfPriority = 5;
            }
            if (firstSocio.nome && repNamePriority < 5) {
              representanteNome = firstSocio.nome; repNamePriority = 5;
            }
            console.log(`[AutoEnrich] Post-BDC Representante: CPF=${representanteCpf ? representanteCpf.substring(0, 3) + '***' + representanteCpf.substring(8) : 'EMPTY'} (P${repCpfPriority}), Name=${representanteNome || 'EMPTY'} (P${repNamePriority})`);
          } else {
            console.log(`[AutoEnrich] BDC QSA: No PF sócios found in Relationships/OwnersKyc`);
          }
        }
      } catch (bdcSocioErr) {
        console.warn(`[AutoEnrich] Post-BDC sócio extraction failed (non-blocking): ${bdcSocioErr.message}`);
      }
    }

    // ═══ STEP 1.5: CAF Full Enrichment — DISABLED (2026-04-18) ═══
    // Desativado porque a Core API CAF exige templateId (Trust Platform), que ainda
    // não temos. KYB/KYC completo (sócios, PEP, sanções, crédito) agora vem 100%
    // do BDC (Step 1 — bdcEnrichCase). Liveness/facematch/documentoscopy continuam
    // funcionando normalmente via cafCreateOnboarding + webhook (fluxo independente).
    // Para reativar: setar CAF_CORE_ENRICHMENT_ENABLED=true + configurar templateIds.
    let cafEnrichSuccess = false;
    const cafEnrichEnabled = false; // Flag local — BDC cobre KYB/KYC hoje
    if (cafEnrichEnabled) {
      try {
        console.log(`[AutoEnrich] Step 1.5: CAF full enrichment...`);
        const enrichParams = { onboardingCaseId: caseId, includeCredit: true };
        if (merchant?.type === 'PF' || merchantCpf?.length === 11) {
          enrichParams.cpf = merchantCpf;
        } else if (merchant?.cpfCnpj) {
          const doc = merchant.cpfCnpj.replace(/\D/g, '');
          if (doc.length === 14) {
            enrichParams.cnpj = doc;
            if (representanteCpf) enrichParams.cpf = representanteCpf;
          } else {
            enrichParams.cpf = doc;
          }
        }
        if (enrichParams.cpf || enrichParams.cnpj) {
          const enrichRes = await base44.asServiceRole.functions.invoke('cafFullEnrichment', enrichParams);
          cafEnrichSuccess = enrichRes?.data?.success === true;
          console.log(`[AutoEnrich] Step 1.5: ${cafEnrichSuccess ? 'OK' : 'FAILED'} — sections=${enrichRes?.data?.sectionsReturned?.length || 0}, flags=${enrichRes?.data?.flagCount || 0}`);
        } else {
          console.log(`[AutoEnrich] Step 1.5: Skipped — no CPF/CNPJ available`);
        }
      } catch (enrichErr) {
        console.warn(`[AutoEnrich] Step 1.5 failed (non-blocking): ${enrichErr.message}`);
      }
    } else {
      console.log(`[AutoEnrich] Step 1.5: DISABLED — BDC covers KYB/KYC (see cafFullEnrichment.js for reactivation)`);
    }

    // ═══ STEP 1.7: CAF Credit Analysis (ITEM 4 — segunda fonte de crédito) ═══
    // For PJ: use representante CPF for personal credit analysis
    let cafCreditSuccess = false;
    try {
      console.log(`[AutoEnrich] Step 1.7: CAF credit analysis...`);
      const creditParams = { onboardingCaseId: caseId };
      if (merchant?.type === 'PF' || merchantCpf?.length === 11) {
        creditParams.cpf = merchantCpf;
      } else if (merchant?.cpfCnpj) {
        const doc = merchant.cpfCnpj.replace(/\D/g, '');
        if (doc.length === 14) {
          creditParams.cnpj = doc;
          if (representanteCpf) creditParams.cpf = representanteCpf;
        } else {
          creditParams.cpf = doc;
        }
      }
      if (creditParams.cpf || creditParams.cnpj) {
        const creditRes = await base44.asServiceRole.functions.invoke('cafCreditAnalysis', creditParams);
        cafCreditSuccess = creditRes?.data?.success === true;
        console.log(`[AutoEnrich] Step 1.7: ${cafCreditSuccess ? 'OK' : 'FAILED'}`);
      } else {
        console.log(`[AutoEnrich] Step 1.7: Skipped — no CPF/CNPJ available`);
      }
    } catch (creditErr) {
      console.warn(`[AutoEnrich] Step 1.7 failed (non-blocking): ${creditErr.message}`);
    }

    // ═══ STEP 2: CAF Screening Internacional ═══
    let screeningSuccess = false;
    try {
      console.log(`[AutoEnrich] Step 2: CAF international screening...`);
      const screenRes = await base44.asServiceRole.functions.invoke('cafScreeningInternacional', { onboardingCaseId: caseId });
      screeningSuccess = screenRes?.data?.success === true;
      console.log(`[AutoEnrich] Step 2: ${screeningSuccess ? 'OK' : 'FAILED'}`);
    } catch (screenErr) {
      console.warn(`[AutoEnrich] Step 2 failed (non-blocking): ${screenErr.message}`);
    }

    // ═══ STEP 2.5: CAF CPF Cross-Validation ═══
    // For PF: validate the merchant CPF. For PJ: validate the representante legal CPF.
    let cpfValidationSuccess = false;
    const cpfToValidate = representanteCpf || (merchantCpf?.length === 11 ? merchantCpf : null);
    if (cpfToValidate) {
      try {
        console.log(`[AutoEnrich] Step 2.5: CPF cross-validation (${representanteCpf ? 'representante legal' : 'merchant'})...`);
        const cpfRes = await base44.asServiceRole.functions.invoke('cafCpfValidation', { cpf: cpfToValidate, onboardingCaseId: caseId });
        cpfValidationSuccess = cpfRes?.data?.success === true;
        console.log(`[AutoEnrich] Step 2.5: ${cpfValidationSuccess ? 'OK' : 'FAILED'}`);
      } catch (cpfErr) {
        console.warn(`[AutoEnrich] Step 2.5 failed (non-blocking): ${cpfErr.message}`);
      }
    }

    // ═══ STEP 2.7: VerifAI — Run on any documents not yet analyzed ═══
    let verifaiSuccess = false;
    try {
      console.log(`[AutoEnrich] Step 2.7: VerifAI check on pending documents...`);
      const allDocs = await base44.asServiceRole.entities.DocumentUpload.filter({ onboardingCaseId: caseId });
      const pendingDocs = allDocs.filter(d => 
        d.validationStatus === 'Pendente' && 
        !d.documentTypeId?.startsWith('caf_') &&
        d.fileUrl
      );
      let verifaiRan = 0;
      for (const doc of pendingDocs) {
        try {
          await base44.asServiceRole.functions.invoke('cafVerifaiDocs', { 
            documentUploadId: doc.id, 
            onboardingCaseId: caseId 
          });
          verifaiRan++;
        } catch (vErr) {
          console.warn(`[AutoEnrich] Step 2.7: VerifAI failed for doc ${doc.id}: ${vErr.message}`);
        }
      }
      verifaiSuccess = true;
      console.log(`[AutoEnrich] Step 2.7: VerifAI ran on ${verifaiRan}/${pendingDocs.length} pending docs`);
    } catch (verifaiErr) {
      console.warn(`[AutoEnrich] Step 2.7 failed (non-blocking): ${verifaiErr.message}`);
    }

    // ═══ STEP 3: SENTINEL IA Analysis (QUALITATIVA — recebe V4) ═══
    let sentinelSuccess = false;
    try {
      console.log(`[AutoEnrich] Step 3: SENTINEL analysis...`);
      const sentinelRes = await base44.asServiceRole.functions.invoke('analyzeOnboarding', { onboardingCaseId: caseId, force: true });
      sentinelSuccess = sentinelRes?.data?.success === true;
      console.log(`[AutoEnrich] Step 3: ${sentinelSuccess ? 'OK' : 'FAILED'} — recommendation=${sentinelRes?.data?.sentinel_recommendation}`);
    } catch (sentinelErr) {
      console.warn(`[AutoEnrich] Step 3 failed (non-blocking): ${sentinelErr.message}`);
    }

    // ═══ STEP 4: DECISÃO 100% DETERMINÍSTICA (DATA-FIRST v7.0) ═══
    // REGRA DE OURO v7: Dados objetivos (BDC V4 + CAF) = VERDADE ABSOLUTA.
    // SENTINEL = RELATOR (gera dossiê), NUNCA DECISOR.
    // Questionário = CONTEXTO, nunca veto.
    // Decisão baseada EXCLUSIVAMENTE em: subfaixa V4 + bloqueios V4 + CAF fraud.
    let autoDecisionApplied = false;
    let finalStatus = null;
    let finalDecision = null;
    try {
      const [freshCase] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
      const subfaixa = freshCase?.subfaixa;
      const v4Score = freshCase?.riskScoreV4;

      // Load ComplianceScore for metadata (SENTINEL is read-only — no decision power)
      // v11 FIX: Sort ASC and pick the ORIGINAL score (which has V4 fields populated by BDC).
      // Delete orphans to prevent UI confusion.
      const scores = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: caseId });
      scores.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      const latestScore = scores[0];
      if (scores.length > 1) {
        console.warn(`[AutoEnrich] Step 4: Found ${scores.length} ComplianceScore records for case ${caseId} — cleaning orphans`);
        for (let i = 1; i < scores.length; i++) {
          try { await base44.asServiceRole.entities.ComplianceScore.delete(scores[i].id); } catch {}
        }
      }

      // ═══ DOC GATE (2026-05-11) ═══
      // REGRA DE OURO: Nenhum caso pode ser marcado como "Aprovado" sem que a Etapa 2
      // (upload de documentos KYC/KYB + CAF) tenha sido concluída.
      // Se o template exige documentos obrigatórios e docCompleted=false, mantemos
      // o caso em "Em Processamento" — o V4 score continua sendo calculado, o SENTINEL
      // continua gerando relatório, mas o status FINAL aguarda a Etapa 2.
      // Quando o cliente sobe os docs, publicOnboardingFinalize re-dispara este pipeline
      // e o Step 4 então aplica a decisão final corretamente.
      let templateRequiresDocs = false;
      try {
        const [tpl] = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ id: freshCase.questionnaireTemplateId });
        const reqDocs = Array.isArray(tpl?.requiredDocuments) ? tpl.requiredDocuments : [];
        templateRequiresDocs = reqDocs.some(d => d?.required === true);
      } catch (_) { /* non-blocking — if we can't read template, fall through */ }
      const docGateBlocking = templateRequiresDocs && !freshCase.docCompleted;

      if (subfaixa && v4Score != null && docGateBlocking) {
        console.log(`[AutoEnrich] Step 4: 🚧 DOC GATE — case ${caseId} has subfaixa=${subfaixa} score=${v4Score} BUT docCompleted=false. Holding status="Em Processamento" until docs+CAF are completed.`);
        await base44.asServiceRole.entities.OnboardingCase.update(caseId, {
          status: 'Em Processamento',
          validationsCompleted: true, // V4/SENTINEL did run; only docs are missing
          escalationSource: 'NONE',
          escalationReason: 'Aguardando Etapa 2 (upload de documentos KYC/KYB + verificação CAF). Score V4 calculado mas decisão final retida até completar a etapa 2.',
        });
        // Notify Slack about the gate hold (best-effort) and return early — skip Step 5 default flow
        finalDecision = 'Aguardando Documentos';
        finalStatus = 'Em Processamento';
        autoDecisionApplied = false;
      } else if (subfaixa && v4Score != null) {
        // ═══ MAPS BY SUBFAIXA ═══
        const rollingReserveMap = { '1A': 0, '1B': 0, '2A': 5, '2B': 10, '3A': 15, '3B': 20, '4': 20, '5': 20 };
        const monitoringMap = {
          '1A': 'PADRAO', '1B': 'PADRAO', '2A': 'REFORÇADO_LEVE', '2B': 'REFORÇADO',
          '3A': 'INTENSO', '3B': 'INTENSO_PLUS', '4': 'MAXIMO', '5': 'MAXIMO'
        };
        const conditionsMap = {
          '2A': ['KYC completo dos merchants em até 60 dias', 'PLD trimestral'],
          '2B': ['KYC completo em 45 dias', 'PLD mensal', 'Monitoramento de chargeback semanal'],
          '3A': ['KYC completo em 30 dias', 'PLD quinzenal', 'Limite de TPV de R$500k/mês', 'Revisão a cada 90 dias'],
          '3B': ['KYC completo em 15 dias', 'PLD semanal', 'Limite de TPV de R$200k/mês', 'Revisão a cada 60 dias', 'Antecipação bloqueada'],
        };

        // ═══ TABELA DE DECISÃO DETERMINÍSTICA v7.0 ═══
        // SENTINEL NÃO TEM VOZ. Decisão é puramente subfaixa + bloqueios + CAF.
        // 1A/1B → Aprovado automático
        // 2A    → Aprovado com Condições Leves (automático)
        // 2B    → Aprovado com Condições (automático)
        // 3A/3B → Aprovado com Condições Rigorosas (automático) ← MUDANÇA: antes era Manual
        // 4     → Revisão Manual (único cenário real de manual)
        // 5     → Recusado (bloqueios V4 ativos)
        let v4Decision;
        if (subfaixa === '1A' || subfaixa === '1B') {
          v4Decision = { status: 'Aprovado', decision: 'Aprovado', isAuto: true };
        } else if (subfaixa === '2A') {
          v4Decision = { status: 'Aprovado', decision: 'Aprovado com Condições Leves', isAuto: true };
        } else if (subfaixa === '2B') {
          v4Decision = { status: 'Aprovado', decision: 'Aprovado com Condições', isAuto: true };
        } else if (subfaixa === '3A') {
          v4Decision = { status: 'Aprovado', decision: 'Aprovado com Condições', isAuto: true };
        } else if (subfaixa === '3B') {
          v4Decision = { status: 'Aprovado', decision: 'Aprovado com Condições', isAuto: true };
        } else if (subfaixa === '4') {
          v4Decision = { status: 'Manual', decision: 'Revisão Manual', isAuto: false };
        } else {
          v4Decision = { status: 'Recusado', decision: 'Recusado', isAuto: true };
        }

        finalDecision = v4Decision.decision;
        finalStatus = v4Decision.status;
        autoDecisionApplied = v4Decision.isAuto;

        // ═══ CAF FRAUD CHECK — v8 INTELLIGENT CLASSIFICATION ═══
        // Separa "fraude confirmada" (score baixo ou deepfake) de "problema de qualidade" (score zona cinza)
        // Aplica hierarquia por subfaixa: 1A/1B/2A precisam 2 sinais, outros bastam 1
        const cafLogs = await base44.asServiceRole.entities.IntegrationLog.filter({ onboarding_case_id: caseId });

        const BINARY_FRAUD_SERVICES = new Set(['deepfake_detection']);
        const QUALITY_SCORED_SERVICES = new Set(['liveness', 'face_liveness', 'face_authentication', 'documentscopy', 'document_liveness']);
        const FRAUD_SCORE_THRESHOLDS = { liveness: 40, face_liveness: 40, face_authentication: 40, documentscopy: 30, document_liveness: 30 };
        const QUALITY_ZONE_MAX = 70;
        const LOW_RISK_SUBFAIXAS = new Set(['1A', '1B', '2A']);

        const confirmedFrauds = [];
        const qualityIssues = [];

        for (const log of cafLogs) {
          if (log.provider !== 'CAF') continue;
          const svc = log.service_type || '';
          const result = log.result_status || '';
          if (result !== 'REPROVED') continue;
          const score = typeof log.score === 'number' ? log.score : null;

          if (BINARY_FRAUD_SERVICES.has(svc)) {
            confirmedFrauds.push({ svc, score, reason: `${svc} REPROVED — fraude binária` });
            continue;
          }
          if (QUALITY_SCORED_SERVICES.has(svc)) {
            const threshold = FRAUD_SCORE_THRESHOLDS[svc] ?? 40;
            if (score == null) {
              qualityIssues.push({ svc, score, reason: `${svc} REPROVED sem score — ambíguo` });
            } else if (score < threshold) {
              confirmedFrauds.push({ svc, score, reason: `${svc} score ${score} (< ${threshold})` });
            } else if (score <= QUALITY_ZONE_MAX) {
              qualityIssues.push({ svc, score, reason: `${svc} score ${score} (zona cinza ${threshold}–${QUALITY_ZONE_MAX})` });
            } else {
              qualityIssues.push({ svc, score, reason: `${svc} score ${score} (próximo do corte)` });
            }
          } else {
            qualityIssues.push({ svc, score, reason: `${svc} REPROVED — serviço não mapeado` });
          }
        }

        const uniqueConfirmedServices = new Set(confirmedFrauds.map(f => f.svc));
        const requiredSignals = LOW_RISK_SUBFAIXAS.has(subfaixa) ? 2 : 1;
        const cafFraudDetected = uniqueConfirmedServices.size >= requiredSignals;
        const recaptureRecommended = !cafFraudDetected && qualityIssues.length > 0 && (freshCase.cafRecaptureAttempts || 0) < 2;

        let escalationReason = null;
        let escalationSource = 'NONE';

        if (cafFraudDetected && finalDecision !== 'Recusado') {
          escalationReason = `${uniqueConfirmedServices.size} sinal(is) CAF confirmado(s) em ${[...uniqueConfirmedServices].join(', ')} — limite para subfaixa ${subfaixa} é ${requiredSignals}. Detalhes: ${confirmedFrauds.map(f => f.reason).join('; ')}`;
          escalationSource = 'CAF_FRAUD';
          finalDecision = 'Revisão Manual';
          finalStatus = 'Manual';
          autoDecisionApplied = false;
          console.log(`[AutoEnrich] Step 4: CAF FRAUD CONFIRMED (${uniqueConfirmedServices.size}/${requiredSignals} signals) — overriding to Revisão Manual`);
        } else if (recaptureRecommended) {
          // Low-quality CAF but not enough confirmed frauds — request recapture instead of escalating
          escalationReason = `Qualidade CAF insuficiente: ${qualityIssues.map(q => q.reason).join('; ')}. Recaptura solicitada antes de escalar.`;
          escalationSource = 'CAF_QUALITY';
          console.log(`[AutoEnrich] Step 4: CAF QUALITY ISSUE — keeping V4 decision, requesting recapture`);
        } else if (hasObjectiveBlocksEarly(freshCase)) {
          escalationSource = 'V4_BLOCK';
        } else if (subfaixa === '4') {
          escalationSource = 'V4_SUBFAIXA_4';
          escalationReason = `Subfaixa 4 — Score V4=${v4Score} exige revisão humana por padrão do framework.`;
        }

        console.log(`[AutoEnrich] Step 4: DETERMINISTIC DECISION="${finalDecision}" (subfaixa=${subfaixa}, v4Score=${v4Score}, confirmedFrauds=${uniqueConfirmedServices.size}, qualityIssues=${qualityIssues.length}, recapture=${recaptureRecommended})`);

        // ═══ MERGE RED FLAGS (informativo apenas — não afeta decisão) ═══
        const v4RedFlags = (freshCase.redFlags || []).map(f => f.startsWith('V4:') || f.startsWith('SENTINEL:') || f.startsWith('CAF:') ? f : `V4: ${f}`);
        const sentinelRedFlags = (latestScore?.sentinel_red_flags || []).map(f => f.startsWith('SENTINEL:') ? f : `SENTINEL: ${f}`);
        const cafFlags = cafFraudDetected ? ['CAF: Fraude biométrica/documental detectada — liveness ou documentoscopia reprovada'] : [];
        const mergedRedFlags = [...new Set([...v4RedFlags, ...sentinelRedFlags, ...cafFlags])];

        // ═══ UPDATE CASE ═══
        const updateData = {
          status: finalStatus,
          iaDecision: finalDecision,
          iaExplanation: latestScore?.sumario_executivo || freshCase.iaExplanation || '',
          rollingReservePercent: rollingReserveMap[subfaixa] || 0,
          monitoramentoNivel: monitoringMap[subfaixa] || 'PADRAO',
          condicoesAutomaticas: conditionsMap[subfaixa] || [],
          redFlags: mergedRedFlags,
          validationsCompleted: true,
          finalDecisionDate: new Date().toISOString(),
          escalationSource,
          escalationReason: escalationReason || '',
        };
        if (recaptureRecommended) {
          updateData.cafRecaptureRequested = true;
          updateData.cafRecaptureReason = qualityIssues.map(q => q.reason).join('; ');
          updateData.cafRecaptureRequestedAt = new Date().toISOString();
        }
        await base44.asServiceRole.entities.OnboardingCase.update(caseId, updateData);

        // ═══ UPDATE COMPLIANCE SCORE ═══
        if (latestScore) {
          await base44.asServiceRole.entities.ComplianceScore.update(latestScore.id, {
            decisao_automatica: autoDecisionApplied,
            rolling_reserve_percent: rollingReserveMap[subfaixa] || 0,
            monitoramento_nivel: monitoringMap[subfaixa] || 'PADRAO',
            condicoes_automaticas: conditionsMap[subfaixa] || [],
            recomendacao_final: finalDecision,
            red_flags: mergedRedFlags,
            decisao_escalada_sentinel: false, // v7: SENTINEL never escalates
          });
        }

        // ═══ UPDATE MERCHANT ═══
        if (freshCase.merchantId) {
          await base44.asServiceRole.entities.Merchant.update(freshCase.merchantId, {
            onboardingStatus: finalStatus,
            riskScore: Math.round(v4Score / 10),
          });
        }

        // ═══ SAFETY NET: Never "Recusado" without V4 blocks ═══
        const hasObjectiveBlocks = (freshCase.bloqueiosAtivos || []).length > 0;
        if (finalDecision === 'Recusado' && !hasObjectiveBlocks && !cafFraudDetected) {
          console.warn(`[AutoEnrich] SAFETY NET: "Recusado" without V4 blocks or CAF fraud → downgrading to "Revisão Manual".`);
          finalDecision = 'Revisão Manual';
          finalStatus = 'Manual';
          autoDecisionApplied = false;
          await base44.asServiceRole.entities.OnboardingCase.update(caseId, {
            status: 'Manual',
            iaDecision: 'Revisão Manual',
            escalationSource: 'SAFETY_NET',
            escalationReason: 'Rebaixamento automático: decisão "Recusado" sem bloqueio V4 nem fraude CAF confirmada. Casos assim devem passar por análise humana.',
          });
          if (latestScore) {
            await base44.asServiceRole.entities.ComplianceScore.update(latestScore.id, { recomendacao_final: 'Revisão Manual' });
          }
        }
      }
    } catch (autoErr) {
      console.warn(`[AutoEnrich] Step 4 failed (non-blocking): ${autoErr.message}`);
    }

    // ═══ STEP 5: SLACK NOTIFICATION ═══
    try {
      const [notifyCase] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
      const [notifyMerchant] = merchant ? [merchant] : await base44.asServiceRole.entities.Merchant.filter({ id: notifyCase?.merchantId });
      const scores = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: caseId });
      const latestScore = scores[0];

      const statusEmoji = { 'Aprovado': '✅', 'Manual': '⚠️', 'Recusado': '🚫', 'Em Processamento': '⏳' };
      const subfaixaEmoji = { '1A': '🟢', '1B': '🟢', '2A': '🔵', '2B': '🔵', '3A': '🟡', '3B': '🟠', '4': '🔴', '5': '⛔' };

      const emoji = statusEmoji[notifyCase?.status] || '📋';
      const sfEmoji = subfaixaEmoji[notifyCase?.subfaixa] || '❓';
      const topRedFlags = (notifyCase?.redFlags || []).slice(0, 4);
      const sentinelConf = latestScore?.nivel_confianca_ia;

      const slackMessage = [
        `${emoji} *Pipeline de Compliance v7.0 — DATA-FIRST*`,
        ``,
        `*Empresa:* ${notifyMerchant?.fullName || 'N/D'} (${notifyMerchant?.cpfCnpj || 'N/D'})`,
        `*Score V4:* ${notifyCase?.riskScoreV4 ?? 'N/D'}/849 ${sfEmoji} Subfaixa ${notifyCase?.subfaixa || 'N/D'} — ${notifyCase?.subfaixaNome || ''}`,
        `*Decisão:* ${notifyCase?.iaDecision || notifyCase?.status || 'N/D'}${autoDecisionApplied ? ' ⚡ AUTOMÁTICA (determinística)' : ' 🔍 Manual (subfaixa 4+)'}`,
        notifyCase?.rollingReservePercent > 0 ? `*Rolling Reserve:* ${notifyCase.rollingReservePercent}%` : '',
        notifyCase?.monitoramentoNivel ? `*Monitoramento:* ${notifyCase.monitoramentoNivel.replace(/_/g, ' ')}` : '',
        topRedFlags.length > 0 ? `\n🚩 *Red Flags V4/CAF (${notifyCase.redFlags.length} total):*\n${topRedFlags.map(f => `  • ${f}`).join('\n')}` : '',
        ``,
        `📊 <${`https://app.base44.com/CadastroDetalhe?id=${notifyMerchant?.id}`}|Ver Dossiê Completo>`,
      ].filter(Boolean).join('\n');

      const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: '#compliance', text: slackMessage, unfurl_links: false }),
      });
      console.log(`[AutoEnrich] Step 5: Slack notification sent`);
    } catch (slackErr) {
      console.warn(`[AutoEnrich] Step 5 failed (non-blocking): ${slackErr.message}`);
    }

    const duration = Date.now() - startTime;
    console.log(`[AutoEnrich] ═══ Pipeline completed in ${duration}ms ═══`);
    console.log(`[AutoEnrich] Results: ProfileCheck=${profileCheckSuccess}, CAF=${cafPostCaptureSuccess}, BDC=${bdcSuccess}, CAFEnrich=${cafEnrichSuccess}, CAFCredit=${cafCreditSuccess}, Screening=${screeningSuccess}, CPF=${cpfValidationSuccess}, VerifAI=${verifaiSuccess}, SENTINEL=${sentinelSuccess}`);
    console.log(`[AutoEnrich] Decision: ${finalDecision} (auto=${autoDecisionApplied})`);

    return Response.json({
      success: true,
      caseId,
      pipeline: { profileCheckSuccess, cafPostCaptureSuccess, bdcSuccess, cafEnrichSuccess, cafCreditSuccess, screeningSuccess, cpfValidationSuccess, verifaiSuccess, sentinelSuccess },
      decision: { autoDecisionApplied, finalStatus, finalDecision },
      duration_ms: duration
    });

  } catch (error) {
    console.error('[AutoEnrich] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});