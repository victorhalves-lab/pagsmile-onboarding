import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, FileText, Users } from 'lucide-react';

import CommercialKPIs from '@/components/commercial-dashboard/CommercialKPIs';
import CommercialQuickMetrics from '@/components/commercial-dashboard/CommercialQuickMetrics';
import SalesFunnelChart from '@/components/commercial-dashboard/SalesFunnelChart';
import ProposalStatusPieChart from '@/components/commercial-dashboard/ProposalStatusPieChart';
import LeadsTrendChart from '@/components/commercial-dashboard/LeadsTrendChart';
import LeadsBySegmentChart from '@/components/commercial-dashboard/LeadsBySegmentChart';
import LeadsByOriginChart from '@/components/commercial-dashboard/LeadsByOriginChart';
import TpvBySegmentChart from '@/components/commercial-dashboard/TpvBySegmentChart';
import RevenueMarginChart from '@/components/commercial-dashboard/RevenueMarginChart';
import TopIntroducersTable from '@/components/commercial-dashboard/TopIntroducersTable';
import LeadQualifierDistribution from '@/components/commercial-dashboard/LeadQualifierDistribution';
import CommercialAlerts from '@/components/commercial-dashboard/CommercialAlerts';
import StandardProposalsSummary from '@/components/commercial-dashboard/StandardProposalsSummary';
import RecentLeadsTable from '@/components/commercial-dashboard/RecentLeadsTable';

function formatCompact(value) {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return `R$ ${value.toFixed(0)}`;
}

