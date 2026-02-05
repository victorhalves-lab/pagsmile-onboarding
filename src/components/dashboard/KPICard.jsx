import React from 'react';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

export default function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconBg = 'bg-slate-100', 
  iconColor = 'text-slate-600',
  trend,
  trendValue,
  trendLabel,
  className = '',
  size = 'default'
}) {
  const isPositiveTrend = trend === 'up';
  
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-[var(--pagsmile-blue)]/70 font-semibold mb-1">{title}</p>
          <p className={`font-bold text-[var(--pagsmile-blue)] ${size === 'large' ? 'text-3xl' : 'text-2xl'}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[var(--pagsmile-blue)]/70 font-medium mt-1">{subtitle}</p>
          )}
          {trendValue !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${
              isPositiveTrend ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositiveTrend ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{trendValue}</span>
              {trendLabel && <span className="text-[var(--pagsmile-blue)]/50">{trendLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconBg}`}>
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
  beforeLabel = 'Antes',
  afterLabel = 'Depois',
  improvement,
  improvementLabel,
  target,
  targetLabel,
  colorScheme = 'green'
}) {
  const colors = {
    green: {
      after: 'text-green-600',
      badge: 'bg-green-100 text-green-700',
      target: 'text-[var(--pagsmile-blue)]/70'
    },
    red: {
      after: 'text-red-600',
      badge: 'bg-red-100 text-red-700',
      target: 'text-[var(--pagsmile-blue)]/70'
    }
  };

  const scheme = colors[colorScheme] || colors.green;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-[var(--pagsmile-blue)]/70 font-semibold mb-3">{title}</p>
      
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="text-center">
          <p className="text-xs text-[var(--pagsmile-blue)]/50">{beforeLabel}</p>
          <p className="text-xl font-bold text-[var(--pagsmile-blue)]/50">{beforeValue}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-[var(--pagsmile-blue)]/40" />
        <div className="text-center">
          <p className="text-xs text-[var(--pagsmile-blue)]/50">{afterLabel}</p>
          <p className={`text-xl font-bold ${scheme.after}`}>{afterValue}</p>
        </div>
      </div>

      {improvement && (
        <div className={`text-center py-1.5 px-3 rounded-lg ${scheme.badge} text-xs font-medium`}>
          {improvement}
        </div>
      )}

      {improvementLabel && (
        <p className="text-xs text-[var(--pagsmile-blue)]/70 text-center mt-2">{improvementLabel}</p>
      )}

      {target && (
        <p className={`text-xs text-center mt-2 ${scheme.target}`}>
          ⊙ {targetLabel}: {target}
        </p>
      )}
    </div>
  );
}