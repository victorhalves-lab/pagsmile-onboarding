import React, { useState } from 'react';
import { History, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ACTION_COLORS = {
  'CREATE': 'bg-green-100 text-green-700',
  'UPDATE': 'bg-blue-100 text-blue-700',
  'DELETE': 'bg-red-100 text-red-700',
  'APPROVAL': 'bg-emerald-100 text-emerald-700',
  'REJECTION': 'bg-red-100 text-red-700',
  'VALIDATION': 'bg-purple-100 text-purple-700',
  'VIEW': 'bg-gray-100 text-gray-600',
};

const ACTION_LABELS = {
  'CREATE': 'Criação',
  'UPDATE': 'Atualização',
  'DELETE': 'Exclusão',
  'APPROVAL': 'Aprovação',
  'REJECTION': 'Rejeição',
  'VALIDATION': 'Validação',
  'VIEW': 'Visualização',
};

function ChangeDetail({ details }) {
  const [open, setOpen] = useState(false);
  if (!details?.changes) return null;

  const entries = Object.entries(details.changes);
  if (!entries.length) return null;

  return (
    <div className="mt-2">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800">
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {entries.length} campo(s) alterado(s)
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-blue-200">
          {entries.map(([key, newVal]) => {
            const oldVal = details.oldValues?.[key];
            return (
              <div key={key} className="text-xs">
                <span className="font-medium text-[var(--pinbank-blue)]/70">{key}:</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-red-500 line-through text-[11px]">{String(oldVal || '(vazio)')}</span>
                  <ArrowRight className="w-3 h-3 text-[var(--pinbank-blue)]/30" />
                  <span className="text-green-600 font-medium text-[11px]">{String(newVal || '(vazio)')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CadastroHistoricoTab({ auditLogs = [] }) {
  if (!auditLogs.length) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-10 text-center mt-4">
        <History className="w-10 h-10 mx-auto mb-3 text-[var(--pinbank-blue)]/20" />
        <p className="text-sm text-[var(--pinbank-blue)]/50">Nenhum registro de histórico encontrado</p>
      </div>
    );
  }

  const sorted = [...auditLogs].sort((a, b) => new Date(b.changeDate || b.created_date) - new Date(a.changeDate || a.created_date));

  return (
    <div className="space-y-2 mt-4">
      <p className="text-sm text-[var(--pinbank-blue)]/60">{sorted.length} registro(s) de histórico</p>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[var(--pinbank-blue)]/8" />
        
        <div className="space-y-3">
          {sorted.map((log, i) => {
            const date = new Date(log.changeDate || log.created_date);
            const color = ACTION_COLORS[log.actionType] || ACTION_COLORS['UPDATE'];
            const label = ACTION_LABELS[log.actionType] || log.actionType;

            return (
              <div key={log.id || i} className="relative pl-12">
                {/* Timeline dot */}
                <div className={`absolute left-3.5 w-3 h-3 rounded-full border-2 border-white ${color.split(' ')[0]} top-4`} />
                
                <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[10px] ${color}`}>{label}</Badge>
                        <span className="text-[10px] text-[var(--pinbank-blue)]/40">{log.entityName}</span>
                      </div>
                      <p className="text-sm text-[var(--pinbank-blue)]/80 mt-1">{log.actionDescription}</p>
                      <ChangeDetail details={log.details} />
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-[var(--pinbank-blue)]/40">{date.toLocaleDateString('pt-BR')}</p>
                      <p className="text-[10px] text-[var(--pinbank-blue)]/40">{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-[10px] text-[var(--pinbank-blue)]/50 mt-1 font-medium">{log.changedBy}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}