import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, ArrowRight, AlertTriangle } from 'lucide-react';
import moment from 'moment';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function SalesPipelineSummary({ leads }) {
  const { t } = useTranslation();

  const FUNNEL_STAGES = [
    { key: 'leads', label: t('pipeline.leads'), statuses: ['questionario_preenchido', 'analisado_priscila'], color: '#002443' },
    { key: 'contato', label: t('pipeline.contact'), statuses: ['em_contato_comercial'], color: '#36706c' },
    { key: 'proposta', label: t('pipeline.proposal'), statuses: ['proposta_enviada'], color: '#3B82F6' },
    { key: 'aceita', label: t('pipeline.accepted'), statuses: ['proposta_aceita'], color: '#8B5CF6' },
    { key: 'compliance', label: t('pipeline.compliance'), statuses: ['kyc_iniciado', 'kyc_aprovado', 'kyc_revisao_manual'], color: '#10B981' },
    { key: 'fechado', label: t('pipeline.closed'), statuses: ['ativado'], color: '#059669' },
  ];
  const metrics = useMemo(() => {
    const stages = FUNNEL_STAGES.map(stage => ({
      ...stage,
      count: leads.filter(l => stage.statuses.includes(l.status)).length,
      tpv: leads.filter(l => stage.statuses.includes(l.status)).reduce((s, l) => s + (l.tpvMensal || 0), 0)
    }));

    const totalTPV = leads.reduce((s, l) => s + (l.tpvMensal || 0), 0);

    const staleLeads = leads.filter(l => {
      if (['ativado', 'perdido'].includes(l.status)) return false;
      const lastDate = l.lastInteractionDate || l.updated_date || l.created_date;
      return moment().diff(moment(lastDate), 'days') > 7;
    }).length;

    const fechados = leads.filter(l => l.status === 'ativado').length;
    const conversionRate = leads.length > 0 ? ((fechados / leads.length) * 100).toFixed(1) : 0;

    return { stages, totalTPV, staleLeads, conversionRate, total: leads.length };
  }, [leads]);

  const maxCount = Math.max(...metrics.stages.map(s => s.count), 1);

  return (
    <Card className="rounded-2xl border-[#002443]/5 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 font-bold text-[#002443]">
            <div className="p-1.5 rounded-lg bg-[#002443]/10">
              <DollarSign className="w-3.5 h-3.5 text-[#002443]" />
            </div>
            {t('pipeline.title')}
          </CardTitle>
          <Link to={createPageUrl('PipelineComercial')}>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-[#2bc196] hover:text-[#002443] font-semibold">
              {t('pipeline.view')} <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded-xl bg-[#f4f4f4]">
            <p className="text-lg font-bold text-[#002443]">{metrics.total}</p>
            <p className="text-[10px] text-[#282828]/40 font-medium">{t('pipeline.leads')}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-[#2bc196]/5">
            <p className="text-lg font-bold text-[#2bc196]">
              R$ {(metrics.totalTPV / 1000000).toFixed(1)}M
            </p>
            <p className="text-[10px] text-[#282828]/40 font-medium">{t('pipeline.tpv')}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-[#f4f4f4]">
            <p className="text-lg font-bold text-[#36706c]">{metrics.conversionRate}%</p>
            <p className="text-[10px] text-[#282828]/40 font-medium">{t('pipeline.conversion')}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-[#f4f4f4]">
            <p className={`text-lg font-bold ${metrics.staleLeads > 0 ? 'text-amber-600' : 'text-[#002443]'}`}>
              {metrics.staleLeads}
            </p>
            <p className="text-[10px] text-[#282828]/40 font-medium">{t('pipeline.stale')}</p>
          </div>
        </div>

        {/* Funnel bars */}
        <div className="space-y-2.5">
          {metrics.stages.map(stage => (
            <div key={stage.key} className="flex items-center gap-2.5">
              <span className="text-[10px] w-14 text-right text-[#282828]/40 shrink-0 font-medium">{stage.label}</span>
              <div className="flex-1 bg-[#f4f4f4] rounded-full h-5 relative overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 10 : 0)}%`,
                    backgroundColor: stage.color
                  }}
                />
              </div>
              <span className="text-xs font-bold w-6 text-[#002443]">{stage.count}</span>
            </div>
          ))}
        </div>

        {/* Alert for stale leads */}
        {metrics.staleLeads > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200/50">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[11px] text-amber-700 font-medium">
              {t('pipeline.stale_alert', { count: metrics.staleLeads })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}