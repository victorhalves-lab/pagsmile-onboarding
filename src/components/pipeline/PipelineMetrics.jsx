import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, DollarSign, CheckCircle, XCircle, BarChart3, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

const formatMoeda = (val) => {
  if (!val) return 'R$ 0';
  if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
  return `R$ ${val.toLocaleString('pt-BR')}`;
};

export default function PipelineMetrics({ leads, contracts = [], proposals = [] }) {
  const { t } = useTranslation();
  const metrics = useMemo(() => {
    const total = leads.length;
    const byStatus = {};
    leads.forEach(l => { byStatus[l.status] = (byStatus[l.status] || 0) + 1; });
    const contratosGerados = byStatus['ativado'] || 0;
    const perdidos = (byStatus['perdido'] || 0) + (byStatus['proposta_recusada'] || 0);
    const conversionRate = total > 0 ? ((contratosGerados / total) * 100).toFixed(1) : 0;
    const totalTPV = leads.reduce((s, l) => s + (l.tpvMensal || 0), 0);
    const tpvFechados = leads.filter(l => l.status === 'ativado').reduce((s, l) => s + (l.tpvMensal || 0), 0);
    const receitaFechados = tpvFechados * 0.025;
    return { total, contratosGerados, perdidos, conversionRate, totalTPV, receitaFechados };
  }, [leads]);

  const kpis = [
    { label: t('pipe_metrics.leads_in_funnel'), value: metrics.total, icon: Users, iconColor: 'text-blue-500', valueColor: 'text-[var(--pagsmile-blue)]' },
    { label: t('pipe_metrics.conversion_pct'), value: `${metrics.conversionRate}%`, icon: TrendingUp, iconColor: 'text-green-500', valueColor: 'text-green-600' },
    { label: t('pipe_metrics.total_tpv'), value: formatMoeda(metrics.totalTPV), icon: DollarSign, iconColor: 'text-[var(--pagsmile-green)]', valueColor: 'text-[var(--pagsmile-blue)]' },
    { label: t('pipe_metrics.closed_revenue'), value: formatMoeda(metrics.receitaFechados), icon: BarChart3, iconColor: 'text-purple-500', valueColor: 'text-purple-600' },
    { label: t('pipe_metrics.deals_closed'), value: metrics.contratosGerados, icon: CheckCircle, iconColor: 'text-emerald-500', valueColor: 'text-emerald-600' },
    { label: t('pipe_metrics.lost'), value: metrics.perdidos, icon: XCircle, iconColor: 'text-red-500', valueColor: 'text-red-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.label} className="rounded-2xl border-[#002443]/5 shadow-sm hover:shadow-md transition-shadow">
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