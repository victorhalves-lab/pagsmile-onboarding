import React from 'react';
import { TrendingUp, TrendingDown, FileText, Clock, AlertTriangle } from 'lucide-react';

export default function CommercialQuickMetrics({ stats }) {
  const metrics = [
    {
      icon: TrendingUp,
      iconBg: 'bg-[#2bc196]/10',
      iconColor: 'text-[#2bc196]',
      label: 'Leads esta semana',
      value: stats.leadsThisWeek,
      sub: stats.leadsWeekTrend > 0 ? `+${stats.leadsWeekTrend} vs anterior` : stats.leadsWeekTrend < 0 ? `${stats.leadsWeekTrend} vs anterior` : 'mesmo que anterior'
    },
    {
      icon: FileText,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      label: 'Propostas este mês',
      value: stats.proposalsThisMonth
    },
    {
      icon: Clock,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      label: 'Leads parados (+7d)',
      value: stats.staleLeads,
      alert: stats.staleLeads > 0
    },
    {
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      label: 'Propostas expirando',
      value: stats.proposalsExpiring,
      alert: stats.proposalsExpiring > 0
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div key={index} className={`bg-white rounded-2xl border ${metric.alert ? 'border-amber-200' : 'border-[#002443]/5'} p-4 hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${metric.iconBg}`}>
                <Icon className={`w-4 h-4 ${metric.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-[#002443]/60 font-semibold">{metric.label}</p>
                <p className={`text-xl font-bold ${metric.alert ? 'text-amber-600' : 'text-[#002443]'}`}>{metric.value}</p>
                {metric.sub && <p className="text-[10px] text-[#002443]/40">{metric.sub}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}