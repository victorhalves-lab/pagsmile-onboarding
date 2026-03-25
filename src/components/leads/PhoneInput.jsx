import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Campo de telefone com formatação automática (XX) XXXXX-XXXX
 * e validação de DDD válido.
 */

const VALID_DDDS = [
  '11','12','13','14','15','16','17','18','19', // SP
  '21','22','24', // RJ
  '27','28', // ES
  '31','32','33','34','35','37','38', // MG
  '41','42','43','44','45','46', // PR
  '47','48','49', // SC
  '51','53','54','55', // RS
  '61', // DF
  '62','64', // GO
  '63', // TO
  '65','66', // MT
  '67', // MS
  '68', // AC
  '69', // RO
  '71','73','74','75','77', // BA
  '79', // SE
  '81','87', // PE
  '82', // AL
  '83', // PB
  '84', // RN
  '85','88', // CE
  '86','89', // PI
  '91','93','94', // PA
  '92','97', // AM
  '95', // RR
  '96', // AP
  '98','99', // MA
];

function formatPhone(digits) {
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`;
}

export default function PhoneInput({ value, onChange, placeholder, hasError }) {
  const [display, setDisplay] = useState('');
  const [dddWarning, setDddWarning] = useState(null);

  useEffect(() => {
    if (value && !display) {
      const digits = String(value).replace(/\D/g, '');
      setDisplay(formatPhone(digits));
    }
  }, [value]);

  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    const formatted = formatPhone(digits);
    setDisplay(formatted);
    onChange(digits);

    // Validar DDD
    if (digits.length >= 2) {
      const ddd = digits.slice(0, 2);
      if (!VALID_DDDS.includes(ddd)) {
        setDddWarning(`DDD ${ddd} não reconhecido`);
      } else {
        setDddWarning(null);
      }
    } else {
      setDddWarning(null);
    }
  };

  const digits = String(value || '').replace(/\D/g, '');
  const isComplete = digits.length === 10 || digits.length === 11;

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          type="tel"
          value={display}
          onChange={handleChange}
          placeholder={placeholder || '(11) 99999-9999'}
          className={`h-12 rounded-xl ${hasError ? 'border-red-400 ring-1 ring-red-300' : ''}`}
          maxLength={16}
        />
        {isComplete && !dddWarning && (
          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
        )}
      </div>
      {dddWarning && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {dddWarning}
        </p>
      )}
    </div>
  );
}