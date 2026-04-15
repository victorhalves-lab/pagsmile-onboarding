import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * triggerEnrichment — Fire-and-forget wrapper for autoEnrichOnboarding.
 * 
 * Kicks off the enrichment pipeline asynchronously and returns immediately.
 * The frontend can poll OnboardingCase.status to track progress.
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { onboardingCaseId } = await req.json();
  if (!onboardingCaseId) {
    return Response.json({ error: 'Missing onboardingCaseId' }, { status: 400 });
  }

  // Mark as processing immediately
  try {
    await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, { 
      status: 'Em Processamento' 
    });
  } catch (e) {
    console.warn(`[triggerEnrichment] Could not update status: ${e.message}`);
  }

  // Fire the pipeline asynchronously — do NOT await
  base44.asServiceRole.functions.invoke('autoEnrichOnboarding', { onboardingCaseId })
    .then(res => {
      console.log(`[triggerEnrichment] Pipeline completed for ${onboardingCaseId}: ${JSON.stringify(res?.data?.decision || {})}`);
    })
    .catch(err => {
      console.error(`[triggerEnrichment] Pipeline failed for ${onboardingCaseId}: ${err.message}`);
    });

  // Return immediately
  return Response.json({ 
    success: true, 
    message: 'Pipeline triggered', 
    onboardingCaseId 
  });
});