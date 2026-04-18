import React from 'react';
import { enrichRedFlag } from './redFlagEnricher';

/**
 * EscalationPointsList — extracts the top 3 escalation points that drove the
 * SENTINEL to elevate the decision. Renders as a numbered visual list inside
 * the Verdict Banner (Bloco 1).
 *
 * Source priority:
 *   1. red_flags with "SENTINEL:" prefix
 *   2. first 3 pontos_atencao
 *   3. first 3 red_flags of any kind
 */

export default function EscalationPointsList({ complianceScore, onboardingCase }) {
  const redFlags = onboardingCase?.redFlags || complianceScore?.red_flags || [];
  const sentinelFlags = redFlags.filter(f => /^sentinel:/i.test(f));
  const attention = complianceScore?.pontos_atencao || [];

  // Pick up to 3 points, preferring SENTINEL flags, then attention, then any flag
  const sources = [];
  sentinelFlags.forEach(f => { if (sources.length < 3) sources.push({ raw: f, kind: 'flag' }); });
  attention.forEach(a => { if (sources.length < 3) sources.push({ raw: a, kind: 'attention' }); });
  redFlags.forEach(f => {
    if (sources.length < 3 && !sources.some(s => s.raw === f)) {
      sources.push({ raw: f, kind: 'flag' });
    }
  });

  if (sources.length === 0) return null;

  const points = sources.map(s => {
    if (s.kind === 'flag') {
      const enr = enrichRedFlag(s.raw);
      return { title: enr.title, severity: enr.severity, source: enr.sourceBadge };
    }
    // plain attention text — use first sentence / up to 120 chars
    const clean = String(s.raw).replace(/\s+/g, ' ').trim();
    const short = clean.length > 120 ? clean.slice(0, 117) + '…' : clean;
    return { title: short, severity: 'MEDIUM', source: 'SENTINEL' };
  });

  return (
    <div className="mt-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-white/70 mb-2">
        Principais pontos identificados ({points.length})
      </p>
      <ol className="space-y-1.5">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[12px] text-white/80 leading-relaxed">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/15 text-white text-[10px] font-bold shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="flex-1">
              {p.title}
              {p.source && (
                <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-white/40">
                  · {p.source}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}