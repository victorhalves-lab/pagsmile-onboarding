/**
 * commercialMetrics.js — Fonte Única da Verdade (FUV) para os 3 dashboards comerciais:
 * DashboardCEO, DashboardComercial e PipelineComercial.
 *
 * Regra de negócio v2026-05-10:
 *   - Proposta aceita = NEGÓCIO FECHADO (cliente não assina contrato).
 *   - StandardProposal NÃO tem status='aceita' — aceite vem via Lead.questionnaireData.taxasAceitas
 *     e/ou origemLead='proposta_padrao_fechamento'.
 *
 * Esta é a ÚNICA fonte de cálculo. Os 3 dashboards consomem este módulo.
 */

// ───────────────────────────────────────────────────────────
// Constantes de status
// ───────────────────────────────────────────────────────────
export const PROPOSAL_STATUS_SENT = ['enviada', 'visualizada', 'aceita', 'recusada', 'contraproposta', 'expirada'];
export const PROPOSAL_STATUS_OPEN = ['enviada', 'visualizada', 'contraproposta', 'expirada'];
export const PROPOSAL_STATUS_DEAD = ['recusada', 'expirada'];

export const LEAD_STATUS_LOST = ['perdido', 'proposta_recusada'];
export const LEAD_STATUS_ACCEPTED_FAMILY = ['proposta_aceita', 'kyc_iniciado', 'kyc_aprovado', 'kyc_revisao_manual', 'ativado'];

// Heurística: Lead aceitou proposta padrão sem entidade Proposal criada
const acceptedViaStandard = (l) =>
  LEAD_STATUS_ACCEPTED_FAMILY.includes(l.status) &&
  !l.currentProposalId &&
  (l.origemLead === 'proposta_padrao_fechamento'
    || l.questionnaireData?.origemFechamento === 'proposta_padrao'
    || l.questionnaireData?.taxasAceitas === true
    || l.questionnaireData?.taxasAceitas?.aceito === true);

// ───────────────────────────────────────────────────────────
// Helpers de normalização
// ───────────────────────────────────────────────────────────
const normalizeCnpj = (v) => (v || '').replace(/\D/g, '');
const normalizeName = (v) => (v || '').toLowerCase().trim().replace(/\s+/g, ' ');
const isValidCnpj = (v) => /^\d{11,14}$/.test(v);

// ───────────────────────────────────────────────────────────
// TPV: melhor estimativa por lead
// Prioridade: proposal.minimoGarantido > lead.tpvMensal > (transacoesMes * ticketMedio)
// ───────────────────────────────────────────────────────────
function tpvFromProposalRates(rates) {
  if (!rates) return 0;
  const mg = rates.minimoGarantido;
  if (mg) return mg.mes3 || mg.mes2 || mg.mes1 || 0;
  return 0;
}

function tpvFromLeadFallback(l) {
  if (!l) return 0;
  if (l.tpvMensal > 0) return l.tpvMensal;
  if (l.transacoesMes > 0 && l.ticketMedio > 0) return l.transacoesMes * l.ticketMedio;
  const qd = l.questionnaireData || {};
  if (qd.tpvMensal > 0) return qd.tpvMensal;
  if (qd.volumeMensalEstimado > 0) return qd.volumeMensalEstimado;
  return 0;
}

// ───────────────────────────────────────────────────────────
// Identidade do vendedor — chave única e nome amigável
// ───────────────────────────────────────────────────────────
function resolveSellerKey(source) {
  if (source.commercialAgentId) return source.commercialAgentId;
  if (source.commercialAgentName) return `name:${source.commercialAgentName}`;
  if (source.responsavelId) return source.responsavelId;
  if (source.responsavelNome) return `name:${source.responsavelNome}`;
  if (source.created_by && source.created_by !== 'anonymous') return source.created_by;
  return '_unassigned';
}
function resolveSellerName(source) {
  return source.commercialAgentName
    || source.responsavelNome
    || source.created_by
    || 'Não atribuído';
}

