import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Retorna detalhes completos de um caso atribuído ao parceiro.
 * Aplica mascaramento baseado em partnerVisibilityLevel.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { assignmentId } = await req.json();
    if (!assignmentId) return Response.json({ error: 'assignmentId required' }, { status: 400 });

    // 1. Buscar assignment
    const assignment = await base44.asServiceRole.entities.PartnerAssignment.get(assignmentId);
    if (!assignment) return Response.json({ error: 'Assignment not found' }, { status: 404 });

    // 2. Validar que assignment pertence a um parceiro do usuário
    const userLinks = await base44.asServiceRole.entities.CompliancePartnerUser.filter({
      userId: user.id,
      isActive: true,
      partnerId: assignment.partnerId
    });

    if (!userLinks || userLinks.length === 0) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Validar que o caso pertence aos modelos permitidos
    const partner = await base44.asServiceRole.entities.CompliancePartner.get(assignment.partnerId);
    if (!partner || partner.isActive === false) {
      return Response.json({ error: 'Partner inactive' }, { status: 403 });
    }
    const allowed = partner.allowedOnboardingCaseModels || [];
    if (!allowed.includes(assignment.caseModel)) {
      return Response.json({ error: 'Case model not allowed for this partner' }, { status: 403 });
    }

    // 4. Buscar OnboardingCase
    const onboardingCase = await base44.asServiceRole.entities.OnboardingCase.get(assignment.onboardingCaseId);
    if (!onboardingCase) return Response.json({ error: 'Case not found' }, { status: 404 });

    // 5. Buscar dados relacionados (merchant, responses, etc)
    const merchant = onboardingCase.merchantId
      ? await base44.asServiceRole.entities.Merchant.get(onboardingCase.merchantId).catch(() => null)
      : null;

    const responses = await base44.asServiceRole.entities.QuestionnaireResponse.filter({
      onboardingCaseId: onboardingCase.id
    }, '-created_date', 500);

    const complianceScore = (await base44.asServiceRole.entities.ComplianceScore.filter({
      onboarding_case_id: onboardingCase.id
    }, '-created_date', 1))[0] || null;

    const integrationLogs = await base44.asServiceRole.entities.IntegrationLog.filter({
      onboarding_case_id: onboardingCase.id
    }, '-created_date', 200);

    const documents = await base44.asServiceRole.entities.DocumentUpload.filter({
      onboardingCaseId: onboardingCase.id
    }, '-created_date', 100);

    // 6. Marcar primeira visualização
    if (!assignment.viewedAt) {
      await base44.asServiceRole.entities.PartnerAssignment.update(assignment.id, {
        status: assignment.status === 'pending' ? 'viewed' : assignment.status,
        viewedAt: new Date().toISOString(),
        viewedByUserId: user.id,
        viewedByUserEmail: user.email
      });
      await base44.asServiceRole.entities.PartnerAssignmentActivity.create({
        assignmentId: assignment.id,
        partnerId: assignment.partnerId,
        onboardingCaseId: assignment.onboardingCaseId,
        activityType: 'viewed',
        performedBy: user.email,
        performedByName: user.full_name,
        performedByRole: 'partner',
        description: `${user.full_name} (parceiro) abriu o caso pela primeira vez`
      });
    }

    // 7. Aplicar mascaramento conforme nível
    const level = assignment.partnerVisibilityLevel || 'full';
    const payload = {
      assignment,
      case: applyMaskingCase(onboardingCase, level),
      merchant: applyMaskingMerchant(merchant, level),
      responses: level === 'summary_only' ? [] : responses,
      complianceScore,
      integrationLogs: level === 'summary_only' ? [] : applyMaskingLogs(integrationLogs, level),
      documents: level === 'summary_only' ? [] : documents,
      partner: { id: partner.id, name: partner.name, logoUrl: partner.logoUrl },
      visibilityLevel: level
    };

    return Response.json(payload);
  } catch (error) {
    console.error('partnerGetCaseDetail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function maskString(val) {
  if (!val) return val;
  const s = String(val);
  if (s.length <= 4) return '***';
  return s.slice(0,2) + '***' + s.slice(-2);
}

function maskCpfCnpj(val) {
  if (!val) return val;
  const digits = String(val).replace(/\D/g, '');
  if (digits.length === 11) return `${digits.slice(0,3)}.***.***-${digits.slice(9)}`;
  if (digits.length === 14) return `${digits.slice(0,2)}.${digits.slice(2,5)}.***/****-${digits.slice(12)}`;
  return val;
}

function applyMaskingMerchant(merchant, level) {
  if (!merchant) return null;
  if (level === 'full') return merchant;
  const m = { ...merchant };
  m.cpfCnpj = maskCpfCnpj(m.cpfCnpj);
  m.email = m.email ? maskString(m.email) : m.email;
  m.phone = m.phone ? maskString(m.phone) : m.phone;
  if (level === 'summary_only') {
    delete m.dateOfBirth;
    delete m.motherName;
  }
  return m;
}

function applyMaskingCase(c, level) {
  if (!c) return null;
  if (level === 'full') return c;
  const o = { ...c };
  return o;
}

function applyMaskingLogs(logs, level) {
  if (level === 'full') return logs;
  return logs.map(l => {
    const o = { ...l };
    if (o.request_payload) delete o.request_payload;
    return o;
  });
}