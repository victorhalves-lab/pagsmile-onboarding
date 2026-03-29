import React from 'react';
import { Input } from '@/components/ui/input';

/**
 * Campo numérico com máscara monetária ou percentual.
 */
export default function CurrencyNumberInput({ value, onChange, placeholder, prefix = 'R$', suffix, hasError }) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#002443]/40 font-medium">
          {prefix}
        </span>
      )}
      <Input
        type="number"
        step="any"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-12 rounded-xl ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''} ${hasError ? 'border-red-400 ring-1 ring-red-300' : ''}`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#002443]/40 font-medium">
          {suffix}
        </span>
      )}
    </div>
  );
}