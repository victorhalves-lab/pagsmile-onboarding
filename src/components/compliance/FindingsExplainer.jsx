import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle, Info, AlertOctagon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { SEVERITY_META, getSeverityMeta } from './severityGlossary';

/**
 * FindingsExplainer — focused component that replaces the old "5 critical / 3 high"
 * pill counters. For each severity it:
 *  1. shows a clickable summary pill with count
 *  2. on click, lists the actual finding titles/evidence
 *  3. shows an inline explanation of what the severity means and the action
 */

function SeverityCard({ severityKey, count, findings, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const [showHelp, setShowHelp] = useState(false);
  const meta = getSeverityMeta(severityKey);
  const hasDetails = findings && findings.length > 0;

  return (
    <div className={`rounded-xl border ${meta.border} ${meta.bg} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3.5 hover:bg-white/40 transition-colors text-left"
      >
        <span className="text-2xl leading-none">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${meta.text}`}>{count}</span>
            <span className={`text-sm font-bold uppercase tracking-wide ${meta.textSoft}`}>
              {meta.label}
            </span>
          </div>
          <p className={`text-[11px] ${meta.textSoft} opacity-75 mt-0.5`}>
            {hasDetails ? `Clique para ver os ${count} item(ns)` : 'Sem detalhes disponíveis'}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowHelp(!showHelp); }}
          className={`p-1 rounded hover:bg-white/60 ${meta.textSoft} opacity-60 hover:opacity-100`}
          title="O que significa essa severidade?"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        {hasDetails && (open
          ? <ChevronUp className={`w-4 h-4 ${meta.textSoft}`} />
          : <ChevronDown className={`w-4 h-4 ${meta.textSoft}`} />
        )}
      </button>

      {/* Explanation (tooltip-style, inline) */}
      {showHelp && (
        <div className="px-4 pb-3 border-t border-white/60">
          <div className="mt-3 p-3 bg-white/70 rounded-lg border border-white/80 space-y-2">
            <div className="flex items-start gap-2">
              <Info className={`w-3.5 h-3.5 ${meta.textSoft} shrink-0 mt-0.5`} />
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${meta.textSoft} mb-1`}>
                  O que significa
                </p>
                <p className={`text-[11px] ${meta.text} leading-relaxed`}>{meta.explanation}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 pt-1 border-t border-white/60">
              <AlertOctagon className={`w-3.5 h-3.5 ${meta.textSoft} shrink-0 mt-0.5`} />
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${meta.textSoft} mb-1`}>
                  O que o analista faz
                </p>
                <p className={`text-[11px] ${meta.text} leading-relaxed`}>{meta.actionForAnalyst}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Finding list */}
      {open && hasDetails && (
        <div className="px-4 pb-4 border-t border-white/60 space-y-2 mt-2">
          {findings.map((f, i) => (
            <div
              key={f.id || i}
              className="p-3 bg-white/80 rounded-lg border border-white/80 space-y-1.5"
            >
              <div className="flex items-start gap-2">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${meta.badge} border text-[10px] font-bold shrink-0`}>
                  {i + 1}
                </span>
                <p className={`text-sm font-semibold ${meta.text} flex-1`}>
                  {f.titulo || f.title || 'Sem título'}
                </p>
                {f.deducao_pontos > 0 && (
                  <span className={`text-[10px] font-mono font-bold ${meta.textSoft} shrink-0`}>
                    ↑ {f.deducao_pontos} pts
                  </span>
                )}
              </div>
              {f.descricao && (
                <p className="text-[12px] text-[#002443]/75 leading-relaxed pl-7">
                  {f.descricao}
                </p>
              )}
              {f.evidencia && (
                <div className="pl-7 pt-1 border-t border-white/80 mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/40 mb-0.5">
                    Evidência
                  </p>
                  <p className="text-[11px] text-[#002443]/70 leading-relaxed italic">
                    {f.evidencia}
                  </p>
                </div>
              )}
              {f.recomendacao && (
                <div className="pl-7 pt-1 border-t border-white/80 mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#2bc196] mb-0.5">
                    Recomendação
                  </p>
                  <p className="text-[11px] text-[#002443]/80 leading-relaxed">
                    {f.recomendacao}
                  </p>
                </div>
              )}
              {(f.secao_questionario || f.fonte_externa) && (
                <div className="pl-7 flex items-center gap-3 text-[9px] text-[#002443]/40">
                  {f.secao_questionario && <span>📋 Seção: {f.secao_questionario}</span>}
                  {f.fonte_externa && <span>🔗 Fonte: {f.fonte_externa}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FindingsExplainer({ complianceScoreId, findingsBySeverity }) {
  // Fetch detailed findings if we have a compliance_score_id. This gives the actual
  // finding titles/evidence/recommendation, not just counts.
  const { data: findingsList = [] } = useQuery({
    queryKey: ['compliance-findings', complianceScoreId],
    queryFn: async () => {
      if (!complianceScoreId) return [];
      try {
        return await base44.entities.ComplianceFinding.filter(
          { compliance_score_id: complianceScoreId },
          '-severidade'
        );
      } catch {
        return [];
      }
    },
    enabled: !!complianceScoreId,
    staleTime: 60_000,
  });

  // Group fetched findings by normalised severity
  const grouped = useMemo(() => {
    const bySev = {};
    for (const f of findingsList) {
      const meta = getSeverityMeta(f.severidade);
      const key = Object.keys(SEVERITY_META).find(k => SEVERITY_META[k] === meta) || 'INFO';
      if (!bySev[key]) bySev[key] = [];
      bySev[key].push(f);
    }
    return bySev;
  }, [findingsList]);

  // Normalise the counts from findings_por_severidade
  const normalisedCounts = useMemo(() => {
    if (!findingsBySeverity) return {};
    const result = {};
    for (const [rawKey, count] of Object.entries(findingsBySeverity)) {
      const meta = getSeverityMeta(rawKey);
      const canonical = Object.keys(SEVERITY_META).find(k => SEVERITY_META[k] === meta) || 'INFO';
      result[canonical] = (result[canonical] || 0) + (count || 0);
    }
    return result;
  }, [findingsBySeverity]);

  // Merge counts from findings_por_severidade + fetched details
  const allKeys = Array.from(new Set([
    ...Object.keys(normalisedCounts),
    ...Object.keys(grouped),
  ])).sort((a, b) => (SEVERITY_META[a]?.order ?? 99) - (SEVERITY_META[b]?.order ?? 99));

  if (allKeys.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Header with hint */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50/70 border border-slate-200">
        <Search className="w-3.5 h-3.5 text-[#002443]/40 shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#002443]/60 leading-relaxed">
          <strong className="text-[#002443]/80">Findings</strong> são achados específicos detectados pela IA durante a análise, categorizados por severidade.
          Clique em cada card para ver os itens detalhados, ou no ícone <HelpCircle className="w-3 h-3 inline -mt-0.5" /> para entender o que significa cada severidade.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {allKeys.map(key => {
          const count = normalisedCounts[key] || (grouped[key]?.length || 0);
          if (count === 0) return null;
          return (
            <SeverityCard
              key={key}
              severityKey={key}
              count={count}
              findings={grouped[key] || []}
              defaultOpen={key === 'BLOQUEANTE' || key === 'CRITICAL'}
            />
          );
        })}
      </div>
    </div>
  );
}