import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, MapPin, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CepAutocompleteField({
  value,
  onChange,
  onAddressData,
  questionId,
  isRequired = false,
  label = 'CEP'
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addressFound, setAddressFound] = useState(false);

  const formatCep = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const handleChange = useCallback(async (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8);
    onChange(questionId, raw);
    setError(null);
    setAddressFound(false);

    if (raw.length === 8) {
      setIsLoading(true);
      const res = await base44.functions.invoke('complianceValidations', {
        action: 'viacep', cep: raw
      });
      setIsLoading(false);

      if (res.data?.error) {
        setError(res.data.error);
      } else if (res.data?.logradouro) {
        setAddressFound(true);
        if (onAddressData) onAddressData(res.data);
      }
    }
  }, [questionId, onChange, onAddressData]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-semibold text-[#002443]">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {addressFound && (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1">
            <CheckCircle className="w-3 h-3" /> ViaCEP
          </Badge>
        )}
      </div>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/30" />
        <Input
          value={formatCep(value || '')}
          onChange={handleChange}
          placeholder="XXXXX-XXX"
          className="h-11 pl-10 pr-10 font-mono"
          maxLength={9}
        />
        {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#2bc196]" />}
      </div>
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}