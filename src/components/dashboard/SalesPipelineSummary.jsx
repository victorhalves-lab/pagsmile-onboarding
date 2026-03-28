import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, ArrowRight, AlertTriangle } from 'lucide-react';
import moment from 'moment';
import { useTranslation } from '@/lib/i18n/LanguageContext';

function formatCompact(value) {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return `R$ ${value.toFixed(0)}`;
}

export default function SalesPipelineSummary({ leads, proposals = [] }) {
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
    }));

    // ── TPV TOTAL: sum tpvMensal from ALL leads (pipeline potential) ──
    const totalTPV = leads.reduce((s, l) => s + (l.tpvMensal || 0), 0);

    // ── ACCEPTED REVENUE: use proposals with status "aceita" ──
    // Get minimoGarantido.mes3 (steady-state monthly guaranteed) as the best proxy
    // Fallback chain: estimatedRevenue → minimoGarantido.mes3 → lead tpvMensal
    const currentProposals = proposals.filter(p => p.isCurrentVersion !== false);
    const acceptedProposals = currentProposals.filter(p => p.status === 'aceita');

    const closedRevenue = acceptedProposals.reduce((sum, p) => {
      // 1. estimatedRevenue if available
      if (p.estimatedRevenue > 0) return sum + p.estimatedRevenue;
      // 2. minimoGarantido.mes3 (steady state TPV commitment)
      const mg = p.rates?.minimoGarantido;
      if (mg?.mes3 > 0) return sum + mg.mes3;
      if (mg?.mes2 > 0) return sum + mg.mes2;
      if (mg?.mes1 > 0) return sum + mg.mes1;
      // 3. fallback to lead tpvMensal
      if (p.leadId) {
        const lead = leads.find(l => l.id === p.leadId);
        if (lead?.tpvMensal > 0) return sum + lead.tpvMensal;
      }
      return sum;
    }, 0);

    // ── PIPELINE REVENUE: proposals in open states ──
    const openStatuses = ['enviada', 'visualizada', 'contraproposta'];
    const pipelineRevenue = currentProposals
      .filter(p => openStatuses.includes(p.status))
      .reduce((sum, p) => {
        if (p.estimatedRevenue > 0) return sum + p.estimatedRevenue;
        const mg = p.rates?.minimoGarantido;
        if (mg?.mes3 > 0) return sum + mg.mes3;
        if (mg?.mes1 > 0) return sum + mg.mes1;
        if (p.leadId) {
          const lead = leads.find(l => l.id === p.leadId);
          if (lead?.tpvMensal > 0) return sum + lead.tpvMensal;
        }
        return sum;
      }, 0);

    const staleLeads = leads.filter(l => {
      if (['ativado', 'perdido'].includes(l.status)) return false;
      const lastDate = l.lastInteractionDate || l.updated_date || l.created_date;
      return moment().diff(moment(lastDate), 'days') > 7;
    }).length;

    // Conversion = accepted proposals / total current proposals (or leads if no proposals)
    const conversionBase = currentProposals.length > 0 ? currentProposals.length : leads.length;
    const conversionRate = conversionBase > 0 ? ((acceptedProposals.length / conversionBase) * 100).toFixed(1) : 0;

    return {
      stages,
      totalTPV,
      closedRevenue,
      pipelineRevenue,
      acceptedCount: acceptedProposals.length,
      staleLeads,
      conversionRate,
      total: leads.length,
    };
  }, [leads, proposals]);

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
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 rounded-xl bg-[#f4f4f4]">
            <p className="text-lg font-bold text-[#002443]">{metrics.total}</p>
            <p className="text-[10px] text-[#282828]/40 font-medium">{t('pipeline.leads')}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-[#2bc196]/5">
            <p className="text-lg font-bold text-[#2bc196]">
              {formatCompact(metrics.totalTPV)}
            </p>
            <p className="text-[10px] text-[#282828]/40 font-medium">TPV {t('pipeline.total_label')}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-emerald-50">
            <p className="text-lg font-bold text-emerald-600">
              {formatCompact(metrics.closedRevenue)}
            </p>
            <p className="text-[10px] text-[#282828]/40 font-medium">{t('pipeline.closed_revenue')}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-blue-50">
            <p className="text-lg font-bold text-blue-600">
              {formatCompact(metrics.pipelineRevenue)}
            </p>
            <p className="text-[10px] text-[#282828]/40 font-medium">{t('pipeline.pipeline_revenue')}</p>
          </div>
        </div>

        {/* Conversion + Stale */}
        <div className="grid grid-cols-2 gap-2">
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