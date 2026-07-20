import React from 'react';
import { History } from 'lucide-react';

export default function CaseHistoryTab({ auditLogs }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-[var(--pinbank-blue)] mb-6">Histórico de Alterações</h3>
      {auditLogs.length === 0 ? (
        <div className="text-center py-12">
          <History className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-[var(--pinbank-blue)]/70 font-medium">Nenhum registro de histórico</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
          <div className="space-y-4">
            {auditLogs.map((log, idx) => (
              <div key={idx} className="relative pl-10">
                <div className={`absolute left-2 w-5 h-5 rounded-full border-2 border-white ${
                  log.actionType === 'APPROVAL' ? 'bg-green-500' :
                  log.actionType === 'REJECTION' ? 'bg-red-500' :
                  log.actionType === 'CREATE' ? 'bg-blue-500' : 'bg-slate-400'
                }`}></div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-[var(--pinbank-blue)]">{log.actionDescription}</p>
                      <p className="text-sm text-[var(--pinbank-blue)]/70 font-medium mt-1">Por {log.changedBy}</p>
                    </div>
                    <span className="text-xs text-[var(--pinbank-blue)]/60 font-medium">
                      {log.changeDate ? new Date(log.changeDate).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) : '-'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}