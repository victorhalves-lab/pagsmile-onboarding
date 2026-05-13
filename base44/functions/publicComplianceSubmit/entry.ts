import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC endpoint — consolidates Merchant + OnboardingCase + QuestionnaireResponse creation
 * for the public compliance flow (ComplianceDinamico / DocumentUploadFull / DocumentUploadPix).
 *
 * Also updates the associated Lead (status=kyc_iniciado, onboardingCaseId) via service role.
 *
 * Payload:
 *   - templateId (required)
 *   - merchantData: { type, cpfCnpj, fullName, companyName, email, phone, dateOfBirth, nationality, motherName, isSubseller, parentMerchantId, paymentServices, onboardingStatus }
 *   - onboardingCaseData: { status, priority, onboardingLinkCode, commercialAgentId, commercialAgentName, isSubsellerCase, parentMerchantId }
 *   - responses: [{ questionId, questionText, questionType, valueText?, valueNumber?, valueBoolean?, valueArray? }]
 *   - linkCode (optional): used to validate subseller link + parentMerchantId
 *   - leadId (optional): updates lead with onboardingCaseId + status
 *
 * Security:
 *   - Merchant is created (cpfCnpj validated as present)
 *   - OnboardingCase forced to status="Pendente" or "Em Análise" — cliente NÃO pode injetar Aprovado
 *   - If linkCode points to SUBSELLER_COMPLIANCE, parentMerchantId is taken from the link, NOT from client
 *   - docLinkToken generated server-side
 */
