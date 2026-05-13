import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * ADMIN — Mescla Merchants duplicados (mesmo CNPJ/CPF).
 *
 * Estratégia:
 *  - Agrupa Merchants por cpfCnpj (limpo, só dígitos).
 *  - Para cada grupo com >1 registro: mantém o MAIS ANTIGO (canônico).
 *  - Migra para o canônico:
 *       OnboardingCase.merchantId
 *       Lead (não tem merchantId, mas tem onboardingCaseId — segue case)
 *       Contract.merchantId (se existir)
 *       OnboardingCase.parentMerchantId (de subsellers)
 *       Merchant.parentMerchantId (de subsellers)
 *  - Apaga os Merchants duplicados (is_deleted via delete).
 *
 * Modos:
 *  - dryRun=true (default): apenas lista os grupos com duplicatas (sem alterar nada)
 *  - dryRun=false: executa a mesclagem
 *
 * Filtros:
 *  - cpfCnpj (opcional): processa só esse documento
 *
 * Permissão: admin obrigatório.
 */

function cleanDoc(d) {
  return String(d || '').replace(/\D/g, '');
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun !== false;          // default true
    const filterCpfCnpj = body.cpfCnpj ? cleanDoc(body.cpfCnpj) : null;

    // 1) Carrega todos os merchants
    const allMerchants = await base44.asServiceRole.entities.Merchant.list('-created_date', 5000);

    // 2) Agrupa por cpfCnpj limpo (apenas com >=11 dígitos)
    const groups = new Map(); // doc → [merchants]
    for (const m of allMerchants) {
      const doc = cleanDoc(m.cpfCnpj);
      if (doc.length < 11) continue;
      if (filterCpfCnpj && doc !== filterCpfCnpj) continue;
      // Subsellers e sellers são entidades distintas — chave inclui o tipo
      const key = m.isSubseller ? `sub:${m.parentMerchantId || 'unknown'}:${doc}` : `seller:${doc}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(m);
    }

    // 3) Pega só os grupos com >1
    const duplicateGroups = [];
    for (const [key, list] of groups.entries()) {
      if (list.length <= 1) continue;
      // Ordena: mais antigo primeiro (canônico)
      const sorted = list.sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
      duplicateGroups.push({
        key,
        cpfCnpj: cleanDoc(sorted[0].cpfCnpj),
        canonical: sorted[0],
        duplicates: sorted.slice(1),
      });
    }

    // 4) DRY RUN: só retorna o relatório
    if (dryRun) {
      return Response.json({
        ok: true,
        dryRun: true,
        totalGroupsWithDuplicates: duplicateGroups.length,
        totalDuplicateRecords: duplicateGroups.reduce((sum, g) => sum + g.duplicates.length, 0),
        groups: duplicateGroups.map(g => ({
          cpfCnpj: g.cpfCnpj,
          canonical: {
            id: g.canonical.id,
            fullName: g.canonical.fullName,
            companyName: g.canonical.companyName,
            email: g.canonical.email,
            onboardingStatus: g.canonical.onboardingStatus,
            created_date: g.canonical.created_date,
          },
          duplicates: g.duplicates.map(d => ({
            id: d.id,
            fullName: d.fullName,
            companyName: d.companyName,
            email: d.email,
            onboardingStatus: d.onboardingStatus,
            created_date: d.created_date,
          })),
        })),
      });
    }

    // 5) EXECUÇÃO: migra e apaga
    const report = {
      ok: true,
      dryRun: false,
      groupsProcessed: 0,
      casesMigrated: 0,
      subsellersReparented: 0,
      subCasesReparented: 0,
      contractsMigrated: 0,
      merchantsDeleted: 0,
      errors: [],
    };

    for (const g of duplicateGroups) {
      const canonicalId = g.canonical.id;
      const duplicateIds = g.duplicates.map(d => d.id);

      for (const dupId of duplicateIds) {
        try {
          // 5.1 — OnboardingCase.merchantId
          const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ merchantId: dupId });
          for (const c of cases) {
            await base44.asServiceRole.entities.OnboardingCase.update(c.id, { merchantId: canonicalId });
            report.casesMigrated++;
          }
          // 5.2 — OnboardingCase.parentMerchantId (subsellers do duplicado)
          const subCases = await base44.asServiceRole.entities.OnboardingCase.filter({ parentMerchantId: dupId });
          for (const c of subCases) {
            await base44.asServiceRole.entities.OnboardingCase.update(c.id, { parentMerchantId: canonicalId });
            report.subCasesReparented++;
          }
          // 5.3 — Merchant.parentMerchantId (subsellers vinculados ao duplicado)
          const subMerchants = await base44.asServiceRole.entities.Merchant.filter({ parentMerchantId: dupId });
          for (const sm of subMerchants) {
            await base44.asServiceRole.entities.Merchant.update(sm.id, { parentMerchantId: canonicalId });
            report.subsellersReparented++;
          }
          // 5.4 — Contract.merchantId (se houver)
          try {
            const contracts = await base44.asServiceRole.entities.Contract.filter({ merchantId: dupId });
            for (const c of contracts) {
              await base44.asServiceRole.entities.Contract.update(c.id, { merchantId: canonicalId });
              report.contractsMigrated++;
            }
          } catch (_) { /* entidade pode não existir ainda */ }

          // 5.5 — Apaga o duplicado
          await base44.asServiceRole.entities.Merchant.delete(dupId);
          report.merchantsDeleted++;
        } catch (err) {
          report.errors.push({ merchantId: dupId, error: err.message });
        }
      }
      report.groupsProcessed++;
    }

    return Response.json(report);
  } catch (error) {
    console.error('mergeDuplicateMerchants error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});