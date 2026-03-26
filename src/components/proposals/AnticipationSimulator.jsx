import React from 'react';
import { Clock, RotateCcw } from 'lucide-react';

const SIMULATION_OPTIONS = [
  { value: 'D+2', label: 'D+2' },
  { value: 'D+7', label: 'D+7' },
  { value: 'D+15', label: 'D+15' },
  { value: 'D+30', label: 'D+30' },
  { value: 'FLUXO', label: 'No Fluxo' },
];

export default function AnticipationSimulator({ originalPrazo, activePrazo, onPrazoChange }) {
  const isSimulating = activePrazo !== originalPrazo;

  return (
    <div className="bg-[#002443]/5 rounded-xl p-4 border border-[#002443]/10">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-[#2bc196]" />
        <span className="text-xs font-bold text-[#002443] uppercase tracking-wide">
          Simular Prazo de Antecipação
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {SIMULATION_OPTIONS.map(opt => {
          const isOriginal = opt.value === originalPrazo;
          const isActive = opt.value === activePrazo;

          return (
            <button
              key={opt.value}
              onClick={() => onPrazoChange(opt.value)}
              className={`
                relative px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200
                ${isActive
                  ? 'bg-[#2bc196] text-white shadow-md shadow-[#2bc196]/20'
                  : 'bg-white text-[#002443]/60 hover:text-[#002443] hover:bg-white/80 border border-[#002443]/10'
                }
              `}
            >
              {opt.label}
              {isOriginal && (
                <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-amber-400 border border-white" title="Prazo da proposta" />
              )}
            </button>
          );
        })}
      </div>

      {isSimulating && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#002443]/10">
          <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
            ⚠️ Simulação: exibindo taxas com prazo {activePrazo}
          </p>
          <button
            onClick={() => onPrazoChange(originalPrazo)}
            className="flex items-center gap-1 text-[10px] font-bold text-[#2bc196] hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            Voltar ao original ({originalPrazo})
          </button>
        </div>
      )}
    </div>
  );
}