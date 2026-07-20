import React from 'react';
import KPICard, { KPICardComparison } from '../dashboard/KPICard';
import { Users, FileText, CheckCircle2, XCircle } from 'lucide-react';

export default function CommercialKPIs({ stats }) {
  return (
    <div className="space-y-4">
      {/* Row 1 — Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total de Leads"
          value={stats.totalLeads.toLocaleString('pt-BR')}
          subtitle={`${stats.leadsThisWeek} novos esta semana`}
          icon={Users}
          iconBg="bg-[#0A0A0A]/10"
          iconColor="text-[#0A0A0A]"
          trend={stats.leadsWeekTrend > 0 ? 'up' : stats.leadsWeekTrend < 0 ? 'down' : undefined}
          trendValue={stats.leadsWeekTrend !== 0 ? `${stats.leadsWeekTrend > 0 ? '+' : ''}${stats.leadsWeekTrend}` : undefined}
          trendLabel="vs semana anterior"
        />
        <KPICard
          title="Propostas Enviadas"
          value={stats.proposalsSent.toLocaleString('pt-BR')}
          subtitle={`${stats.proposalsPending} aguardando resposta`}
          icon={FileText}
          iconBg="bg-[#1356E2]/10"
          iconColor="text-[#1356E2]"
        />
        <KPICard
          title="Propostas Aceitas"
          value={stats.proposalsAccepted.toLocaleString('pt-BR')}
          subtitle={`Conversão: ${stats.proposalConversionRate}%`}
          icon={CheckCircle2}
          iconBg="bg-[#1356E2]/10"
          iconColor="text-[#1356E2]"
        />
        <KPICard
          title="Leads Perdidos"
          value={stats.leadsLost.toLocaleString('pt-BR')}
          subtitle={`Taxa de perda: ${stats.lossRate}%`}
          icon={XCircle}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
      </div>

      {/* Row 2 — Performance Comparisons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICardComparison
          title="TPV Pipeline"
          afterValue={stats.tpvPipelineFormatted}
          improvementLabel="Soma TPV leads ativos"
          colorScheme="green"
        />
        <KPICardComparison
          title="Ticket Médio"
          afterValue={stats.avgTicketFormatted}
          improvementLabel="Média declarada pelos leads"
          colorScheme="blue"
        />
        <KPICardComparison
          title="Tempo Médio Funil"
          afterValue={stats.avgFunnelTime}
          improvementLabel="Criação → Ativação"
          target="30 dias"
          targetLabel="Meta"
          colorScheme="green"
        />
        <KPICardComparison
          title="Taxa Conversão Proposta"
          afterValue={`${stats.proposalConversionRate}%`}
          improvementLabel="Aceitas / Enviadas ao cliente"
          target="40%"
          targetLabel="Meta"
          colorScheme="blue"
        />
      </div>
    </div>
  );
}