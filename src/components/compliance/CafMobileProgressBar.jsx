import React from 'react';
import { FileCheck, ScanFace, CheckCircle2, Clock } from 'lucide-react';

/**
 * Compact sticky progress bar visible during CAF capture (mobile-first).
 * Shows the client "Step X of 3" + remaining time so they know how much is left.
 * Reduces anxiety during long captures.
 */
export default function CafMobileProgressBar({ phase, savedResults }) {
  // Map phase → step number (1-based)
  const getStepInfo = () => {
    if (phase === 'ready' || phase === 'loading') {
      return { step: 0, label: 'Preparação', icon: FileCheck, timeLeft: '~2 min' };
    }
    if (phase === 'doc_front') {
      return { step: 1, label: 'Documento (frente)', icon: FileCheck, timeLeft: '~90 seg' };
    }
    if (phase === 'doc_back') {
      return { step: 2, label: 'Documento (verso)', icon: FileCheck, timeLeft: '~60 seg' };
    }
    if (phase === 'liveness_prep' || phase === 'liveness') {
      return { step: 3, label: 'Prova de vida', icon: ScanFace, timeLeft: '~30 seg' };
    }
    if (phase === 'done') {
      return { step: 3, label: 'Concluído!', icon: CheckCircle2, timeLeft: '✓' };
    }
    return null;
  };

  const info = getStepInfo();
  if (!info || info.step === 0) return null;

  const TOTAL_STEPS = 3;
  const percent = Math.round((info.step / TOTAL_STEPS) * 100);
  const Icon = info.icon;

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm -mx-4 md:mx-0 md:rounded-xl md:border md:mb-3">
      <div className="px-4 py-2.5 md:px-4 md:py-3">
        {/* Row 1: step badge + label + time */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-100 shrink-0">
              <Icon className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 leading-tight">
                Passo {info.step} de {TOTAL_STEPS}
              </p>
              <p className="text-xs font-semibold text-[#002443] leading-tight truncate">
                {info.label}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#002443]/60 shrink-0 bg-slate-50 px-2 py-1 rounded-md">
            <Clock className="w-3 h-3" />
            <span className="font-medium">{info.timeLeft}</span>
          </div>
        </div>

        {/* Row 2: progress bar */}
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Row 3: step pills (desktop only) */}
        <div className="hidden md:flex items-center gap-1.5 mt-2">
          {[1, 2, 3].map((s) => {
            const done = s < info.step || (s === 1 && savedResults?.front) || (s === 2 && savedResults?.back) || (s === 3 && savedResults?.liveness);
            const active = s === info.step;
            return (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-all ${
                  done ? 'bg-emerald-500' : active ? 'bg-purple-500' : 'bg-slate-200'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}