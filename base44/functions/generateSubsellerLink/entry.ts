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

    const { parentMerchantId, parentMerchantName, expiresInDays, complianceType, branding, frameworkVersion } = await req.json();

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

    // [V5.2 Fase 6.5.2] Framework version do link (default v4.0 — opt-in explícito p/ V5.2)
    const fwVersion = frameworkVersion === 'v5.2' ? 'v5.2' : 'v4.0';

    // Resolve template conforme framework version
    let template = null;
    if (fwVersion === 'v5.2') {
      // V5.2: template único dinâmico tier-aware (subCategory=V5_2_DYNAMIC).
      // Funciona para subseller_pj e subseller_pf (tier resolvido em runtime pela engine).
      const v5_2Templates = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({
        subCategory: 'V5_2_DYNAMIC',
        isActive: true,
      });
      template = v5_2Templates[0];
      if (!template) {
        return Response.json({
          error: 'Template V5.2 dinâmico não encontrado. Execute seedV5_2MasterData antes de gerar links V5.2.',
        }, { status: 500 });
      }
    } else {
      // V4.0 (legado): mantém comportamento atual — subseller_v2 com fallback subseller.
      let templates = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ model: 'subseller_v2', isActive: true });
      if (!templates.length) {
        templates = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ model: 'subseller', isActive: true });
      }
      template = templates[0];
      if (!template) {
        return Response.json({ error: 'Subseller questionnaire template not found' }, { status: 500 });
      }
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
    const linkData = {
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
      framework_version: fwVersion,
    };

    // Adicionar branding se fornecido
    if (branding) {
      if (branding.brandName) linkData.brandName = branding.brandName;
      if (branding.brandLogoUrl) linkData.brandLogoUrl = branding.brandLogoUrl;
      if (branding.brandPrimaryColor) linkData.brandPrimaryColor = branding.brandPrimaryColor;
      if (branding.brandSecondaryColor) linkData.brandSecondaryColor = branding.brandSecondaryColor;
      if (branding.customSlug) linkData.customSlug = branding.customSlug;
    }

    const link = await base44.asServiceRole.entities.OnboardingLink.create(linkData);

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
        framework_version: fwVersion,
      }
    });

    return Response.json({
      success: true,
      link: {
        id: link.id,
        uniqueCode,
        customSlug: linkData.customSlug || null,
        parentMerchantId,
        parentMerchantName: parentMerchantName || merchant.fullName,
        questionnaireTemplateId: template.id,
        expiresAt,
        framework_version: fwVersion,
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});