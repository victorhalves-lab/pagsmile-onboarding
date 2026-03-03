import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, TrendingUp, Users, DollarSign, CheckCircle, XCircle, BarChart3 } from 'lucide-react';

const formatMoeda = (val) => {
  if (!val) return 'R$ 0';
  if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
  return `R$ ${val.toLocaleString('pt-BR')}`;
};

export default function PipelineMetrics({ leads }) {
  const metrics = useMemo(() => {
    const total = leads.length;
    const byStatus = {};
    leads.forEach(l => { byStatus[l.status] = (byStatus[l.status] || 0) + 1; });

    const ativados = byStatus['ativado'] || 0;
    const perdidos = (byStatus['perdido'] || 0) + (byStatus['proposta_recusada'] || 0);
    const conversionRate = total > 0 ? ((ativados / total) * 100).toFixed(1) : 0;

    const totalTPV = leads.reduce((s, l) => s + (l.tpvMensal || 0), 0);
    const receitaMensal = totalTPV * 0.025;

    return { total, ativados, perdidos, conversionRate, totalTPV, receitaMensal };
  }, [leads]);

  const kpis = [
    { label: 'Leads no Funil', value: metrics.total, icon: Users, iconColor: 'text-blue-500', valueColor: 'text-[var(--pagsmile-blue)]' },
    { label: '% Conversão', value: `${metrics.conversionRate}%`, icon: TrendingUp, iconColor: 'text-green-500', valueColor: 'text-green-600' },
    { label: 'TPV Mensal Estimado', value: formatMoeda(metrics.totalTPV), icon: DollarSign, iconColor: 'text-[var(--pagsmile-green)]', valueColor: 'text-[var(--pagsmile-blue)]' },
    { label: 'Receita Mensal (2,5%)', value: formatMoeda(metrics.receitaMensal), icon: BarChart3, iconColor: 'text-purple-500', valueColor: 'text-purple-600' },
    { label: 'Ganhos (Ativados)', value: metrics.ativados, icon: CheckCircle, iconColor: 'text-emerald-500', valueColor: 'text-emerald-600' },
    { label: 'Perdidos', value: metrics.perdidos, icon: XCircle, iconColor: 'text-red-500', valueColor: 'text-red-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.label} className="border-slate-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
                <span className="text-[10px] text-[var(--pagsmile-blue)]/60 leading-tight">{kpi.label}</span>
              </div>
              <p className={`text-xl font-bold mt-1 ${kpi.valueColor}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}