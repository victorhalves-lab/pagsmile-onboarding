import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Star, TrendingUp, Minus, TrendingDown, XCircle, Clock,
  CheckCircle2, AlertTriangle, HelpCircle, RefreshCw, Loader2,
  Brain, Target, FileCheck, BarChart3, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

const LEVEL_CONFIG = {
  EXCELENTE: { label: 'Excelente', color: 'bg-emerald-100 text-emerald-700', textColor: 'text-emerald-600', icon: Star },
  BOM: { label: 'Bom', color: 'bg-green-100 text-green-700', textColor: 'text-green-600', icon: TrendingUp },
  REGULAR: { label: 'Regular', color: 'bg-amber-100 text-amber-700', textColor: 'text-amber-600', icon: Minus },
  FRACO: { label: 'Fraco', color: 'bg-orange-100 text-orange-700', textColor: 'text-orange-600', icon: TrendingDown },
  INSUFICIENTE: { label: 'Insuficiente', color: 'bg-red-100 text-red-700', textColor: 'text-red-600', icon: XCircle },
};

const DIMENSION_ICONS = {
  completude: FileCheck,
  qualidade: Star,
  potencialComercial: BarChart3,
  coerencia: Target,
  prontidao: Zap,
};

const DIMENSION_LABELS = {
  completude: 'Completude',
  qualidade: 'Qualidade das Respostas',
  potencialComercial: 'Potencial Comercial',
  coerencia: 'Coerência dos Dados',
  prontidao: 'Prontidão',
};

const DIMENSION_MAX = {
  completude: 20,
  qualidade: 20,
  potencialComercial: 25,
  coerencia: 20,
  prontidao: 15,
};