export default function DashboardComercial() {
  const { data: leads = [], isLoading: leadsLoading, refetch: refetchLeads } = useQuery({
    queryKey: ['comm-dash-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500)
  });

  const { data: proposals = [], refetch: refetchProposals } = useQuery({
    queryKey: ['comm-dash-proposals'],
    queryFn: () => base44.entities.Proposal.list('-created_date', 500)
  });

  const { data: pixProposals = [] } = useQuery({
    queryKey: ['comm-dash-pix-proposals'],
    queryFn: () => base44.entities.PixProposal.list('-created_date', 500)
  });

  const { data: standardProposals = [] } = useQuery({
    queryKey: ['comm-dash-std-proposals'],
    queryFn: () => base44.entities.StandardProposal.list('-created_date', 500)
  });

  const { data: introducers = [] } = useQuery({
    queryKey: ['comm-dash-introducers'],
    queryFn: () => base44.entities.Introducer.list()
  });

  const refetchAll = () => {
    refetchLeads();
    refetchProposals();
  };

  // ── Compute all stats ──
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today.getTime() - 7 * 86400000);
    const lastWeekStart = new Date(today.getTime() - 14 * 86400000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Basic counts
    const totalLeads = leads.length;
    const leadsThisWeek = leads.filter(l => new Date(l.created_date) >= thisWeekStart).length;
    const leadsLastWeek = leads.filter(l => {
      const d = new Date(l.created_date);
      return d >= lastWeekStart && d < thisWeekStart;
    }).length;
    const leadsWeekTrend = leadsThisWeek - leadsLastWeek;

    // All proposals (Proposal + PixProposal)
    const allProposals = [...proposals.filter(p => p.isCurrentVersion !== false), ...pixProposals.filter(p => p.isCurrentVersion !== false)];
    const clientFacingStatuses = ['enviada', 'visualizada', 'aceita', 'recusada', 'contraproposta', 'expirada'];
    const proposalsSent = allProposals.filter(p => clientFacingStatuses.includes(p.status)).length;
    const proposalsPending = allProposals.filter(p => ['enviada', 'visualizada', 'contraproposta'].includes(p.status)).length;
    const proposalsAccepted = allProposals.filter(p => p.status === 'aceita').length;
    const proposalConversionRate = proposalsSent > 0 ? ((proposalsAccepted / proposalsSent) * 100).toFixed(1) : 0;

    // Lost leads
    const leadsLost = leads.filter(l => ['perdido', 'proposta_recusada'].includes(l.status)).length;
    const lossRate = totalLeads > 0 ? ((leadsLost / totalLeads) * 100).toFixed(1) : 0;

    // TPV & Ticket
    const activeLeads = leads.filter(l => !['perdido', 'proposta_recusada'].includes(l.status));
    const tpvPipeline = activeLeads.reduce((s, l) => s + (l.tpvMensal || 0), 0);
    const leadsWithTicket = leads.filter(l => l.ticketMedio > 0);
    const avgTicket = leadsWithTicket.length > 0 ? leadsWithTicket.reduce((s, l) => s + l.ticketMedio, 0) / leadsWithTicket.length : 0;

    // Funnel time (days from creation to ativado)
    const activatedLeads = leads.filter(l => l.status === 'ativado' && l.created_date);
    const avgFunnelDays = activatedLeads.length > 0
      ? (activatedLeads.reduce((s, l) => {
          const updated = l.lastInteractionDate || l.updated_date;
          return s + (new Date(updated) - new Date(l.created_date)) / 86400000;
        }, 0) / activatedLeads.length).toFixed(0)
      : '-';

    // Proposals this month
    const proposalsThisMonth = allProposals.filter(p => new Date(p.created_date) >= thisMonthStart).length;

    // Stale leads (>7 days no interaction, not closed)
    const staleLeads = leads.filter(l => {
      if (['ativado', 'perdido', 'proposta_recusada'].includes(l.status)) return false;
      const d = l.lastInteractionDate || l.updated_date || l.created_date;
      return d && (now - new Date(d)) / 86400000 > 7;
    }).length;

    // Expiring proposals (within 3 days)
    const threeDaysFromNow = new Date(now.getTime() + 3 * 86400000);
    const proposalsExpiring = allProposals.filter(p => {
      if (!['enviada', 'visualizada'].includes(p.status)) return false;
      if (!p.validUntil) return false;
      const exp = new Date(p.validUntil);
      return exp <= threeDaysFromNow && exp >= now;
    }).length;

    // Rejected proposals without follow-up
    const proposalsRejectedNoFollowup = allProposals.filter(p => p.status === 'recusada').length;

    // Urgent leads (IA) without proposal
    const urgentLeadsNoProp = leads.filter(l => l.iaPriority === 'URGENTE' && !l.currentProposalId).length;

    // Leads ready for proposal (analyzed, good score, no proposal yet)
    const leadsReadyForProposal = leads.filter(l =>
      ['analisado_priscila', 'em_contato_comercial'].includes(l.status) &&
      (l.leadQualifierLevel === 'EXCELENTE' || l.leadQualifierLevel === 'BOM') &&
      !l.currentProposalId
    ).length;

    // ── Funnel data ──
    const funnelData = [
      { name: 'Questionário', value: leads.filter(l => l.status === 'questionario_preenchido').length },
      { name: 'Analisado IA', value: leads.filter(l => l.status === 'analisado_priscila').length },
      { name: 'Em Contato', value: leads.filter(l => l.status === 'em_contato_comercial').length },
      { name: 'Proposta Enviada', value: leads.filter(l => l.status === 'proposta_enviada').length },
      { name: 'Proposta Aceita', value: leads.filter(l => l.status === 'proposta_aceita').length },
      { name: 'KYC', value: leads.filter(l => ['kyc_iniciado', 'kyc_aprovado', 'kyc_revisao_manual'].includes(l.status)).length },
      { name: 'Ativado', value: leads.filter(l => l.status === 'ativado').length },
    ];

    // ── Trend data (6 months) ──
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const monthLeads = leads.filter(l => {
        const cd = new Date(l.created_date);
        return cd.getMonth() === month && cd.getFullYear() === year;
      });
      trendData.push({
        name: d.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
        novos: monthLeads.length,
        convertidos: monthLeads.filter(l => l.status === 'ativado').length,
        perdidos: monthLeads.filter(l => ['perdido', 'proposta_recusada'].includes(l.status)).length,
      });
    }

    // ── Leads by segment ──
    const segCounts = {};
    leads.forEach(l => {
      const seg = l.businessSubCategory || 'Outros';
      segCounts[seg] = (segCounts[seg] || 0) + 1;
    });
    const leadsBySegment = Object.entries(segCounts)
      .map(([name, count]) => ({ name: name === 'MERCHAN' ? 'Merchant' : name === 'GATEWAY' ? 'Gateway' : name === 'MARKETPLACE' ? 'Marketplace' : name, count }))
      .sort((a, b) => b.count - a.count);

    // ── Leads by origin ──
    const originCounts = {};
    leads.forEach(l => {
      const origin = l.introducerName || l.origemLead || 'Direto';
      originCounts[origin] = (originCounts[origin] || 0) + 1;
    });
    const leadsByOrigin = Object.entries(originCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // ── TPV by segment ──
    const tpvBySeg = {};
    leads.forEach(l => {
      const seg = l.businessSubCategory || 'Outros';
      const label = seg === 'MERCHAN' ? 'Merchant' : seg === 'GATEWAY' ? 'Gateway' : seg === 'MARKETPLACE' ? 'Marketplace' : seg;
      tpvBySeg[label] = (tpvBySeg[label] || 0) + (l.tpvMensal || 0);
    });
    const tpvBySegment = Object.entries(tpvBySeg)
      .map(([name, tpv]) => ({ name, tpv }))
      .sort((a, b) => b.tpv - a.tpv);

    // ── Revenue/Margin chart ──
    const acceptedProps = proposals.filter(p => p.status === 'aceita' && p.isCurrentVersion !== false);
    const revenueData = [];
    const months6 = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months6.push({ name: d.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''), month: d.getMonth(), year: d.getFullYear() });
    }
    months6.forEach(({ name, month, year }) => {
      const monthProps = acceptedProps.filter(p => {
        const cd = new Date(p.acceptedDate || p.created_date);
        return cd.getMonth() === month && cd.getFullYear() === year;
      });
      revenueData.push({
        name,
        receita: monthProps.reduce((s, p) => s + (p.estimatedRevenue || 0), 0),
        custo: monthProps.reduce((s, p) => s + (p.estimatedCost || 0), 0),
        margem: monthProps.reduce((s, p) => s + (p.estimatedMargin || 0), 0),
      });
    });
    const hasRevenueData = revenueData.some(d => d.receita > 0 || d.custo > 0);

    // ── Top Introducers ──
    const introducerMap = {};
    introducers.forEach(intr => { introducerMap[intr.id] = intr; });
    const introLeadCounts = {};
    leads.forEach(l => {
      if (!l.introducerId) return;
      if (!introLeadCounts[l.introducerId]) {
        const intr = introducerMap[l.introducerId];
        introLeadCounts[l.introducerId] = {
          name: intr?.name || l.introducerName || 'Desconhecido',
          referralCode: intr?.referralCode || l.introducerReferralCode || '',
          leadsCount: 0,
          acceptedCount: 0,
          tpv: 0,
        };
      }
      introLeadCounts[l.introducerId].leadsCount++;
      introLeadCounts[l.introducerId].tpv += (l.tpvMensal || 0);
      if (['proposta_aceita', 'kyc_iniciado', 'kyc_aprovado', 'ativado'].includes(l.status)) {
        introLeadCounts[l.introducerId].acceptedCount++;
      }
    });
    const topIntroducers = Object.values(introLeadCounts).sort((a, b) => b.leadsCount - a.leadsCount);

    // ── Lead Qualifier Distribution ──
    const qualLevels = ['EXCELENTE', 'BOM', 'REGULAR', 'FRACO', 'INSUFICIENTE', 'PENDENTE'];
    const qualDist = qualLevels.map(level => ({
      level,
      count: leads.filter(l => (l.leadQualifierLevel || 'PENDENTE') === level).length
    }));
    const leadsWithQual = leads.filter(l => l.leadQualifierScore > 0);
    const avgQualScore = leadsWithQual.length > 0
      ? Math.round(leadsWithQual.reduce((s, l) => s + l.leadQualifierScore, 0) / leadsWithQual.length)
      : 0;
    const leadsWithPriscila = leads.filter(l => l.priscilaQualityScore > 0);
    const avgPriscila = leadsWithPriscila.length > 0
      ? Math.round(leadsWithPriscila.reduce((s, l) => s + l.priscilaQualityScore, 0) / leadsWithPriscila.length)
      : 0;

    return {
      totalLeads, leadsThisWeek, leadsWeekTrend,
      proposalsSent, proposalsPending, proposalsAccepted, proposalConversionRate,
      leadsLost, lossRate,
      tpvPipelineFormatted: formatCompact(tpvPipeline),
      avgTicketFormatted: formatCompact(avgTicket),
      avgFunnelTime: avgFunnelDays === '-' ? '-' : `${avgFunnelDays}d`,
      proposalsThisMonth, staleLeads, proposalsExpiring,
      proposalsRejectedNoFollowup, urgentLeadsNoProp, leadsReadyForProposal,
      funnelData, trendData, leadsBySegment, leadsByOrigin,
      tpvBySegment, revenueData: hasRevenueData ? revenueData : [],
      topIntroducers, qualDist, avgQualScore, avgPriscila,
    };
  }, [leads, proposals, pixProposals, introducers]);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <TrendingUp className="w-6 h-6 text-[#5cf7cf]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard Comercial</h1>
              <p className="text-white/60 text-sm mt-1">Visão completa de Leads, Propostas e Performance</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refetchAll} className="border-white/20 text-white hover:bg-white/10 rounded-xl bg-transparent">
              <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
            </Button>
            <Link to={createPageUrl('PipelineComercial')}>
              <Button className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl shadow-md">
                <Users className="w-4 h-4 mr-2" /> Pipeline
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <CommercialKPIs stats={stats} />

      {/* Quick Metrics */}
      <CommercialQuickMetrics stats={stats} />

      {/* Alerts */}
      <CommercialAlerts stats={stats} />

      {/* Funnel + Proposal Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesFunnelChart data={stats.funnelData} />
        <ProposalStatusPieChart proposals={[...proposals, ...pixProposals]} />
      </div>

      {/* Trend + Segment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadsTrendChart data={stats.trendData} />
        <LeadsBySegmentChart data={stats.leadsBySegment} />
      </div>

      {/* Origin + TPV */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadsByOriginChart data={stats.leadsByOrigin} />
        <TpvBySegmentChart data={stats.tpvBySegment} />
      </div>

      {/* Revenue + IA Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueMarginChart data={stats.revenueData} />
        <LeadQualifierDistribution data={stats.qualDist} avgScore={stats.avgQualScore} avgPriscila={stats.avgPriscila} />
      </div>

      {/* Introducers + Standard Proposals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopIntroducersTable data={stats.topIntroducers} />
        <StandardProposalsSummary standardProposals={standardProposals} pixProposals={pixProposals} />
      </div>

      {/* Recent Leads Table */}
      <div>
        <h2 className="text-lg font-bold text-[#002443] mb-3">Leads Recentes</h2>
        <RecentLeadsTable leads={leads} isLoading={leadsLoading} />
      </div>
    </div>
  );
}