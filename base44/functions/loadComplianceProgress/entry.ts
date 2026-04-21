import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { sessionToken } = body;

    if (!sessionToken) {
      return Response.json({ error: 'sessionToken is required' }, { status: 400 });
    }

    const sessions = await base44.asServiceRole.entities.ComplianceSession.filter({ sessionToken });

    if (sessions.length === 0) {
      return Response.json({ found: false });
    }

    const session = sessions[0];

    // Update last access
    await base44.asServiceRole.entities.ComplianceSession.update(session.id, {
      lastAccessDate: new Date().toISOString()
    });

    return Response.json({
      found: true,
      session: {
        sessionToken: session.sessionToken,
        flowType: session.flowType,
        templateModel: session.templateModel,
        currentPhase: session.currentPhase,
        currentStep: session.currentStep,
        formData: session.formData || {},
        documentsData: session.documentsData || {},
        clientEmail: session.clientEmail,
        clientName: session.clientName,
        linkCode: session.linkCode,
        status: session.status,
        lastAccessDate: session.lastAccessDate
      }
    });
  } catch (error) {
    console.error('Error loading compliance progress:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});