// ───────────────────────────────────────────────────────────
// Origem do lead — cascade
// ───────────────────────────────────────────────────────────
function resolveLeadOrigin(l, linkTypeMap) {
  if (l.introducerName) return l.introducerName;
  if (l.origemLead && l.origemLead !== 'direto') return l.origemLead;
  if (l.onboardingLinkCode && linkTypeMap?.[l.onboardingLinkCode]) {
    return linkTypeMap[l.onboardingLinkCode]; // ex: LEAD_QUESTIONNAIRE, LEAD_SIMPLIFICADO
  }
  return 'Direto';
}

// ───────────────────────────────────────────────────────────
// MAIN: buildCommercialDataset
// ───────────────────────────────────────────────────────────
export function buildCommercialDataset({
  leads = [],
  proposals = [],
  pixProposals = [],
  standardProposals = [],
  introducers = [],
  onboardingLinks = [],
}) {
  // ─── 1. Indexes básicos ───────────────────────────────────
  const leadById = new Map(leads.map(l => [l.id, l]));
  const introducerById = new Map(introducers.map(i => [i.id, i]));
  const linkTypeMap = {};
  onboardingLinks.forEach(link => { if (link.uniqueCode) linkTypeMap[link.uniqueCode] = link.linkType; });

  // ─── 2. Propostas: filtra versões atuais e indexa ──────────
  const allCardPix = [
    ...proposals.filter(p => p.isCurrentVersion !== false),
    ...pixProposals.filter(p => p.isCurrentVersion !== false),
  ];

  // Dedupe de propostas aceitas por rootProposalId (evita contar 2x versionadas)
  const acceptedRootIds = new Set();
  const acceptedDeduped = [];
  [...proposals, ...pixProposals]
    .filter(p => p.status === 'aceita')
    .forEach(p => {
      const root = p.rootProposalId || p.id;
      if (!acceptedRootIds.has(root)) {
        acceptedRootIds.add(root);
        acceptedDeduped.push(p);
      }
    });

  // ─── 3. Maps: leadId → proposta(s) ────────────────────────
  const proposalsByLeadId = new Map();
  const acceptedByLeadId = new Map();
  allCardPix.forEach(p => {
    if (!p.leadId) return;
    if (!proposalsByLeadId.has(p.leadId)) proposalsByLeadId.set(p.leadId, []);
    proposalsByLeadId.get(p.leadId).push(p);
  });
  acceptedDeduped.forEach(p => {
    if (!p.leadId) return;
    if (!acceptedByLeadId.has(p.leadId)) acceptedByLeadId.set(p.leadId, []);
    acceptedByLeadId.get(p.leadId).push(p);
  });

  // ─── 4. TPV por lead (melhor estimativa) ──────────────────
  const tpvByLeadId = new Map();
  leads.forEach(l => {
    const propTpv = (proposalsByLeadId.get(l.id) || [])
      .reduce((max, p) => Math.max(max, tpvFromProposalRates(p.rates)), 0);
    tpvByLeadId.set(l.id, propTpv || tpvFromLeadFallback(l));
  });

  // ─── 5. Propostas órfãs (sem leadId) — dedupe por CNPJ vs leads ───
  const leadCnpjs = new Set();
  leads.forEach(l => {
    const c = normalizeCnpj(l.cpfCnpj);
    if (isValidCnpj(c)) leadCnpjs.add(c);
  });
  const orphanAccepted = acceptedDeduped.filter(p => {
    if (p.leadId) return false;
    const c = normalizeCnpj(p.clienteCnpj);
    return !isValidCnpj(c) || !leadCnpjs.has(c);
  });
  const orphanAcceptedTpv = orphanAccepted.reduce((s, p) => s + tpvFromProposalRates(p.rates), 0);

  // ─── 6. Sets de verdade ───────────────────────────────────
  const dealClosedLeadIds = new Set();
  const proposalsSentLeadIds = new Set();
  const standardAccepterLeadIds = new Set();

  leads.forEach(l => {
    // Aceitação real via Proposal/PixProposal
    if ((acceptedByLeadId.get(l.id) || []).length > 0) {
      dealClosedLeadIds.add(l.id);
      proposalsSentLeadIds.add(l.id);
    }
    // Aceitação via lead.status sem proposta correspondente (fallback)
    if (LEAD_STATUS_ACCEPTED_FAMILY.includes(l.status)) {
      dealClosedLeadIds.add(l.id);
    }
    // Aceitação via StandardProposal (sem entidade Proposal criada)
    if (acceptedViaStandard(l)) {
      dealClosedLeadIds.add(l.id);
      proposalsSentLeadIds.add(l.id);
      standardAccepterLeadIds.add(l.id);
    }
    // Proposta enviada (qualquer status client-facing)
    const props = proposalsByLeadId.get(l.id) || [];
    if (props.some(p => PROPOSAL_STATUS_SENT.includes(p.status))) {
      proposalsSentLeadIds.add(l.id);
    }
  });

  // Leads mortos: status='perdido'|'proposta_recusada' OU última proposta recusada/expirada há > 14 dias sem outra mais nova
  const now = new Date();
  const deadLeadIds = new Set();
  leads.forEach(l => {
    if (LEAD_STATUS_LOST.includes(l.status)) { deadLeadIds.add(l.id); return; }
    const props = (proposalsByLeadId.get(l.id) || []).slice().sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    if (!props.length) return;
    const latest = props[0];
    if (PROPOSAL_STATUS_DEAD.includes(latest.status)) {
      const refDate = new Date(latest.rejectedDate || latest.validUntil || latest.updated_date || latest.created_date);
      const daysSince = (now - refDate) / 86400000;
      if (daysSince > 14 && !dealClosedLeadIds.has(l.id)) deadLeadIds.add(l.id);
    }
  });

  // ─── 7. Contagens globais ─────────────────────────────────
  const totalLeads = leads.length;
  const proposalsSentCount = proposalsSentLeadIds.size;
  // Conversão respeitando dedupe + standard
  const proposalsAcceptedCount = dealClosedLeadIds.size + orphanAccepted.length;
  // proposalsSent precisa cobrir TUDO que foi aceito (inclusive standard) para conversão não passar de 100%
  const proposalsSentWithStandardCount = proposalsSentLeadIds.size + orphanAccepted.length;
  const proposalConversionRate = proposalsSentWithStandardCount > 0
    ? ((proposalsAcceptedCount / proposalsSentWithStandardCount) * 100).toFixed(1)
    : '0.0';

  const leadsActivated = leads.filter(l => l.status === 'ativado').length;
  const activationRate = totalLeads > 0 ? ((leadsActivated / totalLeads) * 100).toFixed(1) : '0.0';
  const leadsLost = deadLeadIds.size;
  const lossRate = totalLeads > 0 ? ((leadsLost / totalLeads) * 100).toFixed(1) : '0.0';

  // ─── 8. TPV global ────────────────────────────────────────
  const activeLeads = leads.filter(l => !deadLeadIds.has(l.id));
  const tpvPipeline = activeLeads.reduce((s, l) => s + (tpvByLeadId.get(l.id) || 0), 0) + orphanAcceptedTpv;
  const tpvClosed = leads.filter(l => dealClosedLeadIds.has(l.id))
    .reduce((s, l) => s + (tpvByLeadId.get(l.id) || 0), 0) + orphanAcceptedTpv;

  const leadsWithTicket = leads.filter(l => l.ticketMedio > 0);
  const avgTicket = leadsWithTicket.length > 0
    ? leadsWithTicket.reduce((s, l) => s + l.ticketMedio, 0) / leadsWithTicket.length
    : 0;

  // Tempo médio funil (criação → ativação)
  const activated = leads.filter(l => l.status === 'ativado' && l.created_date);
  const avgFunnelDays = activated.length > 0
    ? Math.round(activated.reduce((s, l) => {
        const upd = l.lastInteractionDate || l.updated_date;
        return s + (new Date(upd) - new Date(l.created_date)) / 86400000;
      }, 0) / activated.length)
    : null;

  // ─── 9. Funil unificado ───────────────────────────────────
  // "Negócio Fechado" usa o set dealClosedLeadIds (não confia em lead.status sozinho).
  const funnelData = [
    { name: 'Questionário', value: leads.filter(l => l.status === 'questionario_preenchido').length },
    { name: 'Analisado IA', value: leads.filter(l => l.status === 'analisado_priscila').length },
    { name: 'Em Contato', value: leads.filter(l => l.status === 'em_contato_comercial' && !dealClosedLeadIds.has(l.id)).length },
    { name: 'Proposta Enviada', value: leads.filter(l => proposalsSentLeadIds.has(l.id) && !dealClosedLeadIds.has(l.id)).length },
    { name: 'Negócio Fechado', value: dealClosedLeadIds.size },
    { name: 'KYC', value: leads.filter(l => ['kyc_iniciado', 'kyc_aprovado', 'kyc_revisao_manual'].includes(l.status)).length },
    { name: 'Ativado', value: leadsActivated },
  ];

  // ─── 10. bySeller (CEO + Comercial usam o mesmo) ──────────
  const sellerMap = new Map();
  const ensureSeller = (key, name) => {
    if (!sellerMap.has(key)) {
      sellerMap.set(key, {
        id: key, name,
        email: typeof key === 'string' && key.includes('@') ? key : '',
        totalLeads: 0, proposalsSent: 0, proposalsAccepted: 0,
        tpvPipeline: 0, tpvClosed: 0,
        leadsActivated: 0, leadsLost: 0,
      });
    }
    return sellerMap.get(key);
  };

  // Por lead
  leads.forEach(l => {
    const key = resolveSellerKey(l);
    const name = resolveSellerName(l);
    const s = ensureSeller(key, name);
    s.totalLeads++;
    if (!deadLeadIds.has(l.id)) s.tpvPipeline += tpvByLeadId.get(l.id) || 0;
    if (dealClosedLeadIds.has(l.id)) s.tpvClosed += tpvByLeadId.get(l.id) || 0;
    if (l.status === 'ativado') s.leadsActivated++;
    if (deadLeadIds.has(l.id)) s.leadsLost++;
    if (proposalsSentLeadIds.has(l.id)) s.proposalsSent++;
    if (dealClosedLeadIds.has(l.id)) s.proposalsAccepted++;
  });

  // Propostas órfãs (sem leadId) → atribui ao responsavelId da proposta
  const orphanSent = allCardPix.filter(p => !p.leadId && PROPOSAL_STATUS_SENT.includes(p.status));
  orphanSent.forEach(p => {
    const cnpj = normalizeCnpj(p.clienteCnpj);
    if (isValidCnpj(cnpj) && leadCnpjs.has(cnpj)) return; // já contado via lead
    const key = resolveSellerKey(p);
    const name = resolveSellerName(p);
    const s = ensureSeller(key, name);
    s.proposalsSent++;
    if (p.status === 'aceita') {
      s.proposalsAccepted++;
      s.tpvClosed += tpvFromProposalRates(p.rates);
    }
  });

  // StandardProposal: conta propostas criadas pelo vendedor (responsavelId)
  // O aceite real já está no Lead (contado acima via proposalsByLeadId/dealClosed).
  // Aqui só somamos as Standard CRIADAS (status='ativa') para reflexão de produtividade.
  // NOTA: não dobra aceitação, só visibilidade de criação.

  const bySeller = Array.from(sellerMap.values())
    .filter(s => s.id !== '_unassigned' || s.totalLeads > 0)
    .sort((a, b) => b.totalLeads - a.totalLeads);

  // ─── 11. byIntroducer ─────────────────────────────────────
  const introMap = new Map();
  leads.forEach(l => {
    if (!l.introducerId) return;
    if (!introMap.has(l.introducerId)) {
      const intr = introducerById.get(l.introducerId);
      introMap.set(l.introducerId, {
        id: l.introducerId,
        name: intr?.name || l.introducerName || 'Desconhecido',
        referralCode: intr?.referralCode || l.introducerReferralCode || '',
        leadsCount: 0, acceptedCount: 0, tpv: 0,
      });
    }
    const item = introMap.get(l.introducerId);
    item.leadsCount++;
    item.tpv += tpvByLeadId.get(l.id) || 0;
    if (dealClosedLeadIds.has(l.id)) item.acceptedCount++;
  });
  const byIntroducer = Array.from(introMap.values()).sort((a, b) => b.leadsCount - a.leadsCount);

  // ─── 12. bySegment ────────────────────────────────────────
  const segMap = new Map();
  const labelSeg = (s) => s === 'MERCHAN' ? 'Merchant' : s === 'GATEWAY' ? 'Gateway' : s === 'MARKETPLACE' ? 'Marketplace' : (s || 'Outros');
  leads.forEach(l => {
    const seg = labelSeg(l.businessSubCategory);
    if (!segMap.has(seg)) segMap.set(seg, { name: seg, count: 0, tpv: 0, accepted: 0 });
    const item = segMap.get(seg);
    item.count++;
    item.tpv += tpvByLeadId.get(l.id) || 0;
    if (dealClosedLeadIds.has(l.id)) item.accepted++;
  });
  const bySegment = Array.from(segMap.values()).sort((a, b) => b.count - a.count);

  // ─── 13. byOrigin (com cascade) ───────────────────────────
  const originMap = new Map();
  leads.forEach(l => {
    const origin = resolveLeadOrigin(l, linkTypeMap);
    if (!originMap.has(origin)) originMap.set(origin, { name: origin, count: 0 });
    originMap.get(origin).count++;
  });
  const byOrigin = Array.from(originMap.values()).sort((a, b) => b.count - a.count);

  // ─── 14. Trend (6 meses) ──────────────────────────────────
  const trendData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth(), y = d.getFullYear();
    const ml = leads.filter(l => { const c = new Date(l.created_date); return c.getMonth() === m && c.getFullYear() === y; });
    trendData.push({
      name: d.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
      novos: ml.length,
      convertidos: ml.filter(l => dealClosedLeadIds.has(l.id)).length,
      perdidos: ml.filter(l => deadLeadIds.has(l.id)).length,
    });
  }

  // ─── 15. Métricas de período ──────────────────────────────
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisWeekStart = new Date(now.getTime() - 7 * 86400000);
  const lastWeekStart = new Date(now.getTime() - 14 * 86400000);

  const leadsThisMonth = leads.filter(l => new Date(l.created_date) >= thisMonthStart).length;
  const leadsThisWeek = leads.filter(l => new Date(l.created_date) >= thisWeekStart).length;
  const leadsLastWeek = leads.filter(l => {
    const d = new Date(l.created_date);
    return d >= lastWeekStart && d < thisWeekStart;
  }).length;

  const proposalsThisMonth = allCardPix.filter(p =>
    PROPOSAL_STATUS_SENT.includes(p.status) && new Date(p.created_date) >= thisMonthStart
  ).length + leads.filter(l => standardAccepterLeadIds.has(l.id) && new Date(l.created_date) >= thisMonthStart).length;

  // ─── 16. Counts especiais para alertas ────────────────────
  const staleLeads = leads.filter(l => {
    if (deadLeadIds.has(l.id) || l.status === 'ativado' || dealClosedLeadIds.has(l.id)) return false;
    const d = l.lastInteractionDate || l.updated_date || l.created_date;
    return d && (now - new Date(d)) / 86400000 > 7;
  }).length;

  const threeDaysFromNow = new Date(now.getTime() + 3 * 86400000);
  const proposalsExpiring = allCardPix.filter(p => {
    if (!['enviada', 'visualizada'].includes(p.status)) return false;
    if (!p.validUntil) return false;
    const exp = new Date(p.validUntil);
    return exp <= threeDaysFromNow && exp >= now;
  }).length;

  const proposalsRejectedNoFollowup = allCardPix.filter(p => p.status === 'recusada').length;
  const urgentLeadsNoProp = leads.filter(l => l.iaPriority === 'URGENTE' && !proposalsSentLeadIds.has(l.id)).length;
  const leadsReadyForProposal = leads.filter(l =>
    ['analisado_priscila', 'em_contato_comercial'].includes(l.status)
    && (l.leadQualifierLevel === 'EXCELENTE' || l.leadQualifierLevel === 'BOM')
    && !proposalsSentLeadIds.has(l.id)
  ).length;

  // ─── Retorno ──────────────────────────────────────────────
  return {
    // Sets/maps (para reuso fino)
    dealClosedLeadIds,
    proposalsSentLeadIds,
    standardAccepterLeadIds,
    deadLeadIds,
    proposalsByLeadId,
    acceptedByLeadId,
    tpvByLeadId,
    orphanAccepted,
    orphanAcceptedTpv,
    linkTypeMap,

    // Helpers (uso pelos componentes filhos)
    getLeadTpv: (l) => tpvByLeadId.get(l?.id) || tpvFromLeadFallback(l),
    getLeadOrigin: (l) => resolveLeadOrigin(l, linkTypeMap),
    isDealClosed: (leadId) => dealClosedLeadIds.has(leadId),
    isDead: (leadId) => deadLeadIds.has(leadId),

    // Agregados prontos
    counts: {
      totalLeads, leadsThisMonth, leadsThisWeek, leadsLastWeek,
      leadsWeekTrend: leadsThisWeek - leadsLastWeek,
      proposalsSent: proposalsSentWithStandardCount,
      proposalsSentRaw: proposalsSentCount,
      proposalsPending: leads.filter(l =>
        proposalsSentLeadIds.has(l.id) && !dealClosedLeadIds.has(l.id) && !deadLeadIds.has(l.id)
      ).length,
      proposalsAccepted: proposalsAcceptedCount,
      proposalsThisMonth,
      proposalConversionRate,
      dealsClosedCount: dealClosedLeadIds.size,
      leadsActivated, activationRate,
      leadsLost, lossRate,
      tpvPipeline, tpvClosed,
      avgTicket,
      avgFunnelDays,
      staleLeads, proposalsExpiring, proposalsRejectedNoFollowup,
      urgentLeadsNoProp, leadsReadyForProposal,
    },

    // Listas
    funnelData,
    trendData,
    bySeller,
    byIntroducer,
    bySegment,
    byOrigin,

    // Auditoria
    audit: {
      // Leads cujo status diverge da realidade (proposta aceita mas status não reflete)
      desyncedAcceptedLeads: leads.filter(l =>
        (acceptedByLeadId.get(l.id) || []).length > 0
        && !LEAD_STATUS_ACCEPTED_FAMILY.includes(l.status)
      ).map(l => ({ id: l.id, fullName: l.fullName || l.companyName, status: l.status })),

      // Propostas órfãs que casam por CNPJ com algum lead
      orphanAcceptedMatchingByCnpj: acceptedDeduped.filter(p => {
        if (p.leadId) return false;
        const c = normalizeCnpj(p.clienteCnpj);
        return isValidCnpj(c) && leadCnpjs.has(c);
      }).map(p => ({ id: p.id, codigo: p.codigo, clienteNome: p.clienteNome, clienteCnpj: p.clienteCnpj })),

      // Leads marcados standard mas sem indicadores claros
      standardWithoutFlags: leads.filter(l =>
        LEAD_STATUS_ACCEPTED_FAMILY.includes(l.status)
        && !l.currentProposalId
        && !(acceptedByLeadId.get(l.id) || []).length
        && !acceptedViaStandard(l)
      ).map(l => ({ id: l.id, fullName: l.fullName || l.companyName, status: l.status, origemLead: l.origemLead })),
    },
  };
}

// Formatador comum
export function formatCompact(v) {
  if (!v) return 'R$ 0';
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`;
  return `R$ ${Math.round(v).toLocaleString('pt-BR')}`;
}