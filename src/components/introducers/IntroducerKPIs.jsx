import React from 'react';
import { Users, UserCheck, FileText, DollarSign, TrendingUp, Star } from 'lucide-react';

export default function IntroducerKPIs({ introducers, leads, proposals }) {
  const activeIntroducers = introducers.filter(i => i.status === 'active').length;
  const introducerLeads = leads.filter(l => l.introducerId);
  const totalLeads = introducerLeads.length;
  
  const proposalsFromIntroducers = proposals.filter(p => {
    const lead = leads.find(l => l.id === p.leadId && l.introducerId);
    return !!lead;
  });
  const acceptedProposals = proposalsFromIntroducers.filter(p => p.status === 'aceita');
  const totalVolume = acceptedProposals.reduce((sum, p) => sum + (p.estimatedRevenue || 0), 0);
  const conversionRate = totalLeads > 0 ? ((acceptedProposals.length / totalLeads) * 100).toFixed(1) : '0.0';

  // Score Médio PRISCILA
  const leadsWithScore = introducerLeads.filter(l => l.priscilaQualityScore != null);
  const avgScore = leadsWithScore.length > 0 
    ? (leadsWithScore.reduce((sum, l) => sum + l.priscilaQualityScore, 0) / leadsWithScore.length).toFixed(0) 
    : '-';

  const kpis = [
    { label: 'Introducers Ativos', value: activeIntroducers, icon: Users, color: '#0A0A0A' },
    { label: 'Leads Gerados', value: totalLeads, icon: UserCheck, color: '#1356E2' },
    { label: 'Propostas Aceitas', value: acceptedProposals.length, icon: FileText, color: '#E84B1C' },
    { label: 'Volume Fechado', value: `R$ ${totalVolume.toLocaleString('pt-BR')}`, icon: DollarSign, color: '#1356E2' },
    { label: 'Taxa de Conversão', value: `${conversionRate}%`, icon: TrendingUp, color: '#E84B1C' },
    { label: 'Score Médio PRISCILA', value: avgScore, icon: Star, color: '#0A0A0A' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi, i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
            <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
          <p className="text-[10px] text-[#0A0A0A]/40">{kpi.label}</p>
        </div>
      ))}
    </div>
  );
}