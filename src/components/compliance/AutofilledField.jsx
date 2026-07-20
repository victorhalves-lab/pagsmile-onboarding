import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Lock } from 'lucide-react';

/**
 * Campo preenchido automaticamente via API com indicador visual.
 * REGRA DE NEGÓCIO: campos enriquecidos/autocomplete SEMPRE são editáveis pelo cliente.
 * A prop `readOnly` foi mantida para compatibilidade mas é ignorada — todo campo
 * de autocomplete em questionários/leads deve permitir edição mesmo após enriquecimento.
 */
export default function AutofilledField({
  label,
  value,
  isRequired = false,
  readOnly: _readOnly = false, // eslint-disable-line no-unused-vars
  onChange,
  questionId,
  helpText,
  source = 'Receita Federal',
  formatFn
}) {
  const displayValue = formatFn ? formatFn(value) : (value || '');
  const hasValue = displayValue && displayValue !== '';

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 flex-wrap">
        <Label className="text-sm font-semibold text-[#0A0A0A]">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {hasValue && (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1">
            <CheckCircle className="w-3 h-3" />
            {source}
          </Badge>
        )}
      </div>
      {helpText && (
        <p className="text-xs text-[#0A0A0A]/60">{helpText}</p>
      )}
      <Input
        value={displayValue}
        onChange={(e) => onChange?.(questionId, e.target.value)}
        className={`h-11 rounded-xl ${hasValue ? 'border-emerald-200 bg-emerald-50/30' : ''}`}
      />
    </div>
  );
}