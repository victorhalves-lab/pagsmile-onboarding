import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Inbox, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PartnerDashboardKPIs({ assignments = [] }) {
  const kpis = useMemo(() => {
    const now = Date.now();
    let pending = 0, inReview = 0, completed = 0, dueSoon = 0, overdue = 0;
    for (const a of assignments) {
      if (a.status === 'pending' || a.status === 'viewed') pending++;
      if (a.status === 'in_review') inReview++;
      if (a.status === 'completed') completed++;
      if (a.dueDate && ['pending', 'viewed', 'in_review'].includes(a.status)) {
        const diffH = (new Date(a.dueDate).getTime() - now) / 3600000;
        if (diffH < 0) overdue++;
        else if (diffH <= 24) dueSoon++;
      }
    }
    return { pending, inReview, completed, dueSoon, overdue };
  }, [assignments]);

  const cards = [
    { label: 'Aguardando análise', value: kpis.pending, icon: Inbox, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Em revisão', value: kpis.inReview, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Vencendo em 24h', value: kpis.dueSoon, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Vencidos', value: kpis.overdue, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Concluídos', value: kpis.completed, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {cards.map(c => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="border-slate-200">
            <CardContent className="p-4">
              <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <div className="text-2xl font-bold text-[#0A0A0A]">{c.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{c.label}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}