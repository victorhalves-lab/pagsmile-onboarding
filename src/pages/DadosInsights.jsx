import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, BarChart3, TrendingUp, DollarSign, Users, CreditCard, ArrowUpDown, Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InsightsTPVSection from '@/components/insights/InsightsTPVSection';
import InsightsRatesSection from '@/components/insights/InsightsRatesSection';
import InsightsProposalRatesSection from '@/components/insights/InsightsProposalRatesSection';
import InsightsFunnelSection from '@/components/insights/InsightsFunnelSection';
import InsightsLeadProfileSection from '@/components/insights/InsightsLeadProfileSection';
import InsightsComplianceSection from '@/components/insights/InsightsComplianceSection';

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002443] via-[#002443] to-[#36706c] p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#2bc196]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-[#5cf7cf]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Dados & Insights</h1>
              <p className="text-white/50 text-sm mt-1">
                Visão estratégica consolidada dos dados de leads, propostas e compliance
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
              <span className="text-white/60 text-xs">Leads:</span>
              <span className="text-[#5cf7cf] text-xs font-bold ml-1">{leads.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
              <span className="text-white/60 text-xs">Propostas:</span>
              <span className="text-[#5cf7cf] text-xs font-bold ml-1">{proposals.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
              <span className="text-white/60 text-xs">Casos Compliance:</span>
              <span className="text-[#5cf7cf] text-xs font-bold ml-1">{cases.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tpv" className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full h-auto bg-white border">
          <TabsTrigger value="tpv" className="gap-1.5 text-xs py-2.5">
            <DollarSign className="w-3.5 h-3.5" /> TPV & Volume
          </TabsTrigger>
          <TabsTrigger value="expected-rates" className="gap-1.5 text-xs py-2.5">
            <ArrowUpDown className="w-3.5 h-3.5" /> Taxas Esperadas
          </TabsTrigger>
          <TabsTrigger value="proposal-rates" className="gap-1.5 text-xs py-2.5">
            <CreditCard className="w-3.5 h-3.5" /> Taxas Propostas
          </TabsTrigger>
          <TabsTrigger value="funnel" className="gap-1.5 text-xs py-2.5">
            <TrendingUp className="w-3.5 h-3.5" /> Funil & Conversão
          </TabsTrigger>
          <TabsTrigger value="profiles" className="gap-1.5 text-xs py-2.5">
            <Users className="w-3.5 h-3.5" /> Perfil dos Leads
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1.5 text-xs py-2.5">
            <Target className="w-3.5 h-3.5" /> Compliance
          </TabsTrigger>
        </TabsList>

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