import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * Renders a group of percentage fields side by side that must sum to 100%.
 * 
 * Props:
 * - title: string - Header label
 * - fields: [{ id, label, placeholder }]
 * - formData: object
 * - updateField: function
 * - required: boolean
 */
export default function PercentDistributionRow({ title, fields, formData, updateField, required = true }) {
  const values = fields.map(f => parseFloat(formData[f.id]) || 0);
  const total = values.reduce((a, b) => a + b, 0);
  const allFilled = fields.every(f => formData[f.id] !== undefined && formData[f.id] !== '' && formData[f.id] !== null);
  const isValid = Math.abs(total - 100) < 0.01 && allFilled;
  const hasAnyValue = fields.some(f => formData[f.id] !== undefined && formData[f.id] !== '' && formData[f.id] !== null);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-[var(--pagsmile-blue)]">
        {title}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <p className="text-xs text-[var(--pagsmile-blue)]/60">
        A soma dos percentuais deve ser igual a 100%.
      </p>

      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${fields.length}, minmax(0, 1fr))` }}>
        {fields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--pagsmile-blue)]/80 block">
              {field.label}
            </label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData[field.id] ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 100)) {
                    updateField(field.id, val);
                  }
                }}
                onBlur={(e) => {
                  const val = e.target.value;
                  if (val !== '' && !isNaN(parseFloat(val))) {
                    updateField(field.id, parseFloat(val).toFixed(2));
                  }
                }}
                placeholder={field.placeholder || '0'}
                className="h-11 rounded-xl pr-8 text-center font-semibold"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--pagsmile-blue)]/40 font-semibold text-sm">
                %
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de total */}
      {hasAnyValue && (
        <div className={`flex items-center justify-between px-4 py-2 rounded-xl text-xs font-semibold ${
          isValid 
            ? 'bg-[var(--pagsmile-green)]/10 text-[var(--pagsmile-green)]' 
            : 'bg-amber-50 text-amber-600'
        }`}>
          <div className="flex items-center gap-1.5">
            {isValid 
              ? <CheckCircle className="w-3.5 h-3.5" />
              : <AlertTriangle className="w-3.5 h-3.5" />
            }
            <span>Total: {total.toFixed(0)}%</span>
          </div>
          {!isValid && (
            <span>{total < 100 ? `Faltam ${(100 - total).toFixed(0)}%` : `Excede em ${(total - 100).toFixed(0)}%`}</span>
          )}
        </div>
      )}
    </div>
  );
}