/**
 * createPendencyRequest
 * --------------------------------------------------------------------
 * Admin-only. Cria uma PendencyRequest para um caso em "Manual" ou
 * "Docs Solicitados" e dispara e-mail ao cliente com link público.
 *
 * Body:
 *   - onboardingCaseId (string, required)
 *   - generalMessage (string, optional)
 *   - deadlineDays (number, required — 1 a 60)
 *   - items (array, required — kind: 'document'|'question', etc.)
 *
 * Side-effects:
 *   - cria PendencyRequest (status='open', token UUID, expiresAt)
 *   - atualiza OnboardingCase.status -> 'Docs Solicitados'
 *   - registra currentPendencyRequestId no caso
 *   - dispara emailPendencyRequest (não bloqueia se falhar)
 *   - grava AuditLog/AccessTrail
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function uuid() {
  // RFC4122 v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isValidItem(it) {
  if (!it || typeof it !== 'object') return false;
  if (!it.itemId || typeof it.itemId !== 'string') return false;
  if (!['document', 'question'].includes(it.kind)) return false;
  if (!it.label || typeof it.label !== 'string' || !it.label.trim()) return false;
  if (it.kind === 'document') {
    if (!Array.isArray(it.acceptedFileTypes) || it.acceptedFileTypes.length === 0) return false;
    if (!it.acceptedFileTypes.every(t => ['pdf', 'image'].includes(t))) return false;
    if (typeof it.requiredQuantity !== 'number' || it.requiredQuantity < 1 || it.requiredQuantity > 20) return false;
  }
  if (it.kind === 'question') {
    if (!['text', 'textarea', 'number', 'yes_no', 'date'].includes(it.answerType)) return false;
  }
  return true;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ ok: false, error: 'method_not_allowed' }, { status: 405 });
    }
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { onboardingCaseId, generalMessage = '', deadlineDays = 7, items = [] } = body;

    if (!onboardingCaseId) {
      return Response.json({ ok: false, error: 'missing_onboarding_case_id' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ ok: false, error: 'items_required' }, { status: 400 });
    }
    if (!items.every(isValidItem)) {
      return Response.json({ ok: false, error: 'invalid_item_shape' }, { status: 400 });
    }
    const days = parseInt(deadlineDays);
    if (!Number.isFinite(days) || days < 1 || days > 60) {
      return Response.json({ ok: false, error: 'invalid_deadline' }, { status: 400 });
    }

    // Load case
    const onboardingCase = await base44.asServiceRole.entities.OnboardingCase.get(onboardingCaseId).catch(() => null);
    if (!onboardingCase) {
      return Response.json({ ok: false, error: 'case_not_found' }, { status: 404 });
    }

    // Gate: only Manual or Docs Solicitados can open new pendencies
    if (!['Manual', 'Docs Solicitados'].includes(onboardingCase.status)) {
      return Response.json({
        ok: false,
        error: 'invalid_status',
        message: `Casos em status "${onboardingCase.status}" não podem receber solicitação de pendências.`,
      }, { status: 400 });
    }

    // Determine round (counts previous pendency requests for this case)
    const previous = await base44.asServiceRole.entities.PendencyRequest.filter({ onboardingCaseId }).catch(() => []);
    const round = (previous?.length || 0) + 1;

    // Normalize items
    const normalizedItems = items.map((it) => ({
      itemId: it.itemId,
      kind: it.kind,
      label: it.label.trim(),
      description: (it.description || '').trim(),
      isRequired: it.isRequired !== false,
      status: 'pending',
      ...(it.kind === 'document' ? {
        acceptedFileTypes: it.acceptedFileTypes,
        requiredQuantity: it.requiredQuantity,
        isOther: !!it.isOther,
        uploadedDocIds: [],
      } : {
        answerType: it.answerType,
        answerValue: '',
      }),
    }));

    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const publicToken = uuid();

    // Create PendencyRequest
    const created = await base44.asServiceRole.entities.PendencyRequest.create({
      onboardingCaseId,
      merchantId: onboardingCase.merchantId,
      status: 'open',
      round,
      requestedBy: user.email,
      requestedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      publicToken,
      generalMessage: (generalMessage || '').trim(),
      items: normalizedItems,
    });

    // Update OnboardingCase
    await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, {
      status: 'Docs Solicitados',
      currentPendencyRequestId: created.id,
      slaDeadline: expiresAt.toISOString(),
    });

    // Audit trail
    try {
      await base44.asServiceRole.entities.AccessTrail.create({
        eventType: 'compliance_case_update',
        onboardingCaseId,
        merchantId: onboardingCase.merchantId,
        action: 'pendency_request_created',
        ip: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || '',
        userAgent: req.headers.get('user-agent') || '',
        metadata: {
          pendencyRequestId: created.id,
          round,
          itemsCount: normalizedItems.length,
          deadlineDays: days,
          analystEmail: user.email,
        },
        serverTimestamp: now.toISOString(),
      });
    } catch (e) {
      console.warn('[createPendencyRequest] audit trail failed:', e?.message);
    }

    // Load merchant for email
    let merchant = null;
    try {
      merchant = await base44.asServiceRole.entities.Merchant.get(onboardingCase.merchantId);
    } catch (e) {
      console.warn('[createPendencyRequest] merchant load failed:', e?.message);
    }

    // Send email (non-blocking)
    let emailSent = false;
    if (merchant?.email) {
      try {
        const emailRes = await base44.asServiceRole.functions.invoke('emailPendencyRequest', {
          pendencyRequestId: created.id,
        });
        emailSent = !!emailRes?.data?.ok;
      } catch (e) {
        console.warn('[createPendencyRequest] email dispatch failed:', e?.message);
      }
    }

    return Response.json({
      ok: true,
      pendencyRequestId: created.id,
      publicToken,
      round,
      expiresAt: expiresAt.toISOString(),
      emailSent,
    });
  } catch (error) {
    console.error('[createPendencyRequest] Error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});