import React from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * Small, reusable step-pill components used by ComplianceDocOnly (and possibly other
 * public flows). Keeps the page file lean.
 */

export function StepPill({ active, done, label, number, tone = 'blue' }) {
  const tones = {
    blue: {
      active: 'bg-blue-100 text-blue-700 ring-2 ring-blue-300',
      number: 'bg-blue-600',
    },
    purple: {
      active: 'bg-purple-100 text-purple-700 ring-2 ring-purple-300',
      number: 'bg-purple-600',
    },
  };
  const palette = tones[tone] || tones.blue;

  const classes = done
    ? 'bg-green-100 text-green-700'
    : active
    ? palette.active
    : 'bg-slate-100 text-slate-400';

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${classes}`}>
      {done ? (
        <CheckCircle2 className="w-3.5 h-3.5" />
      ) : (
        <span className={`w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center ${active ? palette.number : 'bg-slate-300'}`}>
          {number}
        </span>
      )}
      {label}
    </div>
  );
}

export function StepSep() {
  return <div className="w-6 md:w-8 h-0.5 bg-slate-200" />;
}