import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    // Tolerante a requests anônimos com token inválido/expirado.
    let base44;
    try {
      base44 = createClientFromRequest(req);
    } catch (_) {
      const { createClient } = await import('npm:@base44/sdk@0.8.25');
      base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID'), requiresAuth: false });
    }
    // This function is called from PUBLIC compliance pages (unauthenticated clients).
    // All entity operations use asServiceRole, so auth is not required.
    const body = await req.json();
    const { sessionToken, flowType, templateModel, currentPhase, currentStep, formData, documentsData, clientEmail, clientName, linkCode } = body;

    if (!sessionToken) {
      return Response.json({ error: 'sessionToken is required' }, { status: 400 });
    }

    // Check if session exists
    const existing = await base44.asServiceRole.entities.ComplianceSession.filter({ sessionToken });

    if (existing.length > 0) {
      // Update existing session
      const session = existing[0];
      const updateData = {
        lastAccessDate: new Date().toISOString()
      };
      if (currentPhase !== undefined) updateData.currentPhase = currentPhase;
      if (currentStep !== undefined) updateData.currentStep = currentStep;
      if (formData !== undefined) updateData.formData = formData;
      if (documentsData !== undefined) updateData.documentsData = documentsData;
      if (clientEmail) updateData.clientEmail = clientEmail;
      if (clientName) updateData.clientName = clientName;
      if (linkCode) updateData.linkCode = linkCode;

      await base44.asServiceRole.entities.ComplianceSession.update(session.id, updateData);
      return Response.json({ success: true, sessionToken, isNew: false });
    } else {
      // Create new session
      await base44.asServiceRole.entities.ComplianceSession.create({
        sessionToken,
        flowType: flowType || 'unknown',
        templateModel: templateModel || 'unknown',
        currentPhase: currentPhase || 'questionnaire',
        currentStep: currentStep || 1,
        formData: formData || {},
        documentsData: documentsData || {},
        clientEmail: clientEmail || '',
        clientName: clientName || '',
        linkCode: linkCode || '',
        lastAccessDate: new Date().toISOString(),
        status: 'active'
      });
      return Response.json({ success: true, sessionToken, isNew: true });
    }
  } catch (error) {
    console.error('Error saving compliance progress:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});