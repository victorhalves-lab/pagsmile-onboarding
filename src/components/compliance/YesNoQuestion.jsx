import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function YesNoQuestion({ 
  question, 
  value, 
  onChange, 
  detailValue, 
  onDetailChange,
  detailLabel = "Detalhe",
  detailPlaceholder = "Por favor, forneça mais detalhes...",
  required = false,
  showDetailOn = true,
  className 
}) {
  return (
    <div className={cn("space-y-4 p-4 rounded-xl border border-slate-200 bg-white", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-slate-700 font-medium">
            {question}
            {required && <span className="text-red-500 ml-1">*</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              value === true 
                ? "bg-[var(--pagsmile-green)] text-white" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Sim
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              value === false 
                ? "bg-slate-700 text-white" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Não
          </button>
        </div>
      </div>
      
      {value === showDetailOn && onDetailChange && (
        <div className="pt-3 border-t border-slate-100">
          <Label className="text-sm text-slate-600 mb-2 block">{detailLabel}</Label>
          <Textarea
            value={detailValue || ''}
            onChange={(e) => onDetailChange(e.target.value)}
            placeholder={detailPlaceholder}
            rows={3}
            className="resize-none"
          />
        </div>
      )}
    </div>
  );
}