import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export default function StepNavigation({ 
  steps, 
  currentStep, 
  onStepClick,
  totalSteps,
  className 
}) {
  const count = totalSteps || steps?.length || 0;

  return (
    <div className={cn("w-full", className)}>
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#002443]">
          Etapa {currentStep} de {count}
        </span>
        <span className="text-sm text-[#002443]/60">
          {Math.round((currentStep / count) * 100)}%
        </span>
      </div>
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
        <div 
          className="h-full bg-gradient-to-r from-[#002443] to-[#2bc196] rounded-full transition-all duration-500"
          style={{ width: `${(currentStep / count) * 100}%` }}
        />
      </div>

      {/* Step dots - horizontal */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {Array.from({ length: count }).map((_, i) => {
          const stepNumber = i + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isClickable = stepNumber <= currentStep;

          return (
            <button
              key={i}
              onClick={() => isClickable && onStepClick?.(stepNumber)}
              disabled={!isClickable}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200",
                isCurrent && "bg-[#002443] text-white ring-3 ring-[#002443]/20 scale-110",
                isCompleted && "bg-[#2bc196] text-white cursor-pointer hover:scale-110",
                !isCurrent && !isCompleted && "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}