import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { 
  AlertTriangle, Clock, FileText, RefreshCw, 
  ArrowRight, Zap, Shield
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function ActionableInsightsCard({ 
  manualReviewCount = 0,
  pendingDocs = 0,
  overdueRevalidations = 0,
  pendingManualOver24h = 0,
  criticalScoresToday = 0
}) {
  const { t } = useTranslation();
  const insights = [
    { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', message: t('insights.manual_review', { count: manualReviewCount }), link: 'QuestionariosRecebidos', linkText: t('insights.manual_review_link'), show: manualReviewCount > 0 },
    { icon: Clock, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', message: t('insights.stalled_24h', { count: pendingManualOver24h }), link: 'QuestionariosRecebidos', linkText: t('insights.stalled_24h_link'), show: pendingManualOver24h > 0 },
    { icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20', message: t('insights.pending_docs', { count: pendingDocs }), link: 'GestaoDocumentos', linkText: t('insights.pending_docs_link'), show: pendingDocs > 0 },
    { icon: RefreshCw, color: 'text-red-600', bg: 'bg-red-600/10 border-red-600/20', message: t('insights.overdue_reval', { count: overdueRevalidations }), link: 'GestaoRevalidacao', linkText: t('insights.overdue_reval_link'), show: overdueRevalidations > 0 },
    { icon: Shield, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', message: t('insights.critical_score', { count: criticalScoresToday }), link: 'QuestionariosRecebidos', linkText: t('insights.critical_score_link'), show: criticalScoresToday > 0 },
  ];

  const visible = insights.filter(i => i.show);

  if (visible.length === 0) {
    return (
      <div className="bg-gradient-to-r from-[#1356E2]/10 to-[#E84B1C]/10 rounded-2xl border border-[#1356E2]/20 p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#1356E2]/10">
            <Zap className="w-5 h-5 text-[#1356E2]" />
          </div>
          <div>
            <h3 className="font-bold text-[#0A0A0A] text-sm">{t('insights.all_clear')}</h3>
            <p className="text-xs text-[#0A0A0A]/50">{t('insights.all_clear_desc')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#0A0A0A] to-[#E84B1C] rounded-2xl p-5 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-white/10">
          <Zap className="w-5 h-5 text-[#E84B1C]" />
        </div>
        <div>
          <h3 className="font-bold text-white text-sm">{t('insights.actions_needed')}</h3>
          <p className="text-[11px] text-white/50">{t('insights.items_count', { count: visible.length })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {visible.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <Link
              key={i}
              to={createPageUrl(insight.link)}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/5 hover:bg-white/20 transition-all group"
            >
              <div className="p-1.5 rounded-lg bg-white/10">
                <Icon className="w-4 h-4 text-[#E84B1C]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/80 font-medium truncate">{insight.message}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#E84B1C] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}