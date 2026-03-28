import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, BarChart3, TrendingUp, DollarSign, Users, CreditCard, ArrowUpDown, Target, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InsightsTPVSection from '@/components/insights/InsightsTPVSection';
import InsightsRatesSection from '@/components/insights/InsightsRatesSection';
import InsightsProposalRatesSection from '@/components/insights/InsightsProposalRatesSection';
import InsightsFunnelSection from '@/components/insights/InsightsFunnelSection';
import InsightsLeadProfileSection from '@/components/insights/InsightsLeadProfileSection';
import InsightsComplianceSection from '@/components/insights/InsightsComplianceSection';
import InsightsAISection from '@/components/insights/InsightsAISection';

export default function DadosInsights() {
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

  const isLoading = loadingLeads || loadingProposals || loadingCases || loadingScores || loadingMerchants || loadingDocs || loadingResponses;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002443] via-[#002443] to-[#36706c] p-6 md:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#2bc196]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#2bc196]/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-[#5cf7cf]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Dados & Insights</h1>
              <p className="text-white/40 text-xs mt-0.5">Visão estratégica consolidada da operação</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Leads', value: leads.length },
              { label: 'Propostas', value: proposals.length },
              { label: 'Compliance', value: cases.length },
              { label: 'Merchants', value: merchants.length },
              { label: 'Documentos', value: documents.length },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
                <span className="text-white/50 text-[10px]">{item.label}</span>
                <span className="text-[#5cf7cf] text-xs font-bold ml-1.5">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ai-insights" className="w-full">
        <TabsList className="flex flex-wrap w-full h-auto bg-white border p-1 gap-0.5 rounded-xl">
          <TabsTrigger value="ai-insights" className="gap-1 text-[11px] py-2 px-3 rounded-lg">
            <Sparkles className="w-3.5 h-3.5" /> IA Insights
          </TabsTrigger>
          <TabsTrigger value="tpv" className="gap-1 text-[11px] py-2 px-3 rounded-lg">
            <DollarSign className="w-3.5 h-3.5" /> TPV & Volume
          </TabsTrigger>
          <TabsTrigger value="expected-rates" className="gap-1 text-[11px] py-2 px-3 rounded-lg">
            <ArrowUpDown className="w-3.5 h-3.5" /> Taxas Esperadas
          </TabsTrigger>
          <TabsTrigger value="proposal-rates" className="gap-1 text-[11px] py-2 px-3 rounded-lg">
            <CreditCard className="w-3.5 h-3.5" /> Taxas Propostas
          </TabsTrigger>
          <TabsTrigger value="funnel" className="gap-1 text-[11px] py-2 px-3 rounded-lg">
            <TrendingUp className="w-3.5 h-3.5" /> Funil
          </TabsTrigger>
          <TabsTrigger value="profiles" className="gap-1 text-[11px] py-2 px-3 rounded-lg">
            <Users className="w-3.5 h-3.5" /> Perfil Leads
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1 text-[11px] py-2 px-3 rounded-lg">
            <Target className="w-3.5 h-3.5" /> Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-insights">
          <InsightsAISection leads={leads} proposals={proposals} cases={cases} complianceScores={complianceScores} merchants={merchants} />
        </TabsContent>
        <TabsContent value="tpv">
          <InsightsTPVSection leads={leads} />
        </TabsContent>
        <TabsContent value="expected-rates">
          <InsightsRatesSection leads={leads} />
        </TabsContent>
        <TabsContent value="proposal-rates">
          <InsightsProposalRatesSection proposals={proposals} />
        </TabsContent>
        <TabsContent value="funnel">
          <InsightsFunnelSection leads={leads} proposals={proposals} cases={cases} />
        </TabsContent>
        <TabsContent value="profiles">
          <InsightsLeadProfileSection leads={leads} />
        </TabsContent>
        <TabsContent value="compliance">
          <InsightsComplianceSection cases={cases} complianceScores={complianceScores} merchants={merchants} documents={documents} questionnaireResponses={questionnaireResponses} />
        </TabsContent>
      </Tabs>
    </div>
  );
}