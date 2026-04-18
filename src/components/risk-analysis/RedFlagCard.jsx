import React, { useState } from 'react';
import {
  AlertOctagon, AlertTriangle, Info, ChevronDown, ChevronUp,
  Target, Compass, Lightbulb, Link2, FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { resolveDimension } from './dimensionGlossary';

/**
 * RedFlagCard — displays ONE enriched red flag as a mini-dossier with four
 * always-visible sections: Why it matters / Evidence / Action / Source.
 *
 * Props:
 *  - flag: EnrichedRedFlag (from redFlagEnricher)
 *  - defaultOpen: bool (first card open, others collapsed)
 */

const SEVERITY_STYLE = {
  BLOQUEANTE: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    bar: 'bg-red-700',
    text: 'text-red-800',
    textSoft: 'text-red-700/80',
    badge: 'bg-red-700 text-white border-red-800',
    icon: AlertOctagon,
    iconColor: 'text-red-700',
    label: 'BLOQUEANTE',
  },
  CRITICAL: {
    bg: 'bg-red-50/60',
    border: 'border-red-200',
    bar: 'bg-red-500',
    text: 'text-red-700',
    textSoft: 'text-red-600/80',
    badge: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertOctagon,
    iconColor: 'text-red-500',
    label: 'CRÍTICO',
  },
  HIGH: {
    bg: 'bg-orange-50/60',
    border: 'border-orange-200',
    bar: 'bg-orange-500',
    text: 'text-orange-800',
    textSoft: 'text-orange-700/80',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: AlertTriangle,
    iconColor: 'text-orange-500',
    label: 'ALTO',
  },
  MEDIUM: {
    bg: 'bg-amber-50/60',
    border: 'border-amber-200',
    bar: 'bg-amber-400',
    text: 'text-amber-800',
    textSoft: 'text-amber-700/80',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    label: 'MÉDIO',
  },
  LOW: {
    bg: 'bg-blue-50/60',
    border: 'border-blue-200',
    bar: 'bg-blue-400',
    text: 'text-blue-700',
    textSoft: 'text-blue-600/80',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Info,
    iconColor: 'text-blue-500',
    label: 'BAIXO',
  },
  INFO: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    bar: 'bg-slate-400',
    text: 'text-slate-700',
    textSoft: 'text-slate-600/80',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Info,
    iconColor: 'text-slate-500',
    label: 'INFO',
  },
};

const SOURCE_TONE = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  slate: 'bg-slate-50 text-slate-700 border-slate-200',
};

export default function RedFlagCard({ flag, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const style = SEVERITY_STYLE[flag.severity] || SEVERITY_STYLE.MEDIUM;
  const Icon = style.icon;
  const dim = flag.dimension ? resolveDimension(flag.dimension) : null;

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden`}>
      {/* Top bar */}
      <div className={`h-1 ${style.bar}`} />

      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-start gap-3 text-left hover:bg-white/40 transition-colors"
      >
        <Icon className={`w-5 h-5 ${style.iconColor} shrink-0 mt-0.5`} />

        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <Badge className={`text-[9px] font-bold ${style.badge} border`}>{style.label}</Badge>
            <Badge className={`text-[9px] font-bold ${SOURCE_TONE[flag.sourceTone] || SOURCE_TONE.slate} border`}>
              {flag.sourceBadge}
            </Badge>
            {dim && (
              <Badge className="text-[9px] font-semibold bg-white/60 text-[#002443]/70 border border-[#002443]/10">
                {dim.icon} {dim.label}
              </Badge>
            )}
          </div>

          {/* Title — ALWAYS COMPLETE, NO TRUNCATION */}
          <p className={`text-sm font-bold ${style.text} leading-snug whitespace-normal break-words`}>{flag.title}</p>

          {/* Preview of description (collapsed state) — fully visible, no line-clamp */}
          {!open && (
            <p className={`text-[12px] ${style.textSoft} mt-1.5 leading-relaxed whitespace-normal break-words`}>
              {flag.whyItMatters}
            </p>
          )}
        </div>

        {open ? <ChevronUp className={`w-4 h-4 ${style.iconColor} shrink-0 mt-1`} />
              : <ChevronDown className={`w-4 h-4 ${style.iconColor} shrink-0 mt-1`} />}
      </button>

      {/* Expanded body */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/60 pt-3">
          {/* Texto literal do alerta — em destaque */}
          <Section icon={FileText} title="Texto literal do alerta" style={style}>
            <p className={`text-[12px] ${style.text} font-medium leading-relaxed whitespace-pre-wrap break-words bg-white/60 rounded-lg p-3 border border-white/80`}>
              {flag.text}
            </p>
          </Section>

          {/* Why it matters — detalhado */}
          <Section icon={Compass} title="Por que isso importa" style={style}>
            <p className={`text-[12px] ${style.textSoft} leading-relaxed whitespace-pre-wrap break-words`}>{flag.whyItMatters}</p>
          </Section>

          {/* Evidence hints */}
          {flag.evidenceHints && flag.evidenceHints.length > 0 && (
            <Section icon={FileText} title="Evidências a verificar" style={style}>
              <ul className="space-y-1.5">
                {flag.evidenceHints.map((e, i) => (
                  <li key={i} className={`text-[12px] ${style.textSoft} leading-relaxed flex items-start gap-2`}>
                    <span className={`inline-block w-1 h-1 rounded-full ${style.bar} shrink-0 mt-2`} />
                    <span className="flex-1 whitespace-normal break-words">{e}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Suggested action */}
          <Section icon={Target} title="Ação sugerida" style={style} highlight>
            <p className={`text-[12px] ${style.text} font-medium leading-relaxed whitespace-pre-wrap break-words`}>
              {flag.suggestedAction}
            </p>
          </Section>

          {/* Source */}
          <div className={`flex items-start gap-2 pt-2 border-t border-white/60`}>
            <Link2 className={`w-3 h-3 ${style.iconColor} shrink-0 mt-0.5`} />
            <div className="flex-1">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${style.text} mb-0.5`}>
                Fonte do alerta
              </p>
              <p className={`text-[10px] ${style.textSoft} leading-relaxed`}>{flag.source}</p>
              {!flag.matched && (
                <p className={`text-[9px] ${style.textSoft} italic mt-1`}>
                  ⓘ Alerta sem enriquecimento catalogado — exibindo texto literal do sistema
                </p>
              )}
            </div>
          </div>

          {/* Raw text (for audit trail) */}
          <details className="pt-1">
            <summary className={`text-[9px] ${style.textSoft} cursor-pointer hover:underline`}>
              Ver texto literal do alerta (auditoria)
            </summary>
            <code className={`block mt-1 p-2 rounded bg-white/60 text-[10px] font-mono ${style.textSoft} leading-relaxed`}>
              {flag.raw}
            </code>
          </details>
        </div>
      )}
    </div>
  );
}

function Section({ icon: SIcon, title, style, highlight = false, children }) {
  return (
    <div className={highlight ? 'p-2.5 rounded-lg bg-white/70 border border-white/80' : ''}>
      <div className="flex items-center gap-1.5 mb-1">
        <SIcon className={`w-3 h-3 ${style.iconColor}`} />
        <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>{title}</span>
      </div>
      {children}
    </div>
  );
}