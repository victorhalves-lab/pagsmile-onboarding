import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Crown, BarChart3, Users, FileText } from 'lucide-react';

import CEOKPICards from '@/components/ceo-dashboard/CEOKPICards';
import SellerPerformanceTable from '@/components/ceo-dashboard/SellerPerformanceTable';
import CEOFunnelOverview from '@/components/ceo-dashboard/CEOFunnelOverview';
import CEOContractsOverview from '@/components/ceo-dashboard/CEOContractsOverview';
import CEOComplianceOverview from '@/components/ceo-dashboard/CEOComplianceOverview';
import CEOTrendChart from '@/components/ceo-dashboard/CEOTrendChart';

const formatCompact = (v) => {
  if (!v) return 'R$ 0';
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}K`;
  return `R$ ${v.toFixed(0)}`;
};

export default function DashboardCEO() {
  const { data: leads = [], refetch: r1 } = useQuery({
    queryKey: ['ceo-leads'], queryFn: () => base44.entities.Lead.list('-created_date', 1000)
  });
  const { data: proposals = [], refetch: r2 } = useQuery({
    queryKey: ['ceo-proposals'], queryFn: () => base44.entities.Proposal.list('-created_date', 500)
  });
  const { data: pixProposals = [] } = useQuery({
    queryKey: ['ceo-pix-proposals'], queryFn: () => base44.entities.PixProposal.list('-created_date', 500)
  });
  const { data: contracts = [] } = useQuery({
    queryKey: ['ceo-contracts'], queryFn: () => base44.entities.Contract.list('-created_date', 500)
  });
  const { data: cases = [] } = useQuery({
    queryKey: ['ceo-cases'], queryFn: () => base44.entities.OnboardingCase.list('-created_date', 500)
  });

  const refetchAll = () => { r1(); r2(); };

  const allProposals = useMemo(() => [
    ...proposals.filter(p => p.isCurrentVersion !== false),
    ...pixProposals.filter(p => p.isCurrentVersion !== false)
  ], [proposals, pixProposals]);

  // ── Global KPIs ──
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalLeads = leads.length;
    const leadsThisMonth = leads.filter(l => new Date(l.created_date) >= thisMonthStart).length;

    const clientStatuses = ['enviada', 'visualizada', 'aceita', 'recusada', 'contraproposta', 'expirada'];
    const proposalsSent = allProposals.filter(p => clientStatuses.includes(p.status)).length;
    const proposalsThisMonth = allProposals.filter(p => new Date(p.created_date) >= thisMonthStart && clientStatuses.includes(p.status)).length;
    const proposalsAccepted = allProposals.filter(p => p.status === 'aceita').length;
    const proposalConversionRate = proposalsSent > 0 ? ((proposalsAccepted / proposalsSent) * 100).toFixed(1) : '0';

    const leadsActivated = leads.filter(l => l.status === 'ativado').length;
    const activationRate = totalLeads > 0 ? ((leadsActivated / totalLeads) * 100).toFixed(1) : '0';
    const leadsLost = leads.filter(l => ['perdido', 'proposta_recusada'].includes(l.status)).length;
    const lossRate = totalLeads > 0 ? ((leadsLost / totalLeads) * 100).toFixed(1) : '0';

    const activeLeads = leads.filter(l => !['perdido', 'proposta_recusada'].includes(l.status));
    const tpvPipeline = activeLeads.reduce((s, l) => s + (l.tpvMensal || 0), 0);
    const leadsWithTicket = leads.filter(l => l.ticketMedio > 0);
    const avgTicket = leadsWithTicket.length > 0 ? leadsWithTicket.reduce((s, l) => s + l.ticketMedio, 0) / leadsWithTicket.length : 0;

    const activated = leads.filter(l => l.status === 'ativado' && l.created_date);
    const avgFunnelDays = activated.length > 0
      ? (activated.reduce((s, l) => {
          const upd = l.lastInteractionDate || l.updated_date;
          return s + (new Date(upd) - new Date(l.created_date)) / 86400000;
        }, 0) / activated.length).toFixed(0)
      : '-';

    return {
      totalLeads, leadsThisMonth, proposalsSent, proposalsThisMonth,
      proposalsAccepted, proposalConversionRate, leadsActivated, activationRate,
      leadsLost, lossRate,
      tpvPipelineFormatted: formatCompact(tpvPipeline),
      avgTicketFormatted: formatCompact(avgTicket),
      avgFunnelTime: avgFunnelDays === '-' ? '-' : `${avgFunnelDays}d`,
    };
  }, [leads, allProposals]);

  // ── Funnel ──
  const funnelData = useMemo(() => [
    { name: 'Questionário', value: leads.filter(l => l.status === 'questionario_preenchido').length },
    { name: 'Analisado IA', value: leads.filter(l => l.status === 'analisado_priscila').length },
    { name: 'Em Contato', value: leads.filter(l => l.status === 'em_contato_comercial').length },
    { name: 'Proposta Enviada', value: leads.filter(l => l.status === 'proposta_enviada').length },
    { name: 'Proposta Aceita', value: leads.filter(l => l.status === 'proposta_aceita').length },
    { name: 'KYC', value: leads.filter(l => ['kyc_iniciado', 'kyc_aprovado', 'kyc_revisao_manual'].includes(l.status)).length },
    { name: 'Ativado', value: leads.filter(l => l.status === 'ativado').length },
  ], [leads]);

  // ── Trend (6 months) ──
  const trendData = useMemo(() => {
    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth(), y = d.getFullYear();
      const ml = leads.filter(l => { const c = new Date(l.created_date); return c.getMonth() === m && c.getFullYear() === y; });
      result.push({
        name: d.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
        novos: ml.length,
        convertidos: ml.filter(l => l.status === 'ativado').length,
        perdidos: ml.filter(l => ['perdido', 'proposta_recusada'].includes(l.status)).length,
      });
    }
    return result;
  }, [leads]);

  // ── Seller Performance ──
  const sellers = useMemo(() => {
    const map = {};
    leads.forEach(l => {
      const agentId = l.commercialAgentId || l.created_by || '_unassigned';
      const agentName = l.commercialAgentName || l.created_by || 'Não atribuído';
      if (!map[agentId]) {
        map[agentId] = {
          id: agentId, name: agentName, email: agentId.includes('@') ? agentId : '',
          totalLeads: 0, proposalsSent: 0, proposalsAccepted: 0, tpvPipeline: 0,
          leadsActivated: 0, leadsLost: 0,
        };
      }
      map[agentId].totalLeads++;
      if (!['perdido', 'proposta_recusada'].includes(l.status)) map[agentId].tpvPipeline += (l.tpvMensal || 0);
      if (l.status === 'ativado') map[agentId].leadsActivated++;
      if (['perdido', 'proposta_recusada'].includes(l.status)) map[agentId].leadsLost++;
    });

    // Count proposals per seller
    allProposals.forEach(p => {
      const rId = p.responsavelId || '_unassigned';
      if (map[rId]) {
        const clientStatuses = ['enviada', 'visualizada', 'aceita', 'recusada', 'contraproposta', 'expirada'];
        if (clientStatuses.includes(p.status)) map[rId].proposalsSent++;
        if (p.status === 'aceita') map[rId].proposalsAccepted++;
      }
    });

    return Object.values(map)
      .filter(s => s.id !== '_unassigned' || s.totalLeads > 0)
      .sort((a, b) => b.totalLeads - a.totalLeads);
  }, [leads, allProposals]);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#002443] via-[#1a3a5c] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <Crown className="w-6 h-6 text-[#5cf7cf]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard CEO</h1>
              <p className="text-white/60 text-sm mt-1">Visão estratégica de todo o funil comercial</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={refetchAll} className="border-white/20 text-white hover:bg-white/10 rounded-xl bg-transparent">
              <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
            </Button>
            <Link to={createPageUrl('DashboardComercial')}>
              <Button className="bg-white/10 hover:bg-white/20 text-white rounded-xl">
                <BarChart3 className="w-4 h-4 mr-2" /> Dash Comercial
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs Globais */}
      <CEOKPICards stats={stats} />

      {/* Performance por Vendedor */}
      <SellerPerformanceTable sellers={sellers} />

      {/* Funil + Tendência */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CEOFunnelOverview data={funnelData} />
        <CEOTrendChart data={trendData} />
      </div>

      {/* Contratos + Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CEOContractsOverview contracts={contracts} />
        <CEOComplianceOverview cases={cases} />
      </div>
    </div>
  );
}