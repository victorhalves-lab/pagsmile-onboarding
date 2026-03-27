import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

/**
 * Input numérico que aceita vírgula e ponto como separador decimal.
 * Exibe sempre com vírgula (padrão brasileiro).
 * Armazena internamente como float (ponto decimal).
 */
export default function BrNumberInput({ value, onChange, decimals = 2, placeholder, className, ...props }) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    if (value !== undefined && value !== null && value !== 0 && value !== '') {
      setDisplay(Number(value).toFixed(decimals).replace('.', ','));
    } else if (value === 0) {
      setDisplay('');
    }
  }, [value, decimals]);

  const handleChange = (e) => {
    const raw = e.target.value;
    // Allow only digits, comma, dot, and minus
    const cleaned = raw.replace(/[^0-9.,-]/g, '');
    setDisplay(cleaned);
    // Parse: replace comma with dot for float conversion
    const normalized = cleaned.replace(',', '.');
    const parsed = parseFloat(normalized);
    onChange(isNaN(parsed) ? 0 : parsed);
  };

  const handleBlur = () => {
    if (value !== undefined && value !== null && value !== 0) {
      setDisplay(Number(value).toFixed(decimals).replace('.', ','));
    } else {
      setDisplay('');
    }
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder || `0,${'0'.repeat(decimals)}`}
      className={className}
      {...props}
    />
  );
}

/** Format a number for display with Brazilian comma */
export function formatBRL(val, decimals = 2) {
  if (val === undefined || val === null || val === 0) return '-';
  return `R$ ${Number(val).toFixed(decimals).replace('.', ',')}`;
}

/** Format a rate (decimal) as percentage with Brazilian comma. e.g. 0.0141 -> "1,41%" */
export function formatPercent(val, decimals = 2) {
  if (val === undefined || val === null || val === 0) return '-';
  return `${(val * 100).toFixed(decimals).replace('.', ',')}%`;
}