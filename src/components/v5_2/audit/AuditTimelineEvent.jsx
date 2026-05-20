import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Rocket, RefreshCw, ShieldCheck, Gavel, GitCompare, AlertTriangle,
  Clock, Hash, GitBranch, ChevronRight
} from 'lucide-react';
import { SNAPSHOT_TYPE_META, CHANGE_CATEGORY_META } from '@/lib/v5_2/snapshotDiff';

const ICON_MAP = { Rocket, RefreshCw, ShieldCheck, Gavel, GitCompare, AlertTriangle };

/**
 * [V5.2 Fase 6.5.6] Card de evento na timeline de auditoria V5.2.
 *
 * Renderiza um snapshot como item da timeline com:
 *   - Ícone + label do tipo de snapshot
 *   - Data/hora formatada
 *   - Hash de integridade (curto)
 *   - Sumário do diff (chips por categoria)
 *   - Botão "Ver diff" se houver mudanças
 *
 * Props:
 *   - snapshot: registro Snapshot V5.2
 *   - diff: { changes, summary, isInitial } resultante de diffSnapshots()
 *   - isFirst, isLast: bool para estilizar bordas/linha vertical
 *   - selected: bool — se este snapshot está selecionado no viewer de diff
 *   - onSelect: callback ao clicar em "Ver diff"
 */
export default function AuditTimelineEvent({ snapshot, diff, isFirst, isLast, selected, onSelect }) {
  const meta = SNAPSHOT_TYPE_META[snapshot.tipo] || SNAPSHOT_TYPE_META.initial_analysis;
  const Icon = ICON_MAP[meta.icon] || Rocket;

  const fmtDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    } catch {
      return iso;
    }
  };

  const hasChanges = !diff?.isInitial && (diff?.changes || []).length > 0;
  const totalChanges = (diff?.changes || []).length;

  return (
    <div className="relative flex gap-4">
      {/* Linha vertical da timeline */}
      <div className="flex flex-col items-center flex-shrink-0">
        {!isFirst && <div className="w-0.5 flex-1 bg-slate-200 -mb-1" />}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center border-2 z-10 shadow-sm bg-white"
          style={{ borderColor: meta.color }}
        >
          <Icon className="w-4 h-4" style={{ color: meta.color }} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 -mt-1" />}
      </div>

      {/* Card do evento */}
      <div className={`flex-1 mb-4 border rounded-xl p-4 transition-all ${
        selected
          ? 'border-[#2bc196] bg-[#2bc196]/5 shadow-md'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}>
        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-[#002443]">{meta.label}</span>
              {diff?.isInitial && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">snapshot inicial</Badge>
              )}
              {hasChanges && (
                <Badge className="bg-[#2bc196] text-white text-[10px] h-4 px-1.5">
                  {totalChanges} {totalChanges === 1 ? 'mudança' : 'mudanças'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-[#002443]/55">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {fmtDate(snapshot.created_date)}
              </span>
              {snapshot.elapsed_ms && (
                <span>{snapshot.elapsed_ms}ms</span>
              )}
              {snapshot.hash_integridade && (
                <span className="inline-flex items-center gap-1 font-mono">
                  <Hash className="w-3 h-3" />
                  {snapshot.hash_integridade.substring(0, 12)}…
                </span>
              )}
            </div>
          </div>
          {hasChanges && (
            <Button
              variant={selected ? 'default' : 'outline'}
              size="sm"
              onClick={onSelect}
              className="text-[11px] h-7 gap-1"
            >
              <GitBranch className="w-3 h-3" />
              {selected ? 'Selecionado' : 'Ver diff'}
            </Button>
          )}
        </div>

        {/* Resumo do estado base (snapshot inicial) */}
        {diff?.isInitial && (
          <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
            <KeyVal label="Score" value={snapshot.output_score_camadas?.score_final} />
            <KeyVal label="Categoria" value={snapshot.output_categoria_decisao} />
            <KeyVal label="Subfaixa" value={snapshot.output_subfaixa_tier_aware} />
            <KeyVal label="Tier" value={snapshot.tier} />
            <KeyVal label="Morfologia" value={snapshot.morfologia} />
            <KeyVal label="Patch" value={snapshot.output_patch_financeiro?.status} />
          </div>
        )}

        {/* Chips de sumário do diff */}
        {hasChanges && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
            {Object.entries(diff.summary || {}).map(([cat, count]) => {
              if (!count) return null;
              const catMeta = CHANGE_CATEGORY_META[cat] || { label: cat, color: '#64748b' };
              return (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${catMeta.color}15`,
                    color: catMeta.color,
                  }}
                >
                  <ChevronRight className="w-2.5 h-2.5" />
                  {catMeta.label}: {count}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function KeyVal({ label, value }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-[#002443]/40 font-semibold">{label}</div>
      <div className="text-[12px] text-[#002443] font-mono truncate">{value ?? '—'}</div>
    </div>
  );
}