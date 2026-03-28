import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, BarChart3, TrendingUp, DollarSign, Users, CreditCard, ArrowUpDown, Target, Sparkles, Wallet, Activity, Swords, Layers, ShieldAlert, Building2, UserPlus, Database, Timer } from 'lucide-react';
import InsightsTPVSection from '@/components/insights/InsightsTPVSection';
import InsightsRatesSection from '@/components/insights/InsightsRatesSection';
import InsightsProposalRatesSection from '@/components/insights/InsightsProposalRatesSection';
import InsightsFunnelSection from '@/components/insights/InsightsFunnelSection';
import InsightsLeadProfileSection from '@/components/insights/InsightsLeadProfileSection';
import InsightsComplianceSection from '@/components/insights/InsightsComplianceSection';
import InsightsAISection from '@/components/insights/InsightsAISection';
import InsightsProfitabilitySection from '@/components/insights/InsightsProfitabilitySection.jsx';
import InsightsBenchmarkSection from '@/components/insights/InsightsBenchmarkSection.jsx';
import InsightsMixSection from '@/components/insights/InsightsMixSection.jsx';
import InsightsRiskPortfolioSection from '@/components/insights/InsightsRiskPortfolioSection.jsx';
import InsightsOperationalSection from '@/components/insights/InsightsOperationalSection.jsx';
import InsightsIntroducerSection from '@/components/insights/InsightsIntroducerSection.jsx';
import InsightsDataHealthSection from '@/components/insights/InsightsDataHealthSection.jsx';
import InsightsCommercialPerfSection from '@/components/insights/InsightsCommercialPerfSection.jsx';

const TAB_GROUPS = [
  {
    label: 'Inteligência',
    tabs: [
      { id: 'ai-insights', label: 'IA Insights', icon: Sparkles },
    ],
  },
  {
    label: 'Volume & Taxas',
    tabs: [
      { id: 'tpv', label: 'TPV & Volume', icon: DollarSign },
      { id: 'benchmark', label: 'Benchmark', icon: Swords },
      { id: 'mix', label: 'Mix Pagamento', icon: Layers },
      { id: 'expected-rates', label: 'Taxas Esperadas', icon: ArrowUpDown },
      { id: 'proposal-rates', label: 'Taxas Propostas', icon: CreditCard },
      { id: 'profitability', label: 'Rentabilidade', icon: Wallet },
    ],
  },
  {
    label: 'Comercial',
    tabs: [
      { id: 'commercial', label: 'Performance', icon: Timer },
      { id: 'funnel', label: 'Funil', icon: TrendingUp },
      { id: 'introducers', label: 'Introducers', icon: UserPlus },
    ],
  },
  {
    label: 'Perfil & Risco',
    tabs: [
      { id: 'profiles', label: 'Perfil Leads', icon: Users },
      { id: 'operational', label: 'Operacional', icon: Building2 },
      { id: 'risk', label: 'Risco', icon: ShieldAlert },
      { id: 'compliance', label: 'Compliance', icon: Target },
      { id: 'data-health', label: 'Data Health', icon: Database },
    ],
  },
];

const ALL_TABS = TAB_GROUPS.flatMap(g => g.tabs);

