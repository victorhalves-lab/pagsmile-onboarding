import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Lista os PartnerAssignments atribuídos ao usuário logado (parceiro).
 * Aplica filtro por allowedOnboardingCaseModels do Partner e mascaramento.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const { status, search, page = 1, pageSize = 50, sortBy = '-assignedAt' } = body;

    // 1. Buscar vínculos ativos do usuário (CompliancePartnerUser)
    const userLinks = await base44.asServiceRole.entities.CompliancePartnerUser.filter({
      userId: user.id,
      isActive: true
    });

    if (!userLinks || userLinks.length === 0) {
      return Response.json({ assignments: [], total: 0, partners: [] });
    }

    const partnerIds = [...new Set(userLinks.map(l => l.partnerId))];

    // 2. Buscar Partners (para allowedOnboardingCaseModels)
    const partners = [];
    for (const pid of partnerIds) {
      try {
        const p = await base44.asServiceRole.entities.CompliancePartner.get(pid);
        if (p && p.isActive !== false) partners.push(p);
      } catch (_) {}
    }

    if (partners.length === 0) {
      return Response.json({ assignments: [], total: 0, partners: [] });
    }

    const activePartnerIds = partners.map(p => p.id);

    // 3. Buscar PartnerAssignments
    const filter = { partnerId: { $in: activePartnerIds } };
    if (status && status !== 'all') filter.status = status;

    const allAssignments = await base44.asServiceRole.entities.PartnerAssignment.filter(
      filter,
      sortBy,
      500
    );

    // 4. Filtrar pelos modelos permitidos por parceiro
    const partnerMap = Object.fromEntries(partners.map(p => [p.id, p]));
    let filtered = allAssignments.filter(a => {
      const partner = partnerMap[a.partnerId];
      if (!partner) return false;
      const allowed = partner.allowedOnboardingCaseModels || [];
      // Se o parceiro não tem modelos configurados, nada aparece (bloqueia por padrão)
      if (allowed.length === 0) return false;
      return allowed.includes(a.caseModel);
    });

    // 5. Busca por texto (nome do merchant ou CPF/CNPJ)
    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      filtered = filtered.filter(a =>
        (a.merchantName || '').toLowerCase().includes(term) ||
        (a.merchantCpfCnpj || '').includes(term)
      );
    }

    // 6. Aplicar mascaramento por nível de visibilidade
    const masked = filtered.map(a => maskAssignment(a));

    // 7. Paginação
    const total = masked.length;
    const start = (page - 1) * pageSize;
    const paginated = masked.slice(start, start + pageSize);

    return Response.json({
      assignments: paginated,
      total,
      page,
      pageSize,
      partners: partners.map(p => ({
        id: p.id,
        name: p.name,
        allowedOnboardingCaseModels: p.allowedOnboardingCaseModels || []
      }))
    });
  } catch (error) {
    console.error('partnerListMyCases error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function maskCpfCnpj(val, level) {
  if (!val || level === 'full') return val;
  const digits = String(val).replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0,3)}.***.***-${digits.slice(9)}`;
  }
  if (digits.length === 14) {
    return `${digits.slice(0,2)}.${digits.slice(2,5)}.***/****-${digits.slice(12)}`;
  }
  return val;
}

function maskAssignment(a) {
  const level = a.partnerVisibilityLevel || 'full';
  const out = { ...a };
  if (level === 'redacted' || level === 'summary_only') {
    out.merchantCpfCnpj = maskCpfCnpj(a.merchantCpfCnpj, level);
  }
  return out;
}