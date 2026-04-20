import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafReconcilePendingTransactions — rede de segurança para quando webhook falhar.
 *
 * Busca IntegrationLogs da CAF das últimas 24h que estão em estado pendente
 * (status === 'processing' ou 'pending', sem callback_received_at),
 * consulta a CAF via GET /v1/transactions/:id e, se houver mudança de status,
 * atualiza o caso como se fosse um webhook recebido.
 *
 * Chamado por:
 *   - Automação agendada a cada 10 minutos (bulk, sem payload)
 *   - Botão manual admin "Resincronizar CAF" (payload: { onboardingCaseId } OU { transactionId })
 *
 * Idempotente: se o webhook já atualizou o log, a função detecta e ignora.
 */

const CONNECT_BASE = 'https://api.us.prd.caf.io';
const CORE_BASE = 'https://api.combateafraude.com';

// ── OAuth2 Connect ──
let connectTokenCache = { accessToken: null, expiresAt: 0 };
async function getConnectToken() {
  const clientId = Deno.env.get('CAF_CONNECT_CLIENT_ID');
  const clientSecret = Deno.env.get('CAF_CONNECT_CLIENT_SECRET');
  if (!clientId || !clientSecret) return null;
  const now = Date.now();
  if (connectTokenCache.accessToken && connectTokenCache.expiresAt - 60_000 > now) {
    return connectTokenCache.accessToken;
  }
  const res = await fetch(`${CONNECT_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret,
    }).toString(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) return null;
  connectTokenCache = {
    accessToken: json.access_token,
    expiresAt: now + (Number(json.expires_in) || 3600) * 1000,
  };
  return json.access_token;
}

function getCoreToken() {
  return Deno.env.get('CAF_CORE_API_TOKEN');
}

// ── Busca transação: tenta Connect primeiro, depois Core (API legada) ──
async function fetchTransaction(transactionId) {
  const connectToken = await getConnectToken();
  if (connectToken) {
    try {
      const r = await fetch(
        `${CONNECT_BASE}/v1/transactions/${transactionId}?_includeCroppedImages=false&_lang=pt`,
        { headers: { 'Authorization': `Bearer ${connectToken}` } }
      );
      if (r.ok) return { data: await r.json(), source: 'connect' };
    } catch { /* fallback */ }
  }
  const coreToken = getCoreToken();
  if (coreToken) {
    try {
      const r = await fetch(
        `${CORE_BASE}/v1/transactions/${transactionId}?_includeCroppedImages=false&_lang=pt`,
        { headers: { 'Authorization': `Bearer ${coreToken}` } }
      );
      if (r.ok) return { data: await r.json(), source: 'core' };
    } catch { /* */ }
  }
  return null;
}

// Normaliza status CAF → status interno
function normalizeCafStatus(cafStatus) {
  const s = String(cafStatus || '').toUpperCase();
  if (s === 'APPROVED') return { internal: 'success', result: 'APPROVED' };
  if (s === 'REPROVED') return { internal: 'failed', result: 'REPROVED' };
  if (s === 'PENDING' || s === 'PENDING_REVIEW' || s === 'MANUAL_REVIEW') return { internal: 'processing', result: 'PENDING_REVIEW' };
  if (s === 'PROCESSING' || s === 'STARTED') return { internal: 'processing', result: null };
  return { internal: 'processing', result: null };
}

// Processa um único log pendente
async function reconcileOneLog(base44, log) {
  const result = {
    logId: log.id,
    transactionId: log.transaction_id,
    onboardingCaseId: log.onboarding_case_id,
    action: 'unchanged',
    error: null,
  };

  if (!log.transaction_id) {
    result.action = 'skipped_no_tx_id';
    return result;
  }

  const tx = await fetchTransaction(log.transaction_id);
  if (!tx) {
    result.action = 'fetch_failed';
    result.error = 'CAF não retornou dados para transactionId';
    return result;
  }

  const cafStatus = tx.data?.status || tx.data?.transactionStatus || '';
  const { internal, result: resultStatus } = normalizeCafStatus(cafStatus);

  // Se ainda está em processamento na CAF, nada a fazer
  if (internal === 'processing' && !resultStatus) {
    result.action = 'still_processing';
    result.cafStatus = cafStatus;
    return result;
  }

  // Atualiza o log com o status final
  try {
    await base44.asServiceRole.entities.IntegrationLog.update(log.id, {
      status: internal,
      result_status: resultStatus || log.result_status,
      response_payload: tx.data,
      callback_received_at: log.callback_received_at || new Date().toISOString(),
      callback_payload: {
        ...(log.callback_payload || {}),
        _reconciled: true,
        _reconciled_at: new Date().toISOString(),
        _reconciliation_source: tx.source,
      },
    });
  } catch (e) {
    result.error = `log update: ${e.message}`;
  }

  // Atualiza o OnboardingCase
  if (log.onboarding_case_id) {
    try {
      const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: log.onboarding_case_id });
      if (cases[0]) {
        const updates = {};
        if (cafStatus === 'APPROVED' && !cases[0].cafCompleted) updates.cafCompleted = true;
        if (cafStatus === 'REPROVED') updates.cafCompleted = true;
        if (Object.keys(updates).length) {
          await base44.asServiceRole.entities.OnboardingCase.update(log.onboarding_case_id, updates);
        }

        // Dispara enrichment pipeline se o status virou final
        if (resultStatus) {
          try {
            await base44.asServiceRole.functions.invoke('autoEnrichOnboarding', {
              onboardingCaseId: log.onboarding_case_id,
            });
          } catch { /* */ }
        }
      }
    } catch (e) {
      result.error = (result.error || '') + ` case update: ${e.message}`;
    }
  }

  // Log da reconciliação
  try {
    await base44.asServiceRole.entities.IntegrationLog.create({
      onboarding_case_id: log.onboarding_case_id || '',
      provider: 'CAF',
      service_type: 'caf_webhook_received',
      transaction_id: log.transaction_id,
      request_id: `reconcile-${log.id}-${Date.now()}`,
      status: 'success',
      result_status: resultStatus || log.result_status,
      request_payload: { _reconciliation: true, source_log: log.id, fetched_from: tx.source },
      response_payload: tx.data,
      callback_received_at: new Date().toISOString(),
    });
  } catch { /* */ }

  result.action = 'reconciled';
  result.cafStatus = cafStatus;
  result.resultStatus = resultStatus;
  return result;
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  try {
    const base44 = createClientFromRequest(req);

    // Verifica auth: admin manual OU automação (sem auth)
    let isAutomation = false;
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      isAutomation = true;
    }

    const body = await req.json().catch(() => ({}));
    const { onboardingCaseId, transactionId, event } = body;

    // Busca logs a processar
    let logsToProcess = [];

    if (transactionId) {
      // Modo: reconciliar uma transação específica
      logsToProcess = await base44.asServiceRole.entities.IntegrationLog.filter({
        transaction_id: transactionId, provider: 'CAF',
      });
    } else if (onboardingCaseId) {
      // Modo: reconciliar todas as transações CAF de um caso
      logsToProcess = await base44.asServiceRole.entities.IntegrationLog.filter({
        onboarding_case_id: onboardingCaseId, provider: 'CAF',
      });
      // Filtra só os que não estão concluídos
      logsToProcess = logsToProcess.filter(l =>
        l.transaction_id && (l.status === 'processing' || l.status === 'pending' || !l.callback_received_at)
      );
    } else {
      // Modo: bulk (automação agendada) — últimas 24h, pendentes
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const all = await base44.asServiceRole.entities.IntegrationLog.filter({
        provider: 'CAF',
        status: 'processing',
      }, '-created_date', 200);
      logsToProcess = all.filter(l =>
        l.transaction_id &&
        l.created_date >= since &&
        !l.callback_received_at &&
        l.service_type !== 'caf_webhook_received'
      );
    }

    if (!logsToProcess.length) {
      return Response.json({
        success: true,
        processed: 0,
        reconciled: 0,
        message: 'Nenhuma transação pendente',
        duration_ms: Date.now() - startTime,
      });
    }

    // Processa em série (evita rate limit da CAF)
    const results = [];
    for (const log of logsToProcess) {
      const r = await reconcileOneLog(base44, log);
      results.push(r);
    }

    const reconciled = results.filter(r => r.action === 'reconciled').length;
    const stillProcessing = results.filter(r => r.action === 'still_processing').length;
    const failed = results.filter(r => r.action === 'fetch_failed').length;

    return Response.json({
      success: true,
      processed: results.length,
      reconciled,
      stillProcessing,
      failed,
      isAutomation,
      duration_ms: Date.now() - startTime,
      results: results.slice(0, 50),
    });
  } catch (error) {
    console.error('[cafReconcile] Error:', error);
    return Response.json({ error: error.message, duration_ms: Date.now() - startTime }, { status: 500 });
  }
});