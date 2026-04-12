import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, HelpCircle } from 'lucide-react';

/**
 * Overlay shown during FaceLiveness SDK execution.
 * Shows privacy mask explanation banner + countdown timer + difficulty button.
 */
export default function CafLivenessOverlay({ onDifficultyClick, timeoutSeconds = 90 }) {
  const [elapsed, setElapsed] = useState(0);
  const remaining = Math.max(0, timeoutSeconds - elapsed);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // After timeout, show difficulty prompt
  useEffect(() => {
    if (elapsed >= timeoutSeconds && onDifficultyClick) {
      onDifficultyClick();
    }
  }, [elapsed, timeoutSeconds]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <>
      {/* Top banner — privacy explanation */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 mb-3">
        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-[11px] text-amber-700 leading-tight">
          <strong>O efeito de contorno no rosto é normal</strong> — é uma proteção de privacidade. Siga as instruções.
        </p>
      </div>

      {/* Bottom bar — timer + help */}
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-1.5 text-[11px] text-[#002443]/40">
          <Clock className="w-3.5 h-3.5" />
          <span>Tempo restante: {mins}:{secs.toString().padStart(2, '0')}</span>
        </div>
        {elapsed > 20 && (
          <button
            onClick={onDifficultyClick}
            className="flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Estou com dificuldade
          </button>
        )}
      </div>
    </>
  );
}