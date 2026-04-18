import React, { useMemo, useState } from 'react';
import { parseSentinelText } from '@/lib/sentinelTextParser';
import SentinelTextFormatter from '../compliance/SentinelTextFormatter';
import { List, ChevronRight } from 'lucide-react';

/**
 * SentinelDocumentRenderer — turns raw SENTINEL analysis text into a navigable
 * document with a table of contents and clearly separated section cards.
 */

const CONCLUSION_IDS = new Set(['conclusao', 'recomendacao', 'condicoes']);

function isConclusionSection(section) {
  if (!section) return false;
  const base = (section.id || '').split('-')[0];
  return CONCLUSION_IDS.has(base);
}

function conclusionTone(decision) {
  const d = (decision || '').toLowerCase();
  if (d.includes('recusa')) return { bg: 'bg-red-50', border: 'border-red-300', barBg: 'bg-red-500', headText: 'text-red-800', chip: 'bg-red-600 text-white' };
  if (d.includes('manual') || d.includes('condi')) return { bg: 'bg-amber-50', border: 'border-amber-300', barBg: 'bg-amber-500', headText: 'text-amber-800', chip: 'bg-amber-500 text-white' };
  if (d.includes('aprov')) return { bg: 'bg-emerald-50', border: 'border-emerald-300', barBg: 'bg-emerald-500', headText: 'text-emerald-800', chip: 'bg-emerald-600 text-white' };
  return { bg: 'bg-slate-50', border: 'border-slate-300', barBg: 'bg-slate-500', headText: 'text-[#002443]', chip: 'bg-slate-700 text-white' };
}

export default function SentinelDocumentRenderer({ text, showIndex = true, compact = false, decision }) {
  const sections = useMemo(() => parseSentinelText(text), [text]);
  const [activeId, setActiveId] = useState(sections[0]?.id);

  if (!text) return null;
  if (sections.length === 0) {
    return <SentinelTextFormatter text={text} />;
  }

  // If only one section, render without TOC
  const singleSection = sections.length === 1;

  const handleJump = (id) => {
    setActiveId(id);
    const el = document.getElementById(`sentinel-sec-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-4">
      {/* Table of Contents */}
      {showIndex && !singleSection && sections.length > 1 && (
        <div className="rounded-xl border border-[#002443]/10 bg-slate-50/60 p-3">
          <div className="flex items-center gap-2 mb-2">
            <List className="w-3.5 h-3.5 text-[#002443]/50" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/50">
              Índice do parecer ({sections.length} seções)
            </span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {sections.map(sec => (
              <li key={sec.id}>
                <button
                  type="button"
                  onClick={() => handleJump(sec.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[12px] transition-all ${
                    activeId === sec.id
                      ? 'bg-white border border-[#2bc196]/30 text-[#002443] font-semibold shadow-sm'
                      : 'text-[#002443]/70 hover:bg-white/70 hover:text-[#002443]'
                  }`}
                >
                  <span className="text-sm leading-none">{sec.icon}</span>
                  <span className="flex-1 truncate">{sec.title}</span>
                  <ChevronRight className="w-3 h-3 text-[#002443]/30" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((sec, idx) => (
          <SectionCard key={sec.id} section={sec} index={idx} compact={compact} decision={decision} />
        ))}
      </div>
    </div>
  );
}

function SectionCard({ section, index, compact, decision }) {
  const isConclusion = isConclusionSection(section);
  const tone = isConclusion ? conclusionTone(decision) : null;

  const rootClass = isConclusion
    ? `rounded-xl border-2 ${tone.border} ${tone.bg} overflow-hidden scroll-mt-20 shadow-sm`
    : 'rounded-xl border border-[#002443]/8 bg-white overflow-hidden scroll-mt-20';

  return (
    <div id={`sentinel-sec-${section.id}`} className={rootClass}>
      {isConclusion && <div className={`h-1 ${tone.barBg}`} />}

      {/* Section header */}
      <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${isConclusion ? `${tone.border}` : 'border-[#002443]/5 bg-gradient-to-r from-slate-50 to-transparent'}`}>
        <span className="text-xl leading-none">{section.icon}</span>
        <div className="flex-1 min-w-0">
          <h5 className={`text-sm font-bold ${isConclusion ? tone.headText : 'text-[#002443]'}`}>
            {index > 0 && <span className="opacity-40 font-mono mr-2">{String(index).padStart(2, '0')}</span>}
            {section.title}
          </h5>
          <p className="text-[10px] opacity-60">
            {section.paragraphs.length} parágrafo{section.paragraphs.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isConclusion && decision && (
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${tone.chip}`}>
            {decision}
          </span>
        )}
      </div>

      {/* Section body */}
      <div className="p-4 space-y-3">
        {section.paragraphs.map((p, i) => (
          <Paragraph key={i} text={p} isFirst={i === 0} compact={compact} />
        ))}
      </div>
    </div>
  );
}

function Paragraph({ text, isFirst, compact }) {
  // Split off the first sentence to highlight it (lead-style)
  const firstSentenceMatch = text.match(/^([^.!?]{10,}[.!?])\s+(.*)/s);
  const hasLead = isFirst && firstSentenceMatch && firstSentenceMatch[2].length > 10;

  if (hasLead) {
    const [, lead, rest] = firstSentenceMatch;
    return (
      <div className={compact ? 'text-xs' : 'text-sm'}>
        <p className="text-[#002443] font-semibold leading-relaxed mb-1.5">
          <SentinelTextFormatter text={lead} variant={compact ? 'compact' : 'default'} />
        </p>
        <div className="text-[#002443]/80 leading-relaxed">
          <SentinelTextFormatter text={rest} variant={compact ? 'compact' : 'default'} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${compact ? 'text-xs' : 'text-sm'} text-[#002443]/80 leading-relaxed`}>
      <SentinelTextFormatter text={text} variant={compact ? 'compact' : 'default'} />
    </div>
  );
}