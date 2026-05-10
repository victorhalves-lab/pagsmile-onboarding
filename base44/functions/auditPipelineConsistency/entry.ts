import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Admin tool: auditoria completa do pipeline comercial.
 *
 * Cruza Leads + Proposals + PixProposals para validar:
 *   1. Contagens totais
 *   2. Leads com proposta aceita mas Lead.status != 'proposta_aceita' (DESYNC — automation deveria corrigir)
 *   3. Propostas órfãs (sem leadId) — invisíveis no pipeline
 *   4. Propostas com leadId apontando para lead inexistente
 *   5. TPV total do pipeline
 *   6. Distribuição por status do Lead
 *   7. Distribuição por status da Proposal
 *
 * Apenas leitura — não modifica nada.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const [leads, proposals, pixProposals] = await Promise.all([
      base44.asServiceRole.entities.Lead.list('-created_date', 5000),
      base44.asServiceRole.entities.Proposal.list('-created_date', 5000),
      base44.asServiceRole.entities.PixProposal.list('-created_date', 5000),
    ]);

    const leadById = {};
    leads.forEach(l => { leadById[l.id] = l; });

    // Status distribution — Leads
    const leadStatusDist = {};
    leads.forEach(l => {
      const s = l.status || 'NULL';
      leadStatusDist[s] = (leadStatusDist[s] || 0) + 1;
    });

    // Status distribution — Proposals (current version only)
    const proposalStatusDist = {};
    const currentProposals = proposals.filter(p => p.isCurrentVersion !== false);
    currentProposals.forEach(p => {
      const s = p.status || 'NULL';
      proposalStatusDist[s] = (proposalStatusDist[s] || 0) + 1;
    });

    const pixCurrentProposals = pixProposals.filter(p => p.isCurrentVersion !== false);
    const pixStatusDist = {};
    pixCurrentProposals.forEach(p => {
      const s = p.status || 'NULL';
      pixStatusDist[s] = (pixStatusDist[s] || 0) + 1;
    });

    // Aceitas — fonte de verdade para "negócio fechado"
    const acceptedProposals = currentProposals.filter(p => p.status === 'aceita');
    const acceptedPix = pixCurrentProposals.filter(p => p.status === 'aceita');

    // DESYNC: proposta aceita mas Lead.status NÃO é proposta_aceita/kyc_*/ativado
    const FORWARD_STATUSES = new Set(['proposta_aceita', 'kyc_iniciado', 'kyc_aprovado', 'kyc_revisao_manual', 'ativado']);
    const desyncLeads = [];
    [...acceptedProposals, ...acceptedPix].forEach(p => {
      if (!p.leadId) return;
      const lead = leadById[p.leadId];
      if (!lead) return;
      if (!FORWARD_STATUSES.has(lead.status)) {
        desyncLeads.push({
          leadId: lead.id, leadName: lead.companyName || lead.fullName,
          leadStatus: lead.status, proposalCodigo: p.codigo || p.id,
          proposalAcceptedDate: p.acceptedDate, source: p.entity_name || (acceptedPix.includes(p) ? 'PixProposal' : 'Proposal'),
        });
      }
    });

    // Órfãs — proposta sem leadId
    const orphanProposals = currentProposals.filter(p => !p.leadId || p.leadId === '').map(p => ({
      id: p.id, codigo: p.codigo, clienteNome: p.clienteNome,
      clienteCnpj: p.clienteCnpj, status: p.status, source: 'Proposal',
    }));
    const orphanPix = pixCurrentProposals.filter(p => !p.leadId || p.leadId === '').map(p => ({
      id: p.id, codigo: p.codigo, clienteNome: p.clienteNome,
      clienteCnpj: p.clienteCnpj, status: p.status, source: 'PixProposal',
    }));

    // Propostas com leadId apontando para lead inexistente
    const ghostLeadProposals = [];
    currentProposals.forEach(p => {
      if (p.leadId && p.leadId !== '' && !leadById[p.leadId]) {
        ghostLeadProposals.push({
          id: p.id, codigo: p.codigo, leadId: p.leadId,
          clienteNome: p.clienteNome, status: p.status,
        });
      }
    });
    pixCurrentProposals.forEach(p => {
      if (p.leadId && p.leadId !== '' && !leadById[p.leadId]) {
        ghostLeadProposals.push({
          id: p.id, codigo: p.codigo, leadId: p.leadId,
          clienteNome: p.clienteNome, status: p.status, source: 'PixProposal',
        });
      }
    });

    // TPV: usar fórmula do pipeline (proposta aceita > minimoGarantido | senão lead.tpvMensal)
    const acceptedByLeadId = {};
    [...acceptedProposals, ...acceptedPix].forEach(p => {
      if (p.leadId) {
        const tpv = p.rates?.minimoGarantido?.mes3 || p.rates?.minimoGarantido?.mes2 || p.rates?.minimoGarantido?.mes1 || 0;
        if (tpv > (acceptedByLeadId[p.leadId] || 0)) acceptedByLeadId[p.leadId] = tpv;
      }
    });

    const getEffectiveTpv = (l) => {
      if (acceptedByLeadId[l.id]) return acceptedByLeadId[l.id];
      return Number(l.tpvMensal) || 0;
    };

    let totalPipelineTpv = 0;
    let closedTpv = 0;
    leads.forEach(l => {
      const tpv = getEffectiveTpv(l);
      totalPipelineTpv += tpv;
      if (FORWARD_STATUSES.has(l.status) || acceptedByLeadId[l.id]) {
        closedTpv += tpv;
      }
    });

    // TPV de propostas órfãs aceitas (não estão atreladas a Lead — somam ao "fechado" no dashboard)
    const orphanAcceptedTpv = [...acceptedProposals, ...acceptedPix]
      .filter(p => !p.leadId || p.leadId === '')
      .reduce((s, p) => s + (p.rates?.minimoGarantido?.mes3 || p.rates?.minimoGarantido?.mes2 || p.rates?.minimoGarantido?.mes1 || 0), 0);

    // Leads com TPV inválido (< R$ 1k mas > 0)
    const invalidTpvLeads = leads.filter(l => Number(l.tpvMensal) > 0 && Number(l.tpvMensal) < 1000);

    // Leads sem TPV (= 0 ou null) que não são de status terminal
    const noTpvActive = leads.filter(l => {
      const t = Number(l.tpvMensal) || 0;
      return t === 0 && !['perdido', 'proposta_recusada'].includes(l.status);
    }).length;

    return Response.json({
      ok: true,
      summary: {
        totalLeads: leads.length,
        totalProposalsAllVersions: proposals.length,
        totalProposalsCurrent: currentProposals.length,
        totalPixProposalsCurrent: pixCurrentProposals.length,
        acceptedProposals: acceptedProposals.length,
        acceptedPixProposals: acceptedPix.length,
        totalAccepted: acceptedProposals.length + acceptedPix.length,
        totalPipelineTpv: Math.round(totalPipelineTpv),
        closedTpv: Math.round(closedTpv),
        orphanAcceptedTpv: Math.round(orphanAcceptedTpv),
        closedTpvWithOrphans: Math.round(closedTpv + orphanAcceptedTpv),
      },
      leadStatusDist,
      proposalStatusDist,
      pixStatusDist,
      issues: {
        desyncLeads_count: desyncLeads.length,
        desyncLeads,
        orphanProposals_count: orphanProposals.length + orphanPix.length,
        orphanProposals: [...orphanProposals, ...orphanPix],
        ghostLeadProposals_count: ghostLeadProposals.length,
        ghostLeadProposals,
        invalidTpvLeads_count: invalidTpvLeads.length,
        invalidTpvLeads: invalidTpvLeads.map(l => ({ id: l.id, name: l.companyName || l.fullName, tpv: l.tpvMensal })),
        noTpvActive_count: noTpvActive,
      },
    });
  } catch (error) {
    console.error('auditPipelineConsistency error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});