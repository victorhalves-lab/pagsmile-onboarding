import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock, XCircle, Zap, CheckCircle2 } from 'lucide-react';

export default function CommercialAlerts({ stats }) {
  const alerts = [
    {
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200/50',
      label: `${stats.staleLeads} leads sem contato há +7 dias`,
      active: stats.staleLeads > 0,
      severity: 'warning'
    },
    {
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50 border-orange-200/50',
      label: `${stats.proposalsExpiring} propostas expirando nos próximos 3 dias`,
      active: stats.proposalsExpiring > 0,
      severity: 'warning'
    },
    {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50 border-red-200/50',
      label: `${stats.proposalsRejectedNoFollowup} propostas recusadas sem follow-up`,
      active: stats.proposalsRejectedNoFollowup > 0,
      severity: 'critical'
    },
    {
      icon: Zap,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200/50',
      label: `${stats.urgentLeadsNoProp} leads urgentes (IA) sem proposta`,
      active: stats.urgentLeadsNoProp > 0,
      severity: 'info'
    },
    {
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50 border-green-200/50',
      label: `${stats.leadsReadyForProposal} leads prontos para proposta`,
      active: stats.leadsReadyForProposal > 0,
      severity: 'success'
    }
  ];

  const activeAlerts = alerts.filter(a => a.active);

  if (activeAlerts.length === 0) {
    return (
      <Card className="rounded-2xl border-[#002443]/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 font-bold text-[#002443]">
            <div className="p-1.5 rounded-lg bg-green-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            </div>
            Alertas Acionáveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600 font-medium text-center py-4">Tudo em dia! Nenhum alerta pendente.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-[#002443]/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 font-bold text-[#002443]">
          <div className="p-1.5 rounded-lg bg-amber-100">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          Alertas Acionáveis
          <span className="ml-auto text-xs font-normal bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            {activeAlerts.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activeAlerts.map((alert, i) => {
          const Icon = alert.icon;
          return (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${alert.bg}`}>
              <Icon className={`w-4 h-4 ${alert.color} shrink-0`} />
              <p className="text-xs font-medium text-[#002443]">{alert.label}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}