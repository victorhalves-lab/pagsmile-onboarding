import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, TrendingUp, Clock, Users, DollarSign, Target } from 'lucide-react';
import moment from 'moment';

const STAGES_ORDER = [
  'questionario_preenchido', 'analisado_priscila', 'em_contato_comercial',
  'proposta_enviada', 'proposta_aceita', 'ativado'
];

export default function PipelineMetrics({ leads, activities }) {
  const metrics = useMemo(() => {
    const total = leads.length;
    const byStatus = {};
    leads.forEach(l => { byStatus[l.status] = (byStatus[l.status] || 0) + 1; });

    // Conversion rates between key stages
    const novos = (byStatus['questionario_preenchido'] || 0) + (byStatus['analisado_priscila'] || 0);
    const emContato = byStatus['em_contato_comercial'] || 0;
    const propostaEnviada = byStatus['proposta_enviada'] || 0;
    const propostaAceita = byStatus['proposta_aceita'] || 0;
    const ativados = byStatus['ativado'] || 0;
    const perdidos = (byStatus['perdido'] || 0) + (byStatus['proposta_recusada'] || 0);

    const convContato = novos > 0 ? ((emContato + propostaEnviada + propostaAceita + ativados) / (novos + emContato + propostaEnviada + propostaAceita + ativados) * 100) : 0;
    const convProposta = (emContato + propostaEnviada) > 0 ? ((propostaEnviada + propostaAceita + ativados) / (emContato + propostaEnviada + propostaAceita + ativados) * 100) : 0;
    const convAceite = propostaEnviada > 0 ? ((propostaAceita + ativados) / (propostaEnviada + propostaAceita + ativados) * 100) : 0;

    // Average score
    const scoredLeads = leads.filter(l => l.priscilaQualityScore != null);
    const avgScore = scoredLeads.length > 0 ? Math.round(scoredLeads.reduce((s, l) => s + l.priscilaQualityScore, 0) / scoredLeads.length) : 0;

    // TPV
    const totalTPV = leads.reduce((s, l) => s + (l.tpvMensal || 0), 0);
    const wonTPV = leads.filter(l => ['proposta_aceita', 'ativado'].includes(l.status)).reduce((s, l) => s + (l.tpvMensal || 0), 0);

    return {
      total, novos, emContato, propostaEnviada, propostaAceita, ativados, perdidos,
      convContato, convProposta, convAceite, avgScore, totalTPV, wonTPV
    };
  }, [leads]);

  return (
    <div className="space-y-3">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-[var(--pagsmile-blue)]/60">Total</span>
            </div>
            <p className="text-xl font-bold text-[var(--pagsmile-blue)] mt-1">{metrics.total}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-[var(--pagsmile-blue)]/60">Score médio</span>
            </div>
            <p className="text-xl font-bold text-[var(--pagsmile-blue)] mt-1">{metrics.avgScore}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-[var(--pagsmile-blue)]/60">→ Contato</span>
            </div>
            <p className="text-xl font-bold text-green-600 mt-1">{metrics.convContato.toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-[var(--pagsmile-blue)]/60">→ Proposta</span>
            </div>
            <p className="text-xl font-bold text-blue-600 mt-1">{metrics.convProposta.toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-[var(--pagsmile-blue)]/60">→ Aceite</span>
            </div>
            <p className="text-xl font-bold text-emerald-600 mt-1">{metrics.convAceite.toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[var(--pagsmile-green)]" />
              <span className="text-xs text-[var(--pagsmile-blue)]/60">TPV Ganho</span>
            </div>
            <p className="text-lg font-bold text-[var(--pagsmile-green)] mt-1">
              R$ {(metrics.wonTPV / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <div className="flex items-center gap-1 text-[10px]">
          <div className="flex-1 text-center py-1 rounded bg-blue-100 text-blue-700 font-medium">
            Novos: {metrics.novos}
          </div>
          <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
          <div className="flex-1 text-center py-1 rounded bg-amber-100 text-amber-700 font-medium">
            Contato: {metrics.emContato}
          </div>
          <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
          <div className="flex-1 text-center py-1 rounded bg-indigo-100 text-indigo-700 font-medium">
            Proposta: {metrics.propostaEnviada}
          </div>
          <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
          <div className="flex-1 text-center py-1 rounded bg-green-100 text-green-700 font-medium">
            Aceita: {metrics.propostaAceita}
          </div>
          <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
          <div className="flex-1 text-center py-1 rounded bg-emerald-100 text-emerald-700 font-medium">
            Ativado: {metrics.ativados}
          </div>
          <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
          <div className="flex-1 text-center py-1 rounded bg-red-100 text-red-700 font-medium">
            Perdido: {metrics.perdidos}
          </div>
        </div>
      </div>
    </div>
  );
}