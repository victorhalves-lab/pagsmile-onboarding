import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Activity, Calendar } from 'lucide-react';

const ACTIVITY_LABELS = {
  assigned:                 'Atribuído',
  viewed:                   'Visualizado',
  commented:                'Comentou',
  documents_downloaded:     'Baixou documentos',
  recommendation_submitted: 'Recomendação enviada',
  recommendation_changed:   'Recomendação alterada',
  revoked:                  'Revogado',
  sla_warning_sent:         'Alerta SLA enviado',
  sla_breached:             'SLA violado',
  status_changed:           'Status alterado',
};

const ACTIVITY_COLORS = {
  recommendation_submitted: 'bg-green-100 text-green-700',
  sla_breached:             'bg-red-100 text-red-700',
  revoked:                  'bg-slate-200 text-slate-600',
};

export default function CadastroPartnerActivityBlock({ assignments = [] }) {
  const assignmentIds = assignments.map(a => a.id);

  const { data: activities = [] } = useQuery({
    queryKey: ['cadastro-partner-activities', assignmentIds],
    queryFn: async () => {
      if (!assignmentIds.length) return [];
      const results = await Promise.all(assignmentIds.map(id => base44.entities.PartnerAssignmentActivity.filter({ assignmentId: id })));
      return results.flat().sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: assignmentIds.length > 0,
  });

  if (!activities.length) return null;

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-5 mt-3">
      <h3 className="text-sm font-semibold text-[var(--pinbank-blue)] mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4 text-[var(--pinbank-blue)]" />
        Atividade dos Parceiros ({activities.length})
      </h3>
      <div className="space-y-2">
        {activities.slice(0, 50).map(a => {
          const label = ACTIVITY_LABELS[a.activityType] || a.activityType;
          const color = ACTIVITY_COLORS[a.activityType] || 'bg-blue-100 text-blue-700';
          return (
            <div key={a.id} className="p-3 bg-slate-50 rounded-lg flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-[10px] ${color}`}>{label}</Badge>
                  {a.performedByRole && <Badge variant="outline" className="text-[10px]">{a.performedByRole}</Badge>}
                </div>
                {a.description && <p className="text-xs text-[var(--pinbank-blue)]/80 mt-1">{a.description}</p>}
                {a.performedByName && <p className="text-[10px] text-[var(--pinbank-blue)]/40 mt-0.5">por {a.performedByName}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <Calendar className="w-3 h-3 text-[var(--pinbank-blue)]/30 inline" />
                <span className="text-[10px] text-[var(--pinbank-blue)]/40 ml-1">{new Date(a.created_date).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}