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

    // ── 1. OnboardingCase ─────────────────────────────────────────
    const cases = await base44.asServiceRole.entities.OnboardingCase.list('-created_date', 10000);
    stats.onboardingCases.total = cases.length;
    const casesToFix = cases.filter(c => !c.framework_version);
    stats.onboardingCases.missing = casesToFix.length;

    if (!dryRun) {
      for (const c of casesToFix) {
        await base44.asServiceRole.entities.OnboardingCase.update(c.id, { framework_version: 'v4.0' });
        stats.onboardingCases.updated++;
      }
    }

    // ── 2. ComplianceScore ────────────────────────────────────────
    const scores = await base44.asServiceRole.entities.ComplianceScore.list('-created_date', 10000);
    stats.complianceScores.total = scores.length;
    const scoresToFix = scores.filter(s => !s.framework_version);
    stats.complianceScores.missing = scoresToFix.length;

    if (!dryRun) {
      for (const s of scoresToFix) {
        await base44.asServiceRole.entities.ComplianceScore.update(s.id, { framework_version: 'v4.0' });
        stats.complianceScores.updated++;
      }
    }

    // ── 3. QuestionnaireTemplate ──────────────────────────────────
    const templates = await base44.asServiceRole.entities.QuestionnaireTemplate.list('-created_date', 10000);
    stats.questionnaireTemplates.total = templates.length;
    const tplsToFix = templates.filter(t => !t.framework_version);
    stats.questionnaireTemplates.missing = tplsToFix.length;

    if (!dryRun) {
      for (const t of tplsToFix) {
        await base44.asServiceRole.entities.QuestionnaireTemplate.update(t.id, { framework_version: 'v4.0' });
        stats.questionnaireTemplates.updated++;
      }
    }

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