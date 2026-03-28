import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconBg = 'bg-[#2bc196]/10', 
  iconColor = 'text-[#2bc196]',
  trend,
  trendValue,
  trendLabel,
  className = '',
}) {
  const isPositiveTrend = trend === 'up';
  
  return (
    <div className={`bg-white rounded-2xl border border-[#002443]/5 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-[#282828]/50 font-semibold uppercase tracking-wider mb-2">{title}</p>
          <p className="font-bold text-[#002443] text-3xl tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[#282828]/40 font-medium mt-1.5">{subtitle}</p>
          )}
          {trendValue !== undefined && (
            <div className={`flex items-center gap-1 mt-2.5 text-xs font-medium ${
              isPositiveTrend ? 'text-[#2bc196]' : 'text-red-500'
            }`}>
              {isPositiveTrend ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{trendValue}</span>
              {trendLabel && <span className="text-[#282828]/40">{trendLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
}

export function KPICardComparison({
  title,
  beforeValue,
  afterValue,
  beforeLabel,
  afterLabel,
  improvement,
  improvementLabel,
  target,
  targetLabel,
  colorScheme = 'green'
}) {
  const { t } = useTranslation();
  const resolvedBeforeLabel = beforeLabel || t('kpi.before');
  const resolvedAfterLabel = afterLabel || t('kpi.after');
  const colors = {
    green: { after: 'text-[#2bc196]', badge: 'bg-[#2bc196]/10 text-[#2bc196]' },
    blue: { after: 'text-[#002443]', badge: 'bg-[#002443]/10 text-[#002443]' },
    teal: { after: 'text-[#36706c]', badge: 'bg-[#36706c]/10 text-[#36706c]' },
  };
  const scheme = colors[colorScheme] || colors.green;

  return (
    <div className="bg-white rounded-2xl border border-[#002443]/5 p-5">
      <p className="text-xs text-[#282828]/50 font-semibold uppercase tracking-wider mb-3">{title}</p>
      <div className="flex items-center justify-center gap-4 mb-3">
        {beforeValue !== undefined && beforeValue !== null && (
          <>
            <div className="text-center">
              <p className="text-xs text-[#282828]/40">{resolvedBeforeLabel}</p>
              <p className="text-xl font-bold text-[#282828]/30">{beforeValue}</p>
            </div>
            <span className="text-[#282828]/20">→</span>
          </>
        )}
        <div className="text-center">
          {beforeValue !== undefined && beforeValue !== null && (
            <p className="text-xs text-[#282828]/40">{resolvedAfterLabel}</p>
          )}
          <p className={`text-2xl font-bold ${scheme.after}`}>{afterValue}</p>
        </div>
      </div>
      {improvement && (
        <div className={`text-center py-1.5 px-3 rounded-xl ${scheme.badge} text-xs font-semibold`}>
          {improvement}
        </div>
      )}
      {improvementLabel && (
        <p className="text-xs text-[#282828]/40 text-center mt-2">{improvementLabel}</p>
      )}
      {target && (
        <p className="text-xs text-[#282828]/40 text-center mt-2">
          ⊙ {targetLabel}: {target}
        </p>
      )}
    </div>
  );
}