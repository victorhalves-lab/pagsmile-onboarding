import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * bulkRecomputeDecisions — ADMIN ONLY
 *
 * Reaplica a regra v7.0 DATA-FIRST em TODOS os OnboardingCases:
 *   - Decisão = subfaixa V4 + bloqueios V4 + fraude CAF confirmada
 *   - SENTINEL não decide nada (fica preservado como relatório)
 *   - Casos SEM liveness/facematch CAF: não escala — só adiciona flag CAF_PENDING_DOCS
 *
 * Modos:
 *   - action: "preview"  → calcula e retorna o diff, NÃO altera nada
 *   - action: "apply"    → aplica as mudanças
 *   - caseIds: opcional — restringe a um subconjunto
 */

const ROLLING_RESERVE_MAP = { '1A': 0, '1B': 0, '2A': 5, '2B': 10, '3A': 15, '3B': 20, '4': 20, '5': 20 };
const MONITORING_MAP = {
  '1A': 'PADRAO', '1B': 'PADRAO', '2A': 'REFORÇADO_LEVE', '2B': 'REFORÇADO',
  '3A': 'INTENSO', '3B': 'INTENSO_PLUS', '4': 'MAXIMO', '5': 'MAXIMO',
};
const CONDITIONS_MAP = {
  '2A': ['KYC completo dos merchants em até 60 dias', 'PLD trimestral'],
  '2B': ['KYC completo em 45 dias', 'PLD mensal', 'Monitoramento de chargeback semanal'],
  '3A': ['KYC completo em 30 dias', 'PLD quinzenal', 'Limite de TPV de R$500k/mês', 'Revisão a cada 90 dias'],
  '3B': ['KYC completo em 15 dias', 'PLD semanal', 'Limite de TPV de R$200k/mês', 'Revisão a cada 60 dias', 'Antecipação bloqueada'],
};

const BINARY_FRAUD_SERVICES = new Set(['deepfake_detection']);
const QUALITY_SCORED_SERVICES = new Set(['liveness', 'face_liveness', 'face_authentication', 'documentscopy', 'document_liveness']);
const CAF_DOC_SERVICES = new Set(['liveness', 'face_liveness', 'face_authentication', 'documentscopy', 'document_liveness', 'document_detector', 'deepfake_detection']);
const FRAUD_SCORE_THRESHOLDS = { liveness: 40, face_liveness: 40, face_authentication: 40, documentscopy: 30, document_liveness: 30 };
const QUALITY_ZONE_MAX = 70;
const LOW_RISK_SUBFAIXAS = new Set(['1A', '1B', '2A']);

function decideBySubfaixa(subfaixa) {
  if (subfaixa === '1A' || subfaixa === '1B') return { status: 'Aprovado', decision: 'Aprovado', isAuto: true };
  if (subfaixa === '2A') return { status: 'Aprovado', decision: 'Aprovado com Condições Leves', isAuto: true };
  if (subfaixa === '2B') return { status: 'Aprovado', decision: 'Aprovado com Condições', isAuto: true };
  if (subfaixa === '3A' || subfaixa === '3B') return { status: 'Aprovado', decision: 'Aprovado com Condições', isAuto: true };
  if (subfaixa === '4') return { status: 'Manual', decision: 'Revisão Manual', isAuto: false };
  if (subfaixa === '5') return { status: 'Recusado', decision: 'Recusado', isAuto: true };
  return null;
}

