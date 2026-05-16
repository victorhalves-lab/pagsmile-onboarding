/**
 * bdcMonitoringWebhook — GAP 10
 * Recebe webhooks de mudanças do BDC Monitoring API.
 *
 * Eventos esperados (vindos da BDC):
 *   - nova sanção em sócio
 *   - mudança de QSA
 *   - novo processo (criminal alerta crítico)
 *   - mudança de status SCR
 *   - mudança cadastral RF
 *   - falecimento de sócio
 *
 * Fluxo:
 *   1. Validar assinatura (header X-BDC-Signature ou query secret)
 *   2. Deduplicar pelo bdcEventId
 *   3. Persistir como BdcMonitoringEvent
 *   4. Disparar downstream:
 *      - Re-enrichment automático do caso
 *      - Notificação Slack (eventos CRITICAL/HIGH)
 *      - Flag para análise manual se mudança crítica
 *
 * Authenticação: shared secret no query param `?secret=...` (BDC_WEBHOOK_SECRET).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Mapeamento BDC event_type → enum interno
const EVENT_TYPE_MAP = {
  'new_sanction': 'new_sanction', 'sanction_added': 'new_sanction',
  'new_pep': 'new_pep', 'pep_status_change': 'new_pep',
  'new_lawsuit': 'new_lawsuit', 'lawsuit_added': 'new_lawsuit',
  'new_criminal_lawsuit': 'new_criminal_lawsuit', 'criminal_lawsuit_added': 'new_criminal_lawsuit',
  'qsa_change': 'qsa_change', 'partnership_change': 'qsa_change',
  'capital_change': 'capital_change', 'share_capital_change': 'capital_change',
  'address_change': 'address_change',
  'scr_change': 'scr_change', 'credit_score_change': 'scr_change',
  'tax_status_change': 'tax_status_change', 'cnpj_status_change': 'tax_status_change',
  'cpf_status_change': 'tax_status_change',
  'owner_death': 'owner_death', 'death_registered': 'owner_death',
  'new_government_debt': 'new_government_debt', 'debt_added': 'new_government_debt',
  'media_adverse': 'media_adverse', 'adverse_media': 'media_adverse',
  'license_revoked': 'license_revoked', 'license_change': 'license_revoked',
};

const SEVERITY_MAP = {
  'new_sanction': 'CRITICAL',
  'new_criminal_lawsuit': 'CRITICAL',
  'owner_death': 'HIGH',
  'tax_status_change': 'HIGH',
  'qsa_change': 'HIGH',
  'new_lawsuit': 'MEDIUM',
  'new_government_debt': 'MEDIUM',
  'media_adverse': 'MEDIUM',
  'license_revoked': 'MEDIUM',
  'new_pep': 'HIGH',
  'capital_change': 'LOW',
  'address_change': 'LOW',
  'scr_change': 'MEDIUM',
};

function classifyEvent(rawType) {
  const normalized = String(rawType || '').toLowerCase().trim();
  return EVENT_TYPE_MAP[normalized] || 'other';
}

function buildSummary(eventType, payload) {
  const doc = payload?.Document || payload?.TaxIdNumber || 'documento';
  const detail = payload?.Description || payload?.Detail || '';
  switch (eventType) {
    case 'new_sanction': return `Nova sanção identificada em ${doc}${detail ? ': ' + detail : ''}`;
    case 'new_pep': return `${doc} passou a constar como PEP`;
    case 'new_criminal_lawsuit': return `Novo processo CRIMINAL para ${doc}${detail ? ': ' + detail : ''}`;
    case 'new_lawsuit': return `Novo processo judicial para ${doc}${detail ? ': ' + detail : ''}`;
    case 'qsa_change': return `Mudança no QSA de ${doc}${detail ? ': ' + detail : ''}`;
    case 'tax_status_change': return `Status cadastral de ${doc} mudou${detail ? ': ' + detail : ''}`;
    case 'owner_death': return `Sócio falecido vinculado a ${doc}${detail ? ': ' + detail : ''}`;
    case 'new_government_debt': return `Nova dívida com governo para ${doc}${detail ? ': ' + detail : ''}`;
    case 'media_adverse': return `Mídia adversa detectada para ${doc}${detail ? ': ' + detail : ''}`;
    case 'license_revoked': return `Licença revogada/alterada para ${doc}${detail ? ': ' + detail : ''}`;
    case 'capital_change': return `Mudança de capital social em ${doc}`;
    case 'address_change': return `Mudança de endereço em ${doc}`;
    case 'scr_change': return `Mudança no SCR de ${doc}`;
    default: return `Evento BDC recebido para ${doc}`;
  }
}

async function triggerDownstream(base44, event, doc, severity, onboardingCaseId) {
  const actions = [];

  // 1. Re-enrichment do caso (HIGH/CRITICAL)
  if ((severity === 'HIGH' || severity === 'CRITICAL') && onboardingCaseId) {
    try {
      await base44.asServiceRole.functions.invoke('bdcEnrichCase', { onboardingCaseId });
      actions.push('reenrich_case');
    } catch (e) {
      console.warn('[BDC-Monitor] reenrich failed:', e.message);
    }
  }

  // 2. Flag para análise manual em eventos críticos
  if (severity === 'CRITICAL' && onboardingCaseId) {
    try {
      const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
      if (cases[0]) {
        const prev = (cases[0].redFlags || []).filter(f => !String(f).startsWith('MONITORING:'));
        await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, {
          redFlags: [...prev, `MONITORING: ${event} — ${doc}`],
          status: cases[0].status === 'Aprovado' ? 'Manual' : cases[0].status,
        });
        actions.push('flag_for_manual_review');
      }
    } catch (e) {
      console.warn('[BDC-Monitor] flag case failed:', e.message);
    }
  }

  return actions;
}

Deno.serve(async (req) => {
  const startedAt = Date.now();
  try {
    // 1. Validate shared secret
    const url = new URL(req.url);
    const querySecret = url.searchParams.get('secret');
    const expectedSecret = Deno.env.get('BDC_WEBHOOK_SECRET');
    if (!expectedSecret) {
      console.error('[BDC-Monitor] BDC_WEBHOOK_SECRET not configured');
      return Response.json({ error: 'Webhook not configured' }, { status: 500 });
    }
    if (querySecret !== expectedSecret) {
      console.warn('[BDC-Monitor] Invalid secret');
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

    const payload = await req.json().catch(() => ({}));
    console.log('[BDC-Monitor] Webhook received:', JSON.stringify(payload).slice(0, 500));

    // BDC pode mandar 1 evento ou um array de eventos
    const events = Array.isArray(payload?.Events) ? payload.Events
      : Array.isArray(payload) ? payload
      : [payload];

    const base44 = await import('npm:@base44/sdk@0.8.25').then(({ createClient }) => createClient({
      appId: Deno.env.get('BASE44_APP_ID'), requiresAuth: false,
    }));

    const processed = [];
    for (const ev of events) {
      try {
        const rawType = ev?.EventType || ev?.Type || ev?.event_type;
        const eventType = classifyEvent(rawType);
        const doc = String(ev?.Document || ev?.TaxIdNumber || ev?.document || '').replace(/\D/g, '');
        if (!doc) {
          console.warn('[BDC-Monitor] Skip event — no document');
          continue;
        }
        const documentType = doc.length === 11 ? 'cpf' : 'cnpj';
        const severity = SEVERITY_MAP[eventType] || 'MEDIUM';
        const bdcEventId = String(ev?.EventId || ev?.Id || ev?.event_id || '');

        // Dedupe
        if (bdcEventId) {
          const existing = await base44.asServiceRole.entities.BdcMonitoringEvent.filter({ bdcEventId });
          if (existing.length > 0) {
            console.log(`[BDC-Monitor] Dedupe — event ${bdcEventId} already received`);
            processed.push({ bdcEventId, status: 'duplicate' });
            continue;
          }
        }

        // Find associated case/merchant by document
        let merchantId = '', onboardingCaseId = '';
        try {
          const merchants = await base44.asServiceRole.entities.Merchant.filter({ cpfCnpj: doc });
          if (merchants[0]) {
            merchantId = merchants[0].id;
            const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ merchantId });
            // pega o caso mais recente
            const sorted = (cases || []).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
            if (sorted[0]) onboardingCaseId = sorted[0].id;
          }
        } catch (e) { console.warn('[BDC-Monitor] case lookup failed:', e.message); }

        const summary = buildSummary(eventType, ev);
        const downstreamActions = await triggerDownstream(base44, eventType, doc, severity, onboardingCaseId);

        const created = await base44.asServiceRole.entities.BdcMonitoringEvent.create({
          document: doc, documentType,
          merchantId, onboardingCaseId,
          eventType, severity, summary,
          rawPayload: ev,
          bdcEventId,
          datasetSource: ev?.DatasetSource || ev?.Dataset || '',
          occurredAt: ev?.EventDate || ev?.OccurredAt || new Date().toISOString(),
          receivedAt: new Date().toISOString(),
          processedStatus: 'processed',
          processedAt: new Date().toISOString(),
          downstreamActions,
        });

        processed.push({ id: created?.id, bdcEventId, eventType, severity, downstreamActions });
      } catch (eventErr) {
        console.error('[BDC-Monitor] Event processing error:', eventErr.message);
        processed.push({ status: 'error', error: eventErr.message });
      }
    }

    return Response.json({
      success: true,
      received: events.length,
      processed: processed.length,
      events: processed,
      elapsed_ms: Date.now() - startedAt,
    });
  } catch (error) {
    console.error('[BDC-Monitor] Fatal:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});