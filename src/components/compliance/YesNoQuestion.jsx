import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

export default function YesNoQuestion({ 
  question, 
  value, 
  onChange, 
  detailValue, 
  onDetailChange,
  detailLabel = "Por favor, detalhe sua resposta:",
  detailPlaceholder = "Digite aqui mais informações...",
  required = false,
  showDetailOn = true,
  className,
  helperText = "Selecione uma opção"
}) {
  return (
    <div className={cn(
      "p-6 rounded-2xl bg-white border border-[var(--pinbank-blue)]/10 shadow-sm transition-all duration-300 hover:shadow-md", 
      className
    )}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <p className="text-[var(--pinbank-blue)] font-semibold text-lg leading-snug">
            {question}
            {required && <span className="text-red-500 ml-1">*</span>}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-1 flex-shrink-0 w-full md:w-auto">
          {helperText && (
            <span className="text-[10px] font-medium text-[var(--pinbank-blue)]/60 uppercase tracking-wider mr-1">
              {helperText}
            </span>
          )}
          <div className="flex gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => onChange(true)}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 border shadow-sm",
                value === true 
                  ? "border-[var(--pinbank-blue)] bg-[var(--pinbank-blue)] text-white shadow-md transform -translate-y-0.5" 
                  : "border-[var(--pinbank-blue)]/20 bg-white text-[var(--pinbank-blue)]/80 hover:border-[var(--pinbank-blue)] hover:text-[var(--pinbank-blue)] hover:bg-[var(--pinbank-blue)]/5"
              )}
            >
              <Check className="w-4 h-4" />
              Sim
            </button>
            
            <button
              type="button"
              onClick={() => onChange(false)}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 border shadow-sm",
                value === false 
                  ? "border-red-500 bg-red-500 text-white shadow-md transform -translate-y-0.5" 
                  : "border-[var(--pinbank-blue)]/20 bg-white text-[var(--pinbank-blue)]/80 hover:border-red-300 hover:text-red-600 hover:bg-red-50"
              )}
            >
              <X className="w-4 h-4" />
              Não
            </button>
          </div>
        </div>
      </div>
      
      <div className={cn(
        "overflow-hidden transition-all duration-500 ease-in-out",
        value === showDetailOn ? "max-h-[500px] opacity-100 mt-6" : "max-h-0 opacity-0"
      )}>
        <div className="bg-[var(--pinbank-blue)]/5 p-4 rounded-xl border border-[var(--pinbank-blue)]/10">
          <Label className="text-sm font-medium text-[var(--pinbank-blue)] mb-2 block pl-1">
            {detailLabel}
          </Label>
          <Textarea
            value={detailValue || ''}
            onChange={(e) => onDetailChange(e.target.value)}
            placeholder={detailPlaceholder}
            rows={3}
            className="bg-white resize-none border-[var(--pinbank-blue)]/20 focus:border-[var(--pinbank-blue)] focus:ring-[var(--pinbank-blue)] text-[var(--pinbank-blue)]"
          />
        </div>
      </div>
    </div>
  );
}