function analyzeCafLogs(cafLogs) {
  const confirmedFrauds = [];
  const qualityIssues = [];
  const servicesCompleted = new Set();

  for (const log of cafLogs) {
    if (log.provider !== 'CAF') continue;
    const svc = log.service_type || '';
    if (CAF_DOC_SERVICES.has(svc)) servicesCompleted.add(svc);
    const result = log.result_status || '';
    if (result !== 'REPROVED') continue;
    const score = typeof log.score === 'number' ? log.score : null;

    if (BINARY_FRAUD_SERVICES.has(svc)) {
      confirmedFrauds.push({ svc, score, reason: `${svc} REPROVED — fraude binária` });
      continue;
    }
    if (QUALITY_SCORED_SERVICES.has(svc)) {
      const threshold = FRAUD_SCORE_THRESHOLDS[svc] ?? 40;
      if (score == null) qualityIssues.push({ svc, score, reason: `${svc} REPROVED sem score` });
      else if (score < threshold) confirmedFrauds.push({ svc, score, reason: `${svc} score ${score} (< ${threshold})` });
      else if (score <= QUALITY_ZONE_MAX) qualityIssues.push({ svc, score, reason: `${svc} score ${score} (zona cinza)` });
      else qualityIssues.push({ svc, score, reason: `${svc} score ${score} (próximo do corte)` });
    }
  }

  const hasLiveness = servicesCompleted.has('liveness') || servicesCompleted.has('face_liveness') || servicesCompleted.has('face_authentication');
  const hasDocCapture = servicesCompleted.has('documentscopy') || servicesCompleted.has('document_liveness') || servicesCompleted.has('document_detector');
  const cafDocsPresent = hasLiveness || hasDocCapture;

  return { confirmedFrauds, qualityIssues, cafDocsPresent, hasLiveness, hasDocCapture };
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'preview';
    const caseIds = body.caseIds || null;
    const batchSize = body.batchSize || 10;
    const batchOffset = body.batchOffset || 0;

    if (!['preview', 'apply'].includes(action)) {
      return Response.json({ error: 'Invalid action. Use "preview" or "apply".' }, { status: 400 });
    }

    // Carrega casos
    const allCases = await base44.asServiceRole.entities.OnboardingCase.list('-created_date', 500);
    const eligibleCases = caseIds?.length
      ? allCases.filter(c => caseIds.includes(c.id))
      : allCases.filter(c => c.riskScoreV4 != null && c.subfaixa); // só casos já scorados

    // Batch pagination — apply processa aos poucos pra evitar rate limit
    const targetCases = action === 'apply'
      ? eligibleCases.slice(batchOffset, batchOffset + batchSize)
      : eligibleCases;

    console.log(`[BulkRecompute] Mode=${action} — ${targetCases.length}/${eligibleCases.length} cases to process (offset=${batchOffset}, batchSize=${batchSize})`);

    const results = {
      total: targetCases.length,
      changed: 0,
      unchanged: 0,
      skipped: 0,
      cafPending: 0,
      changes: [],
    };

    for (const c of targetCases) {
      const subfaixa = c.subfaixa;
      const v4Score = c.riskScoreV4;

      if (!subfaixa || v4Score == null) {
        results.skipped++;
        continue;
      }

      const base = decideBySubfaixa(subfaixa);
      if (!base) { results.skipped++; continue; }

      // Analisa CAF
      const cafLogs = await base44.asServiceRole.entities.IntegrationLog.filter({ onboarding_case_id: c.id });
      const { confirmedFrauds, qualityIssues, cafDocsPresent, hasLiveness, hasDocCapture } = analyzeCafLogs(cafLogs);

      let finalStatus = base.status;
      let finalDecision = base.decision;
      let autoDecisionApplied = base.isAuto;
      let escalationReason = null;
      let escalationSource = 'NONE';

      // Fraude CAF confirmada só conta se tiver os documentos
      if (cafDocsPresent) {
        const uniqueConfirmed = new Set(confirmedFrauds.map(f => f.svc));
        const required = LOW_RISK_SUBFAIXAS.has(subfaixa) ? 2 : 1;
        if (uniqueConfirmed.size >= required && finalDecision !== 'Recusado') {
          finalDecision = 'Revisão Manual';
          finalStatus = 'Manual';
          autoDecisionApplied = false;
          escalationSource = 'CAF_FRAUD';
          escalationReason = `${uniqueConfirmed.size} sinal(is) CAF confirmado(s) em ${[...uniqueConfirmed].join(', ')} — limite para subfaixa ${subfaixa} é ${required}.`;
        }
      }

      // Bloqueios V4 / subfaixa 4
      if (escalationSource === 'NONE') {
        if ((c.bloqueiosAtivos || []).length > 0) escalationSource = 'V4_BLOCK';
        else if (subfaixa === '4') {
          escalationSource = 'V4_SUBFAIXA_4';
          escalationReason = `Subfaixa 4 — Score V4=${v4Score} exige revisão humana por padrão do framework.`;
        }
      }

      // Red flags — mantém as V4/CAF reais, remove poder de decisão do SENTINEL mas preserva como observação
      const existingFlags = c.redFlags || [];
      const v4Flags = existingFlags.filter(f => f.startsWith('V4:') || f.startsWith('CAF_') || f.startsWith('CAF:'));
      const sentinelFlags = existingFlags.filter(f => f.startsWith('SENTINEL:'));
      const otherFlags = existingFlags.filter(f => !f.startsWith('V4:') && !f.startsWith('SENTINEL:') && !f.startsWith('CAF_') && !f.startsWith('CAF:'));

      const newFlags = [...v4Flags, ...sentinelFlags, ...otherFlags];

      // Flag CAF pendente — apenas informativa
      const cafPendingFlag = 'CAF_PENDING_DOCS: Cliente ainda não completou liveness/facematch/documentoscopia';
      const cafFraudFlag = 'CAF: Fraude biométrica/documental detectada';

      if (!cafDocsPresent) {
        if (!newFlags.includes(cafPendingFlag)) newFlags.push(cafPendingFlag);
        results.cafPending++;
      } else {
        // Se docs presentes, remove flag de pendência
        const idx = newFlags.indexOf(cafPendingFlag);
        if (idx >= 0) newFlags.splice(idx, 1);

        if (escalationSource === 'CAF_FRAUD' && !newFlags.some(f => f.startsWith('CAF: Fraude'))) {
          newFlags.push(cafFraudFlag);
        }
      }

      const update = {
        status: finalStatus,
        iaDecision: finalDecision,
        rollingReservePercent: ROLLING_RESERVE_MAP[subfaixa] || 0,
        monitoramentoNivel: MONITORING_MAP[subfaixa] || 'PADRAO',
        condicoesAutomaticas: CONDITIONS_MAP[subfaixa] || [],
        redFlags: newFlags,
        escalationSource,
        escalationReason: escalationReason || '',
        validationsCompleted: true,
      };

      // Detecta mudança real
      const before = {
        status: c.status, iaDecision: c.iaDecision, rollingReservePercent: c.rollingReservePercent,
        monitoramentoNivel: c.monitoramentoNivel, escalationSource: c.escalationSource,
      };
      const after = {
        status: update.status, iaDecision: update.iaDecision, rollingReservePercent: update.rollingReservePercent,
        monitoramentoNivel: update.monitoramentoNivel, escalationSource: update.escalationSource,
      };
      const changed = JSON.stringify(before) !== JSON.stringify(after);

      if (changed) {
        results.changed++;
        results.changes.push({
          caseId: c.id, merchantId: c.merchantId, subfaixa, v4Score,
          cafDocsPresent, hasLiveness, hasDocCapture,
          confirmedCafFrauds: confirmedFrauds.length,
          before, after,
        });
      } else {
        results.unchanged++;
      }

      if (action === 'apply' && changed) {
        await base44.asServiceRole.entities.OnboardingCase.update(c.id, update);
        await new Promise(r => setTimeout(r, 400));

        const scores = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: c.id });
        if (scores[0]) {
          await base44.asServiceRole.entities.ComplianceScore.update(scores[0].id, {
            decisao_automatica: autoDecisionApplied,
            rolling_reserve_percent: ROLLING_RESERVE_MAP[subfaixa] || 0,
            monitoramento_nivel: MONITORING_MAP[subfaixa] || 'PADRAO',
            condicoes_automaticas: CONDITIONS_MAP[subfaixa] || [],
            recomendacao_final: finalDecision,
            red_flags: newFlags,
            decisao_escalada_sentinel: false,
            escalation_justification: escalationReason || '',
          });
          await new Promise(r => setTimeout(r, 400));
        }

        if (c.merchantId) {
          await base44.asServiceRole.entities.Merchant.update(c.merchantId, {
            onboardingStatus: finalStatus,
            riskScore: Math.round(v4Score / 10),
          });
          await new Promise(r => setTimeout(r, 400));
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[BulkRecompute] Done in ${duration}ms — changed=${results.changed}, unchanged=${results.unchanged}, cafPending=${results.cafPending}`);

    const hasMore = action === 'apply' && (batchOffset + batchSize) < eligibleCases.length;

    return Response.json({
      success: true,
      action,
      total: results.total,
      totalEligible: eligibleCases.length,
      batchOffset,
      batchSize,
      hasMore,
      nextOffset: hasMore ? batchOffset + batchSize : null,
      changed: results.changed,
      unchanged: results.unchanged,
      skipped: results.skipped,
      cafPending: results.cafPending,
      changes: results.changes,
      duration_ms: duration,
    });
  } catch (error) {
    console.error('[BulkRecompute] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});