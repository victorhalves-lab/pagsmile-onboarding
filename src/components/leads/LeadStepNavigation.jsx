import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function LeadStepNavigation({ currentStep, totalSteps }) {
  return (
    <div className="w-full">
      {/* Barra de progresso */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--pinbank-blue)]">
          Etapa {currentStep + 1} de {totalSteps}
        </span>
        <span className="text-sm text-[var(--pinbank-blue)]/60">
          {Math.round(((currentStep + 1) / totalSteps) * 100)}%
        </span>
      </div>
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[var(--pinbank-blue)] to-[var(--pinbank-blue)] rounded-full transition-all duration-500"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="flex flex-wrap gap-1.5 justify-center mt-3">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
              i < currentStep 
                ? 'bg-[var(--pinbank-blue)] text-white' 
                : i === currentStep
                ? 'bg-[var(--pinbank-blue)] text-white ring-3 ring-[var(--pinbank-blue)]/20 scale-110'
                : 'bg-slate-200 text-[var(--pinbank-blue)]/50'
            }`}>
              {i < currentStep ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                i + 1
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}