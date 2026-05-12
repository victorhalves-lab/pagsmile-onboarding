import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Crown, BarChart3, Users, FileText } from 'lucide-react';

import { buildCommercialDataset, formatCompact as fmtCompact } from '@/lib/commercialMetrics';
import CEOKPICards from '@/components/ceo-dashboard/CEOKPICards';
import SellerPerformanceTable from '@/components/ceo-dashboard/SellerPerformanceTable';
import CEOFunnelOverview from '@/components/ceo-dashboard/CEOFunnelOverview';
import CEOContractsOverview from '@/components/ceo-dashboard/CEOContractsOverview';
import CEOComplianceOverview from '@/components/ceo-dashboard/CEOComplianceOverview';
import CEOTrendChart from '@/components/ceo-dashboard/CEOTrendChart';
import TeamProductivityPanel from '@/components/ceo-dashboard/TeamProductivityPanel';

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
  const { data: onboardingLinks = [] } = useQuery({
    queryKey: ['ceo-links'], queryFn: () => base44.entities.OnboardingLink.list('-created_date', 500)
  });
  const { data: standardProposals = [] } = useQuery({
    queryKey: ['ceo-std-proposals'], queryFn: () => base44.entities.StandardProposal.list('-created_date', 500)
  });

  const refetchAll = () => { r1(); r2(); };

  const allProposals = useMemo(() => [
    ...proposals.filter(p => p.isCurrentVersion !== false),
    ...pixProposals.filter(p => p.isCurrentVersion !== false)
  ], [proposals, pixProposals]);

  // ── Fonte Única da Verdade (FUV) ──
  const dataset = useMemo(() => buildCommercialDataset({
    leads, proposals, pixProposals, standardProposals,
    introducers: [], onboardingLinks,
  }), [leads, proposals, pixProposals, standardProposals, onboardingLinks]);

  // ── Global KPIs (shape compatível com CEOKPICards) ──
  const stats = useMemo(() => {
    const c = dataset.counts;
    return {
      totalLeads: c.totalLeads,
      leadsThisMonth: c.leadsThisMonth,
      proposalsSent: c.proposalsSent,
      proposalsThisMonth: c.proposalsThisMonth,
      proposalsAccepted: c.proposalsAccepted,
      proposalConversionRate: c.proposalConversionRate,
      leadsActivated: c.leadsActivated,
      activationRate: c.activationRate,
      leadsLost: c.leadsLost,
      lossRate: c.lossRate,
      tpvPipelineFormatted: fmtCompact(c.tpvPipeline),
      avgTicketFormatted: fmtCompact(c.avgTicket),
      avgFunnelTime: c.avgFunnelDays == null ? '-' : `${c.avgFunnelDays}d`,
    };
  }, [dataset]);

  const funnelData = dataset.funnelData;
  const trendData = dataset.trendData;
  const sellers = dataset.bySeller;

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

      {/* Produtividade do Time */}
      <TeamProductivityPanel
        sellers={sellers}
        leads={leads}
        allProposals={allProposals}
        onboardingLinks={onboardingLinks}
        cases={cases}
        contracts={contracts}
        standardProposals={standardProposals}
        pixProposals={pixProposals}
      />

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