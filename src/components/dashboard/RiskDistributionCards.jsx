import React from 'react';
import { Shield } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function RiskDistributionCards({ 
  lowRisk = 0, 
  mediumRisk = 0, 
  highRisk = 0, 
  criticalRisk = 0 
}) {
  const { t } = useTranslation();
  const categories = [
    { 
      label: t('chart.risk_low'), 
      value: lowRisk, 
      bgColor: 'bg-green-50', 
      barColor: 'bg-green-500',
      textColor: 'text-green-600'
    },
    { 
      label: t('chart.risk_medium'), 
      value: mediumRisk, 
      bgColor: 'bg-yellow-50', 
      barColor: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    { 
      label: t('chart.risk_high'), 
      value: highRisk, 
      bgColor: 'bg-orange-50', 
      barColor: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    { 
      label: t('chart.risk_critical'), 
      value: criticalRisk, 
      bgColor: 'bg-red-50', 
      barColor: 'bg-red-500',
      textColor: 'text-red-600'
    }
  ];

  const total = lowRisk + mediumRisk + highRisk + criticalRisk;
  const maxValue = Math.max(lowRisk, mediumRisk, highRisk, criticalRisk, 1);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-[var(--pagsmile-blue)]/70" />
        <h3 className="font-bold text-[var(--pagsmile-blue)]">{t('chart.risk_distribution')}</h3>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {categories.map((cat, index) => {
          const heightPercentage = total > 0 ? (cat.value / maxValue) * 100 : 0;
          
          return (
            <div key={index} className={`rounded-lg p-3 ${cat.bgColor} text-center`}>
              <div className="h-24 flex items-end justify-center mb-2">
                <div 
                  className={`w-8 rounded-t-lg ${cat.barColor} transition-all duration-500`}
                  style={{ height: `${Math.max(heightPercentage, 10)}%` }}
                />
              </div>
              <p className="text-xs text-[var(--pagsmile-blue)]/80 font-semibold mb-1">{cat.label}</p>
              <p className={`text-xl font-bold ${cat.textColor}`}>
                {cat.value.toLocaleString('pt-BR')}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}