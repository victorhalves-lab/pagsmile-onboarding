import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BDC_BASE_URL = 'https://plataforma.bigdatacorp.com.br';
const MAX_TOTAL_ATTEMPTS = 50; // ~3 days with exponential backoff
const MAX_QUEUE_AGE_HOURS = 72; // give up after 3 days

// Backoff schedule in minutes (grows exponentially, capped at 4h)
const BACKOFF_MINUTES = [2, 5, 10, 15, 30, 60, 90, 120, 180, 240];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function jitter(base) { return base + Math.random() * base * 0.2; }

async function callBdcBatch(accessToken, tokenId, endpoint, document, datasets, batchId) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);
  const start = Date.now();
  try {
    const r = await fetch(`${BDC_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'AccessToken': accessToken, 'TokenId': tokenId, 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ Datasets: datasets.join(','), q: `doc{${document}}`, Limit: 1 }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const txt = await r.text();
    const elapsed = Date.now() - start;

    if (r.status >= 400) return { success: false, error: `HTTP ${r.status}`, elapsed };
    const bdcData = JSON.parse(txt);
    const result = bdcData.Result?.[0];
    if (!result || Object.keys(result).filter(k => k !== 'MatchKeys').length === 0) {
      return { success: false, error: 'Empty response', elapsed };
    }
    return { success: true, data: result, elapsed };
  } catch (e) {
    clearTimeout(timeoutId);
    return { success: false, error: e.name === 'AbortError' ? 'Timeout 90s' : e.message, elapsed: Date.now() - start };
  }
}

function mergeIntoResult(existing, newData) {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(newData)) {
    if (key === 'MatchKeys') merged.MatchKeys = value;
    else merged[key] = value;
  }
  return merged;
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
    const tokenId = Deno.env.get('BDC_TOKEN_ID');
    if (!accessToken || !tokenId) return Response.json({ error: 'BDC tokens not configured' }, { status: 500 });

    console.log(`[BDCWorker] ═══ Starting retry worker ═══`);

    // Find queue entries ready to retry
    const now = new Date().toISOString();
    const allPending = await base44.asServiceRole.entities.BdcRetryQueue.filter({ status: 'pending' });
    const ready = allPending.filter(q => !q.next_retry_at || q.next_retry_at <= now);

    console.log(`[BDCWorker] ${allPending.length} pending, ${ready.length} ready to retry`);

    if (ready.length === 0) {
      return Response.json({ success: true, processed: 0, duration_ms: Date.now() - startTime });
    }

    let processed = 0, succeeded = 0, failed = 0, givenUp = 0, pipelineReleased = 0;

    for (const queue of ready.slice(0, 10)) { // Max 10 per run
      processed++;

      // Check age — give up after MAX_QUEUE_AGE_HOURS
      const ageHours = (Date.now() - new Date(queue.first_attempt_at || queue.created_date).getTime()) / (3600 * 1000);
      if (ageHours > MAX_QUEUE_AGE_HOURS || queue.attempt_count >= MAX_TOTAL_ATTEMPTS) {
        console.warn(`[BDCWorker] Giving up on ${queue.onboarding_case_id} after ${ageHours.toFixed(1)}h / ${queue.attempt_count} attempts`);
        await base44.asServiceRole.entities.BdcRetryQueue.update(queue.id, {
          status: 'giving_up',
          last_error: `Given up after ${ageHours.toFixed(1)}h and ${queue.attempt_count} attempts`,
        });
        // Release pipeline with degraded data
        await base44.asServiceRole.entities.OnboardingCase.update(queue.onboarding_case_id, {
          status: 'Manual',
          iaDecision: 'Revisão Manual',
          iaExplanation: `BDC indisponível após ${queue.attempt_count} tentativas em ${ageHours.toFixed(0)}h — análise degradada com dados parciais`,
        });
        givenUp++;
        continue;
      }

      // Mark as processing
      await base44.asServiceRole.entities.BdcRetryQueue.update(queue.id, { status: 'processing' });

      const endpoint = queue.document_type === 'cpf' ? '/pessoas' : '/empresas';
      const pendingBatches = (queue.batches_pending || []).filter(b => b.status === 'pending');

      if (pendingBatches.length === 0) {
        // No pending batches — mark success
        await base44.asServiceRole.entities.BdcRetryQueue.update(queue.id, {
          status: 'success',
          last_success_at: new Date().toISOString(),
        });
        succeeded++;
        continue;
      }

      console.log(`[BDCWorker] Processing case ${queue.onboarding_case_id}: ${pendingBatches.length} batches pending (attempt ${queue.attempt_count + 1})`);

      // Retry each pending batch in parallel
      const batchPromises = pendingBatches.map(async (batch) => {
        const result = await callBdcBatch(accessToken, tokenId, endpoint, queue.document, batch.datasets, batch.batch_id);
        return { ...batch, result };
      });
      const batchResults = await Promise.all(batchPromises);

      // Update batch statuses and merge results
      const updatedBatches = [...(queue.batches_pending || [])];
      let mergedResult = queue.merged_result || {};
      let anySuccess = false, anyFail = false;

      for (const br of batchResults) {
        const idx = updatedBatches.findIndex(b => b.batch_id === br.batch_id);
        if (idx < 0) continue;

        if (br.result.success) {
          updatedBatches[idx] = {
            ...updatedBatches[idx],
            attempts: (updatedBatches[idx].attempts || 0) + 1,
            last_attempt_at: new Date().toISOString(),
            status: 'success',
            last_error: '',
          };
          mergedResult = mergeIntoResult(mergedResult, br.result.data);
          anySuccess = true;
        } else {
          updatedBatches[idx] = {
            ...updatedBatches[idx],
            attempts: (updatedBatches[idx].attempts || 0) + 1,
            last_attempt_at: new Date().toISOString(),
            last_error: br.result.error,
            status: 'pending',
          };
          anyFail = true;
        }
      }

      const allDone = updatedBatches.every(b => b.status === 'success');
      const criticalStillPending = updatedBatches.some(b => b.priority === 'CRITICAL' && b.status === 'pending');
      const newSuccessBatches = updatedBatches.filter(b => b.status === 'success').map(b => b.batch_id);

      // Calculate next retry time
      const backoffIdx = Math.min(queue.attempt_count, BACKOFF_MINUTES.length - 1);
      const nextRetryMs = jitter(BACKOFF_MINUTES[backoffIdx] * 60 * 1000);
      const nextRetryAt = new Date(Date.now() + nextRetryMs).toISOString();

      if (allDone) {
        // All batches succeeded — update queue and trigger pipeline
        await base44.asServiceRole.entities.BdcRetryQueue.update(queue.id, {
          batches_pending: updatedBatches,
          batches_success: newSuccessBatches,
          attempt_count: queue.attempt_count + 1,
          last_success_at: new Date().toISOString(),
          status: 'success',
          merged_result: mergedResult,
        });

        // Re-run the full pipeline (autoEnrichOnboarding will recompute score)
        try {
          console.log(`[BDCWorker] ✅ All batches success for ${queue.onboarding_case_id} — triggering pipeline`);
          // Save merged result as ExternalValidationResult so downstream uses it
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId: queue.onboarding_case_id, provider: 'BigDataCorp',
            validationType: `Enriquecimento (retry completo) — ${queue.dataset_group}`,
            endpoint, resultData: mergedResult,
            status: 'Sucesso', timestamp: new Date().toISOString(),
            responseTime: batchResults.reduce((s, br) => s + (br.result.elapsed || 0), 0),
          });

          await base44.asServiceRole.functions.invoke('autoEnrichOnboarding', { onboardingCaseId: queue.onboarding_case_id });
          pipelineReleased++;
        } catch (pipelineErr) {
          console.warn(`[BDCWorker] Pipeline trigger failed: ${pipelineErr.message}`);
        }
        succeeded++;
      } else {
        // Still pending — reschedule
        await base44.asServiceRole.entities.BdcRetryQueue.update(queue.id, {
          batches_pending: updatedBatches,
          batches_success: newSuccessBatches,
          attempt_count: queue.attempt_count + 1,
          next_retry_at: nextRetryAt,
          status: 'pending',
          last_error: anyFail ? `Batches still pending: ${updatedBatches.filter(b => b.status === 'pending').map(b => b.batch_id).join(', ')}` : '',
          merged_result: mergedResult,
        });

        // Update case to show progress
        await base44.asServiceRole.entities.OnboardingCase.update(queue.onboarding_case_id, {
          iaExplanation: `Aguardando BDC — tentativa ${queue.attempt_count + 1}/${MAX_TOTAL_ATTEMPTS} — ${updatedBatches.filter(b => b.status === 'pending').length} lote(s) pendente(s) — próximo retry em ${Math.round(nextRetryMs / 60000)}min`,
        });

        if (anySuccess) succeeded++;
        else failed++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[BDCWorker] ═══ Done: processed=${processed}, succeeded=${succeeded}, failed=${failed}, givenUp=${givenUp}, pipelineReleased=${pipelineReleased} (${duration}ms) ═══`);

    return Response.json({
      success: true, processed, succeeded, failed, givenUp, pipelineReleased, duration_ms: duration,
    });
  } catch (error) {
    console.error('[BDCWorker] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});