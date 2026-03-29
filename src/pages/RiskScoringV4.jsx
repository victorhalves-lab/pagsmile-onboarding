import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Shield } from 'lucide-react';
import InsightsRiskScoringV4Section from '@/components/insights/InsightsRiskScoringV4Section';

export default function RiskScoringV4() {
  const { data: complianceScores = [], isLoading: loadingScores } = useQuery({
    queryKey: ['risk-v4-scores'],
    queryFn: () => base44.entities.ComplianceScore.list('-created_date', 500),
  });

  const { data: cases = [], isLoading: loadingCases } = useQuery({
    queryKey: ['risk-v4-cases'],
    queryFn: () => base44.entities.OnboardingCase.list('-created_date', 500),
  });

  const isLoading = loadingScores || loadingCases;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/10">
            <Shield className="w-6 h-6 text-[#5cf7cf]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Risk Scoring v4.0</h1>
            <p className="text-white/60 text-sm mt-1">Motor determinístico — 3 camadas, 60 variáveis, 10 bloqueios, 8 subfaixas</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
        </div>
      ) : (
        <InsightsRiskScoringV4Section complianceScores={complianceScores} cases={cases} />
      )}
    </div>
  );
}