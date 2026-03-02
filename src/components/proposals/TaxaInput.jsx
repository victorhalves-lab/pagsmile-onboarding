import React from 'react';
import { Input } from '@/components/ui/input';

export default function TaxaInput({ value, onChange, prefix, suffix, placeholder = '0,00', className = '' }) {
  const handleChange = (e) => {
    let val = e.target.value.replace('.', ',');
    // Allow only numbers, comma and one decimal point
    val = val.replace(/[^0-9,]/g, '');
    onChange(val);
  };

  return (
    <div className={`relative ${className}`}>
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--pagsmile-blue)]/50 font-medium">
          {prefix}
        </span>
      )}
      <Input
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        className={`h-10 ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-14' : ''}`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--pagsmile-blue)]/50 font-medium">
          {suffix}
        </span>
      )}
    </div>
  );
}