import React from 'react';
import { Zap, Clock, Target, FileText } from 'lucide-react';

export default function QuickMetricsCard({ 
  avgTimeIA = '0s',
  avgTimeManual = '0h',
  avgScore = 0,
  pendingDocs = 0
}) {
  const metrics = [
    {
      icon: Zap,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      label: 'Tempo Médio (IA)',
      value: avgTimeIA
    },
    {
      icon: Clock,
      iconBg: 'bg-slate-100',
      iconColor: 'text-[var(--pagsmile-blue)]/80',
      label: 'Tempo Médio (Manual)',
      value: avgTimeManual
    },
    {
      icon: Target,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      label: 'Score Médio Carteira',
      value: avgScore
    },
    {
      icon: FileText,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      label: 'Docs Pendentes',
      value: pendingDocs
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div key={index} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${metric.iconBg}`}>
                <Icon className={`w-4 h-4 ${metric.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-[var(--pagsmile-blue)]/70 font-semibold">{metric.label}</p>
                <p className="text-xl font-bold text-[var(--pagsmile-blue)]">{metric.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}