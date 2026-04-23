import React, { useState, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertTriangle, Mail, Info } from 'lucide-react';
// SDK-FREE for public routes.
import { callPublicFunction } from '@/lib/publicApi';

export default function EmailValidationField({
  value,
  onChange,
  questionId,
  isRequired = false,
  label = 'E-mail',
  emailReceitaFederal,
  helpText
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState(null);
  const debounceRef = useRef(null);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    onChange(questionId, val);
    setValidation(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Validate when looks like a complete email
    if (val.includes('@') && val.split('@')[1]?.includes('.')) {
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const body = await callPublicFunction('complianceValidations', {
            action: 'validateEmail',
            email: val,
            emailReceitaFederal: emailReceitaFederal || null,
          });
          setValidation(body?.data ?? body);
        } catch (e) {
          console.warn('Email validation failed:', e?.message);
        }
        setIsLoading(false);
      }, 1000);
    }
  }, [questionId, onChange, emailReceitaFederal]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-semibold text-[#002443]">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {validation?.mxValid === true && (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1">
            <CheckCircle className="w-3 h-3" /> MX Válido
          </Badge>
        )}
      </div>
      {helpText && <p className="text-xs text-[#002443]/60">{helpText}</p>}
      
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/30" />
        <Input
          type="email"
          value={value || ''}
          onChange={handleChange}
          placeholder="email@empresa.com.br"
          className={`h-11 pl-10 pr-10 ${
            validation?.mxValid === false ? 'border-red-400 ring-1 ring-red-200' : 
            validation?.mxValid === true ? 'border-emerald-400 ring-1 ring-emerald-200' : ''
          }`}
        />
        {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#2bc196]" />}
      </div>

      {validation?.mxValid === false && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          O domínio '{validation.domain}' não aceita e-mails. Verifique o endereço informado.
        </p>
      )}
      {validation?.isFreeProvider && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <Info className="w-3 h-3" />
          {validation.freeProviderWarning}
        </p>
      )}
      {validation?.domainMatchReceita === false && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <Info className="w-3 h-3" />
          {validation.domainMismatchNote}
        </p>
      )}
      {validation?.domainMatchReceita === true && (
        <p className="text-xs text-emerald-600 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Domínio consistente com o e-mail registrado na Receita Federal.
        </p>
      )}
    </div>
  );
}