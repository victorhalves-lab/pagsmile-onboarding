import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function LeadStepNavigation({ currentStep, totalSteps }) {
  return (
    <div className="w-full">
      {/* Barra de progresso */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--pagsmile-blue)]">
          Etapa {currentStep + 1} de {totalSteps}
        </span>
        <span className="text-sm text-[var(--pagsmile-blue)]/60">
          {Math.round(((currentStep + 1) / totalSteps) * 100)}%
        </span>
      </div>
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[var(--pagsmile-blue)] to-[var(--pagsmile-green)] rounded-full transition-all duration-500"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="flex justify-between mt-3">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
              i < currentStep 
                ? 'bg-[var(--pagsmile-green)] text-white' 
                : i === currentStep
                ? 'bg-[var(--pagsmile-blue)] text-white ring-4 ring-[var(--pagsmile-blue)]/20'
                : 'bg-slate-200 text-[var(--pagsmile-blue)]/50'
            }`}>
              {i < currentStep ? (
                <CheckCircle className="w-4 h-4" />
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