function DimensionCard({ name, data }) {
  const Icon = DIMENSION_ICONS[name] || FileCheck;
  const label = DIMENSION_LABELS[name] || name;
  const max = DIMENSION_MAX[name] || 20;
  const score = data?.score || 0;
  const pct = Math.round((score / max) * 100);
  
  const getColor = (p) => {
    if (p >= 80) return 'text-emerald-600';
    if (p >= 60) return 'text-green-600';
    if (p >= 40) return 'text-amber-600';
    if (p >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColor = (p) => {
    if (p >= 80) return '[&>div]:bg-emerald-500';
    if (p >= 60) return '[&>div]:bg-green-500';
    if (p >= 40) return '[&>div]:bg-amber-500';
    if (p >= 20) return '[&>div]:bg-orange-500';
    return '[&>div]:bg-red-500';
  };

  return (
    <div className="p-4 rounded-xl border border-[#0A0A0A]/5 bg-[#f4f4f4]/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#0A0A0A]/50" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className={`text-lg font-bold ${getColor(pct)}`}>{score}/{max}</span>
      </div>
      <Progress value={pct} className={`h-2 ${getProgressColor(pct)}`} />
      {data?.detalhes && (
        <p className="text-xs text-[#0A0A0A]/60 mt-2 leading-relaxed">{data.detalhes}</p>
      )}
      {data?.camposFaltantes?.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] font-medium text-red-600 mb-1">Campos faltantes:</p>
          <div className="flex flex-wrap gap-1">
            {data.camposFaltantes.map((c, i) => (
              <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 border-red-200 text-red-600">{c}</Badge>
            ))}
          </div>
        </div>
      )}
      {data?.inconsistencias?.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] font-medium text-amber-600 mb-1">Inconsistências:</p>
          {data.inconsistencias.map((c, i) => (
            <p key={i} className="text-[10px] text-amber-700 flex items-start gap-1"><AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />{c}</p>
          ))}
        </div>
      )}
      {data?.destaquesPositivos?.length > 0 && (
        <div className="mt-2">
          {data.destaquesPositivos.map((c, i) => (
            <p key={i} className="text-[10px] text-green-700 flex items-start gap-1"><CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />{c}</p>
          ))}
        </div>
      )}
      {data?.destaquesNegativos?.length > 0 && (
        <div className="mt-2">
          {data.destaquesNegativos.map((c, i) => (
            <p key={i} className="text-[10px] text-orange-700 flex items-start gap-1"><AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />{c}</p>
          ))}
        </div>
      )}
      {data?.sinaisPositivos?.length > 0 && (
        <div className="mt-2">
          {data.sinaisPositivos.map((c, i) => (
            <p key={i} className="text-[10px] text-green-700 flex items-start gap-1"><CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />{c}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LeadQualifierPanel({ lead }) {
  const queryClient = useQueryClient();
  
  const analyzeMutation = useMutation({
    mutationFn: () => base44.functions.invoke('analyzeLeadQualifier', { leadId: lead.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', lead.id] });
      toast.success('Análise Lead Qualifier concluída!');
    },
    onError: (err) => {
      toast.error(`Erro na análise: ${err.message}`);
    }
  });

  const report = lead.leadQualifierReport;
  const score = lead.leadQualifierScore;
  const level = lead.leadQualifierLevel || 'PENDENTE';
  const levelCfg = LEVEL_CONFIG[level];

  if (!report || !score) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#1356E2]" />
            Lead Qualifier IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto text-[#0A0A0A]/20 mb-3" />
            <p className="text-[#0A0A0A]/60 mb-4">Análise Lead Qualifier ainda não realizada</p>
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white"
            >
              {analyzeMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analisando...</>
              ) : (
                <><Brain className="w-4 h-4 mr-2" /> Executar Análise IA</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const LevelIcon = levelCfg?.icon || Clock;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#1356E2]" />
            Lead Qualifier IA
          </CardTitle>
          <div className="flex items-center gap-2">
            {lead.leadQualifierDate && (
              <span className="text-[10px] text-[#0A0A0A]/40">
                {moment(lead.leadQualifierDate).format('DD/MM/YY HH:mm')}
              </span>
            )}
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
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Header */}
        <div className="flex items-center gap-6 p-4 rounded-xl bg-gradient-to-r from-[#0A0A0A] to-[#E84B1C]">
          <div className="text-center">
            <p className="text-4xl font-bold text-white">{score}</p>
            <p className="text-xs text-white/50">/100</p>
          </div>
          <div className="flex-1">
            <Badge className={`${levelCfg?.color || 'bg-slate-100'} gap-1 mb-1`}>
              <LevelIcon className="w-3 h-3" />
              {levelCfg?.label || level}
            </Badge>
            <p className="text-sm text-white/80 leading-relaxed">{report.resumoExecutivo}</p>
          </div>
        </div>

        {/* Dimensões */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Dimensões da Avaliação</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.dimensoes && Object.entries(report.dimensoes).map(([key, data]) => (
              <DimensionCard key={key} name={key} data={data} />
            ))}
          </div>
        </div>

        {/* Pontos Fortes */}
        {report.pontosFortes?.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Pontos Fortes</h4>
            <ul className="space-y-1.5">
              {report.pontosFortes.map((p, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pontos de Atenção */}
        {report.pontosDeAtencao?.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Pontos de Atenção</h4>
            <ul className="space-y-1.5">
              {report.pontosDeAtencao.map((p, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recomendação Comercial */}
        {report.recomendacaoComercial && (
          <div className="p-4 rounded-xl bg-[#1356E2]/5 border border-[#1356E2]/20">
            <h4 className="text-sm font-semibold text-[#0A0A0A] mb-2 flex items-center gap-1"><Target className="w-4 h-4 text-[#1356E2]" /> Recomendação Comercial</h4>
            <p className="text-sm text-[#0A0A0A]/80 leading-relaxed">{report.recomendacaoComercial}</p>
          </div>
        )}

        {/* Perguntas Sugeridas */}
        {report.perguntasSugeridas?.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><HelpCircle className="w-4 h-4 text-blue-500" /> Perguntas Sugeridas para o Comercial</h4>
            <ol className="space-y-1.5 list-decimal list-inside">
              {report.perguntasSugeridas.map((p, i) => (
                <li key={i} className="text-sm text-[#0A0A0A]/80">{p}</li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}