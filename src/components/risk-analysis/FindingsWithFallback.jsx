import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronUp, HelpCircle, Info, Target, FileText, Link2, Search } from 'lucide-react';
import { SEVERITY_META, getSeverityMeta } from '../compliance/severityGlossary';
import { enrichRedFlag } from './redFlagEnricher';

/**
 * FindingsWithFallback — findings display with a 3-level fallback:
 *   1. Try ComplianceFinding entity (richest data)
 *   2. Fallback: reconstruct from red_flags + pontos_atencao + variaveis_negativas
 *   3. Last resort: show count with "contact compliance" note
 *
 * For EVERY severity bucket, clicking the card shows the individual findings
 * with title, why it matters, evidence, recommendation and source.
 */

function reconstructFindingsFromCompliance(cs) {
  if (!cs) return [];
  const synthesised = [];

  // A) Red flags → findings with severity inferred by enricher
  const redFlags = cs.red_flags || [];
  redFlags.forEach((flag, i) => {
    const enriched = enrichRedFlag(flag);
    synthesised.push({
      id: `rf-${i}`,
      severidade: enriched.severity,
      titulo: enriched.title,
      descricao: enriched.whyItMatters,
      evidencia: enriched.evidenceHints?.join('; ') || null,
      recomendacao: enriched.suggestedAction,
      fonte_externa: enriched.source,
      fonte_badge: enriched.sourceBadge,
      secao_questionario: enriched.dimension,
      origin: 'red_flag',
      deducao_pontos: 0,
    });
  });

  // B) Pontos de atenção → MEDIUM findings (unless already covered by red flag text)
  const attention = cs.pontos_atencao || [];
  const flagTexts = redFlags.map(f => f.toLowerCase());
  attention.forEach((pt, i) => {
    const ptLower = pt.toLowerCase();
    const alreadyCovered = flagTexts.some(ft => ft.includes(ptLower.slice(0, 30)) || ptLower.includes(ft.slice(0, 30)));
    if (!alreadyCovered) {
      synthesised.push({
        id: `pa-${i}`,
        severidade: 'MEDIUM',
        titulo: pt.length > 80 ? pt.slice(0, 77) + '…' : pt,
        descricao: pt,
        evidencia: null,
        recomendacao: 'Investigar nas respostas do questionário e dados BDC para contexto completo.',
        fonte_externa: 'SENTINEL — Ponto de atenção qualitativo',
        fonte_badge: 'SENTINEL',
        origin: 'ponto_atencao',
        deducao_pontos: 0,
      });
    }
  });

  // C) Variáveis negativas → INFO findings (add context)
  const negVars = cs.variaveis_negativas || [];
  negVars.forEach((v, i) => {
    synthesised.push({
      id: `vn-${i}`,
      severidade: 'INFO',
      titulo: `Variável aplicada: ${v}`,
      descricao: `Variável do framework V4 aplicada com impacto negativo no score. Consulte o detalhamento no bloco de Variáveis Aplicadas.`,
      evidencia: null,
      recomendacao: 'Ver detalhamento da variável no bloco de Análise Dimensional.',
      fonte_externa: 'Framework V4 — Variável determinística',
      fonte_badge: 'BDC',
      origin: 'variavel',
      deducao_pontos: 0,
    });
  });

  return synthesised;
}

function normaliseSeverityKey(sev) {
  const meta = getSeverityMeta(sev);
  return Object.keys(SEVERITY_META).find(k => SEVERITY_META[k] === meta) || 'INFO';
}

function groupBySeverity(findings) {
  const grouped = {};
  for (const f of findings) {
    const key = normaliseSeverityKey(f.severidade);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(f);
  }
  return grouped;
}

