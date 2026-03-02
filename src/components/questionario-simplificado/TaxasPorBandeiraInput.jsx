import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MARCAS = [
  { key: 'visa', label: 'Visa' },
  { key: 'mastercard', label: 'Mastercard' },
  { key: 'amex', label: 'Amex' },
  { key: 'elo', label: 'Elo' },
];

export default function TaxasPorBandeiraInput({ label, fieldKey, formData, setFormData }) {
  const updateValue = (marca, val) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        [marca]: val === '' ? undefined : parseFloat(val)
      }
    }));
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-[#002443]">{label}</Label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {MARCAS.map(m => (
          <div key={m.key} className="space-y-1">
            <Label className="text-xs text-[#002443]/70">{m.label}</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData[fieldKey]?.[m.key] ?? ''}
                onChange={(e) => updateValue(m.key, e.target.value)}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#002443]/50">%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}