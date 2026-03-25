import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Info } from 'lucide-react';

/**
 * Campo de e-mail com:
 * - Detecção de e-mail pessoal vs corporativo (sugestão não-bloqueante)
 * - Sugestão de site baseada no domínio do e-mail
 */

const FREE_EMAIL_DOMAINS = [
  'gmail.com','hotmail.com','outlook.com','yahoo.com','yahoo.com.br',
  'bol.com.br','uol.com.br','terra.com.br','ig.com.br','live.com',
  'msn.com','icloud.com','me.com','protonmail.com','zoho.com',
  'mail.com','aol.com','yandex.com','gmx.com','tutanota.com'
];

export default function EmailInput({ value, onChange, onSiteSuggestion, placeholder, hasError, questionId }) {
  const [warning, setWarning] = useState(null);

  const handleChange = (e) => {
    const email = e.target.value;
    onChange(email);
  };

  const handleBlur = () => {
    if (!value || !value.includes('@')) {
      setWarning(null);
      return;
    }
    const domain = value.split('@')[1]?.toLowerCase();
    if (!domain) return;

    // Verificar e-mail pessoal
    if (FREE_EMAIL_DOMAINS.includes(domain)) {
      setWarning('Recomendamos um e-mail corporativo para agilizar a análise.');
    } else {
      setWarning(null);
      // Sugerir site com base no domínio
      if (onSiteSuggestion) {
        onSiteSuggestion(`https://${domain}`);
      }
    }
  };

  return (
    <div className="space-y-1">
      <Input
        type="email"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder || 'email@empresa.com'}
        className={`h-12 rounded-xl ${hasError ? 'border-red-400 ring-1 ring-red-300' : ''}`}
      />
      {warning && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <Info className="w-3 h-3" /> {warning}
        </p>
      )}
    </div>
  );
}