import React, { useState } from 'react';
import { Search, CheckCircle2, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import FindingCardV2 from './FindingCardV2';

const SEV_FILTERS = [
  { key: 'BLOQUEANTE', label: 'Bloqueante', color: 'bg-red-900 text-white border-red-900' },
  { key: 'CRITICAL', label: 'Crítico', color: 'bg-red-100 text-red-700 border-red-300' },
  { key: 'HIGH', label: 'Alto', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { key: 'MEDIUM', label: 'Médio', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { key: 'LOW', label: 'Baixo', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'INFO', label: 'Info', color: 'bg-gray-100 text-gray-600 border-gray-200' },
];

export default function FindingsSectionV2({ findings, findingsBySeverity }) {
  const [filter, setFilter] = useState('all');
  if (!findings?.length) return null;

  const filtered = filter === 'all' ? findings : findings.filter(f => f.severidade === filter);
  const totalDeductions = findings.reduce((sum, f) => sum + (f.deducao_pontos || 0), 0);
  const blockers = findings.filter(f => f.severidade === 'BLOQUEANTE' || f.severidade === 'CRITICAL');
  const warnings = findings.filter(f => f.severidade === 'HIGH' || f.severidade === 'MEDIUM');
  const infoCount = findings.length - blockers.length - warnings.length;

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-rose-50/50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-100"><Search className="w-5 h-5 text-rose-600" /></div>
            <div>
              <h3 className="text-base font-bold text-[var(--pinbank-blue)]">Findings — Achados da Análise ({findings.length})</h3>
              <p className="text-xs text-[var(--pinbank-blue)]/40 mt-0.5">Pontos identificados em bureau (BDC), antifraude (CAF) e questionário, com evidência e impacto</p>
            </div>
          </div>
          {totalDeductions > 0 && (
            <Badge className="bg-red-100 text-red-700 text-xs border-0 font-bold flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />Total: +{totalDeductions} pts
            </Badge>
          )}
        </div>
      </div>

      <div className="p-5">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {blockers.length > 0 && (
            <div className="p-3.5 rounded-xl bg-red-50 border-2 border-red-200 text-center">
              <p className="text-2xl font-black text-red-700">{blockers.length}</p>
              <p className="text-[10px] text-red-600 font-bold uppercase tracking-wide">Críticos / Bloqueantes</p>
              <p className="text-[9px] text-red-500 mt-0.5">Impedem ou dificultam aprovação</p>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-200 text-center">
              <p className="text-2xl font-black text-amber-700">{warnings.length}</p>
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wide">Atenção</p>
              <p className="text-[9px] text-amber-500 mt-0.5">Requerem análise manual</p>
            </div>
          )}
          <div className="p-3.5 rounded-xl bg-blue-50 border-2 border-blue-200 text-center">
            <p className="text-2xl font-black text-blue-700">{infoCount}</p>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wide">Baixos / Info</p>
            <p className="text-[9px] text-blue-500 mt-0.5">Observações e registros</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button onClick={() => setFilter('all')}
            className={`text-xs px-3.5 py-2 rounded-lg border-2 transition-all font-bold ${filter === 'all' ? 'bg-[var(--pinbank-blue)] text-white border-[var(--pinbank-blue)]' : 'bg-white text-[var(--pinbank-blue)]/60 border-gray-200 hover:bg-gray-50'}`}>
            Todos ({findings.length})
          </button>
          {SEV_FILTERS.map(s => {
            const count = findingsBySeverity[s.key] || 0;
            if (!count) return null;
            return (
              <button key={s.key} onClick={() => setFilter(s.key)}
                className={`text-xs px-3.5 py-2 rounded-lg border-2 transition-all font-bold ${filter === s.key ? s.color : `bg-white ${s.color.split(' ')[1]} border-gray-200 hover:opacity-80`}`}>
                {s.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Finding cards */}
        <div className="space-y-4">
          {filtered.map(f => <FindingCardV2 key={f.id} finding={f} />)}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <p className="text-sm text-[var(--pinbank-blue)]/40">Nenhum finding nesta categoria</p>
          </div>
        )}
      </div>
    </div>
  );
}