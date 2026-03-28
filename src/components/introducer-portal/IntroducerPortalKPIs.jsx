import React from 'react';
import { Users, FileCheck, DollarSign, TrendingUp, Clock, Star } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function IntroducerPortalKPIs({ leads, proposals }) {
  const { t } = useTranslation();
  const totalLeads = leads.length;
  const leadsAtivos = leads.filter(l => !['perdido', 'ativado'].includes(l.status)).length;
  const leadsConvertidos = leads.filter(l => l.status === 'ativado').length;

  const myProposals = proposals.filter(p => {
    const leadIds = leads.map(l => l.id);
    return leadIds.includes(p.leadId);
  });
  const propostasAceitas = myProposals.filter(p => p.status === 'aceita').length;
  const volumeFechado = myProposals
    .filter(p => p.status === 'aceita')
    .reduce((sum, p) => sum + (p.estimatedRevenue || 0), 0);
  
  const conversionRate = totalLeads > 0 ? ((leadsConvertidos / totalLeads) * 100).toFixed(1) : '0.0';

  const leadsWithScore = leads.filter(l => l.leadQualifierScore != null);
  const avgScore = leadsWithScore.length > 0
    ? Math.round(leadsWithScore.reduce((s, l) => s + l.leadQualifierScore, 0) / leadsWithScore.length)
    : null;

  const kpis = [
    { label: t('idash.leads_referred'), value: totalLeads, icon: Users, color: '#002443' },
    { label: t('idash.in_progress'), value: leadsAtivos, icon: Clock, color: '#36706c' },
    { label: t('idash.converted'), value: leadsConvertidos, icon: FileCheck, color: '#2bc196' },
    { label: t('idash.proposals_accepted'), value: propostasAceitas, icon: FileCheck, color: '#36706c' },
    { label: t('idash.volume'), value: volumeFechado > 0 ? `R$ ${volumeFechado.toLocaleString()}` : '-', icon: DollarSign, color: '#2bc196' },
    { label: t('idash.conversion'), value: `${conversionRate}%`, icon: TrendingUp, color: '#002443' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi, i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#002443]/5 p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
            <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
          <p className="text-[10px] text-[#002443]/40">{kpi.label}</p>
        </div>
      ))}
    </div>
  );
}