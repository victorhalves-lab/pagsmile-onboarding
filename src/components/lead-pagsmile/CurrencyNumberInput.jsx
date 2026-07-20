import React from 'react';
import { Input } from '@/components/ui/input';

/**
 * Campo numérico com máscara monetária BR (R$ 1.500.000) ou percentual.
 *
 * Para campos monetários (prefix='R$' e sem suffix '%'):
 *   - Aceita apenas dígitos no input
 *   - Formata visualmente com pontos de milhar (1.500.000)
 *   - Emite onChange com a STRING NUMÉRICA SIMPLES ("1500000") — backend continua recebendo number puro
 *
 * Para percentual (suffix='%'):
 *   - Aceita decimais com vírgula ou ponto
 *   - Comportamento original preservado
 */
export default function CurrencyNumberInput({ value, onChange, placeholder, prefix = 'R$', suffix, hasError }) {
  const isCurrency = prefix === 'R$' && suffix !== '%';

  // Formatação para exibição: 1500000 → "1.500.000"
  const formatBr = (num) => {
    if (num == null || num === '') return '';
    const digits = String(num).replace(/\D/g, '');
    if (!digits) return '';
    return Number(digits).toLocaleString('pt-BR');
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    if (isCurrency) {
      // Mantém só os dígitos — emite valor numérico puro
      const digits = raw.replace(/\D/g, '');
      onChange(digits);
    } else {
      // Percentual / outros: comportamento original
      onChange(raw);
    }
  };

  // Display value: formatado se moeda, raw se percentual
  const displayValue = isCurrency ? formatBr(value) : (value || '');

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#0A0A0A]/40 font-medium">
          {prefix}
        </span>
      )}
      <Input
        type={isCurrency ? 'text' : 'number'}
        inputMode={isCurrency ? 'numeric' : 'decimal'}
        step={isCurrency ? undefined : 'any'}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`h-12 rounded-xl ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''} ${hasError ? 'border-red-400 ring-1 ring-red-300' : ''}`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#0A0A0A]/40 font-medium">
          {suffix}
        </span>
      )}
    </div>
  );
}