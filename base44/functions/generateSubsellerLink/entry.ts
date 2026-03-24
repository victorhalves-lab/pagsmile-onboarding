import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { parentMerchantId, parentMerchantName, expiresInDays, complianceType } = await req.json();

    if (!parentMerchantId) {
      return Response.json({ error: 'parentMerchantId is required' }, { status: 400 });
    }

    // Verificar se o merchant existe e está aprovado
    const merchants = await base44.asServiceRole.entities.Merchant.filter({ id: parentMerchantId });
    const merchant = merchants[0];

    if (!merchant) {
      return Response.json({ error: 'Merchant not found' }, { status: 404 });
    }

    if (merchant.onboardingStatus !== 'Aprovado') {
      return Response.json({ error: 'Merchant must be approved to generate subseller links' }, { status: 400 });
    }

    // Buscar template de subseller
    const templates = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ model: 'subseller', isActive: true });
    const template = templates[0];

    if (!template) {
      return Response.json({ error: 'Subseller questionnaire template not found' }, { status: 500 });
    }

    // Gerar código único
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uniqueCode = 'SUB_';
    for (let i = 0; i < 12; i++) {
      uniqueCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Calcular expiração
    let expiresAt = null;
    if (expiresInDays) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + expiresInDays);
      expiresAt = expDate.toISOString();
    }

    // Criar OnboardingLink
    const link = await base44.asServiceRole.entities.OnboardingLink.create({
      linkType: 'SUBSELLER_COMPLIANCE',
      uniqueCode,
      parentMerchantId,
      parentMerchantName: parentMerchantName || merchant.fullName || merchant.companyName,
      questionnaireTemplateId: template.id,
      isActive: true,
      clickCount: 0,
      submissionCount: 0,
      completedCount: 0,
      complianceType: complianceType || 'GENERIC',
      expiresAt,
    });

    // Criar audit log
    await base44.asServiceRole.entities.AuditLog.create({
      entityName: 'OnboardingLink',
      entityId: link.id,
      actionType: 'CREATE',
      actionDescription: `Link de subseller gerado para ${parentMerchantName || merchant.fullName} (código: ${uniqueCode})`,
      changedBy: user.email,
      changeDate: new Date().toISOString(),
      details: {
        linkType: 'SUBSELLER_COMPLIANCE',
        parentMerchantId,
        uniqueCode,
        questionnaireTemplateId: template.id,
      }
    });

    return Response.json({
      success: true,
      link: {
        id: link.id,
        uniqueCode,
        parentMerchantId,
        parentMerchantName: parentMerchantName || merchant.fullName,
        questionnaireTemplateId: template.id,
        expiresAt,
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});