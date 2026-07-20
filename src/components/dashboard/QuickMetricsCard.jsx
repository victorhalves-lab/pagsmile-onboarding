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
    { icon: Zap, iconBg: 'bg-[#1356E2]/10', iconColor: 'text-[#1356E2]', label: t('quick_metrics.avg_time_ia'), value: avgTimeIA },
    { icon: Clock, iconBg: 'bg-[#0A0A0A]/10', iconColor: 'text-[#0A0A0A]', label: t('quick_metrics.avg_time_manual'), value: avgTimeManual },
    { icon: Target, iconBg: 'bg-[#E84B1C]/10', iconColor: 'text-[#E84B1C]', label: t('quick_metrics.avg_score'), value: avgScore },
    { icon: FileText, iconBg: 'bg-[#1356E2]/10', iconColor: 'text-[#1356E2]', label: t('quick_metrics.pending_docs'), value: pendingDocs }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div key={index} className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${metric.iconBg}`}>
                <Icon className={`w-4 h-4 ${metric.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-[#0A0A0A]/60 font-semibold">{metric.label}</p>
                <p className="text-xl font-bold text-[#1356E2]">{metric.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}