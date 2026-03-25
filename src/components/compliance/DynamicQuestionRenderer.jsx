import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { HelpCircle, CheckCircle, Lock, AlertTriangle as AlertTriangleIcon, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CnpjAutocompleteField from './CnpjAutocompleteField';
import CepAutocompleteField from './CepAutocompleteField';
import EmailValidationField from './EmailValidationField';
import PhoneValidationField from './PhoneValidationField';
import Top5CnpjField from './Top5CnpjField';
import CpfValidationField from './CpfValidationField';
import ComplianceFieldAlerts from './ComplianceFieldAlerts';
import SiteValidationBadge from '../leads/SiteValidationBadge';

// Componente que renderiza UMA pergunta com base no tipo
function QuestionField({ question, value, onChange, cnpjAutocompleteData, onCnpjAutocomplete, onCepData, fieldAlerts }) {
  const { type, text, options = [], placeholder, helpText, isRequired } = question;
  const textLower = (text || '').toLowerCase();

  const handleChange = (newValue) => {
    onChange(question.id, newValue);
  };

  // Detectar se é campo CNPJ gatilho
  const isCnpjTrigger = type === 'CPF_CNPJ' && textLower === 'cnpj';
  if (isCnpjTrigger) {
    return (
      <CnpjAutocompleteField
        value={value || ''}
        onChange={onChange}
        onAutocompleteData={onCnpjAutocomplete}
        questionId={question.id}
        isRequired={isRequired}
        blockOnInactive={true}
        helpText={helpText}
      />
    );
  }

  // Detectar campo CEP (autocomplete via ViaCEP)
  const isCepField = textLower === 'cep' || textLower === 'cep do endereço' || textLower === 'cep do escritório' || textLower === 'cep do ubo';
  if (isCepField) {
    return (
      <CepAutocompleteField
        value={value || ''}
        onChange={onChange}
        onAddressData={onCepData}
        questionId={question.id}
        isRequired={isRequired}
        label={text}
      />
    );
  }

  // Detectar campos de e-mail que precisam de validação MX
  const isEmailValidation = type === 'EMAIL' || (type === 'TEXT' && (
    textLower.includes('e-mail') || textLower.includes('email')
  ) && !textLower.includes('receita'));
  if (isEmailValidation) {
    return (
      <EmailValidationField
        value={value || ''}
        onChange={onChange}
        questionId={question.id}
        isRequired={isRequired}
        label={text}
        emailReceitaFederal={cnpjAutocompleteData?.email}
        helpText={helpText}
      />
    );
  }

  // Detectar campos de telefone que precisam de validação DDD
  const isPhoneValidation = type === 'PHONE' || (type === 'TEXT' && (
    textLower.includes('telefone') || textLower.includes('celular')
  ) && !textLower.includes('receita'));
  if (isPhoneValidation) {
    return (
      <PhoneValidationField
        value={value || ''}
        onChange={onChange}
        questionId={question.id}
        isRequired={isRequired}
        label={text}
        empresaUf={cnpjAutocompleteData?.endereco?.uf}
        helpText={helpText}
      />
    );
  }

  // Detectar campos Top 5 (Clientes/Sellers/Sub-Merchants)
  const isTop5 = textLower.includes('top 5') || textLower.includes('maiores clientes') ||
    textLower.includes('maiores sellers') || textLower.includes('maiores sub-merchants') ||
    textLower.includes('maiores sub merchants');
  if (isTop5) {
    return (
      <>
        <Top5CnpjField
          value={value || []}
          onChange={onChange}
          questionId={question.id}
          label={text}
          maxItems={5}
          checkAnexoI={textLower.includes('sub-merchant') || textLower.includes('sub merchant') || textLower.includes('seller')}
        />
        <ComplianceFieldAlerts alerts={fieldAlerts} />
      </>
    );
  }

  // Detectar campos CPF que precisam de validação módulo 11
  const isCpfField = type === 'CPF_CNPJ' && textLower !== 'cnpj' && (
    textLower.includes('cpf') || textLower.includes('cpf do ubo') || 
    textLower.includes('cpf do sócio') || textLower.includes('cpf resp')
  );
  if (isCpfField) {
    return (
      <>
        <CpfValidationField
          value={value || ''}
          onChange={onChange}
          questionId={question.id}
          isRequired={isRequired}
          label={text}
          helpText={helpText}
        />
        <ComplianceFieldAlerts alerts={fieldAlerts} />
      </>
    );
  }

  // Detectar campos de site/URL que precisam de validação
  const isSiteField = type === 'TEXT' && (
    textLower.includes('site') || textLower.includes('url') || textLower.includes('website')
  ) && !textLower.includes('receita');

  // Detectar campos auto-preenchidos via CNPJ (readonly display fields)
  const isAutofilledReadonly = cnpjAutocompleteData && (
    textLower === 'razão social' ||
    textLower === 'nome fantasia' ||
    textLower.includes('cnae principal') ||
    textLower.includes('cnaes secundários') ||
    textLower.includes('situação cadastral') ||
    textLower.includes('capital social') ||
    textLower.includes('porte da empresa') ||
    textLower.includes('data de início') ||
    textLower.includes('e-mail da receita') ||
    textLower.includes('telefone da receita')
  );

  if (isAutofilledReadonly && value) {
    return (
      <div className="relative">
        <Input
          value={value || ''}
          readOnly
          className="h-11 bg-emerald-50/30 border-emerald-200 cursor-not-allowed"
        />
        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#002443]/30" />
      </div>
    );
  }

  switch (type) {
    case 'TEXT':
    case 'EMAIL':
    case 'PHONE':
    case 'CPF_CNPJ':
      return (
        <>
          <Input
            type={type === 'EMAIL' ? 'email' : type === 'PHONE' ? 'tel' : 'text'}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || ''}
            className="h-11"
          />
          {isSiteField && value && String(value).length > 5 && (
            <SiteValidationBadge siteUrl={value} updateField={onChange} />
          )}
          <ComplianceFieldAlerts alerts={fieldAlerts} />
        </>
      );

    case 'NUMBER':
      return (
        <>
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || ''}
            className="h-11"
          />
          <ComplianceFieldAlerts alerts={fieldAlerts} />
        </>
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
        <>
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
          <ComplianceFieldAlerts alerts={fieldAlerts} />
        </>
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
function QuestionItem({ question, value, onChange, prefillSource, cnpjAutocompleteData, onCnpjAutocomplete, onCepData, fieldAlerts }) {
  const textLower = (question.text || '').toLowerCase();
  const isCnpjTrigger = question.type === 'CPF_CNPJ' && textLower === 'cnpj';
  const isAutoSource = cnpjAutocompleteData && value && (
    textLower.includes('razão social') || textLower.includes('nome fantasia') ||
    textLower.includes('tipo de empresa') || textLower.includes('cnae') ||
    textLower.includes('situação cadastral') || textLower.includes('capital social') ||
    textLower.includes('porte da empresa') || textLower.includes('data de início') ||
    textLower === 'cep' || textLower === 'logradouro' || textLower === 'bairro' ||
    textLower === 'cidade' || textLower === 'município' || textLower === 'uf' || 
    textLower === 'estado' || textLower === 'número' ||
    textLower === 'complemento' || textLower.includes('e-mail da receita') ||
    textLower.includes('telefone da receita') || textLower === 'código mcc' ||
    textLower === 'site da empresa'
  );

  return (
    <div className="space-y-2">
      {/* O CnpjAutocompleteField renderiza seu próprio label */}
      {!isCnpjTrigger && (
        <div className="flex items-start gap-2 flex-wrap">
          <Label className="text-sm font-semibold text-[#002443]">
            {question.text}
            {question.isRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {isAutoSource && (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1">
              <CheckCircle className="w-3 h-3" />
              Receita Federal
            </Badge>
          )}
          {question.helpText && (
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-50">
                {question.helpText}
              </div>
            </div>
          )}
        </div>
      )}
      {prefillSource && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md w-fit">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Preenchido automaticamente com dados do questionário de leads
        </div>
      )}
      <QuestionField
        question={question}
        value={value}
        onChange={onChange}
        cnpjAutocompleteData={cnpjAutocompleteData}
        onCnpjAutocomplete={onCnpjAutocomplete}
        onCepData={onCepData}
        fieldAlerts={fieldAlerts}
      />
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
  questionsPerStep = 5,
  showTitle = true,
  stepTitle = null,
  allQuestions = [],
  prefillSources = {},
  cnpjAutocompleteData = null,
  onCnpjAutocomplete,
  onCepData,
  complianceAlerts = {}
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
            prefillSource={prefillSources[question.id]}
            cnpjAutocompleteData={cnpjAutocompleteData}
            onCnpjAutocomplete={onCnpjAutocomplete}
            onCepData={onCepData}
            fieldAlerts={complianceAlerts[question.id]}
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