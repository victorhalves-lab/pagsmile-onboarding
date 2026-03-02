import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { HelpCircle } from 'lucide-react';

// Componente que renderiza UMA pergunta com base no tipo
function QuestionField({ question, value, onChange }) {
  const { type, text, options = [], placeholder, helpText, isRequired } = question;

  const handleChange = (newValue) => {
    onChange(question.id, newValue);
  };

  switch (type) {
    case 'TEXT':
    case 'EMAIL':
    case 'PHONE':
    case 'CPF_CNPJ':
      return (
        <Input
          type={type === 'EMAIL' ? 'email' : type === 'PHONE' ? 'tel' : 'text'}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder || ''}
          className="h-11"
        />
      );

    case 'NUMBER':
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder || ''}
          className="h-11"
        />
      );

    case 'DATE':
      return (
        <Input
          type="date"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="h-11"
        />
      );

    case 'SELECT':
      return (
        <Select value={value || ''} onValueChange={handleChange}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder={placeholder || 'Selecione uma opção'} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt, idx) => (
              <SelectItem key={idx} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'MULTI_SELECT':
      const selectedValues = value || [];
      return (
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <Checkbox
                id={`${question.id}_${idx}`}
                checked={selectedValues.includes(opt)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleChange([...selectedValues, opt]);
                  } else {
                    handleChange(selectedValues.filter(v => v !== opt));
                  }
                }}
              />
              <Label htmlFor={`${question.id}_${idx}`} className="font-normal cursor-pointer">
                {opt}
              </Label>
            </div>
          ))}
        </div>
      );

    case 'BOOLEAN':
      return (
        <RadioGroup
          value={value === true ? 'sim' : value === false ? 'nao' : ''}
          onValueChange={(v) => handleChange(v === 'sim')}
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="sim" id={`${question.id}_sim`} />
            <Label htmlFor={`${question.id}_sim`} className="font-normal cursor-pointer">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="nao" id={`${question.id}_nao`} />
            <Label htmlFor={`${question.id}_nao`} className="font-normal cursor-pointer">Não</Label>
          </div>
        </RadioGroup>
      );

    case 'FILE_UPLOAD':
      return (
        <Input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleChange(file);
          }}
          className="h-11"
        />
      );

    default:
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder || ''}
          rows={3}
        />
      );
  }
}

// Componente que renderiza UMA pergunta completa com label
function QuestionItem({ question, value, onChange, prefillSource }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Label className="text-sm font-semibold text-[#002443]">
          {question.text}
          {question.isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {question.helpText && (
          <div className="group relative">
            <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-50">
              {question.helpText}
            </div>
          </div>
        )}
      </div>
      {prefillSource && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md w-fit">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Preenchido automaticamente com dados do questionário de leads
        </div>
      )}
      <QuestionField question={question} value={value} onChange={onChange} />
    </div>
  );
}

// Função para avaliar lógica condicional
function evaluateConditionalLogic(conditionalLogic, formData) {
  if (!conditionalLogic || !conditionalLogic.dependsOn) {
    return true; // Sem lógica condicional = sempre visível
  }

  const { dependsOn, operator, value } = conditionalLogic;
  const dependentValue = formData[dependsOn];

  // Converter valores para comparação
  const normalizeValue = (val) => {
    if (val === true || val === 'true') return 'true';
    if (val === false || val === 'false') return 'false';
    return String(val || '').toLowerCase();
  };

  const normalizedDependentValue = normalizeValue(dependentValue);
  const normalizedExpectedValue = normalizeValue(value);

  switch (operator) {
    case 'equals':
      return normalizedDependentValue === normalizedExpectedValue;
    case 'not_equals':
      return normalizedDependentValue !== normalizedExpectedValue;
    case 'contains':
      return normalizedDependentValue.includes(normalizedExpectedValue);
    case 'greater_than':
      return parseFloat(dependentValue) > parseFloat(value);
    case 'less_than':
      return parseFloat(dependentValue) < parseFloat(value);
    case 'in':
      const allowedValues = value.split(',').map(v => v.trim().toLowerCase());
      return allowedValues.includes(normalizedDependentValue);
    default:
      return true;
  }
}

// Componente principal que agrupa perguntas por seção/step
export default function DynamicQuestionRenderer({ 
  questions, 
  formData, 
  onFieldChange,
  currentStep,
  questionsPerStep = 5, // Quantas perguntas por step
  showTitle = true,
  stepTitle = null,
  allQuestions = [], // Todas as perguntas para avaliar lógica condicional corretamente
  prefillSources = {} // Mapa de questionId → fonte do pré-preenchimento
}) {
  // Se currentStep for definido, filtramos as perguntas para aquele step
  const displayQuestions = currentStep !== undefined
    ? questions.slice((currentStep - 1) * questionsPerStep, currentStep * questionsPerStep)
    : questions;

  // Filtrar perguntas visíveis baseado na lógica condicional
  const visibleQuestions = displayQuestions.filter(question => {
    return evaluateConditionalLogic(question.conditionalLogic, formData);
  });

  if (visibleQuestions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        Nenhuma pergunta configurada para esta etapa.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTitle && stepTitle && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#002443]">{stepTitle}</h2>
        </div>
      )}
      
      <div className="space-y-5">
        {visibleQuestions.map((question) => (
          <QuestionItem
            key={question.id}
            question={question}
            value={formData[question.id]}
            onChange={onFieldChange}
          />
        ))}
      </div>
    </div>
  );
}

// Hook para calcular número de steps baseado nas perguntas
export function useQuestionnaireSteps(questions, questionsPerStep = 5) {
  const totalSteps = Math.ceil(questions.length / questionsPerStep);
  
  const getStepQuestions = (step) => {
    const start = (step - 1) * questionsPerStep;
    const end = start + questionsPerStep;
    return questions.slice(start, end);
  };
  
  const getStepTitle = (step) => {
    const stepQuestions = getStepQuestions(step);
    if (stepQuestions.length === 0) return '';
    // Usa o texto da primeira pergunta como título simplificado
    return `Etapa ${step}`;
  };

  return { totalSteps, getStepQuestions, getStepTitle };
}