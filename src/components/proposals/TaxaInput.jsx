import React, { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';

/**
 * Formata valor para padrão brasileiro: 1.000,00
 * isCurrency: se true, formata como moeda (ex: 1.234,56). Se false, formata como taxa/percentual (ex: 2,50)
 */
function formatBRL(raw, isCurrency) {
  if (!raw && raw !== 0) return '';
  const str = String(raw).replace(/\./g, '').replace(',', '.');
  const num = parseFloat(str);
  if (isNaN(num)) return String(raw);
  if (!isCurrency) {
    // Para percentuais ou valores pequenos, manter simples
    return str.replace('.', ',');
  }
  // Formato moeda brasileira: 1.234,56
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function unformat(val) {
  // Remove pontos de milhar, mantém vírgula decimal, troca por ponto para parsear
  return val.replace(/\./g, '').replace(',', '.');
}

export default function TaxaInput({ value, onChange, prefix, suffix, placeholder = '0,00', className = '', isCurrency = false }) {
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef(null);
  const isTyping = useRef(false);

  useEffect(() => {
    if (!isTyping.current) {
      if (value === '' || value === null || value === undefined) {
        setDisplayValue('');
      } else if (isCurrency) {
        const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
        if (!isNaN(num) && num !== 0) {
          setDisplayValue(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        } else {
          setDisplayValue(String(value));
        }
      } else {
        setDisplayValue(String(value));
      }
    }
  }, [value, isCurrency]);

  const handleChange = (e) => {
    isTyping.current = true;
    let val = e.target.value;

    if (isCurrency) {
      // Aceita apenas dígitos, vírgula e ponto
      val = val.replace(/[^0-9.,]/g, '');
      setDisplayValue(val);
      onChange(val);
    } else {
      // Comportamento original para percentuais
      val = val.replace('.', ',');
      val = val.replace(/[^0-9,]/g, '');
      const parts = val.split(',');
      if (parts.length > 2) val = parts[0] + ',' + parts.slice(1).join('');
      setDisplayValue(val);
      onChange(val);
    }
  };

  const handleBlur = () => {
    isTyping.current = false;
    if (!displayValue) return;

    if (isCurrency) {
      const cleaned = unformat(displayValue);
      const num = parseFloat(cleaned);
      if (!isNaN(num)) {
        const formatted = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        setDisplayValue(formatted);
        onChange(formatted);
      }
    }
  };

  return (
    <div className="relative w-full">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/20 font-medium z-10 pointer-events-none">{prefix}</span>}
      <Input
        ref={inputRef}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`${className} ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-12' : ''}`}
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/20 font-medium z-10 pointer-events-none">{suffix}</span>}
    </div>
  );
}