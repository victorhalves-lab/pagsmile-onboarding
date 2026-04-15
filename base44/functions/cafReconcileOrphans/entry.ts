import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafReconcileOrphans — ITEM 2: Reconciliação diária de transações CAF
 *
 * Detecta transações na CAF que não têm IntegrationLog correspondente (orphans)
 * e reprocessa-as via auto-fetch completo, salvando resultados no sistema.
 *
 * Modos:
 *   - reconcile (default): detecta e reprocessa orphans das últimas 48h
 *   - stats: retorna estatísticas sem reprocessar
 *
 * Chamado automaticamente via scheduled automation (diário, 2h da manhã)
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

function getCafToken() {
  const token = Deno.env.get('CAF_CLIENT_SECRET');
  if (!token) throw new Error('CAF_CLIENT_SECRET not configured');
  return token;
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);

    // Allow both admin and scheduled (service role) calls
    try {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      // Called via scheduled automation — allowed
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'reconcile';
    const hoursBack = body.hoursBack || 48;
    const authToken = getCafToken();

    // Calculate date range
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - hoursBack * 3600000).toISOString();

    console.log(`[CAF-Reconcile] Mode: ${mode}, range: ${hoursBack}h back`);

    // Fetch recent transactions from CAF (paginated, max 10 per page)
    const allItems = [];
    let offset = 0;
    const maxPages = 10; // Max 100 transactions to scan

    for (let page = 0; page < maxPages; page++) {
      const params = new URLSearchParams({
        _limit: '10',
        _offset: String(offset),
        _order: 'desc',
        _startCreatedDate: startDate,
        _endCreatedDate: endDate,
      });

      const response = await fetch(`${CAF_API_BASE}/v1/transactions?${params}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (!response.ok) break;

      const text = await response.text();
      let result;
      try { result = JSON.parse(text); } catch { break; }

      const items = result?.items || [];
      if (items.length === 0) break;

      allItems.push(...items);
      offset += 10;

      if (allItems.length >= (result?.totalItems || 0)) break;
    }

    console.log(`[CAF-Reconcile] Scanned ${allItems.length} CAF transactions`);

    // Find orphans — transactions not in our IntegrationLog
    const orphans = [];
    const matched = [];

    for (const item of allItems) {
      const txId = item.id || item.uuid;
      if (!txId) continue;

      const logs = await base44.asServiceRole.entities.IntegrationLog.filter({
        transaction_id: txId, provider: 'CAF',
      });

      if (logs.length === 0) {
        orphans.push({
          id: txId,
          status: item.status,
          createdAt: item.createdAt,
          type: item.type,
          data: item.data,
        });
      } else {
        matched.push(txId);
      }
    }

    console.log(`[CAF-Reconcile] Found ${orphans.length} orphans, ${matched.length} matched`);

    // Stats mode — just return numbers
    if (mode === 'stats') {
      const statusDist = {};
      for (const item of allItems) {
        statusDist[item.status || 'UNKNOWN'] = (statusDist[item.status || 'UNKNOWN'] || 0) + 1;
      }

      return Response.json({
        success: true,
        mode: 'stats',
        totalScanned: allItems.length,
        orphanCount: orphans.length,
        matchedCount: matched.length,
        statusDistribution: statusDist,
        dateRange: { start: startDate, end: endDate },
        duration_ms: Date.now() - startTime,
      });
    }

    // Reconcile mode — reprocess orphans
    let reconciled = 0;
    let failed = 0;
    const reconciledDetails = [];

    for (const orphan of orphans) {
      try {
        // Fetch full transaction
        const txResponse = await fetch(
          `${CAF_API_BASE}/v1/transactions/${orphan.id}?_includeCroppedImages=true&_includePfRelationships=true&_lang=pt`,
          { method: 'GET', headers: { 'Authorization': `Bearer ${authToken}` } }
        );

        if (!txResponse.ok) {
          failed++;
          continue;
        }

        const txText = await txResponse.text();
        let txResult;
        try { txResult = JSON.parse(txText); } catch { failed++; continue; }

        const sections = txResult?.sections || {};
        const cafStatus = txResult?.status || 'UNKNOWN';
        const onboardingId = txResult?.onboardingId || '';

        // Try to find related case via metadata
        let onboardingCaseId = txResult?.metadata?.onboardingCaseId || '';

        // If no metadata, try to find by onboarding_id
        if (!onboardingCaseId && onboardingId) {
          const relatedLogs = await base44.asServiceRole.entities.IntegrationLog.filter({
            onboarding_id: onboardingId, provider: 'CAF',
          });
          if (relatedLogs[0]?.onboarding_case_id) {
            onboardingCaseId = relatedLogs[0].onboarding_case_id;
          }
        }

        // Create IntegrationLog for the orphan
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          provider: 'CAF',
          service_type: 'transaction',
          transaction_id: orphan.id,
          onboarding_id: onboardingId,
          status: cafStatus === 'APPROVED' ? 'success' : cafStatus === 'REPROVED' ? 'failed' : 'processing',
          result_status: cafStatus === 'APPROVED' ? 'APPROVED' : cafStatus === 'REPROVED' ? 'REPROVED' : 'PENDING_REVIEW',
          request_payload: { reconciled: true, originalCreatedAt: orphan.createdAt },
          response_payload: {
            status: cafStatus,
            sectionsReturned: Object.keys(sections),
            reconciledAt: new Date().toISOString(),
          },
          duration_ms: 0,
        });

        // Save sections as ExternalValidationResult if case-linked
        if (onboardingCaseId) {
          for (const [secName, secData] of Object.entries(sections)) {
            try {
              await base44.asServiceRole.entities.ExternalValidationResult.create({
                onboardingCaseId, provider: 'CAF',
                validationType: `Reconciled — ${secName}`,
                endpoint: `/v1/transactions/${orphan.id} (${secName})`,
                resultData: secData,
                status: 'Sucesso',
                timestamp: new Date().toISOString(),
              });
            } catch { /* skip */ }
          }
        }

        reconciled++;
        reconciledDetails.push({
          id: orphan.id,
          status: cafStatus,
          sections: Object.keys(sections).length,
          caseLinked: !!onboardingCaseId,
        });

      } catch (e) {
        console.warn(`[CAF-Reconcile] Failed to reconcile ${orphan.id}:`, e.message);
        failed++;
      }
    }

    // Send Slack notification if orphans were found
    if (orphans.length > 0) {
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
        const message = [
          `🔍 *CAF Reconciliação Diária*`,
          ``,
          `Transações CAF escaneadas: ${allItems.length}`,
          `Orphans encontrados: ${orphans.length}`,
          `Reconciliados com sucesso: ${reconciled}`,
          `Falhas: ${failed}`,
          ``,
          reconciled > 0 ? `✅ ${reconciled} transações recuperadas e salvas no sistema.` : '',
          failed > 0 ? `⚠️ ${failed} transações não puderam ser recuperadas.` : '',
        ].filter(Boolean).join('\n');

        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: '#compliance', text: message, unfurl_links: false }),
        });
      } catch (e) {
        console.warn('[CAF-Reconcile] Slack notification failed:', e.message);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[CAF-Reconcile] Done in ${duration}ms: ${reconciled} reconciled, ${failed} failed`);

    return Response.json({
      success: true,
      mode: 'reconcile',
      totalScanned: allItems.length,
      orphanCount: orphans.length,
      reconciled,
      failed,
      reconciledDetails,
      dateRange: { start: startDate, end: endDate },
      duration_ms: duration,
    });

  } catch (error) {
    console.error('[CAF-Reconcile] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});