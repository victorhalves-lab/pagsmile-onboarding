import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Link2 } from 'lucide-react';

/**
 * RiskPositivesAndConcerns v2 — each item has an always-visible "Why" inline
 * explanation. If we can match it with evidence from red_flags or variables,
 * we show the source chip too.
 */

function tryExtractWhy(text) {
  // Common patterns: "Comprova X (Questionário seção 4.2)", "X — Y", "X: justificativa"
  const dashMatch = text.match(/^(.+?)\s*[—–-]\s*(.+)$/);
  if (dashMatch && dashMatch[2].length > 15) {
    return { statement: dashMatch[1].trim(), why: dashMatch[2].trim() };
  }
  const colonMatch = text.match(/^(.+?):\s*(.+)$/);
  if (colonMatch && colonMatch[2].length > 15) {
    return { statement: colonMatch[1].trim(), why: colonMatch[2].trim() };
  }
  const parenMatch = text.match(/^(.+?)\s*\(([^)]{10,})\)\s*$/);
  if (parenMatch) {
    return { statement: parenMatch[1].trim(), why: parenMatch[2].trim() };
  }
  return { statement: text, why: null };
}

function inferSource(text) {
  const lower = text.toLowerCase();
  if (lower.includes('questionário') || lower.includes('questionario') || lower.includes('declarou') || lower.includes('informou')) {
    return { label: 'Questionário', tone: 'bg-blue-50 text-blue-700 border-blue-200' };
  }
  if (lower.includes('bdc') || lower.includes('receita') || lower.includes('cnpj') || lower.includes('cnae')) {
    return { label: 'BDC', tone: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  }
  if (lower.includes('caf') || lower.includes('liveness') || lower.includes('facematch') || lower.includes('biometria')) {
    return { label: 'CAF', tone: 'bg-purple-50 text-purple-700 border-purple-200' };
  }
  if (lower.includes('processo') || lower.includes('dívida') || lower.includes('divida')) {
    return { label: 'Compliance', tone: 'bg-red-50 text-red-700 border-red-200' };
  }
  return null;
}

function EnrichedItem({ text, tone }) {
  const [open, setOpen] = useState(false);
  const { statement, why } = tryExtractWhy(text);
  const source = inferSource(text);
  const Icon = tone === 'positive' ? CheckCircle2 : AlertTriangle;
  const iconColor = tone === 'positive' ? 'text-emerald-500' : 'text-amber-500';
  const textColor = tone === 'positive' ? 'text-emerald-800' : 'text-amber-800';
  const softColor = tone === 'positive' ? 'text-emerald-700/80' : 'text-amber-700/80';
  const borderColor = tone === 'positive' ? 'border-emerald-100' : 'border-amber-100';

  const hasExpansion = !!why;

  return (
    <div className={`rounded-lg border ${borderColor} bg-white/60 p-2.5`}>
      <div className="flex items-start gap-2">
        <Icon className={`w-3.5 h-3.5 ${iconColor} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`text-[12px] font-semibold ${textColor} leading-snug`}>
            {statement}
          </p>

          {/* Inline "Por quê?" always visible if detected */}
          {why && (
            <div className="mt-1.5 pt-1.5 border-t border-current/10">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${softColor} mb-0.5`}>
                Por quê?
              </p>
              <p className={`text-[11px] ${softColor} leading-relaxed`}>{why}</p>
            </div>
          )}

          {/* Source chip */}
          {source && (
            <div className="mt-1.5 flex items-center gap-1">
              <Link2 className="w-2.5 h-2.5 text-[#002443]/30" />
              <span className={`text-[9px] font-bold px-1.5 py-0 rounded border ${source.tone}`}>
                Fonte: {source.label}
              </span>
            </div>
          )}

          {/* Expand for raw text (audit) */}
          {hasExpansion && (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className={`mt-1 text-[9px] ${softColor} hover:underline flex items-center gap-0.5`}
            >
              {open ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              Ver texto literal
            </button>
          )}
          {open && hasExpansion && (
            <code className={`block mt-1 p-2 rounded bg-white/80 text-[10px] font-mono ${softColor} leading-relaxed border ${borderColor}`}>
              {text}
            </code>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RiskPositivesAndConcerns({ complianceScore }) {
  const positives = complianceScore?.pontos_positivos || [];
  const concerns = complianceScore?.pontos_atencao || [];

  if (positives.length === 0 && concerns.length === 0) return null;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {positives.length > 0 && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-emerald-800">Pontos Positivos ({positives.length})</h4>
          </div>
          <p className="text-[10px] text-emerald-700/50 mb-3">
            Fatores que reduzem risco e suportam aprovação.
          </p>
          <div className="space-y-2">
            {positives.map((p, i) => <EnrichedItem key={i} text={p} tone="positive" />)}
          </div>
        </div>
      )}
      {concerns.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-bold text-amber-800">Pontos de Atenção ({concerns.length})</h4>
          </div>
          <p className="text-[10px] text-amber-700/50 mb-3">
            Fatores qualitativos identificados pela IA que merecem investigação.
          </p>
          <div className="space-y-2">
            {concerns.map((c, i) => <EnrichedItem key={i} text={c} tone="concern" />)}
          </div>
        </div>
      )}
    </div>
  );
}