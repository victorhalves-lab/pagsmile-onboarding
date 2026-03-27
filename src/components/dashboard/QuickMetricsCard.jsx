import React from 'react';
import { Zap, Clock, Target, FileText } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function QuickMetricsCard({ 
  avgTimeIA = '0s',
  avgTimeManual = '0h',
  avgScore = 0,
  pendingDocs = 0
}) {
  const { t } = useTranslation();
  const metrics = [
    { icon: Zap, iconBg: 'bg-[#2bc196]/10', iconColor: 'text-[#2bc196]', label: t('quick_metrics.avg_time_ia'), value: avgTimeIA },
    { icon: Clock, iconBg: 'bg-[#002443]/10', iconColor: 'text-[#002443]', label: t('quick_metrics.avg_time_manual'), value: avgTimeManual },
    { icon: Target, iconBg: 'bg-[#36706c]/10', iconColor: 'text-[#36706c]', label: t('quick_metrics.avg_score'), value: avgScore },
    { icon: FileText, iconBg: 'bg-[#5cf7cf]/10', iconColor: 'text-[#36706c]', label: t('quick_metrics.pending_docs'), value: pendingDocs }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div key={index} className="bg-white rounded-2xl border border-[#002443]/5 p-4 hover:shadow-md transition-shadow">
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