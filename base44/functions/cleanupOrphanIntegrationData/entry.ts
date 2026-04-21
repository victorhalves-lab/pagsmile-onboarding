import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cleanupOrphanIntegrationData — Remove registros de integração órfãos.
 *
 * Cobre 4 entidades que guardam FK para OnboardingCase:
 *   - ExternalValidationResult (onboardingCaseId, camelCase)
 *   - IntegrationLog           (onboarding_case_id, snake_case)
 *   - BdcRetryQueue            (onboarding_case_id, snake_case)
 *   - DocumentUpload           (onboardingCaseId, camelCase)
 *
 * Regra de órfão:
 *   - FK vazia/null/placeholder (ex: "test_validation"), OU
 *   - FK aponta para OnboardingCase que não existe mais
 *
 * Segurança:
 *   - Admins podem chamar manualmente
 *   - Automation agendada roda com service role (sem auth)
 *
 * Performance:
 *   - Cache de OnboardingCase IDs válidos (1 fetch só)
 *   - Paginação por entidade (max 1000 registros por run, sort DESC created_date)
 *   - Deleções em paralelo limitadas (batch de 10)
 */

// Config por entidade
const ENTITIES = [
  { name: 'ExternalValidationResult', fkField: 'onboardingCaseId' },
  { name: 'IntegrationLog',           fkField: 'onboarding_case_id' },
  { name: 'BdcRetryQueue',            fkField: 'onboarding_case_id' },
  { name: 'DocumentUpload',           fkField: 'onboardingCaseId' },
];

const PAGE_SIZE = 500;
const DELETE_BATCH = 3;
const BATCH_SLEEP_MS = 250;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function cleanupEntity(base44, entityConfig, validCaseIds) {
  const { name, fkField } = entityConfig;
  const startedAt = Date.now();

  let scanned = 0;
  let orphansFound = 0;
  let orphansDeleted = 0;
  const deletedIds = [];
  const errors = [];

  try {
    const rows = await base44.asServiceRole.entities[name].list('-created_date', PAGE_SIZE);
    scanned = rows.length;

    const orphans = rows.filter(r => {
      const fk = r?.[fkField];
      // Órfão se: vazio, null, placeholder óbvio, ou case não existe
      if (!fk || typeof fk !== 'string' || fk.trim() === '') return true;
      if (fk === 'test_validation') return true;
      return !validCaseIds.has(fk);
    });

    orphansFound = orphans.length;

    // Delete em batches pequenos com pausa (evita rate-limit do SDK)
    for (let i = 0; i < orphans.length; i += DELETE_BATCH) {
      const batch = orphans.slice(i, i + DELETE_BATCH);
      const results = await Promise.allSettled(
        batch.map(r => base44.asServiceRole.entities[name].delete(r.id))
      );
      results.forEach((res, idx) => {
        if (res.status === 'fulfilled') {
          orphansDeleted++;
          if (deletedIds.length < 20) deletedIds.push(batch[idx].id);
        } else {
          errors.push({ id: batch[idx].id, error: String(res.reason?.message || res.reason) });
        }
      });
      // Pausa entre batches — SDK Base44 rate-limita ~30req/s
      if (i + DELETE_BATCH < orphans.length) await sleep(BATCH_SLEEP_MS);
    }
  } catch (e) {
    errors.push({ entity: name, error: e.message });
  }

  return {
    entity: name,
    scanned,
    orphansFound,
    orphansDeleted,
    deletedIds,
    errors: errors.slice(0, 5), // primeiros 5 pra auditoria
    duration_ms: Date.now() - startedAt,
  };
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  try {
    const base44 = createClientFromRequest(req);

    // Auth: admin manual OU automação (service role)
    let isAutomation = false;
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch {
      isAutomation = true;
    }

    // 1) Fetch todos os OnboardingCase IDs válidos (cache em memória)
    // IMPORTANTE: precisamos da LISTA INTEIRA. Se algum dia crescer >5k, paginar.
    const allCases = await base44.asServiceRole.entities.OnboardingCase.list('-created_date', 5000);
    const validCaseIds = new Set(allCases.map(c => c.id));
    console.log(`[CleanupIntegrationOrphans] Loaded ${validCaseIds.size} valid OnboardingCase IDs`);

    // 2) Processa cada entidade em sequência (evita rate-limit)
    const results = [];
    for (const cfg of ENTITIES) {
      const result = await cleanupEntity(base44, cfg, validCaseIds);
      results.push(result);
      console.log(`[CleanupIntegrationOrphans] ${cfg.name}: scanned=${result.scanned}, orphans=${result.orphansFound}, deleted=${result.orphansDeleted}, errors=${result.errors.length}`);
    }

    const totals = results.reduce((acc, r) => ({
      scanned: acc.scanned + r.scanned,
      orphansFound: acc.orphansFound + r.orphansFound,
      orphansDeleted: acc.orphansDeleted + r.orphansDeleted,
    }), { scanned: 0, orphansFound: 0, orphansDeleted: 0 });

    console.log(`[CleanupIntegrationOrphans] ═══ DONE: scanned=${totals.scanned}, orphans=${totals.orphansFound}, deleted=${totals.orphansDeleted} (${Date.now() - startTime}ms) ═══`);

    return Response.json({
      success: true,
      isAutomation,
      validCases: validCaseIds.size,
      totals,
      byEntity: results,
      duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    console.error('[CleanupIntegrationOrphans] Error:', error);
    return Response.json({ error: error.message, duration_ms: Date.now() - startTime }, { status: 500 });
  }
});