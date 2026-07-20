import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import {
  Brain, TrendingUp, TrendingDown, Target, Activity, Sparkles, ArrowRight
} from 'lucide-react';

export default function CommercialInsights({ stats, leads }) {
  // Compute insights from data
  const now = new Date();
  const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const lastWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);

  const leadsThisWeek = leads.filter(l => new Date(l.created_date) >= thisWeekStart).length;
  const leadsLastWeek = leads.filter(l => {
    const d = new Date(l.created_date);
    return d >= lastWeekStart && d < thisWeekStart;
  }).length;
  const weekTrend = leadsThisWeek - leadsLastWeek;

  // Average qualifier score trend
  const recentLeads = leads.filter(l => new Date(l.created_date) >= thisWeekStart && l.leadQualifierScore > 0);
  const olderLeads = leads.filter(l => {
    const d = new Date(l.created_date);
    return d >= lastWeekStart && d < thisWeekStart && l.leadQualifierScore > 0;
  });
  const avgRecent = recentLeads.length > 0 ? Math.round(recentLeads.reduce((s, l) => s + l.leadQualifierScore, 0) / recentLeads.length) : 0;
  const avgOlder = olderLeads.length > 0 ? Math.round(olderLeads.reduce((s, l) => s + l.leadQualifierScore, 0) / olderLeads.length) : 0;
  const scoreTrend = avgRecent - avgOlder;

  // High-value leads (TPV > 100k) not yet contacted
  const highValueUntouched = leads.filter(l =>
    l.tpvMensal >= 100000 &&
    l.status === 'questionario_preenchido'
  ).length;

  const alerts = [
    {
      icon: weekTrend >= 0 ? TrendingUp : TrendingDown,
      message: weekTrend >= 0
        ? `Volume de leads subiu ${weekTrend} esta semana`
        : `Volume de leads caiu ${Math.abs(weekTrend)} esta semana`,
      action: 'Ver leads',
      actionLink: 'PipelineComercial',
      show: weekTrend !== 0,
    },
    {
      icon: Target,
      message: scoreTrend >= 0
        ? `Score médio dos leads subiu ${scoreTrend} pts esta semana`
        : `Score médio dos leads caiu ${Math.abs(scoreTrend)} pts esta semana`,
      action: 'Ver métricas',
      actionLink: 'DadosInsights',
      show: scoreTrend !== 0 && avgRecent > 0,
    },
    {
      icon: Sparkles,
      message: `${highValueUntouched} lead(s) com TPV >R$ 100K aguardando contato`,
      action: 'Priorizar',
      actionLink: 'PipelineComercial',
      show: highValueUntouched > 0,
    },
    {
      icon: Activity,
      message: `Taxa de conversão atual: ${stats.proposalConversionRate}%`,
      action: 'Detalhes',
      actionLink: 'GestaoPropostas',
      show: parseFloat(stats.proposalConversionRate) > 0,
    },
  ];

  const visibleAlerts = alerts.filter(a => a.show);

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="bg-[#0A0A0A] rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-white/10">
          <Brain className="w-5 h-5 text-[#E84B1C]" />
        </div>
        <div>
          <h3 className="font-bold text-white text-sm">Insights Comerciais IA</h3>
          <p className="text-[11px] text-white/50 font-medium">Tendências e oportunidades detectadas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visibleAlerts.map((alert, index) => {
          const Icon = alert.icon;
          return (
            <div
              key={index}
              className="flex items-center justify-between p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/5 hover:bg-white/15 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10">
                  <Icon className="w-4 h-4 text-[#E84B1C]" />
                </div>
                <p className="text-sm text-white/80 font-medium">{alert.message}</p>
              </div>
              <Link
                to={createPageUrl(alert.actionLink)}
                className="flex items-center gap-1 text-sm text-[#E84B1C] hover:text-white font-semibold whitespace-nowrap ml-3"
              >
                {alert.action}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}