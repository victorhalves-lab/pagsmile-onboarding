import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export default function StepNavigation({ 
  steps, 
  currentStep, 
  onStepClick,
  className 
}) {
  return (
    <nav className={cn("space-y-1", className)}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const Icon = step.icon;

        return (
          <button
            key={step.id}
            onClick={() => stepNumber <= currentStep && onStepClick(stepNumber)}
            disabled={stepNumber > currentStep}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
              isCurrent && "bg-[var(--pagsmile-green)]/10 border border-[var(--pagsmile-green)]",
              isCompleted && "hover:bg-slate-50",
              !isCurrent && !isCompleted && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium",
              isCurrent && "bg-[var(--pagsmile-green)] text-white",
              isCompleted && "bg-[var(--pagsmile-green)] text-white",
              !isCurrent && !isCompleted && "bg-slate-200 text-slate-500"
            )}>
              {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium truncate",
                isCurrent && "text-[var(--pagsmile-green)]",
                isCompleted && "text-slate-700",
                !isCurrent && !isCompleted && "text-slate-400"
              )}>
                {step.title}
              </p>
            </div>
          </button>
        );
      })}
    </nav>
  );
}