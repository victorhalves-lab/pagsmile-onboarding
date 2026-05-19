// ─────────────────────────────────────────────────────────────────────
// V5.1 — Backfill defensivo de framework_version
// ─────────────────────────────────────────────────────────────────────
// Marca TODOS os casos/scores/templates existentes (sem framework_version)
// como "v4.0". Garante que o wrapper de roteamento sempre tenha resposta
// determinística — quem nasceu V4 morre V4.
//
// Admin-only. Execução manual (uma vez por ambiente, antes do rollout V5.1).
// ─────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.29';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun !== false; // default true (segurança)

    const stats = {
      onboardingCases: { total: 0, missing: 0, updated: 0 },
      complianceScores: { total: 0, missing: 0, updated: 0 },
      questionnaireTemplates: { total: 0, missing: 0, updated: 0 },
      dryRun,
    };

    // Helper: processa lista em chunks com pausa para não estourar rate limit.
    // Para cada item, monta payload com framework_version + required fields existentes
    // (Base44 revalida o registro inteiro em update; alguns registros legados podem ter
    // required fields que viraram required depois — re-afirmamos o valor atual).
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    async function backfillChunked(entityName, items, statBucket, requiredFields = []) {
      const CHUNK = 10;
      const PAUSE_MS = 400;
      const errors = [];
      for (let i = 0; i < items.length; i += CHUNK) {
        const slice = items.slice(i, i + CHUNK);
        await Promise.all(slice.map(async (it) => {
          const payload = { framework_version: 'v4.0' };
          // Re-afirma required fields presentes; usa fallback se ausente
          // (registros legados podem ter required fields que viraram required depois).
          for (const f of requiredFields) {
            if (it[f] !== undefined && it[f] !== null && it[f] !== '') {
              payload[f] = it[f];
            } else {
              // Fallback seguro por campo (todos não-destrutivos)
              if (f === 'category') payload[f] = 'COMPLIANCE';
              else if (f === 'merchantType') payload[f] = 'PJ';
              else if (f === 'name') payload[f] = it.name || `(sem nome) ${it.id}`;
            }
          }
          try {
            await base44.asServiceRole.entities[entityName].update(it.id, payload);
            statBucket.updated++;
          } catch (e) {
            errors.push({ id: it.id, error: e.message });
          }
        }));
        if (i + CHUNK < items.length) await sleep(PAUSE_MS);
      }
      if (errors.length) statBucket.errors = errors;
    }

    // ── 1. OnboardingCase ─────────────────────────────────────────
    const cases = await base44.asServiceRole.entities.OnboardingCase.list('-created_date', 10000);
    stats.onboardingCases.total = cases.length;
    const casesToFix = cases.filter(c => !c.framework_version);
    stats.onboardingCases.missing = casesToFix.length;
    if (!dryRun) await backfillChunked('OnboardingCase', casesToFix, stats.onboardingCases, ['merchantId','questionnaireTemplateId']);

    // ── 2. ComplianceScore ────────────────────────────────────────
    const scores = await base44.asServiceRole.entities.ComplianceScore.list('-created_date', 10000);
    stats.complianceScores.total = scores.length;
    const scoresToFix = scores.filter(s => !s.framework_version);
    stats.complianceScores.missing = scoresToFix.length;
    if (!dryRun) await backfillChunked('ComplianceScore', scoresToFix, stats.complianceScores, ['onboarding_case_id']);

    // ── 3. QuestionnaireTemplate ──────────────────────────────────
    const templates = await base44.asServiceRole.entities.QuestionnaireTemplate.list('-created_date', 10000);
    stats.questionnaireTemplates.total = templates.length;
    const tplsToFix = templates.filter(t => !t.framework_version);
    stats.questionnaireTemplates.missing = tplsToFix.length;
    if (!dryRun) await backfillChunked('QuestionnaireTemplate', tplsToFix, stats.questionnaireTemplates, ['name','merchantType','category']);

    return Response.json({
      success: true,
      message: dryRun
        ? 'DRY RUN — nenhuma alteração feita. Envie {"dryRun": false} para executar.'
        : `Backfill V5.1 executado. ${stats.onboardingCases.updated + stats.complianceScores.updated + stats.questionnaireTemplates.updated} registros marcados como v4.0.`,
      stats,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});