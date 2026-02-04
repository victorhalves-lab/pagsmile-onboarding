import React from 'react';
import { Progress } from '@/components/ui/progress';

export default function ProgressBar({ currentStep, totalSteps }) {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">
          Etapa {currentStep} de {totalSteps}
        </span>
        <span className="font-medium text-[var(--pagsmile-green)]">
          {percentage}%
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}