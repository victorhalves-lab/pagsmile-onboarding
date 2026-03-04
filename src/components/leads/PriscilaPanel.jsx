import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ShieldCheck, CheckCircle2, AlertTriangle, XCircle,
  RefreshCw, Loader2, Shield, TrendingUp, Banknote,
  Settings2, Scale, Eye, CreditCard, ChevronDown, ChevronRight, FileText, Zap
} from 'lucide-react';
import { toast } from 'sonner';

const RISK_CONFIG = {
  BAIXO: { label: 'Baixo', color: 'bg-emerald-100 text-emerald-700', barColor: '[&>div]:bg-emerald-500' },
  MEDIO: { label: 'Médio', color: 'bg-amber-100 text-amber-700', barColor: '[&>div]:bg-amber-500' },
  ALTO: { label: 'Alto', color: 'bg-orange-100 text-orange-700', barColor: '[&>div]:bg-orange-500' },
  CRITICO: { label: 'Crítico', color: 'bg-red-100 text-red-700', barColor: '[&>div]:bg-red-500' },
};

const DECISION_CONFIG = {
  AUTO_APROVAR: { label: 'Auto-Aprovar', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  AUTO_COM_FLAG: { label: 'Aprovar c/ Flag', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  REVISAO_MANUAL: { label: 'Revisão Manual', color: 'bg-orange-100 text-orange-700', icon: Eye },
  REJEITAR: { label: 'Rejeitar', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const DIM_ICONS = {
  riscoCadastral: Shield,
  riscoFinanceiro: Banknote,
  riscoOperacional: Settings2,
  riscoPLD: Scale,
  riscoReputacional: Eye,
};

const DIM_LABELS = {
  riscoCadastral: 'Risco Cadastral',
  riscoFinanceiro: 'Risco Financeiro',
  riscoOperacional: 'Risco Operacional',
  riscoPLD: 'Risco PLD/AML',
  riscoReputacional: 'Risco Reputacional',
};

function DimensionRow({ name, data }) {
  const Icon = DIM_ICONS[name] || Shield;
  const label = DIM_LABELS[name] || name;
  const score = data?.score || 0;

  const getColor = (s) => {
    if (s >= 80) return 'text-emerald-600';
    if (s >= 60) return 'text-amber-600';
    if (s >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBarColor = (s) => {
    if (s >= 80) return '[&>div]:bg-emerald-500';
    if (s >= 60) return '[&>div]:bg-amber-500';
    if (s >= 40) return '[&>div]:bg-orange-500';
    return '[&>div]:bg-red-500';
  };

  return (
    <div className="p-4 rounded-xl border border-[#002443]/5 bg-[#f4f4f4]/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#002443]/50" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className={`text-lg font-bold ${getColor(score)}`}>{score}/100</span>
      </div>
      <Progress value={score} className={`h-2 ${getBarColor(score)}`} />
      {data?.detalhes && (
        <p className="text-xs text-[#002443]/60 mt-2 leading-relaxed">{data.detalhes}</p>
      )}
      {data?.flags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.flags.map((f, i) => (
            <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 border-red-200 text-red-600">{f}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}

const SEV_COLORS = {
  BAIXA: 'text-blue-600',
  MEDIA: 'text-amber-600',
  ALTA: 'text-orange-600',
  CRITICA: 'text-red-600',
};

export default function PriscilaPanel({ lead, leadId }) {
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: () => base44.functions.invoke('analyzePriscila', { leadId: lead.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId || lead.id] });
      toast.success('Análise PRISCILA concluída!');
    },
    onError: (err) => {
      toast.error(`Erro na análise: ${err.message}`);
    }
  });

  const report = lead.priscilaAnalysisReport;

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            Relatório PRISCILA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ShieldCheck className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/20 mb-3" />
            <p className="text-[var(--pagsmile-blue)]/60 mb-4">Análise PRISCILA ainda não disponível</p>
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {analyzeMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analisando...</>
              ) : (
                <><ShieldCheck className="w-4 h-4 mr-2" /> Executar Análise PRISCILA</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const riskCfg = RISK_CONFIG[report.riskLevel] || RISK_CONFIG.MEDIO;
  const decCfg = DECISION_CONFIG[report.decisionPath] || DECISION_CONFIG.REVISAO_MANUAL;
  const DecIcon = decCfg.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            Relatório PRISCILA
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="h-7"
          >
            {analyzeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Header */}
        <div className="flex items-center gap-6 p-4 rounded-xl bg-gradient-to-r from-purple-900 to-purple-600">
          <div className="text-center">
            <p className="text-4xl font-bold text-white">{report.score}</p>
            <p className="text-xs text-white/50">/100</p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${riskCfg.color} gap-1`}>
                Risco {riskCfg.label}
              </Badge>
              <Badge className={`${decCfg.color} gap-1`}>
                <DecIcon className="w-3 h-3" />
                {decCfg.label}
              </Badge>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{report.resumoExecutivo}</p>
          </div>
        </div>

        {/* Dimensões */}
        {report.dimensoes && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Dimensões de Risco</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(report.dimensoes).map(([key, data]) => (
                <DimensionRow key={key} name={key} data={data} />
              ))}
            </div>
          </div>
        )}

        {/* Pontos Fortes */}
        {report.pontosFortes?.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-green-700 mb-2 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Pontos Fortes</h4>
            <ul className="space-y-1">
              {report.pontosFortes.map((p, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  {p.descricao || p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pontos de Atenção */}
        {report.pontosDeAtencao?.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-amber-700 mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Pontos de Atenção</h4>
            <ul className="space-y-1">
              {report.pontosDeAtencao.map((p, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  {p.descricao || p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pontos de Risco */}
        {report.pontosDeRisco?.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-red-700 mb-2 flex items-center gap-1"><XCircle className="w-4 h-4" /> Pontos de Risco</h4>
            <ul className="space-y-1.5">
              {report.pontosDeRisco.map((p, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <span>{p.descricao || p}</span>
                    {p.severidade && (
                      <Badge variant="outline" className={`ml-2 text-[10px] px-1.5 py-0 ${SEV_COLORS[p.severidade] || ''}`}>
                        {p.severidade}
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recomendação */}
        {report.recomendacao && (
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
            <h4 className="text-sm font-semibold text-[#002443] mb-2 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-purple-600" /> Recomendação PRISCILA
            </h4>
            <p className="text-sm text-[#002443]/80 leading-relaxed">{report.recomendacao}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}