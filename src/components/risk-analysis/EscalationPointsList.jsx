import React from 'react';
import { enrichRedFlag } from './redFlagEnricher';
import { AlertOctagon, AlertTriangle, Info } from 'lucide-react';

/**
 * EscalationPointsList — lista TODOS os pontos que pesaram na decisão,
 * agrupados por severidade, SEM truncamento, com texto completo e enriquecimento.
 * Renderizado no Verdict Banner (bloco 1).
 */

const SEVERITY_ORDER = ['BLOQUEANTE', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
const SEVERITY_LABEL = {
  BLOQUEANTE: 'BLOQUEANTE',
  CRITICAL: 'CRÍTICO',
  HIGH: 'ALTO',
  MEDIUM: 'MÉDIO',
  LOW: 'BAIXO',
  INFO: 'INFO',
};
const SEVERITY_PILL = {
  BLOQUEANTE: 'bg-red-900/40 text-red-200 border-red-400/30',
  CRITICAL: 'bg-red-500/20 text-red-200 border-red-400/30',
  HIGH: 'bg-orange-500/20 text-orange-200 border-orange-400/30',
  MEDIUM: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
  LOW: 'bg-blue-500/15 text-blue-200 border-blue-400/30',
  INFO: 'bg-white/10 text-white/70 border-white/20',
};

export default function EscalationPointsList({ complianceScore, onboardingCase }) {
  const redFlags = onboardingCase?.redFlags || complianceScore?.red_flags || [];
  const attention = complianceScore?.pontos_atencao || [];

  // Dedupe — atenção pode repetir red flag
  const seen = new Set();
  const allRaw = [];
  redFlags.forEach(f => { if (!seen.has(f)) { seen.add(f); allRaw.push({ raw: f, kind: 'flag' }); } });
  attention.forEach(a => { if (!seen.has(a)) { seen.add(a); allRaw.push({ raw: a, kind: 'attention' }); } });

  if (allRaw.length === 0) return null;

  // Enriquecer cada um e agrupar por severidade
  const enriched = allRaw.map(({ raw, kind }) => {
    const enr = enrichRedFlag(raw);
    return { ...enr, kind };
  });

  const grouped = {};
  SEVERITY_ORDER.forEach(s => { grouped[s] = []; });
  enriched.forEach(e => {
    const sev = SEVERITY_ORDER.includes(e.severity) ? e.severity : 'MEDIUM';
    grouped[sev].push(e);
  });

  let counter = 0;

  return (
    <div className="mt-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-white/70 mb-3">
        Pontos identificados na análise ({enriched.length})
        <span className="text-[10px] font-normal text-white/40 normal-case ml-2">
          — todos os pontos, agrupados por severidade
        </span>
      </p>

      <div className="space-y-4">
        {SEVERITY_ORDER.map(sev => {
          const items = grouped[sev];
          if (items.length === 0) return null;
          const SeverityIcon = sev === 'BLOQUEANTE' || sev === 'CRITICAL'
            ? AlertOctagon
            : (sev === 'HIGH' || sev === 'MEDIUM' ? AlertTriangle : Info);

          return (
            <div key={sev}>
              <div className="flex items-center gap-2 mb-2">
                <SeverityIcon className="w-3.5 h-3.5 text-white/60" />
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${SEVERITY_PILL[sev]}`}>
                  {SEVERITY_LABEL[sev]} · {items.length}
                </span>
              </div>
              <ol className="space-y-2">
                {items.map((p, i) => {
                  counter += 1;
                  return (
                    <li key={`${sev}-${i}`} className="bg-white/5 rounded-lg border border-white/10 p-3">
                      <div className="flex items-start gap-2.5">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/15 text-white text-[10px] font-bold shrink-0 mt-0.5">
                          {counter}
                        </span>
                        <div className="flex-1 min-w-0">
                          {/* Título COMPLETO, sem truncar */}
                          <p className="text-[13px] font-semibold text-white leading-snug whitespace-normal break-words">
                            {p.title}
                          </p>

                          {/* Texto literal se for diferente do título enriquecido */}
                          {p.matched && p.text && p.text !== p.title && (
                            <p className="text-[11px] text-white/60 mt-1.5 leading-relaxed whitespace-pre-wrap break-words italic">
                              "{p.text}"
                            </p>
                          )}

                          {/* Explicação completa */}
                          <p className="text-[11.5px] text-white/70 mt-2 leading-relaxed whitespace-pre-wrap break-words">
                            {p.whyItMatters}
                          </p>

                          {/* Ação sugerida em destaque */}
                          <div className="mt-2.5 bg-white/10 rounded-md px-2.5 py-1.5 border border-white/10">
                            <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-1">Ação sugerida</p>
                            <p className="text-[11.5px] text-white/85 leading-relaxed whitespace-pre-wrap break-words">
                              {p.suggestedAction}
                            </p>
                          </div>

                          {/* Fonte */}
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">
                              Fonte:
                            </span>
                            <span className="text-[10px] text-white/60 whitespace-normal break-words">
                              {p.source}
                            </span>
                            {p.sourceBadge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/70 border border-white/10">
                                {p.sourceBadge}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
    </div>
  );
}