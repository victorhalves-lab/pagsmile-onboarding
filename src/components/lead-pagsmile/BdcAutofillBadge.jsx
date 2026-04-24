import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Badge discreto que aparece embaixo de um campo que foi autopreenchido via BDC.
 * Informa ao cliente que o valor veio do Big Data Corp e ele pode alterar se quiser.
 */
export default function BdcAutofillBadge({ show, label = 'Sugerido via BDC — confirme ou altere' }) {
  if (!show) return null;
  return (
    <p className="text-[10px] text-[#2bc196] flex items-center gap-1 font-medium">
      <Sparkles className="w-3 h-3" /> {label}
    </p>
  );
}