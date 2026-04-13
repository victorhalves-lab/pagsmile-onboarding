import React, { useState, useMemo } from 'react';
import { Clock, Fingerprint, Database, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PROVIDER_CONFIG = {
  CAF: { icon: Fingerprint, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  BigDataCorp: { icon: Database, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
};

function getStatusIcon(status) {
  const s = (status || '').toLowerCase();
  if (['sucesso', 'success', 'approved'].includes(s)) return { icon: CheckCircle2, color: 'text-green-600' };
  if (['falha', 'failed', 'reproved'].includes(s)) return { icon: XCircle, color: 'text-red-600' };
  return { icon: AlertTriangle, color: 'text-amber-600' };
}

export default function AnaliseTimelineIntegracoes({ integrationLogs, validations }) {
  const [filter, setFilter] = useState('all');
  const [showLimit, setShowLimit] = useState(20);

  // Merge all records
  const allRecords = React.useMemo(() => {
    const map = new Map();
    [...integrationLogs, ...validations].forEach(r => map.set(r.id, r));
    return Array.from(map.values()).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [integrationLogs, validations]);

  const filtered = filter === 'all' ? allRecords : allRecords.filter(r => r.provider === filter);
  const visible = filtered.slice(0, showLimit);

  if (allRecords.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <Clock className="w-5 h-5 text-[var(--pagsmile-blue)]/60" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--pagsmile-blue)]">Timeline de Integrações</h2>
              <p className="text-xs text-[var(--pagsmile-blue)]/40">Ordem cronológica de todas as chamadas a CAF e Big Data Corp</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[var(--pagsmile-blue)]/30" />
            {['all', 'CAF', 'BigDataCorp'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                  filter === f ? 'bg-[var(--pagsmile-blue)] text-white' : 'bg-slate-100 text-[var(--pagsmile-blue)]/50 hover:bg-slate-200'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'BigDataCorp' ? 'BDC' : f}
              </button>
            ))}
            <Badge variant="outline" className="text-[10px]">{filtered.length} registros</Badge>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
          
          <div className="space-y-3">
            {visible.map(record => {
              const provider = record.provider || 'CAF';
              const pCfg = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.CAF;
              const sCfg = getStatusIcon(record.status || record.result_status);
              const PIcon = pCfg.icon;
              const SIcon = sCfg.icon;
              const date = new Date(record.created_date || record.timestamp);
              const svcType = record.service_type || record.validationType || 'N/D';

              return (
                <div key={record.id} className="relative flex items-start gap-4 pl-10">
                  {/* Timeline dot */}
                  <div className={`absolute left-3 w-5 h-5 rounded-full ${pCfg.bg} border-2 ${pCfg.border} flex items-center justify-center`}>
                    <PIcon className={`w-2.5 h-2.5 ${pCfg.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-[var(--pagsmile-blue)]">{svcType.replace(/_/g, ' ')}</span>
                      <Badge className={`text-[9px] ${pCfg.bg} ${pCfg.color} ${pCfg.border} border`}>{provider}</Badge>
                      <SIcon className={`w-3 h-3 ${sCfg.color}`} />
                      <span className={`text-[10px] font-medium ${sCfg.color}`}>{record.status || record.result_status || 'N/D'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[var(--pagsmile-blue)]/40 mt-0.5">
                      <span>{date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      {record.duration_ms && <span>• {record.duration_ms}ms</span>}
                      {record.request_id && <span className="font-mono">• {record.request_id.substring(0, 12)}...</span>}
                    </div>
                    {record.red_flags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {record.red_flags.slice(0, 3).map((f, i) => (
                          <Badge key={i} className="bg-red-100 text-red-700 text-[9px]">{f}</Badge>
                        ))}
                        {record.red_flags.length > 3 && <Badge className="bg-red-50 text-red-500 text-[9px]">+{record.red_flags.length - 3}</Badge>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length > showLimit && (
            <div className="text-center mt-4">
              <button
                onClick={() => setShowLimit(prev => prev + 20)}
                className="text-xs text-[var(--pagsmile-green)] hover:underline"
              >
                Carregar mais ({filtered.length - showLimit} restantes)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}