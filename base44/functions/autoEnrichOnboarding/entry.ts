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

    // For PJ: extract representative's CPF from questionnaire responses (needed for CAF face match)
    let representanteCpf = null;
    let representanteNome = null;
    if (merchant?.type === 'PJ' || (merchantCpf && merchantCpf.length === 14)) {
      try {
        const responses = await base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId: caseId });
        for (const r of responses) {
          const t = (r.questionText || '').toLowerCase();
          const val = r.valueText || '';
          const cleanVal = val.replace(/\D/g, '');
          // Priority: "CPF do Representante Legal" > "CPF do Responsável Legal" > any 11-digit CPF
          if (cleanVal.length === 11 && t.includes('cpf') && t.includes('representante') && t.includes('legal')) {
            representanteCpf = cleanVal;
          } else if (!representanteCpf && cleanVal.length === 11 && t.includes('cpf') && (t.includes('responsável') || t.includes('responsavel'))) {
            representanteCpf = cleanVal;
          }
          if (t.includes('representante legal') && t.includes('nome') && val.length > 3) {
            representanteNome = val;
          } else if (!representanteNome && (t.includes('responsável legal') || t.includes('nome do responsável')) && val.length > 3) {
            representanteNome = val;
          }
        }
        if (representanteCpf) {
          console.log(`[AutoEnrich] Found representante legal CPF: ${representanteCpf.substring(0, 3)}***${representanteCpf.substring(8)}, name: ${representanteNome || 'N/D'}`);
        }
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
    let profileCheckSuccess = false;
    try {
      console.log(`[AutoEnrich] Step 0.5: CAF profile check...`);
      const profileParams = { onboardingCaseId: caseId };
      if (merchantCpf && (merchant?.type === 'PF' || merchantCpf.length === 11)) {
        profileParams.cpf = merchantCpf;
      } else if (merchant?.cpfCnpj) {
        const doc = merchant.cpfCnpj.replace(/\D/g, '');
        if (doc.length === 14) profileParams.cnpj = doc;
        else profileParams.cpf = doc;
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
    let bdcSuccess = false;
    try {
      console.log(`[AutoEnrich] Step 1: BDC enrichment (V4 scoring)...`);
      const bdcRes = await base44.asServiceRole.functions.invoke('bdcEnrichCase', { onboardingCaseId: caseId });
      bdcSuccess = bdcRes?.data?.success === true;
      console.log(`[AutoEnrich] Step 1: ${bdcSuccess ? 'OK' : 'FAILED'} — V4 score=${bdcRes?.data?.analysis?.scoring?.finalScore}`);
    } catch (bdcErr) {
      console.warn(`[AutoEnrich] Step 1 failed (non-blocking): ${bdcErr.message}`);
    }

    // ═══ STEP 1.5: CAF Full Enrichment (ITEM 3 — KYC/KYB completo) ═══
    let cafEnrichSuccess = false;
    try {
      console.log(`[AutoEnrich] Step 1.5: CAF full enrichment...`);
      const enrichParams = { onboardingCaseId: caseId, includeCredit: true };
      if (merchant?.type === 'PF' || merchantCpf?.length === 11) {
        enrichParams.cpf = merchantCpf;
      } else if (merchant?.cpfCnpj) {
        const doc = merchant.cpfCnpj.replace(/\D/g, '');
        if (doc.length === 14) enrichParams.cnpj = doc;
        else enrichParams.cpf = doc;
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

    // ═══ STEP 1.7: CAF Credit Analysis (ITEM 4 — segunda fonte de crédito) ═══
    let cafCreditSuccess = false;
    try {
      console.log(`[AutoEnrich] Step 1.7: CAF credit analysis...`);
      const creditParams = { onboardingCaseId: caseId };
      if (merchant?.type === 'PF' || merchantCpf?.length === 11) {
        creditParams.cpf = merchantCpf;
      } else if (merchant?.cpfCnpj) {
        const doc = merchant.cpfCnpj.replace(/\D/g, '');
        if (doc.length === 14) creditParams.cnpj = doc;
        else creditParams.cpf = doc;
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
      const scores = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: caseId });
      const latestScore = scores[0];

      if (subfaixa && v4Score != null) {
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

        // ═══ CAF FRAUD CHECK — única exceção que pode mudar decisão ═══
        // Dados biométricos/documentais CAF são OBJETIVOS — fraude confirmada = manual obrigatório
        let cafFraudDetected = false;
        const cafLogs = await base44.asServiceRole.entities.IntegrationLog.filter({ onboarding_case_id: caseId });
        for (const log of cafLogs) {
          if (log.provider !== 'CAF') continue;
          const svc = log.service_type || '';
          const result = log.result_status || '';
          if ((svc === 'liveness' || svc === 'face_liveness' || svc === 'deepfake_detection') && result === 'REPROVED') {
            cafFraudDetected = true;
          }
          if (svc === 'documentscopy' && result === 'REPROVED') {
            cafFraudDetected = true;
          }
        }
        if (cafFraudDetected && finalDecision !== 'Recusado') {
          finalDecision = 'Revisão Manual';
          finalStatus = 'Manual';
          autoDecisionApplied = false;
          console.log(`[AutoEnrich] Step 4: CAF FRAUD DETECTED — overriding to Revisão Manual`);
        }

        console.log(`[AutoEnrich] Step 4: DETERMINISTIC DECISION="${finalDecision}" (subfaixa=${subfaixa}, v4Score=${v4Score}, cafFraud=${cafFraudDetected})`);

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
        };
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
          await base44.asServiceRole.entities.OnboardingCase.update(caseId, { status: 'Manual', iaDecision: 'Revisão Manual' });
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