const ALLOWED_CASE_STATUSES = new Set(['Pendente', 'Em Processamento']);
const ALLOWED_MERCHANT_STATUSES = new Set(['Pendente', 'Em Análise']);
const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const { templateId, merchantData = {}, onboardingCaseData = {}, responses = [], linkCode, leadId, additionalRepresentatives = [] } = body;

    if (!templateId) {
      return Response.json({ error: 'templateId required' }, { status: 400 });
    }
    if (!merchantData.cpfCnpj && !merchantData.email) {
      return Response.json({ error: 'merchant requires cpfCnpj or email' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Validate template exists
    let templates = [];
    try { templates = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ id: templateId }); } catch (_) { templates = []; }
    if (templates.length === 0) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    // If linkCode present, validate + extract subseller parent from server (never trust client)
    let parentMerchantId = null;
    let isSubsellerLink = false;
    let linkCommercialAgent = null;
    if (linkCode) {
      const links = await base44.asServiceRole.entities.OnboardingLink.filter({ uniqueCode: linkCode });
      const link = links[0];
      if (link) {
        if (link.linkType === 'SUBSELLER_COMPLIANCE' && link.parentMerchantId) {
          parentMerchantId = link.parentMerchantId;
          isSubsellerLink = true;
        }
        linkCommercialAgent = { id: link.commercialAgentId, name: link.commercialAgentName };
      }
    }

    // BUG-004 fix: validate commercialAgentId from client (if sent) by looking up the User.
    // If it doesn't exist, drop it silently. Never trust the client-provided name.
    let verifiedClientAgent = null;
    const clientAgentId = onboardingCaseData.commercialAgentId;
    if (!linkCommercialAgent?.id && clientAgentId && typeof clientAgentId === 'string' && clientAgentId.length >= 10) {
      try {
        const users = await base44.asServiceRole.entities.User.filter({ id: clientAgentId });
        if (users.length > 0) {
          const u = users[0];
          if (u.role === 'admin' || u.role === 'user') {
            verifiedClientAgent = { id: u.id, name: u.full_name };
          }
        }
      } catch (_) { /* agent lookup failed — drop silently */ }
    }

    // Sanitize merchant (force-allowed status)
    const safeMerchantStatus = ALLOWED_MERCHANT_STATUSES.has(merchantData.onboardingStatus)
      ? merchantData.onboardingStatus : 'Em Análise';

    const merchantPayload = {
      type: merchantData.type === 'PF' ? 'PF' : 'PJ',
      cpfCnpj: merchantData.cpfCnpj || '',
      fullName: merchantData.fullName || merchantData.companyName || 'N/A',
      companyName: merchantData.companyName || '',
      email: merchantData.email || 'nao-informado@placeholder.com',
      phone: merchantData.phone || '',
      onboardingStatus: safeMerchantStatus,
      isSubseller: !!isSubsellerLink, // server-trusted only — ignore client-provided flag
    };
    if (Array.isArray(merchantData.paymentServices)) merchantPayload.paymentServices = merchantData.paymentServices;
    if (merchantData.type === 'PF') {
      if (merchantData.dateOfBirth) merchantPayload.dateOfBirth = merchantData.dateOfBirth;
      if (merchantData.nationality) merchantPayload.nationality = merchantData.nationality;
      if (merchantData.motherName) merchantPayload.motherName = merchantData.motherName;
    }
    if (parentMerchantId) merchantPayload.parentMerchantId = parentMerchantId;

    // FIX (2026-05-13): CNPJ/CPF agora é CHAVE PRIMÁRIA. Não importa quando foi
    // submetido — se já existe Merchant com mesmo documento, REUSA sempre.
    // Isso evita duplicatas como o caso FERRAMAC (2 registros do mesmo CNPJ em
    // dias diferentes) e KINGPAY (2 registros com 12 dias de intervalo).
    //
    // Regra:
    //  1. Procura Merchant com mesmo CNPJ/CPF (limpo, só dígitos).
    //  2. Se existe → reusa, atualiza dados em branco (email/telefone) com
    //     informações mais recentes se vieram preenchidas.
    //  3. Se já tem case para esse template → retorna o case existente.
    //  4. Se não existe → cria novo Merchant.
    let merchant = null;
    const cleanCpfCnpj = (merchantPayload.cpfCnpj || '').replace(/\D/g, '');
    if (cleanCpfCnpj.length >= 11) {
      try {
        const sameDocMerchants = await base44.asServiceRole.entities.Merchant.filter({ cpfCnpj: cleanCpfCnpj });
        // Filtra subsellers: subsellers podem ter CNPJ de outro registro principal.
        // Para dedup de SELLER, ignora subsellers; para SUBSELLER, considera apenas subsellers do mesmo parent.
        const candidates = sameDocMerchants.filter(m => {
          if (isSubsellerLink) {
            return m.isSubseller && m.parentMerchantId === parentMerchantId;
          }
          return !m.isSubseller;
        });
        // Pega o mais antigo (canônico) — preserva histórico.
        const existing = candidates.sort((a, b) =>
          new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
        )[0];

        if (existing) {
          // Atualiza dados em branco do Merchant canônico com dados novos.
          const patch = {};
          if (!existing.email && merchantPayload.email && merchantPayload.email !== 'nao-informado@placeholder.com') {
            patch.email = merchantPayload.email;
          }
          if (!existing.phone && merchantPayload.phone) patch.phone = merchantPayload.phone;
          if (!existing.companyName && merchantPayload.companyName) patch.companyName = merchantPayload.companyName;
          if (!existing.fullName && merchantPayload.fullName) patch.fullName = merchantPayload.fullName;
          if (Object.keys(patch).length > 0) {
            try { await base44.asServiceRole.entities.Merchant.update(existing.id, patch); } catch (_) {}
          }

          // Já tem case para esse template? Retorna o existente.
          const existingCases = await base44.asServiceRole.entities.OnboardingCase.filter({
            merchantId: existing.id, questionnaireTemplateId: templateId,
          });
          if (existingCases[0]) {
            console.log(`[publicComplianceSubmit] Dedup hit — reusing Merchant ${existing.id} + Case ${existingCases[0].id}`);
            return Response.json({
              ok: true,
              merchantId: existing.id,
              onboardingCaseId: existingCases[0].id,
              docLinkToken: existingCases[0].docLinkToken,
              deduped: true,
            });
          }
          merchant = existing; // reusa merchant, cria case novo abaixo
        }
      } catch (dedupErr) { console.warn('[publicComplianceSubmit] Dedup check failed:', dedupErr.message); }
    }
    if (!merchant) {
      merchant = await base44.asServiceRole.entities.Merchant.create(merchantPayload);
    }

    // Sanitize OnboardingCase (force-allowed status + priority)
    const safeCaseStatus = ALLOWED_CASE_STATUSES.has(onboardingCaseData.status)
      ? onboardingCaseData.status : 'Pendente';
    const safePriority = ALLOWED_PRIORITIES.has(onboardingCaseData.priority)
      ? onboardingCaseData.priority : 'medium';

    // Use crypto.randomUUID — Deno native
    const docLinkToken = crypto.randomUUID().replace(/-/g, '').slice(0, 24);

    // Attribution sources (precedence):
    //   1. Link-resolved agent (from OnboardingLink — server-trusted)
    //   2. Client-provided agent (only if validated against User entity)
    //   3. empty
    // `isSubsellerCase` is ONLY trusted when it comes from a SUBSELLER_COMPLIANCE linkCode.
    const resolvedAgent = linkCommercialAgent?.id ? linkCommercialAgent : verifiedClientAgent;

    const casePayload = {
      merchantId: merchant.id,
      questionnaireTemplateId: templateId,
      submissionDate: new Date().toISOString(),
      status: safeCaseStatus,
      priority: safePriority,
      onboardingLinkCode: linkCode || onboardingCaseData.onboardingLinkCode || '',
      commercialAgentId: resolvedAgent?.id || '',
      commercialAgentName: resolvedAgent?.name || '',
      isSubsellerCase: !!isSubsellerLink, // server-trusted only — ignore client
      docLinkToken,
    };
    if (parentMerchantId) casePayload.parentMerchantId = parentMerchantId;

    // Persist additionalRepresentatives (opt-in — só quando o cliente preencheu a lista)
    if (Array.isArray(additionalRepresentatives) && additionalRepresentatives.length > 0) {
      casePayload.additionalRepresentatives = additionalRepresentatives
        .filter(r => r && (r.nome || r.cpf))
        .slice(0, 10) // hard cap defensivo
        .map(r => ({
          nome: String(r.nome || '').trim().slice(0, 200),
          cpf: String(r.cpf || '').replace(/\D/g, '').slice(0, 11),
          email: String(r.email || '').trim().slice(0, 200),
          phone: String(r.phone || '').trim().slice(0, 30),
          cargo: String(r.cargo || '').trim().slice(0, 100),
        }));
    }

    const onboardingCase = await base44.asServiceRole.entities.OnboardingCase.create(casePayload);

    // Audit trail: capture client context (IP, geo, UA) for this submission — non-blocking
    try {
      const headers = req.headers;
      const ip = headers.get('cf-connecting-ip') || (headers.get('x-forwarded-for') || '').split(',')[0].trim() || headers.get('x-real-ip') || null;
      base44.asServiceRole.entities.AccessTrail.create({
        eventType: 'compliance_submit',
        onboardingCaseId: onboardingCase.id,
        merchantId: merchant.id,
        leadId: leadId || undefined,
        action: 'create_case',
        ip,
        country: headers.get('cf-ipcountry') || null,
        region: headers.get('cf-region') || null,
        city: headers.get('cf-ipcity') || null,
        timezone: headers.get('cf-timezone') || null,
        userAgent: (headers.get('user-agent') || '').slice(0, 500),
        referer: (headers.get('referer') || '').slice(0, 500),
        linkCode: linkCode || null,
        docLinkToken: docLinkToken.slice(0, 6),
        metadata: { templateId, responsesCount: responses.length, hasAdditionalReps: (additionalRepresentatives || []).length > 0 },
        serverTimestamp: new Date().toISOString(),
      }).catch(() => {});
    } catch (_) { /* silent */ }

    // Create QuestionnaireResponses (bulk)
    if (Array.isArray(responses) && responses.length > 0) {
      // Sanitize: only allow known shape
      const sanitized = responses
        .filter(r => r && r.questionId)
        .map(r => ({
          onboardingCaseId: onboardingCase.id,
          questionId: r.questionId,
          questionText: r.questionText || '',
          questionType: r.questionType || '',
          ...(r.valueText !== undefined && { valueText: String(r.valueText) }),
          ...(typeof r.valueNumber === 'number' && { valueNumber: r.valueNumber }),
          ...(typeof r.valueBoolean === 'boolean' && { valueBoolean: r.valueBoolean }),
          ...(Array.isArray(r.valueArray) && { valueArray: r.valueArray }),
        }));
      if (sanitized.length > 0) {
        await base44.asServiceRole.entities.QuestionnaireResponse.bulkCreate(sanitized);
      }
    }

    // Link to Lead if provided (service role — bypass RLS)
    if (leadId) {
      try {
        await base44.asServiceRole.entities.Lead.update(leadId, {
          onboardingCaseId: onboardingCase.id,
          status: 'kyc_iniciado',
        });
      } catch (_) { /* non-blocking */ }
    }

    return Response.json({
      ok: true,
      merchantId: merchant.id,
      onboardingCaseId: onboardingCase.id,
      docLinkToken,
    });
  } catch (error) {
    console.error('publicComplianceSubmit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});