import React from 'react';
import { Input } from '@/components/ui/input';

function formatCnpj(value) {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function unformatCnpj(value) {
  return value.replace(/\D/g, '');
}

export function formatCNPJ(raw) {
  if (!raw) return '';
  return formatCnpj(raw);
}

export default function CnpjInput({ value, onChange, className = '', error }) {
  const handleChange = (e) => {
    const raw = unformatCnpj(e.target.value);
    onChange(raw);
  };

  return (
    <Input
      value={formatCnpj(value || '')}
      onChange={handleChange}
      placeholder="00.000.000/0000-00"
      maxLength={18}
      className={`${error ? 'border-red-500' : ''} ${className}`}
    />
  );
}