export default function DadosInsights() {
  const [activeTab, setActiveTab] = useState('ai-insights');

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['insights-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500),
  });
  const { data: proposals = [], isLoading: loadingProposals } = useQuery({
    queryKey: ['insights-proposals'],
    queryFn: () => base44.entities.Proposal.list('-created_date', 500),
  });
  const { data: cases = [], isLoading: loadingCases } = useQuery({
    queryKey: ['insights-cases'],
    queryFn: () => base44.entities.OnboardingCase.list('-created_date', 500),
  });
  const { data: complianceScores = [], isLoading: loadingScores } = useQuery({
    queryKey: ['insights-scores'],
    queryFn: () => base44.entities.ComplianceScore.list('-created_date', 500),
  });
  const { data: merchants = [], isLoading: loadingMerchants } = useQuery({
    queryKey: ['insights-merchants'],
    queryFn: () => base44.entities.Merchant.list('-created_date', 500),
  });
  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['insights-documents'],
    queryFn: () => base44.entities.DocumentUpload.list('-created_date', 500),
  });
  const { data: questionnaireResponses = [], isLoading: loadingResponses } = useQuery({
    queryKey: ['insights-qr'],
    queryFn: () => base44.entities.QuestionnaireResponse.list('-created_date', 500),
  });
  const { data: partners = [], isLoading: loadingPartners } = useQuery({
    queryKey: ['insights-partners'],
    queryFn: () => base44.entities.Partner.list('-created_date', 50),
  });
  const { data: pixProposals = [], isLoading: loadingPix } = useQuery({
    queryKey: ['insights-pix-proposals'],
    queryFn: () => base44.entities.PixProposal.list('-created_date', 500),
  });

  const isLoading = loadingLeads || loadingProposals || loadingCases || loadingScores || loadingMerchants || loadingDocs || loadingResponses || loadingPartners || loadingPix;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-[#2bc196]/20 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-[#002443] to-[#003366] flex items-center justify-center shadow-2xl shadow-[#002443]/20">
            <BarChart3 className="w-7 h-7 text-[#2bc196]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white shadow-lg flex items-center justify-center">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2bc196]" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#002443]/60">Carregando dados...</p>
          <p className="text-[10px] text-[#002443]/25 mt-1">Preparando visualizações</p>
        </div>
      </div>
    );
  }

  const counters = [
    { label: 'Leads', value: leads.length, color: '#2bc196' },
    { label: 'Propostas', value: proposals.length + pixProposals.length, color: '#5cf7cf' },
    { label: 'Compliance', value: cases.length, color: '#36706c' },
    { label: 'Merchants', value: merchants.length, color: '#94a3b8' },
    { label: 'Parceiros', value: partners.length, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto">
      {/* ═══ PREMIUM HEADER ═══ */}
      <div className="relative overflow-hidden rounded-[28px] bg-[#002443]">
        {/* Multi-layer mesh gradient */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#2bc196]/8 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#5cf7cf]/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-[#2bc196]/3 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2" />
        </div>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        {/* Geometric accents */}
        <div className="absolute top-6 right-10 w-[140px] h-[140px] border border-white/[0.04] rounded-full" />
        <div className="absolute top-10 right-14 w-[90px] h-[90px] border border-white/[0.04] rounded-full" />
        <div className="absolute bottom-4 right-1/3 w-8 h-8 border border-white/[0.06] rounded-lg rotate-45" />
        
        <div className="relative z-10 p-7 md:p-9">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-[#2bc196]/30 blur-lg" />
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2bc196] to-[#36706c] flex items-center justify-center shadow-xl">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-[26px] md:text-[32px] font-extrabold text-white tracking-[-0.02em] leading-none">Dados & Insights</h1>
                  <div className="flex items-center gap-1.5 bg-white/[0.08] backdrop-blur-md rounded-full px-3 py-1 border border-white/[0.06]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2bc196] shadow-[0_0_8px_rgba(43,193,150,0.6)] animate-pulse" />
                    <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Live</span>
                  </div>
                </div>
                <p className="text-white/25 text-[13px] mt-2 font-medium tracking-wide">Business Intelligence • Visão Estratégica</p>
              </div>
            </div>
            
            {/* Counter pills */}
            <div className="flex flex-wrap gap-2">
              {counters.map((c, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-white/[0.05] backdrop-blur-md rounded-2xl px-4 py-3 border border-white/[0.04] hover:bg-white/[0.1] hover:border-white/[0.08] transition-all duration-400 cursor-default group">
                  <div className="w-2 h-2 rounded-full transition-shadow duration-400 group-hover:shadow-[0_0_8px]" style={{ backgroundColor: c.color, '--tw-shadow-color': c.color }} />
                  <span className="text-[10px] text-white/30 font-medium tracking-wide">{c.label}</span>
                  <span className="text-[14px] font-extrabold text-white tabular-nums">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ GROUPED TABS — PREMIUM NAV ═══ */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 p-2 shadow-[0_1px_3px_rgba(0,36,67,0.04)]">
        <div className="flex flex-wrap items-center gap-1">
          {TAB_GROUPS.map((group, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <div className="hidden md:block w-px h-6 bg-[#002443]/[0.06] mx-1" />}
              {group.tabs.map(tab => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all duration-400 whitespace-nowrap
                      ${isActive
                        ? 'bg-[#002443] text-white shadow-lg shadow-[#002443]/15'
                        : 'text-[#002443]/35 hover:text-[#002443]/70 hover:bg-[#002443]/[0.03]'
                      }`}
                  >
                    {isActive && <div className="absolute inset-x-2 -bottom-[2px] h-[2px] bg-[#2bc196] rounded-full" />}
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#2bc196]' : ''}`} />
                    {tab.label}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div className="min-h-[400px]">
        {activeTab === 'ai-insights' && <InsightsAISection leads={leads} proposals={proposals} cases={cases} complianceScores={complianceScores} merchants={merchants} />}
        {activeTab === 'tpv' && <InsightsTPVSection leads={leads} />}
        {activeTab === 'benchmark' && <InsightsBenchmarkSection leads={leads} proposals={proposals} />}
        {activeTab === 'mix' && <InsightsMixSection leads={leads} />}
        {activeTab === 'expected-rates' && <InsightsRatesSection leads={leads} />}
        {activeTab === 'proposal-rates' && <InsightsProposalRatesSection proposals={proposals} />}
        {activeTab === 'profitability' && <InsightsProfitabilitySection proposals={proposals} partners={partners} pixProposals={pixProposals} />}
        {activeTab === 'commercial' && <InsightsCommercialPerfSection leads={leads} proposals={proposals} pixProposals={pixProposals} />}
        {activeTab === 'funnel' && <InsightsFunnelSection leads={leads} proposals={proposals} cases={cases} />}
        {activeTab === 'profiles' && <InsightsLeadProfileSection leads={leads} />}
        {activeTab === 'operational' && <InsightsOperationalSection leads={leads} cases={cases} />}
        {activeTab === 'risk' && <InsightsRiskPortfolioSection leads={leads} complianceScores={complianceScores} cases={cases} />}
        {activeTab === 'introducers' && <InsightsIntroducerSection leads={leads} proposals={proposals} />}
        {activeTab === 'compliance' && <InsightsComplianceSection cases={cases} complianceScores={complianceScores} merchants={merchants} documents={documents} questionnaireResponses={questionnaireResponses} />}
        {activeTab === 'data-health' && <InsightsDataHealthSection leads={leads} />}
      </div>
    </div>
  );
}