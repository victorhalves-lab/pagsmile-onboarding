import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Users, FileText, Shield, ArrowUpRight, CheckCircle2, AlertTriangle, Search, Activity, Zap, Brain } from 'lucide-react';
import QuickActions from '@/components/home/QuickActions';
import SalesPipelineSummary from '@/components/dashboard/SalesPipelineSummary';
import ProposalStatusSummary from '@/components/home/ProposalStatusSummary';
import ComplianceSummary from '@/components/home/ComplianceSummary';
import HelenaInsightsAlerts from '@/components/dashboard/HelenaInsightsAlerts';
import RecentActivity from '@/components/home/RecentActivity';
import moment from 'moment';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const Sparkline = ({ data, color }) => {
  // Mock sparkline visualization
  return (
    <div className="flex items-end gap-1 h-8">
      {[40, 60, 45, 70, 65, 80, 75].map((h, i) => (
        <div 
          key={i} 
          className={`w-1 rounded-t-sm ${color}`}
          style={{ height: `${h}%`, opacity: 0.3 + (i * 0.1) }}
        />
      ))}
    </div>
  );
};

const KPICardBento = ({ title, value, subtitle, trend, icon: Icon, colorClass, sparklineColor }) => (
  <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white rounded-2xl overflow-hidden relative group">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
      <Icon className="w-16 h-16" />
    </div>
    <CardContent className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorClass.replace('text-', 'bg-').replace('600', '100')} ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
            <ArrowUpRight className="w-3 h-3" /> {trend}
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold text-[#002443]">{value}</p>
          <Sparkline color={sparklineColor} />
        </div>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
    </CardContent>
  </Card>
);

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
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#002443] to-[#36706c] shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Activity className="w-64 h-64 text-white" />
        </div>
        <div className="relative p-8 md:p-12 text-white">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Olá, {user?.full_name?.split(' ')[0] || 'Gestor'}
            </h1>
            <p className="text-lg md:text-xl text-[#5cf7cf]/90 font-light mb-8">
              Você tem <strong className="text-white font-bold">{pendingCases} casos</strong> aguardando revisão e <strong className="text-white font-bold">{openProposals} propostas</strong> em negociação ativa.
              Sua operação está <span className="inline-flex items-center bg-[#2bc196]/20 px-2 py-1 rounded text-[#5cf7cf] text-sm font-bold ml-2"><ArrowUpRight className="w-4 h-4 mr-1"/> 12% mais eficiente</span> hoje.
            </p>
            <div className="flex gap-4">
              <Button className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white border-none shadow-lg shadow-[#2bc196]/20 rounded-xl px-6 h-12 text-base">
                Ver Fila de Análise
              </Button>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl px-6 h-12 text-base">
                Relatórios
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* KPI Column */}
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICardBento
            title="Leads Ativos"
            value={activeLeads}
            subtitle="Pipeline saudável"
            trend="+5%"
            icon={Users}
            colorClass="text-blue-600"
            sparklineColor="bg-blue-600"
          />
          <KPICardBento
            title="Propostas Abertas"
            value={openProposals}
            subtitle="Em negociação"
            trend="+2.4%"
            icon={FileText}
            colorClass="text-amber-600"
            sparklineColor="bg-amber-600"
          />
          <KPICardBento
            title="Compliance Pendente"
            value={pendingCases}
            subtitle="Requer atenção"
            trend="-10%"
            icon={Shield}
            colorClass="text-purple-600"
            sparklineColor="bg-purple-600"
          />
          <KPICardBento
            title="IA Insights"
            value={helenaAnalyses.length}
            subtitle="Análises hoje"
            trend="+100%"
            icon={Brain}
            colorClass="text-[#36706c]"
            sparklineColor="bg-[#36706c]"
          />
        </div>

        {/* Helena IA Section - Distinct "Teal" Island */}
        <div className="lg:col-span-4 bg-[#36706c] rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <Brain className="w-6 h-6 text-[#5cf7cf]" />
              </div>
              <h2 className="text-2xl font-bold">Helena IA Intelligence</h2>
            </div>
            <Badge className="bg-[#5cf7cf] text-[#002443] hover:bg-[#5cf7cf]">
              <Zap className="w-3 h-3 mr-1" /> Live Insights
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
             {/* Insight Card 1 */}
             <div className="bg-[#002443]/50 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-[#002443]/70 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-[#5cf7cf]">Risco de Churn</h3>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-sm text-white/80 mb-3">
                  {staleLeads} leads estão sem interação há mais de 7 dias.
                </p>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full w-[45%]"></div>
                </div>
             </div>

             {/* Insight Card 2 */}
             <div className="bg-[#002443]/50 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-[#002443]/70 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-[#5cf7cf]">SLA Crítico</h3>
                  <Activity className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-sm text-white/80 mb-3">
                  {pendingManualOver24h} casos manuais excederam 24h de espera.
                </p>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-red-400 h-full w-[70%]"></div>
                </div>
             </div>

             {/* Insight Card 3 */}
             <div className="bg-[#002443]/50 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-[#002443]/70 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-[#5cf7cf]">Eficiência IA</h3>
                  <CheckCircle2 className="w-4 h-4 text-[#2bc196]" />
                </div>
                <p className="text-sm text-white/80 mb-3">
                  85% das aprovações hoje foram automáticas.
                </p>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#2bc196] h-full w-[85%]"></div>
                </div>
             </div>
          </div>
        </div>

        {/* Main Content Grid - Mixed Backgrounds */}
        <div className="lg:col-span-3 grid grid-cols-1 gap-6">
           {/* Pipeline & Proposals */}
           <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
             <SalesPipelineSummary leads={leads} />
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <ProposalStatusSummary proposals={proposals} />
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <ComplianceSummary cases={cases} helenaAnalyses={helenaAnalyses} />
              </div>
           </div>
        </div>

        {/* Sidebar Column - Quick Actions & Activity */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#002443] rounded-3xl p-6 text-white shadow-lg">
             <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
               <Zap className="w-5 h-5 text-[#5cf7cf]" /> Ações Rápidas
             </h3>
             <QuickActions />
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-fit">
            <h3 className="font-bold text-[#002443] text-lg mb-4">Atividade Recente</h3>
            <RecentActivity logs={auditLogs} />
          </div>
        </div>

      </div>
    </div>
  );
}