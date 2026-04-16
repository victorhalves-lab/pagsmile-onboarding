import React, { useMemo } from 'react';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Database, Fingerprint, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function IntegrationTimeline({ integrationLogs = [], validations = [] }) {
  const allRecords = useMemo(() => {
    const map = new Map();
    [...validations, ...integrationLogs].forEach(r => map.set(r.id, r));
    return Array.from(map.values()).sort((a, b) => new Date(a.created_date || a.timestamp) - new Date(b.created_date || b.timestamp));
  }, [validations, integrationLogs]);

  if (!allRecords.length) return null;

  const bdcCount = allRecords.filter(r => r.provider === 'BigDataCorp').length;
  const cafCount = allRecords.filter(r => r.provider === 'CAF').length;
  const okCount = allRecords.filter(r => ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)).length;
  const failCount = allRecords.filter(r => ['Falha', 'failed', 'REPROVED'].includes(r.status || r.result_status)).length;
  const totalTime = allRecords.reduce((s, r) => s + (r.duration_ms || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100"><Zap className="w-5 h-5 text-slate-600" /></div>
          <div>
            <h3 className="text-base font-bold text-[var(--pagsmile-blue)]">Timeline de Integrações — O Que Foi Consultado</h3>
            <p className="text-xs text-[var(--pagsmile-blue)]/40 mt-0.5">Visão rápida de todas as consultas feitas a provedores externos</p>
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-4">
        <Stat label="Total" value={allRecords.length} />
        <Stat label="BDC" value={bdcCount} icon={Database} colorClass="text-blue-500" />
        <Stat label="CAF" value={cafCount} icon={Fingerprint} colorClass="text-purple-500" />
        <Stat label="Sucesso" value={okCount} icon={CheckCircle2} colorClass="text-green-500" />
        {failCount > 0 && <Stat label="Falha" value={failCount} icon={XCircle} colorClass="text-red-500" />}
        {totalTime > 0 && <Stat label="Tempo Total" value={`${(totalTime / 1000).toFixed(1)}s`} icon={Clock} colorClass="text-slate-500" />}
      </div>

      {/* Compact timeline */}
      <div className="px-6 py-3 max-h-[300px] overflow-y-auto">
        <div className="space-y-1">
          {allRecords.map(r => {
            const isBdc = r.provider === 'BigDataCorp';
            const s = (r.status || r.result_status || '').toLowerCase();
            const ok = ['sucesso', 'success', 'approved'].includes(s);
            const fail = ['falha', 'failed', 'reproved'].includes(s);
            const date = new Date(r.created_date || r.timestamp);
            const svcType = r.service_type || r.validationType || 'unknown';

            return (
              <div key={r.id} className="flex items-center gap-3 py-1.5 text-xs">
                {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> : fail ? <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                <Badge className={`text-[9px] border-0 ${isBdc ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                  {isBdc ? 'BDC' : 'CAF'}
                </Badge>
                <span className="font-medium text-[var(--pagsmile-blue)] truncate flex-1">{svcType.replace(/_/g, ' ')}</span>
                {r.duration_ms && <span className="text-[var(--pagsmile-blue)]/30">{r.duration_ms}ms</span>}
                <span className="text-[var(--pagsmile-blue)]/25">{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, colorClass = 'text-slate-500' }) {
  return (
    <div className="flex items-center gap-1.5">
      {Icon && <Icon className={`w-3.5 h-3.5 ${colorClass}`} />}
      <span className="text-[10px] text-[var(--pagsmile-blue)]/40">{label}:</span>
      <span className="text-xs font-bold text-[var(--pagsmile-blue)]">{value}</span>
    </div>
  );
}