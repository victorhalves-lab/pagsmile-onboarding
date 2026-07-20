import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Info, DollarSign, Shield, Lock } from 'lucide-react';

const RATE_FIELDS = [
  { key: 'mdr1x', label: 'Crédito à Vista (1x)', suffix: '%', icon: CreditCard, placeholder: '2.50' },
  { key: 'mdr2a6x', label: 'Crédito 2 a 6x', suffix: '%', icon: CreditCard, placeholder: '3.50' },
  { key: 'mdr7a12x', label: 'Crédito 7 a 12x', suffix: '%', icon: CreditCard, placeholder: '4.50' },
  { key: 'antecipacao', label: 'Taxa de Antecipação', suffix: '%', icon: DollarSign, placeholder: '1.80' },
  { key: 'feeTransacao', label: 'Fee por Transação', suffix: 'R$', icon: DollarSign, placeholder: '0.40' },
  { key: 'antifraude', label: 'Taxa de Antifraude', suffix: 'R$', icon: Shield, placeholder: '0.08' },
  { key: 'taxa3ds', label: 'Taxa de 3DS', suffix: 'R$', icon: Lock, placeholder: '0.05' },
];

export default function ExpectedRatesInput({ formData, updateField, error }) {
  const rates = formData._expectedRates || {};

  const handleChange = (key, value) => {
    if (value !== '' && parseFloat(value) < 0) return;
    updateField('_expectedRates', { ...rates, [key]: value });
  };

  const handleBlur = (key) => {
    const val = rates[key];
    if (val !== '' && val !== undefined && !isNaN(parseFloat(val))) {
      updateField('_expectedRates', { ...rates, [key]: parseFloat(val).toFixed(2) });
    }
  };

  return (
    <div className="space-y-5">
      {/* Disclaimer */}
      <div className="flex gap-3 p-4 bg-[#1356E2]/5 border border-[#1356E2]/20 rounded-xl">
        <Info className="w-5 h-5 text-[#1356E2] shrink-0 mt-0.5" />
        <p className="text-sm text-[#0A0A0A]/80 leading-relaxed">
          Conte para a gente a sua <strong>expectativa de taxas</strong>, baseadas em propostas que 
          você já recebeu ou em momentos que você já operou cartão, para a gente ter uma visão de 
          como buscar ao máximo as suas expectativas dentro das nossas possibilidades.
        </p>
      </div>

      {/* Título */}
      <Label className="text-sm font-bold text-[var(--pinbank-blue)] flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-[#1356E2]" />
        Expectativa de Taxas
        <span className="text-red-500 ml-1">*</span>
      </Label>

      {/* Erro de validação */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-500 px-1">
          <Info className="w-3 h-3 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid de campos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {RATE_FIELDS.map(field => {
          const Icon = field.icon;
          const isPercent = field.suffix === '%';
          const isCurrency = field.suffix === 'R$';

          return (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-xs font-semibold text-[var(--pinbank-blue)]/70 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-[#1356E2]/60" />
                {field.label}
              </Label>
              <div className="relative">
                {isCurrency && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--pinbank-blue)]/50 font-semibold">
                    R$
                  </span>
                )}
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rates[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  onBlur={() => handleBlur(field.key)}
                  placeholder={field.placeholder}
                  className={`h-10 rounded-lg text-sm ${isCurrency ? 'pl-10' : ''} ${isPercent ? 'pr-8' : ''}`}
                />
                {isPercent && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--pinbank-blue)]/40 font-medium">
                    %
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}