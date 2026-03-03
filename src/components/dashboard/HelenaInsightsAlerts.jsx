import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { 
  Brain, Clock, TrendingUp, AlertTriangle, 
  ArrowRight, Activity, Target
} from 'lucide-react';

export default function HelenaInsightsAlerts({ 
  pendingManualOver24h = 0,
  approvalRateTrend = 0,
  criticalScoresToday = 0,
  manualTimeTrend = 0,
  staleLeads = 0
}) {
  const alerts = [
    {
      icon: Clock,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      message: `${staleLeads} leads comerciais parados há mais de 7 dias sem interação`,
      action: 'Ver Pipeline',
      actionLink: 'PipelineComercial',
      show: staleLeads > 0
    },
    {
      icon: Clock,
      iconBg: 'bg-slate-100',
      iconColor: 'text-[var(--pagsmile-blue)]/80',
      message: `${pendingManualOver24h} submissões aguardando análise manual há mais de 24h`,
      action: 'Ver fila',
      actionLink: 'ComplianceSubmissions',
      show: pendingManualOver24h > 0
    },
    {
      icon: Target,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      message: `Taxa de aprovação automática ${approvalRateTrend >= 0 ? 'aumentou' : 'diminuiu'} ${Math.abs(approvalRateTrend)}% esta semana`,
      action: 'Ver métricas',
      actionLink: 'AdminHelenaIA',
      show: approvalRateTrend !== 0
    },
    {
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      message: `${criticalScoresToday} merchants com score crítico detectados hoje`,
      action: 'Analisar',
      actionLink: 'ComplianceSubmissions',
      show: criticalScoresToday > 0
    },
    {
      icon: Activity,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      message: `Tempo médio de análise manual ${manualTimeTrend >= 0 ? 'reduziu' : 'aumentou'} ${Math.abs(manualTimeTrend)}%`,
      action: 'Detalhes',
      actionLink: 'AdminHelenaIA',
      show: manualTimeTrend !== 0
    }
  ];

  const visibleAlerts = alerts.filter(a => a.show);

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-purple-100">
          <Brain className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-bold text-[var(--pagsmile-blue)]">Helena Insights & Alertas</h3>
          <p className="text-xs text-[var(--pagsmile-blue)]/70 font-medium">Alertas e recomendações em tempo real da IA</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visibleAlerts.map((alert, index) => {
          const Icon = alert.icon;
          return (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${alert.iconBg}`}>
                  <Icon className={`w-4 h-4 ${alert.iconColor}`} />
                </div>
                <p className="text-sm text-[var(--pagsmile-blue)]/80 font-medium">{alert.message}</p>
              </div>
              <Link 
                to={createPageUrl(alert.actionLink)}
                className="flex items-center gap-1 text-sm text-[var(--pagsmile-blue)]/70 hover:text-[var(--pagsmile-blue)] font-medium whitespace-nowrap"
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