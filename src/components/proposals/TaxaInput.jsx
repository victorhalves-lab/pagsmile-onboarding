import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

export default function TaxaInput({ value, onChange, prefix, suffix, placeholder = '0,00', className = '' }) {
  const [displayValue, setDisplayValue] = useState(value || '');

  useEffect(() => {
    setDisplayValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    let val = e.target.value.replace('.', ',');
    // Allow only numbers, comma and ONE decimal point (comma)
    val = val.replace(/[^0-9,]/g, '');
    
    // Ensure only one comma
    const parts = val.split(',');
    if (parts.length > 2) {
        val = parts[0] + ',' + parts.slice(1).join('');
    }
    
    setDisplayValue(val);
    onChange(val);
  };

  return (
    <div className="relative w-full">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium z-10 pointer-events-none">
          {prefix}
        </span>
      )}
      <Input
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${className} ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''} placeholder:text-slate-600 focus:border-[#2bc196] focus:ring-1 focus:ring-[#2bc196]`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium z-10 pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}