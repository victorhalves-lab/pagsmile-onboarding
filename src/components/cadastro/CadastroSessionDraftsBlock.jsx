import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { FileEdit } from 'lucide-react';

const STATUS_COLORS = {
  active:    'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  expired:   'bg-slate-200 text-slate-600',
};

export default function CadastroSessionDraftsBlock({ merchantEmail }) {
  const { data: sessions = [] } = useQuery({
    queryKey: ['cadastro-sessions', merchantEmail],
    queryFn: () => base44.entities.ComplianceSession.filter({ clientEmail: merchantEmail }),
    enabled: !!merchantEmail,
  });

  if (!sessions.length) return null;

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
      <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-3 flex items-center gap-2">
        <FileEdit className="w-4 h-4 text-[var(--pagsmile-green)]" />
        Rascunhos de Questionário ({sessions.length})
      </h3>
      <p className="text-[10px] text-[var(--pagsmile-blue)]/40 mb-3">
        Sessões salvas automaticamente pelo cliente durante o preenchimento.
      </p>
      <div className="space-y-2">
        {sessions.map(s => (
          <div key={s.id} className="p-3 bg-slate-50 rounded-lg flex items-start justify-between gap-2 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`text-[10px] ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-700'}`}>{s.status}</Badge>
                <Badge variant="outline" className="text-[10px]">{s.templateModel || s.flowType}</Badge>
                <Badge variant="outline" className="text-[10px]">Fase: {s.currentPhase}</Badge>
                <Badge variant="outline" className="text-[10px]">Step: {s.currentStep}</Badge>
              </div>
              <p className="text-[10px] text-[var(--pagsmile-blue)]/40 mt-1">
                Iniciado em {new Date(s.created_date).toLocaleString('pt-BR')}
                {s.lastAccessDate && ` • último acesso ${new Date(s.lastAccessDate).toLocaleString('pt-BR')}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}