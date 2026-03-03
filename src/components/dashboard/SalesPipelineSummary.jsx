import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, TrendingUp, ArrowRight, AlertTriangle } from 'lucide-react';
import moment from 'moment';

const FUNNEL_STAGES = [
  { key: 'leads', label: 'Leads (Completo)', statuses: ['questionario_preenchido', 'analisado_priscila'], color: '#6B7280' },
  { key: 'contato', label: 'Contato + Simpl.', statuses: ['em_contato_comercial'], color: '#F59E0B' },
  { key: 'proposta', label: 'Proposta', statuses: ['proposta_enviada'], color: '#3B82F6' },
  { key: 'aceita', label: 'Aceita', statuses: ['proposta_aceita'], color: '#8B5CF6' },
  { key: 'kyc', label: 'KYC', statuses: ['kyc_iniciado', 'kyc_aprovado', 'kyc_revisao_manual'], color: '#10B981' },
  { key: 'ativado', label: 'Ativado', statuses: ['ativado'], color: '#059669' },
];

export default function SalesPipelineSummary({ leads }) {
  const metrics = useMemo(() => {
    const stages = FUNNEL_STAGES.map(stage => ({
      ...stage,
      count: leads.filter(l => stage.statuses.includes(l.status)).length,
      tpv: leads.filter(l => stage.statuses.includes(l.status)).reduce((s, l) => s + (l.tpvMensal || 0), 0)
    }));

    const totalTPV = leads.reduce((s, l) => s + (l.tpvMensal || 0), 0);
    const avgScore = leads.filter(l => l.priscilaQualityScore).length > 0
      ? Math.round(leads.filter(l => l.priscilaQualityScore).reduce((s, l) => s + l.priscilaQualityScore, 0) / leads.filter(l => l.priscilaQualityScore).length)
      : 0;

    // Leads parados há mais de 7 dias
    const staleLeads = leads.filter(l => {
      if (['ativado', 'perdido'].includes(l.status)) return false;
      const lastDate = l.lastInteractionDate || l.updated_date || l.created_date;
      return moment().diff(moment(lastDate), 'days') > 7;
    }).length;

    // Conversão geral
    const ativos = leads.filter(l => l.status === 'ativado').length;
    const conversionRate = leads.length > 0 ? ((ativos / leads.length) * 100).toFixed(1) : 0;

    return { stages, totalTPV, avgScore, staleLeads, conversionRate, total: leads.length };
  }, [leads]);

  const maxCount = Math.max(...metrics.stages.map(s => s.count), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[var(--pagsmile-green)]" />
            Pipeline de Vendas
          </CardTitle>
          <Link to={createPageUrl('PipelineComercial')}>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-[var(--pagsmile-green)]">
              Ver Pipeline <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold text-[var(--pagsmile-blue)]">{metrics.total}</p>
            <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Leads</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[var(--pagsmile-green)]">
              R$ {(metrics.totalTPV / 1000000).toFixed(1)}M
            </p>
            <p className="text-[10px] text-[var(--pagsmile-blue)]/50">TPV Total</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600">{metrics.conversionRate}%</p>
            <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Conversão</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${metrics.staleLeads > 0 ? 'text-amber-600' : 'text-[var(--pagsmile-blue)]'}`}>
              {metrics.staleLeads}
            </p>
            <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Parados 7d+</p>
          </div>
        </div>

        {/* Funnel bars */}
        <div className="space-y-2">
          {metrics.stages.map(stage => (
            <div key={stage.key} className="flex items-center gap-2">
              <span className="text-[10px] w-16 text-right text-[var(--pagsmile-blue)]/60 shrink-0">{stage.label}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-5 relative overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 flex items-center"
                  style={{
                    width: `${Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 8 : 0)}%`,
                    backgroundColor: stage.color
                  }}
                />
              </div>
              <span className="text-xs font-bold w-6 text-[var(--pagsmile-blue)]">{stage.count}</span>
            </div>
          ))}
        </div>

        {/* Alert for stale leads */}
        {metrics.staleLeads > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-700">
              {metrics.staleLeads} lead{metrics.staleLeads > 1 ? 's' : ''} sem interação há mais de 7 dias
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}