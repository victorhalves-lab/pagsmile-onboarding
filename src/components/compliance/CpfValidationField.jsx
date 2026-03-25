import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, User } from 'lucide-react';

function validarCpf(cpf) {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(digits[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (parseInt(digits[9]) !== resto) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(digits[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return parseInt(digits[10]) === resto;
}

function formatCpf(val) {
  const d = val.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

export default function CpfValidationField({
  value,
  onChange,
  questionId,
  isRequired = false,
  label = 'CPF',
  helpText
}) {
  const [validation, setValidation] = useState(null);

  const handleChange = useCallback((e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
    onChange(questionId, raw);

    if (raw.length === 11) {
      setValidation(validarCpf(raw) ? { valid: true } : { valid: false, error: 'CPF inválido (dígitos verificadores não conferem)' });
    } else {
      setValidation(null);
    }
  }, [questionId, onChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-semibold text-[#002443]">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {validation?.valid && (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1">
            <CheckCircle className="w-3 h-3" /> CPF Válido
          </Badge>
        )}
      </div>
      {helpText && <p className="text-xs text-[#002443]/60">{helpText}</p>}
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/30" />
        <Input
          value={formatCpf(value || '')}
          onChange={handleChange}
          placeholder="XXX.XXX.XXX-XX"
          className={`h-11 pl-10 pr-10 font-mono ${
            validation?.valid === false ? 'border-red-400 ring-1 ring-red-200' :
            validation?.valid ? 'border-emerald-400 ring-1 ring-emerald-200' : ''
          }`}
          maxLength={14}
        />
        {validation?.valid && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
        {validation?.valid === false && <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />}
      </div>
      {validation?.valid === false && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {validation.error}
        </p>
      )}
    </div>
  );
}