export default function FindingsWithFallback({ complianceScore }) {
  const complianceScoreId = complianceScore?.id;

  // Level 1: fetch actual ComplianceFinding entity
  const { data: dbFindings = [], isLoading } = useQuery({
    queryKey: ['compliance-findings-v2', complianceScoreId],
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

  // Level 2: reconstruct from complianceScore fields
  const reconstructed = useMemo(
    () => reconstructFindingsFromCompliance(complianceScore),
    [complianceScore]
  );

  // Decision: use DB findings if available, otherwise fallback to reconstruction
  const findings = dbFindings.length > 0 ? dbFindings : reconstructed;
  const usingFallback = dbFindings.length === 0 && reconstructed.length > 0;

  const grouped = useMemo(() => groupBySeverity(findings), [findings]);

  // Respect the original count from findings_por_severidade if DB is empty
  // but keep the detailed items from our reconstruction
  const fallbackCounts = complianceScore?.findings_por_severidade || {};
  const allKeys = Array.from(new Set([
    ...Object.keys(grouped),
    ...Object.keys(fallbackCounts).map(k => normaliseSeverityKey(k)),
  ])).sort((a, b) => (SEVERITY_META[a]?.order ?? 99) - (SEVERITY_META[b]?.order ?? 99));

  if (allKeys.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <p className="text-[12px] text-[#002443]/60 italic">
          Nenhum finding registrado para este caso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header explainer */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50/70 border border-slate-200">
        <Search className="w-3.5 h-3.5 text-[#002443]/40 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[11px] text-[#002443]/70 leading-relaxed">
            <strong className="text-[#002443]">Findings por severidade.</strong>{' '}
            Clique em qualquer card para ver os itens individuais com título, evidência, recomendação e fonte.
            Quanto mais grave a severidade, maior o impacto no score e mais urgente a investigação.
          </p>
          {usingFallback && (
            <p className="text-[10px] text-blue-600/70 mt-1 italic">
              ⓘ Findings detalhados reconstruídos a partir de red flags, pontos de atenção e variáveis do framework.
            </p>
          )}
        </div>
      </div>

      {/* Severity cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {allKeys.map(key => {
          const items = grouped[key] || [];
          // Use DB count if available, otherwise use reconstructed count, otherwise fallback_counts
          const count = items.length > 0
            ? items.length
            : (Object.entries(fallbackCounts).reduce((acc, [k, v]) => acc + (normaliseSeverityKey(k) === key ? (v || 0) : 0), 0));
          if (count === 0) return null;
          return (
            <SeverityCard
              key={key}
              severityKey={key}
              count={count}
              findings={items}
              defaultOpen={key === 'BLOQUEANTE' || key === 'CRITICAL'}
            />
          );
        })}
      </div>
    </div>
  );
}

function SeverityCard({ severityKey, count, findings, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const [showHelp, setShowHelp] = useState(false);
  const meta = getSeverityMeta(severityKey);
  const hasDetails = findings && findings.length > 0;

  return (
    <div className={`rounded-xl border ${meta.border} ${meta.bg} overflow-hidden`}>
      {/* Main button */}
      <button
        type="button"
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
            {hasDetails
              ? `Clique para ver os ${count} item(ns) detalhado(s)`
              : `${count} item(ns) — detalhes não disponíveis na base`}
          </p>
        </div>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); setShowHelp(!showHelp); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setShowHelp(!showHelp); } }}
          className={`p-1 rounded hover:bg-white/60 ${meta.textSoft} opacity-60 hover:opacity-100 cursor-pointer`}
          title="O que significa essa severidade?"
        >
          <HelpCircle className="w-4 h-4" />
        </span>
        {hasDetails && (open
          ? <ChevronUp className={`w-4 h-4 ${meta.textSoft}`} />
          : <ChevronDown className={`w-4 h-4 ${meta.textSoft}`} />
        )}
      </button>

      {/* Severity explanation */}
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
              <Target className={`w-3.5 h-3.5 ${meta.textSoft} shrink-0 mt-0.5`} />
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

      {/* Expanded findings list */}
      {open && hasDetails && (
        <div className="px-4 pb-4 border-t border-white/60 space-y-2.5 pt-3">
          {findings.map((f, i) => (
            <FindingItem key={f.id || i} finding={f} index={i + 1} meta={meta} />
          ))}
        </div>
      )}
      {open && !hasDetails && (
        <div className="px-4 pb-4 border-t border-white/60 pt-3">
          <p className={`text-[11px] ${meta.textSoft} italic`}>
            Contagem disponível ({count} item{count !== 1 ? 's' : ''}) mas os detalhes não foram persistidos na base.
            Consulte o bloco de Análise Dimensional (abaixo) para ver os itens BDC desta severidade.
          </p>
        </div>
      )}
    </div>
  );
}

function FindingItem({ finding, index, meta }) {
  return (
    <div className="p-3 bg-white/80 rounded-lg border border-white/80 space-y-2">
      {/* Title row */}
      <div className="flex items-start gap-2.5">
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${meta.badge} border text-[10px] font-bold shrink-0`}>
          {index}
        </span>
        <p className={`text-[13px] font-semibold ${meta.text} flex-1 leading-snug`}>
          {finding.titulo || finding.title || 'Sem título'}
        </p>
        {finding.deducao_pontos > 0 && (
          <span className={`text-[10px] font-mono font-bold ${meta.textSoft} shrink-0`}>
            ↑ {finding.deducao_pontos} pts
          </span>
        )}
      </div>

      {/* Description */}
      {finding.descricao && (
        <div className="pl-7">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#002443]/40 mb-0.5">
            Por que importa
          </p>
          <p className="text-[12px] text-[#002443]/75 leading-relaxed">
            {finding.descricao}
          </p>
        </div>
      )}

      {/* Evidence */}
      {finding.evidencia && (
        <div className="pl-7 pt-1 border-t border-white/70">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#002443]/40 mb-0.5">
            Evidência
          </p>
          <p className="text-[11px] text-[#002443]/70 leading-relaxed italic">
            {finding.evidencia}
          </p>
        </div>
      )}

      {/* Recommendation */}
      {finding.recomendacao && (
        <div className="pl-7 pt-1 border-t border-white/70">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#2bc196] mb-0.5">
            <Target className="w-2.5 h-2.5 inline mr-0.5" />
            Ação recomendada
          </p>
          <p className="text-[12px] text-[#002443]/80 leading-relaxed font-medium">
            {finding.recomendacao}
          </p>
        </div>
      )}

      {/* Source footer */}
      {(finding.fonte_externa || finding.secao_questionario || finding.fonte_badge) && (
        <div className="pl-7 pt-2 border-t border-white/70 flex items-center gap-2 flex-wrap">
          <Link2 className="w-2.5 h-2.5 text-[#002443]/30" />
          {finding.fonte_badge && (
            <span className="text-[9px] font-bold px-1.5 py-0 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {finding.fonte_badge}
            </span>
          )}
          {finding.fonte_externa && (
            <span className="text-[10px] text-[#002443]/50">{finding.fonte_externa}</span>
          )}
          {finding.secao_questionario && (
            <span className="text-[10px] text-[#002443]/40 flex items-center gap-0.5">
              <FileText className="w-2.5 h-2.5" />
              {finding.secao_questionario}
            </span>
          )}
        </div>
      )}
    </div>
  );
}