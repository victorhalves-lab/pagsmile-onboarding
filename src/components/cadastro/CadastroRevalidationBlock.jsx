import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Calendar } from 'lucide-react';

const STATUS_COLORS = {
  pending:     'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-slate-200 text-slate-600',
};

const TYPE_LABELS = {
  periodic:    'Periódica',
  risk_based:  'Baseada em Risco',
  regulatory:  'Regulatória',
  manual:      'Manual',
};

export default function CadastroRevalidationBlock({ merchantId }) {
  const { data: schedules = [] } = useQuery({
    queryKey: ['cadastro-revalidations', merchantId],
    queryFn: () => base44.entities.RevalidationSchedule.filter({ merchantId }),
    enabled: !!merchantId,
  });

  if (!schedules.length) return null;

  const sorted = [...schedules].sort((a, b) => new Date(b.scheduledDate || b.created_date) - new Date(a.scheduledDate || a.created_date));

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
      <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-3 flex items-center gap-2">
        <RefreshCw className="w-4 h-4 text-[var(--pagsmile-green)]" />
        Revalidações ({schedules.length})
      </h3>
      <div className="space-y-2">
        {sorted.map(s => (
          <div key={s.id} className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className={`text-[10px] ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-700'}`}>{s.status}</Badge>
              <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[s.revalidationType] || s.revalidationType}</Badge>
              {s.frequency && <Badge variant="outline" className="text-[10px]">{s.frequency}</Badge>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs mt-2">
              {s.scheduledDate && (
                <div>
                  <p className="text-[10px] text-[var(--pagsmile-blue)]/50 flex items-center gap-1"><Calendar className="w-3 h-3" />Agendada</p>
                  <p className="font-semibold">{new Date(s.scheduledDate).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
              {s.nextRevalidationDate && (
                <div>
                  <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Próxima</p>
                  <p className="font-semibold">{new Date(s.nextRevalidationDate).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
              {s.lastRevalidationDate && (
                <div>
                  <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Última</p>
                  <p className="font-semibold">{new Date(s.lastRevalidationDate).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
            </div>
            {s.notes && <p className="text-xs text-[var(--pagsmile-blue)]/70 mt-2 italic">{s.notes}</p>}
            {s.triggeredBy && <p className="text-[10px] text-[var(--pagsmile-blue)]/40 mt-1">Disparada por: {s.triggeredBy}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}