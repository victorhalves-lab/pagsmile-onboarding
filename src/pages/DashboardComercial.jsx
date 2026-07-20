import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, FileText, Users } from 'lucide-react';

import { buildCommercialDataset, formatCompact as fmtCompact } from '@/lib/commercialMetrics';
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
import CommercialInsights from '@/components/commercial-dashboard/CommercialInsights';
import StandardProposalsSummary from '@/components/commercial-dashboard/StandardProposalsSummary';
import RecentLeadsTable from '@/components/commercial-dashboard/RecentLeadsTable';

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

  const { data: onboardingLinks = [] } = useQuery({
    queryKey: ['comm-dash-onb-links'],
    queryFn: () => base44.entities.OnboardingLink.list('-created_date', 500)
  });

  const refetchAll = () => {
    refetchLeads();
    refetchProposals();
  };

  // ── Compute all stats via Fonte Única da Verdade (FUV) ──
  const stats = useMemo(() => {
    const ds = buildCommercialDataset({
      leads, proposals, pixProposals, standardProposals, introducers, onboardingLinks,
    });
    const c = ds.counts;

    // TPV by segment (precisa do helper getLeadTpv da FUV)
    const tpvBySeg = {};
    const labelSeg = (s) => s === 'MERCHAN' ? 'Merchant' : s === 'GATEWAY' ? 'Gateway' : s === 'MARKETPLACE' ? 'Marketplace' : (s || 'Outros');
    leads.forEach(l => {
      const label = labelSeg(l.businessSubCategory);
      tpvBySeg[label] = (tpvBySeg[label] || 0) + (ds.getLeadTpv(l) || 0);
    });
    const tpvBySegment = Object.entries(tpvBySeg).map(([name, tpv]) => ({ name, tpv })).sort((a, b) => b.tpv - a.tpv);

    // Lead Qualifier Distribution
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
      // Shape mantido para CommercialKPIs/CommercialQuickMetrics/Alerts/Insights
      totalLeads: c.totalLeads,
      leadsThisWeek: c.leadsThisWeek,
      leadsWeekTrend: c.leadsWeekTrend,
      proposalsSent: c.proposalsSent,
      proposalsPending: c.proposalsPending,
      proposalsAccepted: c.proposalsAccepted,
      proposalConversionRate: c.proposalConversionRate,
      leadsLost: c.leadsLost,
      lossRate: c.lossRate,
      tpvPipelineFormatted: fmtCompact(c.tpvPipeline),
      avgTicketFormatted: fmtCompact(c.avgTicket),
      avgFunnelTime: c.avgFunnelDays == null ? '-' : `${c.avgFunnelDays}d`,
      proposalsThisMonth: c.proposalsThisMonth,
      staleLeads: c.staleLeads,
      proposalsExpiring: c.proposalsExpiring,
      proposalsRejectedNoFollowup: c.proposalsRejectedNoFollowup,
      urgentLeadsNoProp: c.urgentLeadsNoProp,
      leadsReadyForProposal: c.leadsReadyForProposal,
      funnelData: ds.funnelData,
      trendData: ds.trendData,
      leadsBySegment: ds.bySegment.map(s => ({ name: s.name, count: s.count })),
      leadsByOrigin: ds.byOrigin.slice(0, 8),
      tpvBySegment,
      topIntroducers: ds.byIntroducer,
      qualDist, avgQualScore, avgPriscila,
    };
  }, [leads, proposals, pixProposals, standardProposals, introducers, onboardingLinks]);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0A0A0A] to-[#E84B1C] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <TrendingUp className="w-6 h-6 text-[#E84B1C]" />
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
              <Button className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white rounded-xl shadow-md">
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

      {/* Ações Necessárias (estilo degradê azul→verde, igual Compliance) */}
      <CommercialAlerts stats={stats} />

      {/* Insights IA (estilo degradê verde, igual Helena Insights) */}
      <CommercialInsights stats={stats} leads={leads} />

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
        <RevenueMarginChart proposals={proposals} leads={leads} />
        <LeadQualifierDistribution data={stats.qualDist} avgScore={stats.avgQualScore} avgPriscila={stats.avgPriscila} />
      </div>

      {/* Introducers + Standard Proposals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopIntroducersTable data={stats.topIntroducers} />
        <StandardProposalsSummary standardProposals={standardProposals} pixProposals={pixProposals} />
      </div>

      {/* Recent Leads Table */}
      <div>
        <h2 className="text-lg font-bold text-[#0A0A0A] mb-3">Leads Recentes</h2>
        <RecentLeadsTable leads={leads} isLoading={leadsLoading} />
      </div>
    </div>
  );
}