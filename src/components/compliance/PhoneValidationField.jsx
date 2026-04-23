import React, { useState, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertTriangle, Phone, Info } from 'lucide-react';
// SDK-FREE for public routes.
import { callPublicFunction } from '@/lib/publicApi';

function formatPhone(val) {
  const d = val.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

export default function PhoneValidationField({
  value,
  onChange,
  questionId,
  isRequired = false,
  label = 'Telefone',
  empresaUf,
  helpText
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState(null);
  const debounceRef = useRef(null);

  const handleChange = useCallback((e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
    onChange(questionId, raw);
    setValidation(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (raw.length >= 10) {
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const body = await callPublicFunction('complianceValidations', {
            action: 'validatePhone',
            phone: raw,
            empresaUf: empresaUf || null,
          });
          setValidation(body?.data ?? body);
        } catch (e) {
          console.warn('Phone validation failed:', e?.message);
        }
        setIsLoading(false);
      }, 800);
    }
  }, [questionId, onChange, empresaUf]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-semibold text-[#002443]">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {validation?.dddValid && validation?.geoConsistent && (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1">
            <CheckCircle className="w-3 h-3" /> DDD {validation.ddd} ({validation.state})
          </Badge>
        )}
      </div>
      {helpText && <p className="text-xs text-[#002443]/60">{helpText}</p>}
      
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/30" />
        <Input
          type="tel"
          value={formatPhone(value || '')}
          onChange={handleChange}
          placeholder="(XX) XXXXX-XXXX"
          className={`h-11 pl-10 pr-10 ${
            validation?.dddValid === false ? 'border-red-400 ring-1 ring-red-200' :
            validation?.dddValid && validation?.geoConsistent ? 'border-emerald-400 ring-1 ring-emerald-200' : ''
          }`}
          maxLength={15}
        />
        {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#2bc196]" />}
      </div>

      {validation?.dddValid === false && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {validation.error}
        </p>
      )}
      {validation?.geoConsistent === false && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <Info className="w-3 h-3" /> {validation.geoWarning}
        </p>
      )}
    </div>
  );
}