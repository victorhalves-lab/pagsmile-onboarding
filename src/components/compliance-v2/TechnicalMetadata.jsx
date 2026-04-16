import React from 'react';
import { Settings, Clock, Hash, Cpu, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TechnicalMetadata({ score, latestCase, integrationLogs = [] }) {
  const version = score?.versao_agente;
  const framework = score?.framework_version;
  const segmento = score?.segmento;
  const questionarioId = score?.questionario_id;
  const isPix = score?.is_pix;
  const fases = [
    { label: 'Fase 1 — Questionário', done: score?.fase_1_completa, date: score?.data_analise_fase_1 },
    { label: 'Fase 2 — Enriquecimento', done: score?.fase_2_completa, date: score?.data_analise_fase_2 },
    { label: 'Fase 3 — SENTINEL', done: score?.fase_3_completa, date: score?.data_analise_fase_3 },
  ];
  const caseCreated = latestCase?.created_date;
  const caseFinal = latestCase?.finalDecisionDate;
  const transactionIds = integrationLogs.slice(0, 10).filter(l => l.transaction_id || l.request_id).map(l => ({
    provider: l.provider,
    svc: l.service_type || l.validationType || '',
    id: l.transaction_id || l.request_id,
  }));

  if (!version && !framework && !caseCreated && transactionIds.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100"><Settings className="w-5 h-5 text-slate-600" /></div>
          <div>
            <h3 className="text-sm font-bold text-[var(--pagsmile-blue)]">Metadados Técnicos</h3>
            <p className="text-[10px] text-[var(--pagsmile-blue)]/40">Versões, IDs de transação e timeline de processamento</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* System info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {version && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
              <Cpu className="w-4 h-4 mx-auto mb-1 text-slate-400" />
              <p className="text-[10px] text-[var(--pagsmile-blue)]/40">Agente SENTINEL</p>
              <p className="text-xs font-bold text-[var(--pagsmile-blue)]">{version}</p>
            </div>
          )}
          {framework && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
              <Shield className="w-4 h-4 mx-auto mb-1 text-slate-400" />
              <p className="text-[10px] text-[var(--pagsmile-blue)]/40">Framework</p>
              <p className="text-xs font-bold text-[var(--pagsmile-blue)]">{framework}</p>
            </div>
          )}
          {segmento && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
              <Hash className="w-4 h-4 mx-auto mb-1 text-slate-400" />
              <p className="text-[10px] text-[var(--pagsmile-blue)]/40">Segmento</p>
              <p className="text-xs font-bold text-[var(--pagsmile-blue)]">{segmento}{isPix ? ' (PIX)' : ''}</p>
            </div>
          )}
          {caseCreated && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
              <Clock className="w-4 h-4 mx-auto mb-1 text-slate-400" />
              <p className="text-[10px] text-[var(--pagsmile-blue)]/40">Caso Criado</p>
              <p className="text-xs font-bold text-[var(--pagsmile-blue)]">{new Date(caseCreated).toLocaleDateString('pt-BR')}</p>
            </div>
          )}
        </div>

        {/* Phases timeline */}
        <div className="flex gap-2">
          {fases.map((f, i) => (
            <div key={i} className={`flex-1 text-center p-2.5 rounded-lg border text-xs ${f.done ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
              <p className="font-bold">{f.label}</p>
              {f.done && f.date && <p className="text-[10px] mt-0.5">{new Date(f.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>}
              {!f.done && <p className="text-[10px] mt-0.5">Pendente</p>}
            </div>
          ))}
        </div>

        {/* Transaction IDs */}
        {transactionIds.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-[var(--pagsmile-blue)]/40 uppercase tracking-wider mb-2">IDs de Transação das Integrações</p>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {transactionIds.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] p-2 bg-slate-50 rounded border border-slate-100">
                  <Badge className={`text-[8px] border-0 ${t.provider === 'BigDataCorp' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {t.provider === 'BigDataCorp' ? 'BDC' : 'CAF'}
                  </Badge>
                  <span className="text-[var(--pagsmile-blue)]/50">{t.svc.replace(/_/g, ' ')}</span>
                  <span className="font-mono text-[var(--pagsmile-blue)]/30 ml-auto truncate max-w-[200px]">{t.id}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}