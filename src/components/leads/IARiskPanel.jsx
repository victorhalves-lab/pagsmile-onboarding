import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Brain, Shield, TrendingUp, Target, Zap,
  RefreshCw, Loader2, CheckCircle2, AlertTriangle,
  ArrowRight, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

const DECISION_CONFIG = {
  AUTO_APROVAR: { label: 'Aprovar', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  REVISAO_MANUAL: { label: 'Revisão Manual', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  REJEITAR: { label: 'Rejeitar', color: 'bg-red-100 text-red-700', icon: Shield },
  PENDENTE: { label: 'Pendente', color: 'bg-slate-100 text-slate-500', icon: Clock },
};

const PRIORITY_CONFIG = {
  URGENTE: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
  ALTA: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  MEDIA: { label: 'Média', color: 'bg-blue-100 text-blue-700' },
  BAIXA: { label: 'Baixa', color: 'bg-slate-100 text-slate-500' },
};

export default function IARiskPanel({ lead }) {
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: () => base44.functions.invoke('analyzeLeadRiskAdvanced', { leadId: lead.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', lead.id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Análise de Risco IA concluída!');
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const hasAnalysis = lead.iaRiskScore != null && lead.iaDecision && lead.iaDecision !== 'PENDENTE';
  const decision = DECISION_CONFIG[lead.iaDecision] || DECISION_CONFIG.PENDENTE;
  const priority = PRIORITY_CONFIG[lead.iaPriority] || PRIORITY_CONFIG.MEDIA;
  const DecisionIcon = decision.icon;

  if (!hasAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#002443]" />
            Análise de Risco IA Avançada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="w-12 h-12 mx-auto text-[#002443]/20 mb-3" />
            <p className="text-[#002443]/60 mb-1">Análise de risco ainda não realizada</p>
            <p className="text-[10px] text-[#002443]/40 mb-4">Usa IA avançada para score de risco, prioridade e sugestões</p>
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="bg-[#002443] hover:bg-[#002443]/90 text-white"
            >
              {analyzeMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analisando...</>
              ) : (
                <><Shield className="w-4 h-4 mr-2" /> Executar Análise de Risco</>
              )}
            </Button>
            <p className="text-[9px] text-[#002443]/30 mt-2">Usa modelo avançado (consome mais créditos)</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const scoreColor = lead.iaRiskScore >= 75 ? 'text-green-600' : lead.iaRiskScore >= 50 ? 'text-amber-600' : 'text-red-600';
  const progressColor = lead.iaRiskScore >= 75 ? '[&>div]:bg-green-500' : lead.iaRiskScore >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#002443]" />
            Análise de Risco IA Avançada
          </CardTitle>
          <div className="flex items-center gap-2">
            {lead.iaAnalysisDate && (
              <span className="text-[10px] text-[#002443]/40">{moment(lead.iaAnalysisDate).format('DD/MM/YY HH:mm')}</span>
            )}
            <Button variant="ghost" size="sm" onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending} className="h-7">
              {analyzeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Score + Decision + Priority */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[#002443] to-[#36706c]">
          <div className="text-center">
            <p className="text-4xl font-bold text-white">{lead.iaRiskScore}</p>
            <p className="text-xs text-white/50">/100</p>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <Badge className={`${decision.color} gap-1`}>
                <DecisionIcon className="w-3 h-3" /> {decision.label}
              </Badge>
              <Badge className={`${priority.color} gap-1`}>
                <Zap className="w-3 h-3" /> {priority.label}
              </Badge>
            </div>
            {lead.iaAnalysisReport && (
              <p className="text-sm text-white/80 leading-relaxed line-clamp-2">{lead.iaAnalysisReport}</p>
            )}
          </div>
        </div>

        {/* Sugestões para o Vendedor */}
        {lead.iaSuggestions?.length > 0 && (
          <div className="p-4 rounded-xl bg-[#2bc196]/5 border border-[#2bc196]/20">
            <h4 className="text-sm font-bold text-[#002443] mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#2bc196]" /> Sugestões para o Vendedor
            </h4>
            <ul className="space-y-2">
              {lead.iaSuggestions.map((s, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-[#2bc196] mt-0.5 shrink-0" />
                  <span className="text-[#002443]/80">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}