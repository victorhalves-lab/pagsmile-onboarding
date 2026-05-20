// ─────────────────────────────────────────────────────────────────────
// autoEnrichOnboardingV5_2 — Orquestrador V5.2 (paralelo a V4 e V5.1)
// ─────────────────────────────────────────────────────────────────────
// REGRA SUPREMA:
//   - SÓ processa casos com framework_version === 'v5.2'.
//   - NUNCA invoca autoEnrichOnboarding (V4) nem autoEnrichOnboardingV5_1.
//   - MVP: invoca bdcEnrichCaseV5_2 (scoring) + atualiza status + notifica.
//   - Enrichment BDC/CAF detalhado virá na Entrega 3 (pipeline 12 steps).
// ─────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const t0 = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    let caseId = body.onboardingCaseId;
    if (!caseId && body.event?.entity_id) caseId = body.event.entity_id;
    if (!caseId && body.data?.id) caseId = body.data.id;

    if (!caseId) return Response.json({ skipped: true, reason: 'no_case_id' });

    const [oc] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
    if (!oc) return Response.json({ skipped: true, reason: 'case_not_found' });

    // GUARD: V5.2 only
    if ((oc.framework_version || 'v4.0') !== 'v5.2') {
      console.log(`[AutoEnrichV5_2] Case ${caseId} is ${oc.framework_version || 'v4.0'} — skipping`);
      return Response.json({ skipped: true, reason: 'wrong_framework', framework: oc.framework_version || 'v4.0' });
    }

    if (!oc.merchantId || !oc.questionnaireTemplateId) {
      return Response.json({ skipped: true, reason: 'incomplete_case' });
    }

    console.log(`[AutoEnrichV5_2] ═══ Starting V5.2 pipeline for case ${caseId} ═══`);

    await base44.asServiceRole.entities.OnboardingCase.update(caseId, { status: 'Em Processamento' });

    // ═══ STEP 1: V5.2 Scoring (cross-deployment para evitar 508 LOOP_DETECTED) ═══
    let scoringResult = null;
    try {
      console.log(`[AutoEnrichV5_2] Step 1: V5.2 scoring...`);
      const appId = Deno.env.get('BASE44_APP_ID');
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
      const fnUrl = `https://base44.app/api/apps/${appId}/functions/bdcEnrichCaseV5_2`;
      const fnRes = await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify({ onboardingCaseId: caseId }),
      });
      if (!fnRes.ok) {
        const txt = await fnRes.text();
        throw new Error(`bdcEnrichCaseV5_2 HTTP ${fnRes.status}: ${txt.slice(0, 200)}`);
      }
      scoringResult = await fnRes.json();
      console.log(`[AutoEnrichV5_2] Step 1: score=${scoringResult?.score} cat=${scoringResult?.categoria_decisao}`);
    } catch (e) {
      console.error(`[AutoEnrichV5_2] Step 1 failed: ${e.message}`);
      return Response.json({ success: false, error: e.message }, { status: 500 });
    }

    const finalStatus = scoringResult?.status_legacy || 'Manual';
    const finalDecision = scoringResult?.recomendacao_final || 'Revisão Manual';
    const isAuto = scoringResult?.categoria_decisao === 'cat_1_auto_approve';

    // ═══ STEP 2: Slack notification (best-effort) ═══
    try {
      const [merchant] = await base44.asServiceRole.entities.Merchant.filter({ id: oc.merchantId });
      const emoji = { 'Aprovado': '✅', 'Manual': '⚠️', 'Recusado': '🚫' }[finalStatus] || '📋';
      const msg = [
        `${emoji} *Pipeline V5.2 — DATA-FIRST*`,
        ``,
        `*Empresa:* ${merchant?.fullName || 'N/D'} (${merchant?.cpfCnpj || 'N/D'})`,
        `*Framework:* V5.2`,
        `*Tier:* ${scoringResult?.tier} | *Segmento:* ${scoringResult?.segmento} | *Morfologia:* ${scoringResult?.morfologia}`,
        `*Score V5.2:* ${scoringResult?.score}/${scoringResult?.score_max}`,
        `*Subfaixa tier-aware:* ${scoringResult?.subfaixa_tier_aware}`,
        `*Categoria:* ${scoringResult?.categoria_decisao}`,
        `*Decisão:* ${finalDecision}${isAuto ? ' ⚡ AUTOMÁTICA' : ' 🔍 Manual'}`,
        scoringResult?.capabilities_ativas?.length ? `*Capabilities:* ${scoringResult.capabilities_ativas.join(', ')}` : '',
        ``,
        `📊 <https://app.base44.com/CadastroDetalhe?id=${merchant?.id}|Ver Dossiê>`,
      ].filter(Boolean).join('\n');

      const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: '#compliance', text: msg, unfurl_links: false }),
      });
    } catch (slackErr) {
      console.warn(`[AutoEnrichV5_2] Slack notification failed (non-blocking): ${slackErr.message}`);
    }

    const elapsed = Date.now() - t0;
    console.log(`[AutoEnrichV5_2] ═══ Completed in ${elapsed}ms — decision=${finalDecision} ═══`);

    return Response.json({
      success: true,
      caseId,
      framework_version: 'v5.2',
      decision: { finalStatus, finalDecision, isAuto },
      scoring: scoringResult,
      duration_ms: elapsed,
    });
  } catch (e) {
    console.error('[AutoEnrichV5_2] ERROR:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
});