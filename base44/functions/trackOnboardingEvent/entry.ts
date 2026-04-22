import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Allowlist of fields — prevents injection of arbitrary attributes from public frontend.
const ALLOWED_FIELDS = new Set([
  'eventType',
  'sessionId',
  'onboardingLinkId',
  'onboardingLinkCode',
  'pageName',
  'stepNumber',
  'totalSteps',
  'flowType',
  'merchantId',
  'onboardingCaseId',
  'metadata'
]);

const VALID_EVENT_TYPES = new Set([
  'link_click', 'page_view', 'page_complete', 'form_submit',
  'onboarding_complete', 'onboarding_abandoned'
]);

const VALID_FLOW_TYPES = new Set(['pix_only', 'full_kyc']);

// Sanitize metadata — only keep known keys and coerce types
function sanitizeMetadata(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const clean = {};
  if (typeof raw.userAgent === 'string') clean.userAgent = raw.userAgent.slice(0, 500);
  if (typeof raw.referrer === 'string') clean.referrer = raw.referrer.slice(0, 500);
  if (typeof raw.timeOnPage === 'number' && isFinite(raw.timeOnPage)) clean.timeOnPage = raw.timeOnPage;
  if (typeof raw.utmSource === 'string') clean.utmSource = raw.utmSource.slice(0, 200);
  if (typeof raw.utmMedium === 'string') clean.utmMedium = raw.utmMedium.slice(0, 200);
  if (typeof raw.utmCampaign === 'string') clean.utmCampaign = raw.utmCampaign.slice(0, 200);
  return clean;
}

function sanitizeEvent(body) {
  const clean = {};
  for (const key of Object.keys(body || {})) {
    if (!ALLOWED_FIELDS.has(key)) continue;
    const v = body[key];
    if (v === null || v === undefined) continue;
    if (key === 'metadata') clean.metadata = sanitizeMetadata(v);
    else if (typeof v === 'string') clean[key] = v.slice(0, 500);
    else if (typeof v === 'number' && isFinite(v)) clean[key] = v;
  }
  return clean;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    // Tolerante a requests anônimos com token inválido/expirado.
    let base44;
    try {
      base44 = createClientFromRequest(req);
    } catch (_) {
      const { createClient } = await import('npm:@base44/sdk@0.8.25');
      base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID'), requiresAuth: false });
    }
    const body = await req.json();
    const data = sanitizeEvent(body);

    // Validation
    if (!data.eventType || !VALID_EVENT_TYPES.has(data.eventType)) {
      return Response.json({ error: 'Invalid eventType' }, { status: 400 });
    }
    if (data.flowType && !VALID_FLOW_TYPES.has(data.flowType)) {
      delete data.flowType;
    }

    await base44.asServiceRole.entities.OnboardingAnalytics.create(data);
    return Response.json({ success: true });
  } catch (error) {
    console.error('trackOnboardingEvent error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});