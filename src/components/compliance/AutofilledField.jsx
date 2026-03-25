import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Lock } from 'lucide-react';

/**
 * Campo preenchido automaticamente via API com indicador visual.
 * Pode ser editável (🟢 AUTO) ou somente leitura (🟣 NOVO+AUTO / display-only).
 */
export default function AutofilledField({
  label,
  value,
  isRequired = false,
  readOnly = false,
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
        <Label className="text-sm font-semibold text-[#002443]">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {hasValue && (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1">
            <CheckCircle className="w-3 h-3" />
            {source}
          </Badge>
        )}
        {readOnly && hasValue && (
          <Badge variant="outline" className="text-[10px] gap-1 text-[#002443]/50 border-[#002443]/20">
            <Lock className="w-3 h-3" />
            Não editável
          </Badge>
        )}
      </div>
      {helpText && (
        <p className="text-xs text-[#002443]/60">{helpText}</p>
      )}
      <Input
        value={displayValue}
        onChange={readOnly ? undefined : (e) => onChange?.(questionId, e.target.value)}
        readOnly={readOnly}
        className={`h-11 rounded-xl ${
          hasValue ? 'border-emerald-200 bg-emerald-50/30' : ''
        } ${readOnly ? 'cursor-not-allowed bg-slate-50' : ''}`}
      />
    </div>
  );
}