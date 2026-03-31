import React from 'react';
import { Users, FileText, CheckCircle2, XCircle, TrendingUp, Clock, DollarSign, Shield } from 'lucide-react';

const KPI = ({ label, value, subtitle, icon: Icon, color, bgColor }) => (
  <div className="bg-white rounded-2xl border border-[#002443]/5 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-9 h-9 rounded-xl ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
    </div>
    <p className="text-2xl font-extrabold text-[#002443]">{value}</p>
    <p className="text-[10px] font-bold text-[#002443]/30 uppercase tracking-wider mt-1">{label}</p>
    {subtitle && <p className="text-[10px] text-[#002443]/40 mt-0.5">{subtitle}</p>}
  </div>
);

export default function CEOKPICards({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KPI label="Total Leads" value={stats.totalLeads} subtitle={`+${stats.leadsThisMonth} este mês`}
        icon={Users} color="text-[#002443]" bgColor="bg-[#002443]/5" />
      <KPI label="Propostas Enviadas" value={stats.proposalsSent} subtitle={`${stats.proposalsThisMonth} este mês`}
        icon={FileText} color="text-[#36706c]" bgColor="bg-[#36706c]/10" />
      <KPI label="Propostas Aceitas" value={stats.proposalsAccepted} subtitle={`Conversão: ${stats.proposalConversionRate}%`}
        icon={CheckCircle2} color="text-[#2bc196]" bgColor="bg-[#2bc196]/10" />
      <KPI label="Ativados" value={stats.leadsActivated} subtitle={`Taxa: ${stats.activationRate}%`}
        icon={TrendingUp} color="text-[#2bc196]" bgColor="bg-[#2bc196]/10" />
      <KPI label="TPV Pipeline" value={stats.tpvPipelineFormatted} subtitle="Leads ativos"
        icon={DollarSign} color="text-[#36706c]" bgColor="bg-[#36706c]/10" />
      <KPI label="Ticket Médio" value={stats.avgTicketFormatted} subtitle="Média dos leads"
        icon={DollarSign} color="text-[#002443]" bgColor="bg-[#002443]/5" />
      <KPI label="Tempo Médio Funil" value={stats.avgFunnelTime} subtitle="Até ativação"
        icon={Clock} color="text-yellow-600" bgColor="bg-yellow-50" />
      <KPI label="Leads Perdidos" value={stats.leadsLost} subtitle={`Taxa: ${stats.lossRate}%`}
        icon={XCircle} color="text-red-500" bgColor="bg-red-50" />
    </div>
  );
}