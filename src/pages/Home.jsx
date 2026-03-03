import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Users, FileText, Shield } from 'lucide-react';
import KPICard from '@/components/dashboard/KPICard';
import QuickActions from '@/components/home/QuickActions';
import SalesPipelineSummary from '@/components/dashboard/SalesPipelineSummary';
import ProposalStatusSummary from '@/components/home/ProposalStatusSummary';
import ComplianceSummary from '@/components/home/ComplianceSummary';
import HelenaInsightsAlerts from '@/components/dashboard/HelenaInsightsAlerts';
import RecentActivity from '@/components/home/RecentActivity';
import moment from 'moment';

export default function Home() {
  const { data: user } = useQuery({
    queryKey: ['home-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['home-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 200),
  });

  const { data: proposals = [], isLoading: loadingProposals } = useQuery({
    queryKey: ['home-proposals'],
    queryFn: () => base44.entities.Proposal.list('-created_date', 200),
  });

  const { data: cases = [], isLoading: loadingCases } = useQuery({
    queryKey: ['home-cases'],
    queryFn: () => base44.entities.OnboardingCase.list('-created_date', 200),
  });

  const { data: helenaAnalyses = [] } = useQuery({
    queryKey: ['home-helena'],
    queryFn: () => base44.entities.HelenaAnalysis.list('-created_date', 100),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['home-audit'],
    queryFn: () => base44.entities.AuditLog.list('-changeDate', 10),
  });

  const isLoading = loadingLeads || loadingProposals || loadingCases;

  // KPI calculations
  const activeLeads = leads.filter(l => !['ativado', 'perdido'].includes(l.status)).length;
  const openProposals = proposals.filter(p => ['rascunho', 'enviada', 'visualizada', 'contraproposta'].includes(p.status)).length;
  const pendingCases = cases.filter(c => ['Pendente', 'Em Processamento', 'Docs Solicitados', 'Manual'].includes(c.status)).length;

  // Helena insights calculations
  const staleLeads = leads.filter(l => {
    if (['ativado', 'perdido'].includes(l.status)) return false;
    const lastDate = l.lastInteractionDate || l.updated_date || l.created_date;
    return moment().diff(moment(lastDate), 'days') > 7;
  }).length;

  const pendingManualOver24h = cases.filter(c => {
    if (c.status !== 'Manual') return false;
    return moment().diff(moment(c.updated_date || c.created_date), 'hours') > 24;
  }).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)]">
          Olá, {user?.full_name?.split(' ')[0] || 'Usuário'} 👋
        </h1>
        <p className="text-sm text-[var(--pagsmile-blue)]/60 mt-1">
          Aqui está o resumo geral da sua operação hoje.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Leads Ativos"
          value={activeLeads}
          subtitle={`${leads.length} total`}
          icon={Users}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <KPICard
          title="Propostas em Aberto"
          value={openProposals}
          subtitle={`${proposals.length} total`}
          icon={FileText}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <KPICard
          title="Compliance Pendentes"
          value={pendingCases}
          subtitle={`${cases.length} total`}
          icon={Shield}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Helena Insights */}
      <HelenaInsightsAlerts
        pendingManualOver24h={pendingManualOver24h}
        staleLeads={staleLeads}
      />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline */}
        <SalesPipelineSummary leads={leads} />

        {/* Proposals */}
        <ProposalStatusSummary proposals={proposals} />

        {/* Compliance */}
        <ComplianceSummary cases={cases} helenaAnalyses={helenaAnalyses} />
      </div>

      {/* Recent Activity */}
      <RecentActivity logs={auditLogs} />
    </div>
  );
}