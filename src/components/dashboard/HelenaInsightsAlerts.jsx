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
      iconBg: 'bg-[#2bc196]/10',
      iconColor: 'text-[#2bc196]',
      message: `${staleLeads} leads comerciais parados há mais de 7 dias sem interação`,
      action: 'Ver Pipeline',
      actionLink: 'PipelineComercial',
      show: staleLeads > 0
    },
    {
      icon: Clock,
      iconBg: 'bg-[#002443]/10',
      iconColor: 'text-[#002443]',
      message: `${pendingManualOver24h} submissões aguardando análise manual há mais de 24h`,
      action: 'Ver fila',
      actionLink: 'QuestionariosRecebidos',
      show: pendingManualOver24h > 0
    },
    {
      icon: Target,
      iconBg: 'bg-[#2bc196]/10',
      iconColor: 'text-[#2bc196]',
      message: `Taxa de aprovação automática ${approvalRateTrend >= 0 ? 'aumentou' : 'diminuiu'} ${Math.abs(approvalRateTrend)}% esta semana`,
      action: 'Ver métricas',
      actionLink: 'HelenaIA',
      show: approvalRateTrend !== 0
    },
    {
      icon: AlertTriangle,
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-500',
      message: `${criticalScoresToday} merchants com score crítico detectados hoje`,
      action: 'Analisar',
      actionLink: 'QuestionariosRecebidos',
      show: criticalScoresToday > 0
    },
    {
      icon: Activity,
      iconBg: 'bg-[#36706c]/10',
      iconColor: 'text-[#36706c]',
      message: `Tempo médio de análise manual ${manualTimeTrend >= 0 ? 'reduziu' : 'aumentou'} ${Math.abs(manualTimeTrend)}%`,
      action: 'Detalhes',
      actionLink: 'HelenaIA',
      show: manualTimeTrend !== 0
    }
  ];

  const visibleAlerts = alerts.filter(a => a.show);

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#36706c] rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-white/10">
          <Brain className="w-5 h-5 text-[#5cf7cf]" />
        </div>
        <div>
          <h3 className="font-bold text-white text-sm">Helena Insights & Alertas</h3>
          <p className="text-[11px] text-white/50 font-medium">Alertas e recomendações em tempo real da IA</p>
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
                  <Icon className="w-4 h-4 text-[#5cf7cf]" />
                </div>
                <p className="text-sm text-white/80 font-medium">{alert.message}</p>
              </div>
              <Link 
                to={createPageUrl(alert.actionLink)}
                className="flex items-center gap-1 text-sm text-[#5cf7cf] hover:text-white font-semibold whitespace-nowrap ml-3"
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