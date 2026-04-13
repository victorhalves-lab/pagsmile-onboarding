import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafGenerateToken — Generates CAF SDK session tokens
 *
 * NOTE: The current CAF_CLIENT_SECRET is a static API key for the Core API.
 * The SDK BFF (web.us.prd.caf.io/bff/session-tokens) requires SEPARATE SDK credentials.
 *
 * This function now returns an error with guidance to use Web Onboarding (cafCreateOnboarding)
 * as the recommended alternative to the SDK flow.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    return Response.json({
      error: 'SDK token generation unavailable',
      reason: 'Current credentials are Core API keys, not SDK credentials.',
      recommendation: 'Use cafCreateOnboarding for a CAF-hosted web onboarding flow instead of the SDK.',
      alternative: {
        function: 'cafCreateOnboarding',
        description: 'Creates a CAF web onboarding link where the client completes document capture + liveness on CAF hosted page.',
        params: {
          onboardingCaseId: 'your case ID',
          transactionTemplateId: 'configured in CAF Trust Platform',
          type: 'PF or PJ',
        },
      },
    }, { status: 501 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});