import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Shield, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import InsightsRiskScoringV4Section from '@/components/insights/InsightsRiskScoringV4Section';

export default function RiskScoringV4() {
  const queryClient = useQueryClient();
  const [revalidating, setRevalidating] = useState(false);
  const [revalResult, setRevalResult] = useState(null);

  const { data: complianceScores = [], isLoading: loadingScores } = useQuery({
    queryKey: ['risk-v4-scores'],
    queryFn: () => base44.entities.ComplianceScore.list('-created_date', 500),
  });

  const { data: cases = [], isLoading: loadingCases } = useQuery({
    queryKey: ['risk-v4-cases'],
    queryFn: () => base44.entities.OnboardingCase.list('-created_date', 500),
  });

  const isLoading = loadingScores || loadingCases;

  const handleRevalidate = async (dryRun = false) => {
    setRevalidating(true);
    setRevalResult(null);
    try {
      const res = await base44.functions.invoke('revalidateRiskScoring', { dryRun });
      setRevalResult(res.data);
      if (!dryRun) {
        queryClient.invalidateQueries({ queryKey: ['risk-v4-scores'] });
        queryClient.invalidateQueries({ queryKey: ['risk-v4-cases'] });
      }
    } catch (err) {
      setRevalResult({ error: err.message });
    } finally {
      setRevalidating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <Shield className="w-6 h-6 text-[#5cf7cf]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Risk Scoring</h1>
              <p className="text-white/60 text-sm mt-1">Motor determinístico — 3 camadas, 60 variáveis, 10 bloqueios, 8 subfaixas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRevalidate(true)}
              disabled={revalidating}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
            >
              {revalidating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
              Simular
            </Button>
            <Button
              size="sm"
              onClick={() => handleRevalidate(false)}
              disabled={revalidating}
              className="bg-[#2bc196] hover:bg-[#2bc196]/80 text-white text-xs"
            >
              {revalidating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
              Revalidar Todos
            </Button>
          </div>
        </div>
      </div>

      {/* Resultado da revalidação */}
      {revalResult && (
        <Card className={revalResult.error ? 'border-red-200 bg-red-50' : 'border-[#2bc196]/30 bg-[#2bc196]/5'}>
          <CardContent className="p-4">
            {revalResult.error ? (
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Erro: {revalResult.error}</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2bc196]" />
                  <span className="text-sm font-bold text-[#002443]">
                    {revalResult.dryRun ? 'Simulação concluída' : 'Revalidação concluída'}
                  </span>
                  {revalResult.dryRun && <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">SIMULAÇÃO — nada foi alterado</Badge>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: 'Total Casos', value: revalResult.summary?.totalCases },
                    { label: 'Processados', value: revalResult.summary?.processed },
                    { label: 'Scores Atualizados', value: revalResult.summary?.scoresUpdated },
                    { label: 'Scores Criados', value: revalResult.summary?.scoresCreated },
                    { label: 'Erros', value: revalResult.summary?.errors, isError: true },
                  ].map((item, i) => (
                    <div key={i} className="bg-white rounded-lg p-3 border border-slate-100 text-center">
                      <p className="text-xl font-bold text-[#002443]" style={item.isError && item.value > 0 ? { color: '#ef4444' } : {}}>{item.value ?? 0}</p>
                      <p className="text-[10px] text-[#002443]/50 font-medium">{item.label}</p>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setRevalResult(null)} className="text-xs text-[#002443]/50">
                  Fechar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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