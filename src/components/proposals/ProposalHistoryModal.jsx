import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Loader2, History, Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import moment from 'moment';

const actionIcons = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
};

const actionColors = {
  CREATE: 'bg-blue-100 text-blue-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
};

export default function ProposalHistoryModal({ open, onClose, proposalId }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['proposal-audit', proposalId],
    queryFn: () => base44.entities.AuditLog.filter({ entityName: 'Proposal', entityId: proposalId }, '-changeDate'),
    enabled: open && !!proposalId
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-[var(--pinbank-blue)]/60" />
            Histórico de Revisões
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--pinbank-blue)]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-10 h-10 mx-auto text-[var(--pinbank-blue)]/30 mb-2" />
            <p className="text-sm text-[var(--pinbank-blue)]/60">Nenhum registro de alteração encontrado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const Icon = actionIcons[log.actionType] || Edit;
              const color = actionColors[log.actionType] || actionColors.UPDATE;
              return (
                <div key={log.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={`${color} gap-1 text-xs`}>
                      <Icon className="w-3 h-3" />
                      {log.actionType === 'CREATE' ? 'Criação' : log.actionType === 'UPDATE' ? 'Atualização' : log.actionType}
                    </Badge>
                    <span className="text-[10px] text-[var(--pinbank-blue)]/50">
                      {log.changeDate ? moment(log.changeDate).format('DD/MM/YY HH:mm') : moment(log.created_date).format('DD/MM/YY HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--pinbank-blue)]/80 mb-1">{log.actionDescription || 'Sem descrição'}</p>
                  <p className="text-[10px] text-[var(--pinbank-blue)]/50">Por: {log.changedBy || 'Sistema'}</p>
                  {log.details && (
                    <details className="mt-2">
                      <summary className="text-[10px] text-[var(--pinbank-blue)]/50 cursor-pointer hover:text-[var(--pinbank-blue)]">
                        Ver detalhes
                      </summary>
                      <pre className="bg-slate-50 rounded p-2 text-[10px] overflow-auto max-h-32 mt-1">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}