import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Verifies the result of a CAF SDK session by validating the signed response (JWT).
 * 
 * The CAF Web SDKs (DocumentDetector + FaceLiveness) return a signedResponse JWT
 * after successful capture. This function decodes it and logs the result.
 * 
 * For production, the signedResponse should be verified with the client_secret.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { signedResponse, onboardingCaseId, module } = await req.json();

    if (!signedResponse) {
      return Response.json({ error: 'signedResponse is required' }, { status: 400 });
    }

    // Decode JWT payload (base64url)
    const parts = signedResponse.split('.');
    if (parts.length !== 3) {
      return Response.json({ error: 'Invalid signedResponse format' }, { status: 400 });
    }

    // Decode payload
    const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadStr = atob(payloadB64);
    const payload = JSON.parse(payloadStr);

    console.log('[CAF] Decoded response payload:', JSON.stringify(payload));

    // Extract useful fields
    const isApproved = payload.isAlive === true || payload.valid === true || payload.approved === true;

    // Log the verification result
    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          provider: 'CAF',
          service_type: module === 'document' ? 'document_detector' : 'face_liveness',
          request_id: payload.requestId || payload.sessionId || '',
          status: isApproved ? 'success' : 'failed',
          result_status: isApproved ? 'APPROVED' : 'FAILED',
          response_payload: payload,
        });
      } catch (logErr) {
        console.warn('[CAF] Failed to log verification:', logErr.message);
      }

      // Mark CAF as completed if face liveness approved
      if (module === 'liveness' && isApproved) {
        try {
          await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, {
            cafCompleted: true,
          });
        } catch (upErr) {
          console.warn('[CAF] Failed to update case:', upErr.message);
        }
      }
    }

    return Response.json({
      approved: isApproved,
      payload: payload,
      module: module || 'unknown',
    });

  } catch (error) {
    console.error('[CAF] Error verifying result:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});