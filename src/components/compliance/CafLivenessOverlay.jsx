import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, HelpCircle, Eye, Volume2 } from 'lucide-react';

/**
 * Enhanced overlay shown during FaceLiveness SDK execution.
 * - Real-time guidance messages that change over time
 * - Countdown timer
 * - Difficulty button after 20s
 * - Progressive tips based on elapsed time
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

  // Dynamic guidance messages based on elapsed time
  const getGuidanceMessage = () => {
    if (elapsed < 5) return { text: 'Posicione seu rosto dentro do contorno oval na tela', icon: Eye };
    if (elapsed < 15) return { text: 'Olhe diretamente para a câmera e fique parado', icon: Eye };
    if (elapsed < 25) return { text: 'Mantenha a posição — o sistema está verificando...', icon: ShieldCheck };
    if (elapsed < 40) return { text: 'Verifique se a iluminação está boa — luz no rosto, não nas costas', icon: Volume2 };
    if (elapsed < 60) return { text: 'Tente se aproximar ou afastar um pouco da câmera', icon: Eye };
    return { text: 'Está demorando mais do que o normal — clique em "Estou com dificuldade"', icon: HelpCircle };
  };

  const guidance = getGuidanceMessage();
  const GuidanceIcon = guidance.icon;

  return (
    <>
      {/* Dynamic guidance banner */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-200 mb-3 transition-all duration-500">
        <GuidanceIcon className="w-4 h-4 text-blue-600 shrink-0" />
        <p className="text-[11px] text-blue-800 leading-tight font-medium">
          {guidance.text}
        </p>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50/60 border border-amber-100 mb-3">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <p className="text-[10px] text-amber-600 leading-tight">
          Verificação segura em andamento — siga as instruções acima
        </p>
      </div>

      {/* Bottom bar — timer + help */}
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-1.5 text-[11px] text-[#002443]/40">
          <Clock className="w-3.5 h-3.5" />
          <span>Tempo: {mins}:{secs.toString().padStart(2, '0')}</span>
        </div>
        {elapsed > 15 && (
          <button
            onClick={onDifficultyClick}
            className="flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-700 font-medium transition-colors bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Estou com dificuldade
          </button>
        )}
      </div>
    </>
  );
}