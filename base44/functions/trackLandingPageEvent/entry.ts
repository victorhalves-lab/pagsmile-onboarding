import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Allowlist of fields — prevents injection of arbitrary attributes from public frontend.
const ALLOWED_FIELDS = new Set([
  'introducerId',
  'referralCode',
  'slug',
  'eventType',
  'segmentName',
  'sessionId',
  'deviceType',
  'referrer',
  'userAgent'
]);

const VALID_EVENT_TYPES = new Set([
  'page_view', 'segment_view', 'segment_info',
  'cta_contratar', 'cta_proposta', 'calculator_interact', 'fechamento_start'
]);

const VALID_DEVICE_TYPES = new Set(['mobile', 'tablet', 'desktop']);

function sanitize(body) {
  const clean = {};
  for (const key of Object.keys(body || {})) {
    if (!ALLOWED_FIELDS.has(key)) continue;
    const v = body[key];
    if (v === null || v === undefined) continue;
    if (typeof v === 'string') clean[key] = v.slice(0, 500);
  }
  return clean;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const data = sanitize(body);

    // Validation
    if (!data.eventType || !VALID_EVENT_TYPES.has(data.eventType)) {
      return Response.json({ error: 'Invalid eventType' }, { status: 400 });
    }
    if (!data.slug) {
      return Response.json({ error: 'Missing slug' }, { status: 400 });
    }
    if (data.deviceType && !VALID_DEVICE_TYPES.has(data.deviceType)) {
      delete data.deviceType;
    }

    await base44.asServiceRole.entities.LandingPageEvent.create(data);
    return Response.json({ success: true });
  } catch (error) {
    console.error('trackLandingPageEvent error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});