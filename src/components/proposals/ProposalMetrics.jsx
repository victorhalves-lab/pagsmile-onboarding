import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle, XCircle, Clock, DollarSign, TrendingUp } from 'lucide-react';
import moment from 'moment';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function ProposalMetrics({ propostas }) {
  const { t } = useTranslation();
  const metrics = useMemo(() => {
    const total = propostas.length;
    const byStatus = {};
    propostas.forEach(p => { byStatus[p.status] = (byStatus[p.status] || 0) + 1; });
    const aceitas = byStatus['aceita'] || 0;
    const recusadas = byStatus['recusada'] || 0;
    const enviadas = byStatus['enviada'] || 0;
    const visualizadas = byStatus['visualizada'] || 0;
    const rascunhos = byStatus['rascunho'] || 0;
    const expiradas = byStatus['expirada'] || 0;
    const sentTotal = aceitas + recusadas + enviadas + visualizadas + expiradas;
    const taxaAceite = sentTotal > 0 ? ((aceitas / sentTotal) * 100) : 0;
    const aceitasComDatas = propostas.filter(p => p.status === 'aceita' && p.sentDate && p.acceptedDate);
    const tempoMedioAceite = aceitasComDatas.length > 0
      ? Math.round(aceitasComDatas.reduce((s, p) => s + moment(p.acceptedDate).diff(moment(p.sentDate), 'days'), 0) / aceitasComDatas.length)
      : null;
    const revenueGanha = propostas.filter(p => p.status === 'aceita').reduce((s, p) => s + (p.estimatedRevenue || 0), 0);
    const expirando = propostas.filter(p => {
      if (!p.validUntil || !['enviada', 'visualizada'].includes(p.status)) return false;
      const diff = moment(p.validUntil).diff(moment(), 'days');
      return diff >= 0 && diff <= 3;
    }).length;
    return { total, rascunhos, aceitas, recusadas, expiradas, expirando, taxaAceite, tempoMedioAceite, revenueGanha };
  }, [propostas]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
      <Card className="rounded-2xl border-[#002443]/5 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#36706c]" />
            <span className="text-xs text-[var(--pagsmile-blue)]/60">{t('prop_metrics.total')}</span>
          </div>
          <p className="text-xl font-bold text-[var(--pagsmile-blue)] mt-1">{metrics.total}</p>
          <p className="text-[10px] text-[var(--pagsmile-blue)]/40">{t('prop_metrics.drafts', { count: metrics.rascunhos })}</p>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-[#002443]/5 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#2bc196]" />
            <span className="text-xs text-[var(--pagsmile-blue)]/60">{t('prop_metrics.acceptance_rate')}</span>
          </div>
          <p className="text-xl font-bold text-[#2bc196] mt-1">{metrics.taxaAceite.toFixed(0)}%</p>
          <p className="text-[10px] text-[var(--pagsmile-blue)]/40">{t('prop_metrics.accepted', { count: metrics.aceitas })}</p>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-[#002443]/5 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#36706c]" />
            <span className="text-xs text-[var(--pagsmile-blue)]/60">{t('prop_metrics.acceptance_time')}</span>
          </div>
          <p className="text-xl font-bold text-[#36706c] mt-1">
            {metrics.tempoMedioAceite != null ? `${metrics.tempoMedioAceite}d` : '-'}
          </p>
          <p className="text-[10px] text-[var(--pagsmile-blue)]/40">{t('prop_metrics.avg_days')}</p>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-[#002443]/5 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-[#2bc196]" />
            <span className="text-xs text-[var(--pagsmile-blue)]/60">{t('prop_metrics.revenue_won')}</span>
          </div>
          <p className="text-lg font-bold text-[var(--pagsmile-green)] mt-1">
            R$ {(metrics.revenueGanha / 1000).toFixed(0)}k
          </p>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-[#002443]/5 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-[var(--pagsmile-blue)]/60">{t('prop_metrics.rejected')}</span>
          </div>
          <p className="text-xl font-bold text-red-600 mt-1">{metrics.recusadas}</p>
          <p className="text-[10px] text-[var(--pagsmile-blue)]/40">{t('prop_metrics.expired', { count: metrics.expiradas })}</p>
        </CardContent>
      </Card>
      <Card className={`rounded-2xl border-[#002443]/5 shadow-sm hover:shadow-md transition-shadow ${metrics.expirando > 0 ? 'border-amber-300 bg-amber-50' : ''}`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-[var(--pagsmile-blue)]/60">{t('prop_metrics.expiring')}</span>
          </div>
          <p className={`text-xl font-bold mt-1 ${metrics.expirando > 0 ? 'text-amber-600' : 'text-[var(--pagsmile-blue)]'}`}>
            {metrics.expirando}
          </p>
          <p className="text-[10px] text-[var(--pagsmile-blue)]/40">{t('prop_metrics.next_3_days')}</p>
        </CardContent>
      </Card>
    </div>
  );
}