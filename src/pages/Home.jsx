import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Users, FileText, Shield, Zap } from 'lucide-react';
import KPICard from '@/components/dashboard/KPICard';
import QuickActions from '@/components/home/QuickActions';
import SalesPipelineSummary from '@/components/dashboard/SalesPipelineSummary';
import ProposalStatusSummary from '@/components/home/ProposalStatusSummary';
import ComplianceSummary from '@/components/home/ComplianceSummary';
import HelenaInsightsAlerts from '@/components/dashboard/HelenaInsightsAlerts';
import RecentActivity from '@/components/home/RecentActivity';
import moment from 'moment';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function Home() {
  const { t } = useTranslation();
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
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
      </div>
    );
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t('home.good_morning');
    if (h < 18) return t('home.good_afternoon');
    return t('home.good_evening');
  })();

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002443] via-[#002443] to-[#36706c] p-8 md:p-10">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#2bc196]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#5cf7cf]/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#5cf7cf 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-[#5cf7cf] text-sm font-semibold tracking-wider uppercase mb-1">{greeting}</p>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                {user?.full_name?.split(' ')[0] || t('home.user_fallback')}
              </h1>
              <p className="text-white/50 text-sm mt-2 max-w-md">
                {t('home.summary')}{' '}
                <span className="text-[#5cf7cf] font-semibold">{t('home.pending_cases', { count: pendingCases })}</span> {t('home.pending_and')}{' '}
                <span className="text-[#5cf7cf] font-semibold">{t('home.open_proposals', { count: openProposals })}</span> {t('home.in_progress')}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
              <Zap className="w-4 h-4 text-[#5cf7cf]" />
              <span className="text-white/70 text-xs font-medium">
                {moment().format('dddd, DD [de] MMMM')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title={t('home.active_leads')}
          value={activeLeads}
          subtitle={t('home.of_total', { count: leads.length })}
          icon={Users}
          iconBg="bg-[#002443]/10"
          iconColor="text-[#002443]"
        />
        <KPICard
          title={t('home.open_proposals_title')}
          value={openProposals}
          subtitle={t('home.of_total', { count: proposals.length })}
          icon={FileText}
          iconBg="bg-[#2bc196]/10"
          iconColor="text-[#2bc196]"
        />
        <KPICard
          title={t('home.pending_compliance')}
          value={pendingCases}
          subtitle={t('home.of_total', { count: cases.length })}
          icon={Shield}
          iconBg="bg-[#36706c]/10"
          iconColor="text-[#36706c]"
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SalesPipelineSummary leads={leads} />
        <ProposalStatusSummary proposals={proposals} />
        <ComplianceSummary cases={cases} helenaAnalyses={helenaAnalyses} />
      </div>

      {/* Recent Activity */}
      <RecentActivity logs={auditLogs} />
    </div>
  );
}