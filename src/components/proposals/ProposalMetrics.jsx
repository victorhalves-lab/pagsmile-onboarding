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
    const aceitasComDatas = propostas.filter(p => p.status === 'aceita' && p.acceptedDate);
    const tempoMedioAceite = aceitasComDatas.length > 0
      ? Math.round(aceitasComDatas.reduce((s, p) => {
          const startDate = p.sentDate || p.created_date;
          return s + moment(p.acceptedDate).diff(moment(startDate), 'days');
        }, 0) / aceitasComDatas.length)
      : null;
    const aceitasList = propostas.filter(p => p.status === 'aceita');
    const revenueGanha = aceitasList.reduce((s, p) => {
      if (p.estimatedRevenue) return s + p.estimatedRevenue;
      // Fallback: estimate from rates if TPV info available from lead data
      const tpv = p.profitabilityDetails?.tpvBase || 0;
      const margin = p.profitabilityDetails?.margemPercentual || 0;
      if (tpv > 0 && margin > 0) return s + (tpv * margin / 100);
      // Last resort: use estimatedMargin
      if (p.estimatedMargin) return s + p.estimatedMargin;
      return s;
    }, 0);
    const expirando = propostas.filter(p => {
      if (!p.validUntil || !['enviada', 'visualizada'].includes(p.status)) return false;
      const diff = moment(p.validUntil).diff(moment(), 'days');
      return diff >= 0 && diff <= 3;
    }).length;
    return { total, rascunhos, aceitas, recusadas, expiradas, expirando, taxaAceite, tempoMedioAceite, revenueGanha };
  }, [propostas]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
      <Card className="rounded-2xl border-[#0A0A0A]/5 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#E84B1C]" />
            <span className="text-xs text-[var(--pinbank-blue)]/60">{t('prop_metrics.total')}</span>
          </div>
          <p className="text-xl font-bold text-[var(--pinbank-blue)] mt-1">{metrics.total}</p>
          <p className="text-[10px] text-[var(--pinbank-blue)]/40">{t('prop_metrics.drafts', { count: metrics.rascunhos })}</p>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-[#0A0A0A]/5 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#1356E2]" />
            <span className="text-xs text-[var(--pinbank-blue)]/60">{t('prop_metrics.acceptance_rate')}</span>
          </div>
          <p className="text-xl font-bold text-[#1356E2] mt-1">{metrics.taxaAceite.toFixed(0)}%</p>
          <p className="text-[10px] text-[var(--pinbank-blue)]/40">{t('prop_metrics.accepted', { count: metrics.aceitas })}</p>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-[#0A0A0A]/5 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#E84B1C]" />
            <span className="text-xs text-[var(--pinbank-blue)]/60">{t('prop_metrics.acceptance_time')}</span>
          </div>
          <p className="text-xl font-bold text-[#E84B1C] mt-1">
            {metrics.tempoMedioAceite != null ? `${metrics.tempoMedioAceite}d` : '-'}
          </p>
          <p className="text-[10px] text-[var(--pinbank-blue)]/40">{t('prop_metrics.avg_days')}</p>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-[#0A0A0A]/5 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-[#1356E2]" />
            <span className="text-xs text-[var(--pinbank-blue)]/60">{t('prop_metrics.revenue_won')}</span>
          </div>
          <p className="text-lg font-bold text-[var(--pinbank-blue)] mt-1">
            R$ {(metrics.revenueGanha / 1000).toFixed(0)}k
          </p>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-[#0A0A0A]/5 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-[var(--pinbank-blue)]/60">{t('prop_metrics.rejected')}</span>
          </div>
          <p className="text-xl font-bold text-red-600 mt-1">{metrics.recusadas}</p>
          <p className="text-[10px] text-[var(--pinbank-blue)]/40">{t('prop_metrics.expired', { count: metrics.expiradas })}</p>
        </CardContent>
      </Card>
      <Card className={`rounded-2xl border-[#0A0A0A]/5 shadow-sm hover:shadow-md transition-shadow ${metrics.expirando > 0 ? 'border-amber-300 bg-amber-50' : ''}`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-[var(--pinbank-blue)]/60">{t('prop_metrics.expiring')}</span>
          </div>
          <p className={`text-xl font-bold mt-1 ${metrics.expirando > 0 ? 'text-amber-600' : 'text-[var(--pinbank-blue)]'}`}>
            {metrics.expirando}
          </p>
          <p className="text-[10px] text-[var(--pinbank-blue)]/40">{t('prop_metrics.next_3_days')}</p>
        </CardContent>
      </Card>
    </div>
  );
}