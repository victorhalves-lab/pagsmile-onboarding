import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Clock, User, Database, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MODE_LABELS = {
  quick: 'Quick',
  kyc_pld_full: 'KYC/PLD Completo',
  due_diligence_deep: 'Due Diligence Profunda',
  custom: 'Custom',
};

export default function BdcLookupHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('bdcLookupHistory', { limit: 30 });
        setLogs(res?.data?.logs || []);
      } catch (e) {
        console.error('Failed to load history:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
        <Clock className="w-5 h-5 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Nenhuma consulta registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
        <Clock className="w-4 h-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-[#002443]">Últimas consultas</h3>
        <span className="text-xs text-slate-400 ml-auto">{logs.length} registros</span>
      </div>
      <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
        {logs.map(log => (
          <div key={log.id} className="px-5 py-3 hover:bg-slate-50/50 flex items-center gap-4 text-xs">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono font-semibold text-[#002443]">{log.documentMasked}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">{log.documentType}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2bc196]/10 text-[#2bc196] font-medium">{MODE_LABELS[log.mode] || log.mode}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{log.queriedBy}</span>
                <span className="flex items-center gap-1"><Database className="w-3 h-3" />{log.datasetsOk?.length || 0} OK</span>
                <span>{log.elapsedMs}ms</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 whitespace-nowrap">
              {log.created_date ? formatDistanceToNow(new Date(log.created_date), { locale: ptBR, addSuffix: true }) : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}