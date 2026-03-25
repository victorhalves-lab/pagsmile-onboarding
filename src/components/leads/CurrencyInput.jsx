import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { DollarSign } from 'lucide-react';

/**
 * Formata um valor numérico para moeda brasileira (R$ 1.234.567,89)
 */
function formatCurrency(value) {
  if (value === '' || value === null || value === undefined) return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/\D/g, '')) / 100 : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Extrai o valor numérico de uma string formatada como moeda
 */
function parseCurrency(formatted) {
  if (!formatted) return '';
  // Remove tudo que não é dígito
  const digits = formatted.replace(/\D/g, '');
  if (!digits) return '';
  return (parseInt(digits, 10) / 100).toString();
}

export default function CurrencyInput({ value, onChange, placeholder, className, hasError }) {
  const [displayValue, setDisplayValue] = useState('');

  // Sincroniza o display quando o value muda externamente
  useEffect(() => {
    if (value !== '' && value !== null && value !== undefined) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        setDisplayValue(formatCurrency(num));
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = useCallback((e) => {
    const raw = e.target.value;
    // Só dígitos
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setDisplayValue('');
      onChange('');
      return;
    }
    const numericValue = parseInt(digits, 10) / 100;
    const formatted = formatCurrency(numericValue);
    setDisplayValue(formatted);
    onChange(numericValue.toString());
  }, [onChange]);

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pagsmile-blue)]/60 font-semibold text-sm">
        R$
      </span>
      <Input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder || '0,00'}
        className={`h-12 rounded-xl pl-12 text-right font-mono text-base ${className || ''} ${hasError ? 'border-red-400 ring-1 ring-red-300' : ''}`}
      />
    </div>
  );
}