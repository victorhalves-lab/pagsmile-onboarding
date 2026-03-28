import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, BarChart3, TrendingUp, DollarSign, Users, CreditCard, ArrowUpDown, Target, Sparkles, Wallet, Activity } from 'lucide-react';
import InsightsTPVSection from '@/components/insights/InsightsTPVSection';
import InsightsRatesSection from '@/components/insights/InsightsRatesSection';
import InsightsProposalRatesSection from '@/components/insights/InsightsProposalRatesSection';
import InsightsFunnelSection from '@/components/insights/InsightsFunnelSection';
import InsightsLeadProfileSection from '@/components/insights/InsightsLeadProfileSection';
import InsightsComplianceSection from '@/components/insights/InsightsComplianceSection';
import InsightsAISection from '@/components/insights/InsightsAISection';
import InsightsProfitabilitySection from '@/components/insights/InsightsProfitabilitySection.jsx';

const TABS = [
  { id: 'ai-insights', label: 'IA Insights', icon: Sparkles },
  { id: 'tpv', label: 'TPV & Volume', icon: DollarSign },
  { id: 'expected-rates', label: 'Taxas Esperadas', icon: ArrowUpDown },
  { id: 'proposal-rates', label: 'Taxas Propostas', icon: CreditCard },
  { id: 'profitability', label: 'Rentabilidade', icon: Wallet },
  { id: 'funnel', label: 'Funil & Conversão', icon: TrendingUp },
  { id: 'profiles', label: 'Perfil Leads', icon: Users },
  { id: 'compliance', label: 'Compliance', icon: Target },
];

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2bc196] to-[#002443] flex items-center justify-center animate-pulse">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-[#2bc196] absolute -bottom-1 -right-1" />
        </div>
        <p className="text-sm text-[#002443]/40 font-medium">Carregando dados...</p>
      </div>
    );
  }

  const counters = [
    { label: 'Leads', value: leads.length, color: '#2bc196' },
    { label: 'Propostas', value: proposals.length, color: '#5cf7cf' },
    { label: 'Compliance', value: cases.length, color: '#36706c' },
    { label: 'Merchants', value: merchants.length, color: '#94a3b8' },
    { label: 'Parceiros', value: partners.length, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      {/* ═══ PREMIUM HEADER ═══ */}
      <div className="relative overflow-hidden rounded-3xl bg-[#002443] p-6 md:p-8">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2bc196]/8 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#5cf7cf]/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="absolute top-4 right-8 w-32 h-32 border border-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-12 right-16 w-20 h-20 border border-white/5 rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2bc196] to-[#5cf7cf] flex items-center justify-center shadow-lg shadow-[#2bc196]/20">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Dados & Insights</h1>
                  <div className="flex items-center gap-1 bg-[#2bc196]/20 rounded-full px-2.5 py-0.5">
                    <Activity className="w-3 h-3 text-[#5cf7cf]" />
                    <span className="text-[10px] font-bold text-[#5cf7cf]">LIVE</span>
                  </div>
                </div>
                <p className="text-white/30 text-sm mt-1 font-medium">Business Intelligence • Visão Estratégica</p>
              </div>
            </div>
            
            {/* Counter pills */}
            <div className="flex flex-wrap gap-2">
              {counters.map((c, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/[0.07] backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/[0.06] hover:bg-white/[0.12] transition-colors duration-200">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-[11px] text-white/40 font-medium">{c.label}</span>
                  <span className="text-sm font-extrabold text-white">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CUSTOM TABS ═══ */}
      <div className="bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm">
        <div className="flex flex-wrap gap-1">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-300 whitespace-nowrap
                  ${isActive
                    ? 'bg-[#2bc196] text-white shadow-md shadow-[#2bc196]/25 scale-[1.02]'
                    : 'text-[#002443]/40 hover:text-[#002443]/70 hover:bg-slate-50'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div className="min-h-[400px]">
        {activeTab === 'ai-insights' && <InsightsAISection leads={leads} proposals={proposals} cases={cases} complianceScores={complianceScores} merchants={merchants} />}
        {activeTab === 'tpv' && <InsightsTPVSection leads={leads} />}
        {activeTab === 'expected-rates' && <InsightsRatesSection leads={leads} />}
        {activeTab === 'proposal-rates' && <InsightsProposalRatesSection proposals={proposals} />}
        {activeTab === 'profitability' && <InsightsProfitabilitySection proposals={proposals} partners={partners} pixProposals={pixProposals} />}
        {activeTab === 'funnel' && <InsightsFunnelSection leads={leads} proposals={proposals} cases={cases} />}
        {activeTab === 'profiles' && <InsightsLeadProfileSection leads={leads} />}
        {activeTab === 'compliance' && <InsightsComplianceSection cases={cases} complianceScores={complianceScores} merchants={merchants} documents={documents} questionnaireResponses={questionnaireResponses} />}
      </div>
    </div>
  );
}