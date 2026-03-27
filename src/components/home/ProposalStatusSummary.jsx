import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, Clock } from 'lucide-react';
import moment from 'moment';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function ProposalStatusSummary({ proposals }) {
  const { t } = useTranslation();

  const STATUS_CONFIG = {
    rascunho: { label: t('proposals.status.draft'), color: 'bg-[#002443]/10 text-[#002443]' },
    enviada: { label: t('proposals.status.sent'), color: 'bg-[#36706c]/10 text-[#36706c]' },
    visualizada: { label: t('proposals.status.viewed'), color: 'bg-[#2bc196]/10 text-[#2bc196]' },
    aceita: { label: t('proposals.status.accepted'), color: 'bg-[#2bc196]/20 text-[#2bc196]' },
    recusada: { label: t('proposals.status.rejected'), color: 'bg-red-100 text-red-600' },
    contraproposta: { label: t('proposals.status.counter'), color: 'bg-amber-100 text-amber-700' },
    expirada: { label: t('proposals.status.expired'), color: 'bg-[#f4f4f4] text-[#282828]/40' },
    cancelada: { label: t('proposals.status.cancelled'), color: 'bg-[#f4f4f4] text-[#282828]/40' },
  };
  const metrics = useMemo(() => {
    const byStatus = {};
    Object.keys(STATUS_CONFIG).forEach(s => { byStatus[s] = 0; });
    proposals.forEach(p => { byStatus[p.status] = (byStatus[p.status] || 0) + 1; });

    const expiringSoon = proposals.filter(p => {
      if (!p.validUntil || ['aceita', 'recusada', 'expirada', 'cancelada'].includes(p.status)) return false;
      const daysLeft = moment(p.validUntil).diff(moment(), 'days');
      return daysLeft >= 0 && daysLeft <= 3;
    }).length;

    const acceptanceRate = proposals.length > 0
      ? ((byStatus.aceita / proposals.length) * 100).toFixed(0)
      : 0;

    return { byStatus, expiringSoon, acceptanceRate, total: proposals.length };
  }, [proposals]);

  const mainStatuses = ['rascunho', 'enviada', 'visualizada', 'aceita', 'recusada', 'contraproposta'];

  return (
    <Card className="rounded-2xl border-[#002443]/5 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 font-bold text-[#002443]">
            <div className="p-1.5 rounded-lg bg-[#2bc196]/10">
              <FileText className="w-3.5 h-3.5 text-[#2bc196]" />
            </div>
            {t('proposals.title')}
          </CardTitle>
          <Link to={createPageUrl('GestaoPropostas')}>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-[#2bc196] hover:text-[#002443] font-semibold">
              {t('proposals.view_all')} <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-xl bg-[#f4f4f4]">
            <p className="text-lg font-bold text-[#002443]">{metrics.total}</p>
            <p className="text-[10px] text-[#282828]/40 font-medium">{t('proposals.total')}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-[#2bc196]/5">
            <p className="text-lg font-bold text-[#2bc196]">{metrics.acceptanceRate}%</p>
            <p className="text-[10px] text-[#282828]/40 font-medium">{t('proposals.accepted')}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-[#f4f4f4]">
            <p className={`text-lg font-bold ${metrics.expiringSoon > 0 ? 'text-amber-600' : 'text-[#002443]'}`}>
              {metrics.expiringSoon}
            </p>
            <p className="text-[10px] text-[#282828]/40 font-medium">{t('proposals.expiring')}</p>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="space-y-2">
          {mainStatuses.map(status => (
            <div key={status} className="flex items-center justify-between py-1">
              <Badge className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold ${STATUS_CONFIG[status].color}`}>
                {STATUS_CONFIG[status].label}
              </Badge>
              <span className="text-sm font-bold text-[#002443]">{metrics.byStatus[status]}</span>
            </div>
          ))}
        </div>

        {/* Expiring alert */}
        {metrics.expiringSoon > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200/50">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[11px] text-amber-700 font-medium">
              {t('proposals.expiring_alert', { count: metrics.expiringSoon })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}