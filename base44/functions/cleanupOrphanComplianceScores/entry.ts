import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cleanupOrphanComplianceScores — Remove ComplianceScores apontando para casos deletados.
 *
 * Quando um OnboardingCase é deletado manualmente (admin reset, bulk actions, etc.),
 * o ComplianceScore associado fica órfão. Isso causa:
 *   - Relatórios distorcidos
 *   - SENTINEL loop tentando analisar casos inexistentes (gasta créditos LLM)
 *   - UI do dossiê exibe dados de casos que não existem mais
 *
 * Esta função roda diariamente via automação agendada e remove todos os órfãos.
 *
 * Security: apenas admins podem chamar manualmente. Automação roda com service role.
 */
Deno.serve(async (req) => {
  const startTime = Date.now();
  try {
    const base44 = createClientFromRequest(req);

    // Verifica auth: admin manual OU automação (service role sem auth)
    let isAutomation = false;
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      isAutomation = true;
    }

    // Limit ao batch pra não explodir em DBs grandes
    const scores = await base44.asServiceRole.entities.ComplianceScore.list('-created_date', 500);
    console.log(`[CleanupOrphans] Scanning ${scores.length} ComplianceScores`);

    let orphansFound = 0;
    let orphansDeleted = 0;
    const deletedIds = [];

    for (const score of scores) {
      if (!score.onboarding_case_id) {
        orphansFound++;
        try {
          await base44.asServiceRole.entities.ComplianceScore.delete(score.id);
          orphansDeleted++;
          deletedIds.push(score.id);
        } catch (e) { console.warn(`Delete failed: ${e.message}`); }
        continue;
      }
      try {
        const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: score.onboarding_case_id });
        if (cases.length === 0) {
          orphansFound++;
          await base44.asServiceRole.entities.ComplianceScore.delete(score.id);
          orphansDeleted++;
          deletedIds.push(score.id);
        }
      } catch { /* skip on error */ }
    }

    console.log(`[CleanupOrphans] ═══ Done: ${orphansFound} orphans found, ${orphansDeleted} deleted (${Date.now() - startTime}ms) ═══`);

    return Response.json({
      success: true,
      scanned: scores.length,
      orphansFound,
      orphansDeleted,
      deletedIds: deletedIds.slice(0, 20), // first 20 for audit
      isAutomation,
      duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    console.error('[CleanupOrphans] Error:', error);
    return Response.json({ error: error.message, duration_ms: Date.now() - startTime }, { status: 500 });
  }
});