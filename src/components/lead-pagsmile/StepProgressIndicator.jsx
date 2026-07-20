import React from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * Shows "X de Y campos obrigatórios preenchidos" for the current step,
 * helping the user see progress before clicking "Next".
 */
export default function StepProgressIndicator({ total, filled }) {
  if (total === 0) return null;
  const pct = Math.round((filled / total) * 100);
  const isComplete = filled === total;

  return (
    <div className="flex items-center gap-2 text-[10px] font-semibold">
      {isComplete ? (
        <>
          <CheckCircle2 className="w-3 h-3 text-[#1356E2]" />
          <span className="text-[#1356E2]">Etapa completa</span>
        </>
      ) : (
        <>
          <span className="text-[#0A0A0A]/50">
            {filled} de {total} obrigatórios · {pct}%
          </span>
          <div className="w-16 h-1 bg-[#0A0A0A]/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1356E2] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}