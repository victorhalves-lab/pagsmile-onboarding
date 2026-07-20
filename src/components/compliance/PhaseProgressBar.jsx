import React from 'react';
import { CheckCircle2, FileText, FileUp, ScanFace, PartyPopper } from 'lucide-react';

/**
 * Top-of-page progress bar showing the 4 phases of compliance onboarding.
 * Example usage: <PhaseProgressBar current="documents" hasDocs hasCaf />
 */
const PHASES = [
  { id: 'questionnaire', label: 'Questionário', icon: FileText },
  { id: 'documents', label: 'Documentos', icon: FileUp },
  { id: 'caf', label: 'Verificação', icon: ScanFace },
  { id: 'done', label: 'Concluído', icon: PartyPopper },
];

export default function PhaseProgressBar({ current = 'questionnaire', showCaf = true }) {
  const visiblePhases = showCaf ? PHASES : PHASES.filter(p => p.id !== 'caf');
  const currentIdx = visiblePhases.findIndex(p => p.id === current);

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        {visiblePhases.map((phase, idx) => {
          const Icon = phase.icon;
          const isDone = idx < currentIdx;
          const isActive = idx === currentIdx;
          return (
            <React.Fragment key={phase.id}>
              <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isDone
                      ? 'bg-[#1356E2] text-white'
                      : isActive
                      ? 'bg-[#0A0A0A] text-white ring-4 ring-[#0A0A0A]/15'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[10px] md:text-xs font-semibold text-center truncate w-full ${
                    isActive ? 'text-[#0A0A0A]' : isDone ? 'text-[#1356E2]' : 'text-slate-400'
                  }`}
                >
                  {phase.label}
                </span>
              </div>
              {idx < visiblePhases.length - 1 && (
                <div className={`flex-1 h-1 rounded-full transition-all ${
                  isDone ? 'bg-[#1356E2]' : 'bg-slate-200'
                }`} style={{ maxWidth: 80 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}