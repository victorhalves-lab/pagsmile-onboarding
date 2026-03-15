import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function FormFieldError({ error }) {
  if (!error) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
      <AlertCircle className="w-3 h-3 shrink-0" />
      {error}
    </p>
  );
}