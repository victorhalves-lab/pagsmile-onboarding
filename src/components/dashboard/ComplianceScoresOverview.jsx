import React from 'react';
import { TrendingUp, Activity, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

function ScoreCard({ title, value, subtext, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex-1">
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-lg ${color.bg}`}>
          <Icon className={`w-5 h-5 ${color.text}`} />
        </div>
        {value !== undefined && (
          <span className={`text-2xl font-bold ${color.text}`}>{value}</span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)]">{title}</h3>
      <p className="text-xs text-[var(--pagsmile-blue)]/70 font-medium mt-1">{subtext}</p>
    </div>
  );
}

export default function ComplianceScoresOverview({ scores }) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ScoreCard title={t('chart.avg_sq')} value={scores.avgSQ} subtext={t('chart.sq_desc')} icon={Activity} color={{ bg: 'bg-blue-50', text: 'text-blue-600' }} />
      <ScoreCard title={t('chart.avg_sve')} value={scores.avgSVE} subtext={t('chart.sve_desc')} icon={ShieldCheck} color={{ bg: 'bg-purple-50', text: 'text-purple-600' }} />
      <ScoreCard title={t('chart.avg_sgc')} value={scores.avgSGC} subtext={t('chart.sgc_desc')} icon={ShieldAlert} color={{ bg: 'bg-slate-100', text: 'text-slate-800' }} />
    </div>
  );
}