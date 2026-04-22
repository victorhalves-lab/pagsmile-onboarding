import React from 'react';
import CafVerificationStep from '@/components/compliance/CafVerificationStep';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

/**
 * Wrapper for the existing CafVerificationStep.
 * The step itself handles all SDK loading, capture and backend submission.
 * On completion, calls onComplete(result).
 */
export default function StepCafV2({
  merchant, caseId, onBack, onComplete, canGoBack,
}) {
  return (
    <div>
      <CafVerificationStep
        personName={merchant?.fullName || ''}
        personCpf={merchant?.cpfCnpj || ''}
        onboardingCaseId={caseId}
        onComplete={(result) => onComplete(result)}
      />

      {canGoBack && (
        <div className="flex justify-start mt-6 pt-4 border-t border-slate-100">
          <Button variant="ghost" onClick={onBack} className="text-slate-500 h-9">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </div>
      )}
    </div>
  );
}