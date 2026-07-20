import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import DynamicQuestionRenderer from '@/components/compliance/DynamicQuestionRenderer';

/**
 * Slim wrapper around DynamicQuestionRenderer for the V2 onboarding.
 * - Owns step navigation + validation only.
 * - Does NOT create merchants, does NOT call backend — parent does that on finalize.
 * - Chunks questions into groups of `questionsPerStep` for better UX.
 */
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function StepQuestionnaireV2({
  questions, formData, setFormData, onComplete, questionsPerStep = 4,
}) {
  const groups = useMemo(() => chunk(questions || [], questionsPerStep), [questions, questionsPerStep]);
  const [stepIdx, setStepIdx] = useState(0);

  const currentGroup = groups[stepIdx] || [];
  const isLast = stepIdx === groups.length - 1;

  const validateCurrent = () => {
    return currentGroup.filter(q => {
      if (!q.isRequired) return false;
      // Conditional logic
      if (q.conditionalLogic?.dependsOn) {
        const depValue = formData[q.conditionalLogic.dependsOn];
        const norm = (v) => v === true || v === 'true' ? 'true' : v === false || v === 'false' ? 'false' : String(v || '').toLowerCase();
        const op = q.conditionalLogic.operator;
        if (op === 'equals' && norm(depValue) !== norm(q.conditionalLogic.value)) return false;
        if (op === 'not_equals' && norm(depValue) === norm(q.conditionalLogic.value)) return false;
      }
      const v = formData[q.id];
      if (v === undefined || v === null || v === '') return true;
      if (Array.isArray(v) && v.length === 0) return true;
      return false;
    });
  };

  const handleFieldChange = (qid, value) => {
    setFormData(prev => ({ ...prev, [qid]: value }));
  };

  const next = () => {
    const missing = validateCurrent();
    if (missing.length > 0) {
      toast.error(`Preencha ${missing.length} campo${missing.length > 1 ? 's' : ''} obrigatório${missing.length > 1 ? 's' : ''}.`);
      return;
    }
    if (isLast) {
      onComplete();
      return;
    }
    setStepIdx(stepIdx + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    if (stepIdx > 0) {
      setStepIdx(stepIdx - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (groups.length === 0) {
    return <div className="text-center text-slate-500 py-8">Nenhuma pergunta configurada neste questionário.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="text-sm font-semibold text-[#0A0A0A]">Etapa {stepIdx + 1} de {groups.length}</div>
        <div className="text-xs text-slate-500">{Math.round(((stepIdx + 1) / groups.length) * 100)}%</div>
      </div>

      <DynamicQuestionRenderer
        questions={currentGroup}
        formData={formData}
        onFieldChange={handleFieldChange}
        showTitle={false}
        allQuestions={questions}
        prefillSources={{}}
        hideAlerts
        isPublicView
      />

      <div className="flex justify-between items-center mt-8 pt-5 border-t border-slate-100">
        <Button
          variant="outline"
          onClick={back}
          disabled={stepIdx === 0}
          className="h-10 px-4 rounded-lg disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <Button onClick={next} className="h-10 px-6 rounded-lg bg-[#1356E2] hover:bg-[#1356E2]/90 text-white">
          {isLast ? (<>Ir para documentos <Check className="w-4 h-4 ml-2" /></>) : (<>Continuar <ArrowRight className="w-4 h-4 ml-2" /></>)}
        </Button>
      </div>
    </div>
  );
}