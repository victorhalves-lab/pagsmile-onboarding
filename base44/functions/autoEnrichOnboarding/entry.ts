import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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
    // FALLBACK: Run even without liveness — documents alone provide OCR + documentoscopy value
    let cafPostCaptureSuccess = false;
    const hasDocuments = onboardingCase.docCompleted || onboardingCase.cafCompleted;
    if (hasDocuments) {
      try {
        console.log(`[AutoEnrich] Step 0: Running CAF post-capture analysis (cafCompleted=${onboardingCase.cafCompleted}, docCompleted=${onboardingCase.docCompleted})...`);
        const cafRes = await base44.asServiceRole.functions.invoke('cafPostCaptureAnalysis', {
          onboardingCaseId: caseId
        });
        cafPostCaptureSuccess = cafRes?.data?.success === true;
        console.log(`[AutoEnrich] CAF post-capture: success=${cafPostCaptureSuccess}`);
      } catch (cafErr) {
        console.warn(`[AutoEnrich] CAF post-capture failed (non-blocking): ${cafErr.message}`);
      }
    } else {
      console.log(`[AutoEnrich] Step 0: Skipped (no documents or CAF data available)`);
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

    // ═══ STEP 4: AUTO-DECISION BY SUBFAIXA ═══
    let autoDecisionApplied = false;
    let finalStatus = null;
    let finalDecision = null;
    try {
      // Reload case with fresh BDC results
      const [freshCase] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
      const subfaixa = freshCase?.subfaixa;
      const score = freshCase?.riskScoreV4;
      
      if (subfaixa && score != null) {
        // Rolling reserve by subfaixa
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

        // Auto-decision rules
        if (subfaixa === '1A' || subfaixa === '1B') {
          finalStatus = 'Aprovado';
          finalDecision = 'Aprovado';
          autoDecisionApplied = true;
        } else if (subfaixa === '2A' || subfaixa === '2B') {
          finalStatus = 'Aprovado';
          finalDecision = 'Aprovado com Condições';
          autoDecisionApplied = true;
        } else if (subfaixa === '3A' || subfaixa === '3B') {
          finalStatus = 'Manual';
          finalDecision = 'Revisão Manual';
          autoDecisionApplied = true;
        } else if (subfaixa === '4') {
          finalStatus = 'Manual';
          finalDecision = 'Revisão Manual';
          autoDecisionApplied = true;
        } else if (subfaixa === '5') {
          finalStatus = 'Recusado';
          finalDecision = 'Recusado';
          autoDecisionApplied = true;
        }

        if (autoDecisionApplied) {
          const updateData = {
            status: finalStatus,
            iaDecision: finalDecision,
            rollingReservePercent: rollingReserveMap[subfaixa] || 0,
            monitoramentoNivel: monitoringMap[subfaixa] || 'PADRAO',
            condicoesAutomaticas: conditionsMap[subfaixa] || [],
            finalDecisionDate: new Date().toISOString(),
          };
          await base44.asServiceRole.entities.OnboardingCase.update(caseId, updateData);
          
          // Also update ComplianceScore with monitoring + decision
          const scores = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: caseId });
          if (scores[0]) {
            await base44.asServiceRole.entities.ComplianceScore.update(scores[0].id, {
              decisao_automatica: ['1A','1B','2A','2B','3A','3B'].includes(subfaixa),
              rolling_reserve_percent: rollingReserveMap[subfaixa] || 0,
              monitoramento_nivel: monitoringMap[subfaixa] || 'PADRAO',
              condicoes_automaticas: conditionsMap[subfaixa] || [],
              recomendacao_final: finalDecision,
            });
          }

          // Update merchant status
          if (freshCase.merchantId) {
            await base44.asServiceRole.entities.Merchant.update(freshCase.merchantId, {
              onboardingStatus: finalStatus,
              riskScore: Math.round(score / 10),
            });
          }

          console.log(`[AutoEnrich] Step 4: Auto-decision applied: ${finalDecision} (subfaixa=${subfaixa}, score=${score})`);
        }
      }
    } catch (autoErr) {
      console.warn(`[AutoEnrich] Auto-decision failed (non-blocking): ${autoErr.message}`);
    }

    // ═══ STEP 5: SLACK NOTIFICATION ═══
    try {
      const [notifyCase] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
      const [notifyMerchant] = merchant ? [merchant] : await base44.asServiceRole.entities.Merchant.filter({ id: notifyCase?.merchantId });
      const scores = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: caseId });
      const latestScore = scores[0];
      
      const statusEmoji = {
        'Aprovado': '✅', 'Manual': '⚠️', 'Recusado': '🚫', 'Em Processamento': '⏳'
      };
      const subfaixaEmoji = {
        '1A': '🟢', '1B': '🟢', '2A': '🔵', '2B': '🔵',
        '3A': '🟡', '3B': '🟠', '4': '🔴', '5': '⛔'
      };
      
      const emoji = statusEmoji[notifyCase?.status] || '📋';
      const sfEmoji = subfaixaEmoji[notifyCase?.subfaixa] || '❓';
      const topRedFlags = (latestScore?.red_flags || notifyCase?.redFlags || []).slice(0, 3);
      
      const slackMessage = [
        `${emoji} *Compliance Pipeline Concluído*`,
        ``,
        `*Empresa:* ${notifyMerchant?.fullName || 'N/D'} (${notifyMerchant?.cpfCnpj || 'N/D'})`,
        `*Score V4:* ${notifyCase?.riskScoreV4 ?? 'N/D'}/849 ${sfEmoji} Subfaixa ${notifyCase?.subfaixa || 'N/D'} (${notifyCase?.subfaixaNome || ''})`,
        `*Decisão:* ${notifyCase?.status || 'N/D'}${autoDecisionApplied ? ' ⚡ Automática' : ''}`,
        latestScore?.monitoramento_nivel ? `*Monitoramento:* ${latestScore.monitoramento_nivel.replace(/_/g, ' ')}` : '',
        latestScore?.rolling_reserve_percent > 0 ? `*Rolling Reserve:* ${latestScore.rolling_reserve_percent}%` : '',
        topRedFlags.length > 0 ? `\n🚩 *Top Red Flags:*\n${topRedFlags.map(f => `  • ${f}`).join('\n')}` : '',
        ``,
        `📊 <${`https://app.base44.com/CadastroDetalhe?id=${notifyMerchant?.id}`}|Ver Análise Completa>`,
      ].filter(Boolean).join('\n');
      
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: '#compliance',
          text: slackMessage,
          unfurl_links: false,
        }),
      });
      console.log(`[AutoEnrich] Step 5: Slack notification sent`);
    } catch (slackErr) {
      console.warn(`[AutoEnrich] Slack notification failed (non-blocking): ${slackErr.message}`);
    }

    const duration = Date.now() - startTime;
    console.log(`[AutoEnrich] Pipeline completed in ${duration}ms. CAF=${cafPostCaptureSuccess}, BDC=${bdcSuccess}, Screening=${screeningSuccess}, CPF=${cpfValidationSuccess}, SENTINEL=${sentinelSuccess}, AutoDecision=${autoDecisionApplied}`);

    return Response.json({
      success: true,
      caseId,
      cafPostCaptureSuccess,
      bdcSuccess,
      screeningSuccess,
      cpfValidationSuccess,
      sentinelSuccess,
      autoDecisionApplied,
      finalStatus,
      finalDecision,
      duration_ms: duration
    });

  } catch (error) {
    console.error('[AutoEnrich] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});