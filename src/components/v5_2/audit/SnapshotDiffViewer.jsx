import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, ArrowRight, Plus, Minus, Equal } from 'lucide-react';
import { CHANGE_CATEGORY_META, SNAPSHOT_TYPE_META } from '@/lib/v5_2/snapshotDiff';

/**
 * [V5.2 Fase 6.5.6] Viewer de diff entre 2 snapshots V5.2.
 *
 * Renderiza as mudan\u00e7as agrupadas por categoria, mostrando antes \u2192 depois
 * para cada campo alterado. Arrays mostram +adicionados/-removidos.
 */
export default function SnapshotDiffViewer({ prevSnapshot, nextSnapshot, diff }) {
  if (!prevSnapshot || !nextSnapshot) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-[#0A0A0A]/50">
          Selecione um evento na timeline para ver o diff.
        </CardContent>
      </Card>
    );
  }

  if (diff?.isInitial || (diff?.changes || []).length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-[#0A0A0A]/50">
          Nenhuma diferen\u00e7a entre este snapshot e o anterior.
        </CardContent>
      </Card>
    );
  }

  const prevMeta = SNAPSHOT_TYPE_META[prevSnapshot.tipo] || SNAPSHOT_TYPE_META.initial_analysis;
  const nextMeta = SNAPSHOT_TYPE_META[nextSnapshot.tipo] || SNAPSHOT_TYPE_META.initial_analysis;

  const fmtDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    } catch {
      return iso;
    }
  };

  // Agrupa mudan\u00e7as por categoria
  const grouped = {};
  diff.changes.forEach((c) => {
    if (!grouped[c.cat]) grouped[c.cat] = [];
    grouped[c.cat].push(c);
  });

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-sm flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#1356E2]" />
          Diff de Snapshots
        </CardTitle>
        <div className="flex items-center gap-2 mt-2 text-[11px]">
          <Badge variant="outline" className="text-[10px]" style={{ borderColor: prevMeta.color, color: prevMeta.color }}>
            {prevMeta.label}
          </Badge>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <Badge variant="outline" className="text-[10px]" style={{ borderColor: nextMeta.color, color: nextMeta.color }}>
            {nextMeta.label}
          </Badge>
        </div>
        <p className="text-[10px] text-[#0A0A0A]/55 mt-1">
          {fmtDate(prevSnapshot.created_date)} → {fmtDate(nextSnapshot.created_date)}
        </p>
      </CardHeader>

      <CardContent className="pt-3 space-y-3 max-h-[600px] overflow-y-auto">
        {Object.entries(grouped).map(([cat, changes]) => {
          const catMeta = CHANGE_CATEGORY_META[cat] || { label: cat, color: '#64748b' };
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 rounded-full" style={{ backgroundColor: catMeta.color }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: catMeta.color }}>
                  {catMeta.label}
                </span>
                <span className="text-[10px] text-slate-400">({changes.length})</span>
              </div>
              <div className="space-y-2 pl-3">
                {changes.map((c, idx) => (
                  <DiffRow key={`${c.path}-${idx}`} change={c} />
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function DiffRow({ change }) {
  if (change.type === 'array') {
    return (
      <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/50">
        <p className="text-[11px] font-semibold text-[#0A0A0A] mb-1">{change.label}</p>
        {change.added.length > 0 && (
          <div className="space-y-0.5 mb-1">
            {change.added.map((item) => (
              <div key={`add-${item}`} className="flex items-start gap-1 text-[11px]">
                <Plus className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                <code className="text-emerald-700 font-mono text-[10px] break-all">{String(item)}</code>
              </div>
            ))}
          </div>
        )}
        {change.removed.length > 0 && (
          <div className="space-y-0.5">
            {change.removed.map((item) => (
              <div key={`rem-${item}`} className="flex items-start gap-1 text-[11px]">
                <Minus className="w-3 h-3 text-red-600 flex-shrink-0 mt-0.5" />
                <code className="text-red-700 font-mono text-[10px] line-through break-all">{String(item)}</code>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Escalar
  const prevStr = String(change.prev ?? '—');
  const nextStr = String(change.next ?? '—');

  return (
    <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/50">
      <p className="text-[11px] font-semibold text-[#0A0A0A] mb-1.5">{change.label}</p>
      {change.long ? (
        <div className="space-y-1.5">
          <DiffLongText label="Antes" value={prevStr} color="red" />
          <DiffLongText label="Depois" value={nextStr} color="emerald" />
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] font-mono flex-wrap">
          <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded border border-red-100 break-all max-w-[120px] truncate" title={prevStr}>
            {prevStr}
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 break-all max-w-[120px] truncate" title={nextStr}>
            {nextStr}
          </span>
        </div>
      )}
    </div>
  );
}

function DiffLongText({ label, value, color }) {
  const colorClasses = color === 'red'
    ? 'bg-red-50 text-red-700 border-red-100'
    : 'bg-emerald-50 text-emerald-700 border-emerald-100';
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-[#0A0A0A]/40 font-semibold mb-0.5">{label}</div>
      <div className={`px-2 py-1 rounded border text-[10px] leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap ${colorClasses}`}>
        {value || '—'}
      </div>
    </div>
  );
}