import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

export default function TaxaInput({ value, onChange, prefix, suffix, placeholder = '0,00', className = '' }) {
  const [displayValue, setDisplayValue] = useState(value || '');

  useEffect(() => { setDisplayValue(value || ''); }, [value]);

  const handleChange = (e) => {
    let val = e.target.value.replace('.', ',');
    val = val.replace(/[^0-9,]/g, '');
    const parts = val.split(',');
    if (parts.length > 2) val = parts[0] + ',' + parts.slice(1).join('');
    setDisplayValue(val);
    onChange(val);
  };

  return (
    <div className="relative w-full">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/20 font-medium z-10 pointer-events-none">{prefix}</span>}
      <Input value={displayValue} onChange={handleChange} placeholder={placeholder}
        className={`${className} ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-12' : ''}`} />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/20 font-medium z-10 pointer-events-none">{suffix}</span>}
    </div>
  );
}